import { Router } from "express";
import { z } from "zod";
import {
  createTeam,
  joinTeam,
  leaveTeam,
  toggleTeamCheckIn,
  getMyTeam,
  getTeamsByEvent,
} from "../controllers/team.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isFestOrganizer } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const createTeamSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  name: z.string().min(2, "Team name must be at least 2 characters"),
});

const joinTeamSchema = z.object({
  inviteCode: z.string().length(6, "Invite code must be exactly 6 characters"),
});

const checkInSchema = z.object({
  checkedIn: z.boolean().optional(),
});

router.post("/", verifyJWT, validate(createTeamSchema), createTeam);
router.post("/join", verifyJWT, validate(joinTeamSchema), joinTeam);
router.post("/:teamId/leave", verifyJWT, leaveTeam);
router.patch(
  "/:teamId/checkin",
  verifyJWT,
  isFestOrganizer,
  validate(checkInSchema),
  toggleTeamCheckIn
);
router.get("/events/:eventId/my-team", verifyJWT, getMyTeam);
router.get("/events/:eventId", verifyJWT, getTeamsByEvent);

export default router;
