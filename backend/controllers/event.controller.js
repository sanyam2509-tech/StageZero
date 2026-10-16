import { Event } from "../models/Event.model.js";
import { Fest } from "../models/Fest.model.js";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitAnnouncement } from "../socket.js";
import { clearFestCache } from "./fest.controller.js";

/**
 * Create a new event within a Fest
 * POST /api/v1/events
 */
export const createEvent = asyncHandler(async (req, res) => {
  const {
    festId,
    title,
    category,
    description,
    teamSize,
    rounds,
    rubric,
    judges,
  } = req.body;

  const fest = await Fest.findById(festId);
  if (!fest) {
    throw new ApiError(404, "Target Fest not found");
  }

  // Resolve judge emails if provided as string emails
  let judgeIds = [];
  if (Array.isArray(judges) && judges.length > 0) {
    for (const item of judges) {
      if (typeof item === "string" && item.includes("@")) {
        const found = await User.findOne({ email: item.toLowerCase() });
        if (found) judgeIds.push(found._id);
      } else {
        judgeIds.push(item);
      }
    }
  }

  // Default rubric if none provided
  const eventRubric =
    Array.isArray(rubric) && rubric.length > 0
      ? rubric
      : [
          { criterion: "Innovation & Originality", maxScore: 10, weight: 1.5 },
          { criterion: "Technical Execution & Architecture", maxScore: 10, weight: 2.0 },
          { criterion: "UI/UX & User Experience", maxScore: 10, weight: 1.0 },
          { criterion: "Presentation & Demo Impact", maxScore: 10, weight: 1.0 },
        ];

  // Default rounds if none provided
  const eventRounds =
    Array.isArray(rounds) && rounds.length > 0
      ? rounds
      : [
          {
            roundNumber: 1,
            title: "Round 1: Initial Pitch & Prototype Submission",
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          {
            roundNumber: 2,
            title: "Round 2: Grand Finale & Live Demo",
            deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
          },
        ];

  const event = await Event.create({
    festId,
    title,
    category: category || "hackathon",
    description,
    teamSize: teamSize || { min: 1, max: 4 },
    rounds: eventRounds,
    rubric: eventRubric,
    judges: judgeIds,
    status: "upcoming",
  });

  const populatedEvent = await Event.findById(event._id)
    .populate("festId", "title slug collegeName")
    .populate("judges", "name email");

  clearFestCache();

  return res
    .status(201)
    .json(new ApiResponse(201, populatedEvent, "Event created successfully"));
});

/**
 * Update Event details, rubric, rounds, or status
 * PUT /api/v1/events/:eventId
 */
export const updateEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const {
    title,
    category,
    description,
    teamSize,
    rounds,
    rubric,
    status,
  } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (title) event.title = title;
  if (category) event.category = category;
  if (description) event.description = description;
  if (teamSize) event.teamSize = teamSize;
  if (rounds) event.rounds = rounds;
  if (rubric) event.rubric = rubric;
  if (status) event.status = status;

  await event.save();

  const updatedEvent = await Event.findById(eventId)
    .populate("festId", "title slug collegeName")
    .populate("judges", "name email");

  clearFestCache();

  return res
    .status(200)
    .json(new ApiResponse(200, updatedEvent, "Event updated successfully"));
});

/**
 * Assign judges to an event by email or user IDs
 * POST /api/v1/events/:eventId/judges
 */
export const assignJudges = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { emails, judgeIds } = req.body;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const newJudgeIds = [];

  if (Array.isArray(emails)) {
    const users = await User.find({
      email: { $in: emails.map((e) => e.toLowerCase().trim()) },
    });
    users.forEach((u) => newJudgeIds.push(u._id.toString()));
  }

  if (Array.isArray(judgeIds)) {
    judgeIds.forEach((id) => newJudgeIds.push(id.toString()));
  }

  const existingJudgeIds = event.judges.map((id) => id.toString());
  const combined = Array.from(new Set([...existingJudgeIds, ...newJudgeIds]));

  event.judges = combined;
  await event.save();

  const updatedEvent = await Event.findById(eventId)
    .populate("festId", "title slug collegeName")
    .populate("judges", "name email college");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedEvent, "Judges assigned successfully"));
});

/**
 * Get Event Details by ID
 * GET /api/v1/events/:eventId
 */
export const getEventById = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId)
    .populate("festId", "title slug collegeName createdBy organizers")
    .populate("judges", "name email college")
    .lean();

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Strict Organizer Isolation:
  // If an organizer attempts to view an event not belonging to their fest, reject with 403 Forbidden
  const isOrganizer =
    Boolean(req.user) &&
    req.user.role === "organizer" &&
    req.user.globalRole !== "superadmin";

  if (isOrganizer) {
    const userIdStr = req.user._id.toString();
    const festCreatorStr = (
      event.festId?.createdBy?._id || event.festId?.createdBy
    )?.toString();
    const isFestCoOrg =
      Array.isArray(event.festId?.organizers) &&
      event.festId.organizers.some(
        (org) => (org?._id || org)?.toString() === userIdStr
      );

    if (festCreatorStr !== userIdStr && !isFestCoOrg) {
      throw new ApiError(
        403,
        "Access denied: Organizers can only view and manage events for fests they created or manage."
      );
    }
  }

  res.setHeader("Cache-Control", "private, max-age=5, stale-while-revalidate=20");
  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event fetched successfully"));
});

/**
 * Broadcast real-time announcement to all event participants via Socket.io
 * POST /api/v1/events/:eventId/announcements
 */
export const broadcastAnnouncement = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { title, message, priority = "info" } = req.body;

  if (!message) {
    throw new ApiError(400, "Announcement message is required");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const announcementPayload = {
    eventId,
    eventTitle: event.title,
    title: title || "Organizer Announcement",
    message,
    priority,
    timestamp: new Date().toISOString(),
    broadcastBy: {
      _id: req.user._id,
      name: req.user.name,
    },
  };

  // Broadcast via Socket.io helper
  emitAnnouncement(eventId, announcementPayload);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        announcementPayload,
        "Announcement broadcasted successfully"
      )
    );
});
