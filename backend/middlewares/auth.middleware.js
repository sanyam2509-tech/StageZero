import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request: No access token provided");
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || "festflow_super_secret_access_jwt_key_2026_dev_mode"
    );

    const user = await User.findById(decodedToken?._id).select(
      "-passwordHash -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token: User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, error?.message || "Invalid or expired access token");
  }
});

export const verifyOptionalJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next();
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET || "festflow_super_secret_access_jwt_key_2026_dev_mode"
    );

    const user = await User.findById(decodedToken?._id).select(
      "-passwordHash -refreshToken"
    );

    if (user) {
      req.user = user;
    }
  } catch (error) {
    // Gracefully ignore token errors for optional auth
  }
  next();
});

