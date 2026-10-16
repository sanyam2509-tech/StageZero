import { ApiError } from "../utils/ApiError.js";

/**
 * Higher-order middleware to validate incoming request data using Zod schema
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
export const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const parsedData = schema.parse(req[source]);
      req[source] = parsedData;
      next();
    } catch (err) {
      if (err?.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return next(
          new ApiError(400, "Validation failed", formattedErrors)
        );
      }
      return next(new ApiError(400, err?.message || "Invalid input data"));
    }
  };
};
