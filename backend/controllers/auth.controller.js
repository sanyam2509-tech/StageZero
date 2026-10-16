import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { Event } from "../models/Event.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

// Helper to generate access and refresh tokens and save refresh token to user
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found for token generation");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    college,
    githubUrl,
    role = "participant",
    clubName,
    designation,
    organization,
    judgeInviteCode,
  } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash: password, // pre-save hook will hash this
    college: college || "",
    githubUrl: githubUrl || "",
    role: role || "participant",
    clubName: clubName || "",
    designation: designation || "",
    organization: organization || "",
  });

  // If registering as a Judge with an event code/ID, automatically link them to the event's judge panel
  if (role === "judge" && judgeInviteCode) {
    try {
      const trimmedCode = judgeInviteCode.trim();
      const event = await Event.findById(trimmedCode).catch(() => null);
      if (event && !event.judges.some((j) => j.toString() === user._id.toString())) {
        event.judges.push(user._id);
        await event.save();
      }
    } catch (e) {
      // Non-fatal if invalid event ID passed
    }
  }

  const createdUser = await User.findById(user._id).select(
    "-passwordHash -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        201,
        { user: createdUser, accessToken, refreshToken },
        `User registered successfully as ${role}`
      )
    );
});

/**
 * Login existing user
 * POST /api/v1/auth/login
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "User does not exist with this email");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-passwordHash -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Logged in successfully"
      )
    );
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logoutUser = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: { refreshToken: 1 },
      },
      { new: true }
    );
  }

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * Refresh Access Token
 * POST /api/v1/auth/refresh-token
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request: No refresh token provided");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET || "festflow_super_secret_refresh_jwt_key_2026_dev_mode"
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token: User not found");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or has been used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

/**
 * Get current logged in user profile
 * GET /api/v1/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

/**
 * 1-Click Demo Login
 * POST /api/v1/auth/demo-login
 * Body: { role: 'organizer' | 'judge' | 'participant' }
 */
export const demoLogin = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const validRoles = ["organizer", "judge", "participant", "superadmin"];
  if (!validRoles.includes(role)) {
    throw new ApiError(
      400,
      `Invalid demo role. Must be one of: ${validRoles.join(", ")}`
    );
  }

  const demoAccounts = {
    superadmin: {
      email: "superadmin@stagezero.io",
      name: "Root Administrator",
      college: "StageZero Global Ops",
      githubUrl: "https://github.com/stagezero-core",
      globalRole: "superadmin",
      role: "organizer",
    },
    organizer: {
      email: "organizer@demo.com",
      name: "Alex Organizer",
      college: "Stanford / MIT Tech",
      githubUrl: "https://github.com/alex-festflow-organizer",
      globalRole: "user",
      role: "organizer",
    },
    judge: {
      email: "judge@demo.com",
      name: "Dr. Elena Vance (Lead Judge)",
      college: "AI Research Institute",
      githubUrl: "https://github.com/dr-elena-vance",
      globalRole: "user",
      role: "judge",
    },
    participant: {
      email: "participant@demo.com",
      name: "Sam Innovator",
      college: "UC Berkeley Hackers",
      githubUrl: "https://github.com/sam-innovator",
      globalRole: "user",
      role: "participant",
    },
  };

  const selected = demoAccounts[role];

  let user = await User.findOne({ email: selected.email });
  if (!user) {
    user = await User.create({
      name: selected.name,
      email: selected.email,
      passwordHash: "demo123456",
      college: selected.college,
      githubUrl: selected.githubUrl,
      globalRole: selected.globalRole || "user",
      role: selected.role,
    });
  } else {
    let modified = false;
    if (user.role !== selected.role) {
      user.role = selected.role;
      modified = true;
    }
    if (selected.globalRole && user.globalRole !== selected.globalRole) {
      user.globalRole = selected.globalRole;
      modified = true;
    }
    if (modified) {
      await user.save({ validateBeforeSave: false });
    }
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const safeUser = await User.findById(user._id).select(
    "-passwordHash -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: safeUser, accessToken, refreshToken, demoRole: role },
        `Demo login successful as ${role}`
      )
    );
});
