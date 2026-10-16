import { Router } from "express";
import { z } from "zod";
import {
  submitEvaluation,
  getLiveLeaderboard,
  downloadCertificate,
} from "../controllers/evaluation.controller.js";
import { verifyJWT, verifyOptionalJWT } from "../middlewares/auth.middleware.js";
import { isEventJudge } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const evaluationSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  eventId: z.string().optional(),
  scores: z
    .array(
      z.object({
        criterion: z.string().min(1),
        score: z.number().min(0),
        maxScore: z.number().min(1).default(10),
        weight: z.number().min(0).default(1),
      })
    )
    .min(1, "At least one criterion score is required"),
  feedback: z.string().optional(),
});

router.post(
  "/",
  verifyJWT,
  isEventJudge,
  validate(evaluationSchema),
  submitEvaluation
);
router.get("/events/:eventId/leaderboard", verifyOptionalJWT, getLiveLeaderboard);
router.get("/events/:eventId/certificate/:teamId", verifyJWT, downloadCertificate);

export default router;
