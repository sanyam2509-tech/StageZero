import { Fest } from "../models/Fest.model.js";
import { Event } from "../models/Event.model.js";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper to generate slug from string
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Create a new campus fest
 * POST /api/v1/fests
 */
export const createFest = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    description,
    collegeName,
    bannerUrl,
    startDate,
    endDate,
  } = req.body;

  const generatedSlug = slug ? slugify(slug) : slugify(title);

  const existingFest = await Fest.findOne({ slug: generatedSlug });
  if (existingFest) {
    throw new ApiError(
      409,
      `A fest with slug '${generatedSlug}' already exists. Please choose a different title or slug.`
    );
  }

  const fest = await Fest.create({
    title,
    slug: generatedSlug,
    description,
    collegeName,
    bannerUrl:
      bannerUrl ||
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80",
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    createdBy: req.user._id,
    organizers: [req.user._id],
  });

  const populatedFest = await Fest.findById(fest._id)
    .populate("createdBy", "name email")
    .populate("organizers", "name email college");

  clearFestCache();

  return res
    .status(201)
    .json(new ApiResponse(201, populatedFest, "Fest created successfully"));
});

// In-memory caching for sub-millisecond response latency
const festsListCache = new Map();
const singleFestCache = new Map();
const CACHE_TTL_MS = 20000; // 20 seconds TTL

export const clearFestCache = () => {
  festsListCache.clear();
  singleFestCache.clear();
};

/**
 * List all fests with pagination and search
 * Organizers only see fests created or co-organized by them
 * Participants and judges can view all fests (or filter by judging)
 * GET /api/v1/fests
 */
export const getAllFests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const skip = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : "";
  const myJudgingOnly = req.query.myJudging === "true";

  const isOrganizer =
    Boolean(req.user) &&
    req.user.role === "organizer" &&
    req.user.globalRole !== "superadmin";

  const isJudge =
    Boolean(req.user) &&
    req.user.role === "judge";

  const cacheKey = isOrganizer
    ? `org_${req.user._id.toString()}_${page}_${search}`
    : isJudge && myJudgingOnly
    ? `judge_${req.user._id.toString()}_${page}_${search}`
    : `public_${page}_${search}`;

  // Return cached result if query is within TTL
  const cachedEntry = festsListCache.get(cacheKey);
  if (cachedEntry && Date.now() - cachedEntry.time < CACHE_TTL_MS) {
    res.setHeader("X-Cache", "HIT");
    res.setHeader("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
    return res.status(200).json(cachedEntry.payload);
  }

  const query = {};

  // Organizers can ONLY view fests created by or co-organized by them
  if (isOrganizer) {
    const organizerFilter = {
      $or: [{ createdBy: req.user._id }, { organizers: req.user._id }],
    };
    if (search) {
      query.$and = [
        organizerFilter,
        {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { collegeName: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        },
      ];
    } else {
      Object.assign(query, organizerFilter);
    }
  } else if (isJudge && myJudgingOnly) {
    // Optional judge filter: show fests containing events where user is assigned judge
    const judgeEvents = await Event.find({ judges: req.user._id }).select("festId").lean();
    const festIds = judgeEvents.map((e) => e.festId);
    query._id = { $in: festIds };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { collegeName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
  } else if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { collegeName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const [fests, totalFests] = await Promise.all([
    Fest.find(query)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name email")
      .populate("organizers", "name email")
      .lean(),
    Fest.countDocuments(query),
  ]);

  const responsePayload = new ApiResponse(
    200,
    {
      fests,
      pagination: {
        totalFests,
        totalPages: Math.ceil(totalFests / limit),
        currentPage: page,
        limit,
      },
      viewerScope: isOrganizer ? "organizer-only" : "all",
    },
    "Fests retrieved successfully"
  );

  festsListCache.set(cacheKey, {
    payload: responsePayload,
    time: Date.now(),
  });

  res.setHeader("X-Cache", "MISS");
  res.setHeader("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
  return res.status(200).json(responsePayload);
});

/**
 * Get single fest by slug or ID with its events
 * Organizers can only view fests they created or manage
 * GET /api/v1/fests/:slug
 */
export const getFestBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const isOrganizer =
    Boolean(req.user) &&
    req.user.role === "organizer" &&
    req.user.globalRole !== "superadmin";

  const cacheKey = isOrganizer
    ? `${slug}_org_${req.user._id.toString()}`
    : `${slug}_public`;

  // Fast memory cache check
  const cached = singleFestCache.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    res.setHeader("X-Cache", "HIT");
    res.setHeader("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
    return res.status(200).json(cached.payload);
  }

  let fest;
  if (slug.match(/^[0-9a-fA-F]{24}$/)) {
    fest = await Fest.findById(slug)
      .populate("createdBy", "name email college")
      .populate("organizers", "name email college")
      .lean();
  } else {
    fest = await Fest.findOne({ slug })
      .populate("createdBy", "name email college")
      .populate("organizers", "name email college")
      .lean();
  }

  if (!fest) {
    throw new ApiError(404, `Fest with slug/id '${slug}' not found`);
  }

  // Strict Organizer Isolation:
  // If an organizer tries to view another organizer's fest, reject with 403 Forbidden
  if (isOrganizer) {
    const userIdStr = req.user._id.toString();
    const createdByStr = (fest.createdBy?._id || fest.createdBy)?.toString();
    const isCoOrganizer =
      Array.isArray(fest.organizers) &&
      fest.organizers.some(
        (org) => (org?._id || org)?.toString() === userIdStr
      );

    if (createdByStr !== userIdStr && !isCoOrganizer) {
      throw new ApiError(
        403,
        "Access denied: Organizers can only view and manage fests created by or assigned to them."
      );
    }
  }

  const events = await Event.find({ festId: fest._id })
    .populate("judges", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const responsePayload = new ApiResponse(
    200,
    {
      fest,
      events,
    },
    "Fest and events fetched successfully"
  );

  singleFestCache.set(cacheKey, {
    payload: responsePayload,
    time: Date.now(),
  });

  res.setHeader("X-Cache", "MISS");
  res.setHeader("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
  return res.status(200).json(responsePayload);
});

/**
 * Add co-organizer to a fest
 * POST /api/v1/fests/:festId/organizers
 */
export const addOrganizer = asyncHandler(async (req, res) => {
  const { festId } = req.params;
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Organizer email is required");
  }

  const fest = await Fest.findById(festId);
  if (!fest) {
    throw new ApiError(404, "Fest not found");
  }

  const userToAdd = await User.findOne({ email: email.toLowerCase() });
  if (!userToAdd) {
    throw new ApiError(404, `User with email '${email}' not found`);
  }

  const alreadyOrganizer = fest.organizers.some(
    (orgId) => orgId.toString() === userToAdd._id.toString()
  );

  if (alreadyOrganizer) {
    throw new ApiError(400, "User is already an organizer for this fest");
  }

  fest.organizers.push(userToAdd._id);
  await fest.save();

  const updatedFest = await Fest.findById(festId)
    .populate("createdBy", "name email")
    .populate("organizers", "name email college");

  clearFestCache();

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedFest, "Co-organizer added successfully")
    );
});

/**
 * Remove co-organizer from a fest
 * DELETE /api/v1/fests/:festId/organizers/:userId
 */
export const removeOrganizer = asyncHandler(async (req, res) => {
  const { festId, userId } = req.params;

  const fest = await Fest.findById(festId);
  if (!fest) {
    throw new ApiError(404, "Fest not found");
  }

  if (fest.createdBy.toString() === userId) {
    throw new ApiError(400, "Cannot remove the primary fest creator");
  }

  const currentUserIdStr = req.user._id.toString();
  const isCreator = fest.createdBy.toString() === currentUserIdStr;
  const isSelf = currentUserIdStr === userId;
  const isSuperAdmin = req.user?.globalRole === "superadmin";

  if (!isCreator && !isSelf && !isSuperAdmin) {
    throw new ApiError(403, "Only the primary fest creator can remove other co-organizers");
  }

  fest.organizers = fest.organizers.filter(
    (orgId) => orgId.toString() !== userId
  );
  await fest.save();

  const updatedFest = await Fest.findById(festId)
    .populate("createdBy", "name email")
    .populate("organizers", "name email college");

  clearFestCache();

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedFest, "Organizer removed successfully")
    );
});
