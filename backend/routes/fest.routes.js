import { Router } from "express";
import { z } from "zod";
import {
  createFest,
  getAllFests,
  getFestBySlug,
  addOrganizer,
  removeOrganizer,
} from "../controllers/fest.controller.js";
import { verifyJWT, verifyOptionalJWT } from "../middlewares/auth.middleware.js";
import { isFestOrganizer, canHostFest } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const createFestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  collegeName: z.string().min(2, "College name is required"),
  bannerUrl: z.string().url("Invalid banner URL").optional().or(z.literal("")),
  startDate: z.string().datetime().or(z.string().min(8)),
  endDate: z.string().datetime().or(z.string().min(8)),
});

const addOrganizerSchema = z.object({
  email: z.string().email("Valid organizer email is required"),
});

router.get("/", verifyOptionalJWT, getAllFests);
router.get("/:slug", verifyOptionalJWT, getFestBySlug);
router.post("/", verifyJWT, canHostFest, validate(createFestSchema), createFest);
router.post(
  "/:festId/organizers",
  verifyJWT,
  isFestOrganizer,
  validate(addOrganizerSchema),
  addOrganizer
);
router.delete(
  "/:festId/organizers/:userId",
  verifyJWT,
  isFestOrganizer,
  removeOrganizer
);

export default router;
