import { Router } from "express";
import { z } from "zod";
import {
  createOrUpdateSubmission,
  getSubmissionsByEvent,
  getSubmissionById,
} from "../controllers/submission.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const submissionSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  teamId: z.string().min(1, "Team ID is required"),
  roundNumber: z.number().int().min(1).default(1),
  projectTitle: z.string().min(2, "Project title must be at least 2 characters"),
  tagline: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  repoUrl: z.string().url("Invalid GitHub repository URL").optional().or(z.literal("")),
  demoUrl: z.string().url("Invalid demo URL").optional().or(z.literal("")),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
  techStack: z.union([z.array(z.string()), z.string()]).optional(),
});

router.post("/", verifyJWT, validate(submissionSchema), createOrUpdateSubmission);
router.get("/events/:eventId", verifyJWT, getSubmissionsByEvent);
router.get("/:submissionId", verifyJWT, getSubmissionById);

export default router;
