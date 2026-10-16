import { Submission } from "../models/Submission.model.js";
import { Team } from "../models/Team.model.js";
import { Event } from "../models/Event.model.js";
import { Evaluation } from "../models/Evaluation.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Create or update project submission for an event round
 * POST /api/v1/submissions
 */
export const createOrUpdateSubmission = asyncHandler(async (req, res) => {
  const {
    eventId,
    teamId,
    roundNumber = 1,
    projectTitle,
    tagline,
    description,
    repoUrl,
    demoUrl,
    videoUrl,
    techStack,
  } = req.body;

  if (!eventId || !teamId || !projectTitle || !description) {
    throw new ApiError(
      400,
      "Event ID, Team ID, Project Title, and Description are required"
    );
  }

  const [event, team] = await Promise.all([
    Event.findById(eventId),
    Team.findById(teamId),
  ]);

  if (!event) throw new ApiError(404, "Event not found");
  if (!team) throw new ApiError(404, "Team not found");

  if (team.eventId.toString() !== eventId) {
    throw new ApiError(400, "Team does not belong to this event");
  }

  // Ensure current user is in team
  const userIdStr = req.user._id.toString();
  const isMember =
    team.leaderId.toString() === userIdStr ||
    team.members.some((m) => m.toString() === userIdStr);

  if (!isMember) {
    throw new ApiError(
      403,
      "Access forbidden: You must be a member of this team to submit"
    );
  }

  // Check round deadline if configured
  const roundObj = event.rounds?.find(
    (r) => r.roundNumber === Number(roundNumber)
  );
  if (roundObj && roundObj.deadline) {
    const deadlineTime = new Date(roundObj.deadline).getTime();
    if (Date.now() > deadlineTime) {
      throw new ApiError(
        400,
        `Submission deadline for Round ${roundNumber} has passed (${new Date(
          roundObj.deadline
        ).toLocaleString()})`
      );
    }
  }

  // Normalize techStack
  let parsedTechStack = [];
  if (Array.isArray(techStack)) {
    parsedTechStack = techStack;
  } else if (typeof techStack === "string") {
    parsedTechStack = techStack
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const submission = await Submission.findOneAndUpdate(
    {
      eventId,
      teamId,
      roundNumber: Number(roundNumber),
    },
    {
      $set: {
        projectTitle: projectTitle.trim(),
        tagline: tagline ? tagline.trim() : "",
        description: description.trim(),
        repoUrl: repoUrl ? repoUrl.trim() : "",
        demoUrl: demoUrl ? demoUrl.trim() : "",
        videoUrl: videoUrl ? videoUrl.trim() : "",
        techStack: parsedTechStack,
        submittedAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  const populated = await Submission.findById(submission._id)
    .populate("teamId", "name inviteCode checkedIn members leaderId")
    .populate("eventId", "title rounds rubric");

  return res
    .status(200)
    .json(new ApiResponse(200, populated, "Project submitted successfully"));
});

/**
 * Get all submissions for an event (with team and evaluation summaries)
 * GET /api/v1/submissions/events/:eventId
 */
export const getSubmissionsByEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const roundNumber = req.query.roundNumber
    ? Number(req.query.roundNumber)
    : undefined;

  const filter = { eventId };
  if (roundNumber) filter.roundNumber = roundNumber;

  const submissions = await Submission.find(filter)
    .populate("teamId", "name inviteCode checkedIn leaderId members")
    .sort({ submittedAt: -1 });

  // If judge or organizer, attach evaluation summary
  const submissionIds = submissions.map((s) => s._id);
  const evaluations = await Evaluation.find({
    submissionId: { $in: submissionIds },
  }).populate("judgeId", "name email");

  const results = submissions.map((sub) => {
    const subEvals = evaluations.filter(
      (e) => e.submissionId.toString() === sub._id.toString()
    );
    const myEval = subEvals.find(
      (e) => e.judgeId?._id?.toString() === req.user._id.toString()
    );

    return {
      ...sub.toObject(),
      evaluationsCount: subEvals.length,
      averageScore:
        subEvals.length > 0
          ? Number(
              (
                subEvals.reduce((acc, curr) => acc + curr.totalWeightedScore, 0) /
                subEvals.length
              ).toFixed(2)
            )
          : null,
      myEvaluation: myEval || null,
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, results, "Event submissions fetched successfully")
    );
});

/**
 * Get submission details by ID
 * GET /api/v1/submissions/:submissionId
 */
export const getSubmissionById = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;

  const submission = await Submission.findById(submissionId)
    .populate({
      path: "teamId",
      populate: [
        { path: "leaderId", select: "name email college githubUrl" },
        { path: "members", select: "name email college githubUrl" },
      ],
    })
    .populate("eventId", "title category rubric rounds status");

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  const evaluations = await Evaluation.find({ submissionId }).populate(
    "judgeId",
    "name email college"
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...submission.toObject(),
        evaluations,
      },
      "Submission fetched successfully"
    )
  );
});
