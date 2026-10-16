import { Router } from "express";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  demoLogin,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

// Zod validation schemas
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  college: z.string().optional(),
  githubUrl: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  role: z.enum(["participant", "organizer", "judge"]).default("participant"),
  clubName: z.string().optional(),
  designation: z.string().optional(),
  organization: z.string().optional(),
  judgeInviteCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const demoLoginSchema = z.object({
  role: z.enum(["organizer", "judge", "participant", "superadmin"], {
    errorMap: () => ({ message: "Role must be superadmin, organizer, judge, or participant" }),
  }),
});

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", verifyJWT, getCurrentUser);
router.post("/demo-login", validate(demoLoginSchema), demoLogin);

export default router;
