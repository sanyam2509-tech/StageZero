import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose / MongoDB errors
  if (!(error instanceof ApiError)) {
    let statusCode = 500;
    let message = error.message || "Internal Server Error";
    let errors = [];

    // Mongoose bad ObjectId CastError
    if (error instanceof mongoose.Error.CastError) {
      statusCode = 400;
      message = `Invalid format for field: ${error.path}`;
    }
    // Mongoose validation error
    else if (error instanceof mongoose.Error.ValidationError) {
      statusCode = 400;
      message = "Validation Error";
      errors = Object.values(error.errors).map((val) => val.message);
    }
    // Mongo duplicate key error (11000)
    else if (error.code === 11000) {
      statusCode = 409;
      const keys = Object.keys(error.keyValue || {});
      message = `Duplicate field value entered for: ${keys.join(", ")}`;
      errors = [`Duplicate key: ${JSON.stringify(error.keyValue)}`];
    }
    // JWT Errors
    else if (error.name === "JsonWebTokenError") {
      statusCode = 401;
      message = "Invalid authentication token";
    } else if (error.name === "TokenExpiredError") {
      statusCode = 401;
      message = "Authentication token has expired";
    }

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  const response = {
    statusCode: error.statusCode,
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode || 500).json(response);
};
