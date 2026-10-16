import { Router } from "express";
import { z } from "zod";
import {
  createEvent,
  updateEvent,
  assignJudges,
  getEventById,
  broadcastAnnouncement,
} from "../controllers/event.controller.js";
import { verifyJWT, verifyOptionalJWT } from "../middlewares/auth.middleware.js";
import { isFestOrganizer } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const createEventSchema = z.object({
  festId: z.string().min(1, "Fest ID is required"),
  title: z.string().min(3, "Event title must be at least 3 characters"),
  category: z
    .enum(["hackathon", "robotics", "coding", "cultural"])
    .default("hackathon"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  teamSize: z
    .object({
      min: z.number().int().min(1).default(1),
      max: z.number().int().min(1).default(4),
    })
    .optional(),
  rounds: z
    .array(
      z.object({
        roundNumber: z.number().int().min(1),
        title: z.string().min(2),
        deadline: z.string().datetime().or(z.string().min(8)),
      })
    )
    .optional(),
  rubric: z
    .array(
      z.object({
        criterion: z.string().min(2),
        maxScore: z.number().min(1).default(10),
        weight: z.number().min(0.1).default(1),
      })
    )
    .optional(),
  judges: z.array(z.string()).optional(),
});

const broadcastAnnouncementSchema = z.object({
  title: z.string().optional(),
  message: z.string().min(2, "Message is required"),
  priority: z.enum(["info", "warning", "urgent"]).optional().default("info"),
});

router.post("/", verifyJWT, isFestOrganizer, validate(createEventSchema), createEvent);
router.get("/:eventId", verifyOptionalJWT, getEventById);
router.put("/:eventId", verifyJWT, isFestOrganizer, updateEvent);
router.post("/:eventId/judges", verifyJWT, isFestOrganizer, assignJudges);
router.post(
  "/:eventId/announcements",
  verifyJWT,
  isFestOrganizer,
  validate(broadcastAnnouncementSchema),
  broadcastAnnouncement
);

export default router;
