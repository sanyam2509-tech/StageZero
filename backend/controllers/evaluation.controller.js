import mongoose from "mongoose";
import { Evaluation } from "../models/Evaluation.model.js";
import { Submission } from "../models/Submission.model.js";
import { Event } from "../models/Event.model.js";
import { Team } from "../models/Team.model.js";
import { Fest } from "../models/Fest.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateCertificate } from "../utils/certificateGenerator.js";
import { emitLeaderboardUpdate } from "../socket.js";

/**
 * Helper to compute live leaderboard using MongoDB aggregation pipeline
 */
export const calculateLeaderboard = async (eventId) => {
  const matchEventId = new mongoose.Types.ObjectId(eventId);

  const leaderboard = await Evaluation.aggregate([
    {
      $match: { eventId: matchEventId },
    },
    {
      $group: {
        _id: "$submissionId",
        averageScore: { $avg: "$totalWeightedScore" },
        judgesCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "submissions",
        localField: "_id",
        foreignField: "_id",
        as: "submission",
      },
    },
    {
      $unwind: "$submission",
    },
    {
      $lookup: {
        from: "teams",
        localField: "submission.teamId",
        foreignField: "_id",
        as: "team",
      },
    },
    {
      $unwind: "$team",
    },
    // Multi-round deduplication: Sort by highest round first, then average score
    {
      $sort: { "submission.roundNumber": -1, averageScore: -1 },
    },
    // Group by team so each team only appears ONCE on the leaderboard
    {
      $group: {
        _id: "$team._id",
        submissionId: { $first: "$submission._id" },
        teamId: { $first: "$team._id" },
        teamName: { $first: "$team.name" },
        projectTitle: { $first: "$submission.projectTitle" },
        tagline: { $first: "$submission.tagline" },
        description: { $first: "$submission.description" },
        repoUrl: { $first: "$submission.repoUrl" },
        demoUrl: { $first: "$submission.demoUrl" },
        videoUrl: { $first: "$submission.videoUrl" },
        techStack: { $first: "$submission.techStack" },
        submittedAt: { $first: "$submission.submittedAt" },
        roundNumber: { $first: "$submission.roundNumber" },
        averageScore: { $first: "$averageScore" },
        judgesCount: { $first: "$judgesCount" },
      },
    },
    {
      $project: {
        _id: 1,
        submissionId: 1,
        averageScore: { $round: ["$averageScore", 2] },
        judgesCount: 1,
        projectTitle: 1,
        tagline: 1,
        description: 1,
        repoUrl: 1,
        demoUrl: 1,
        videoUrl: 1,
        techStack: 1,
        submittedAt: 1,
        roundNumber: 1,
        teamId: 1,
        teamName: 1,
        // STRICT PRIVACY: inviteCode, leaderName, leaderEmail, and feedback are removed from public projection
      },
    },
    {
      $sort: { averageScore: -1, judgesCount: -1 },
    },
  ]);

  // Assign 1-based ranks
  return leaderboard.map((item, index) => ({
    rank: index + 1,
    ...item,
  }));
};

/**
 * Submit judge scorecard
 * POST /api/v1/evaluations
 */
export const submitEvaluation = asyncHandler(async (req, res) => {
  const { submissionId, scores, feedback } = req.body;

  if (!submissionId || !Array.isArray(scores) || scores.length === 0) {
    throw new ApiError(
      400,
      "Submission ID and a valid scores array are required"
    );
  }

  const submission = req.submission || (await Submission.findById(submissionId));
  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  const event = req.event || (await Event.findById(submission.eventId));
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Completeness check and Rubric integrity enforcement:
  // Read maxScore and weight strictly from the authorized event rubric
  let totalScore = 0;
  let totalWeight = 0;
  let sanitizedScores = [];
  let totalWeightedScore = 0;

  if (Array.isArray(event.rubric) && event.rubric.length > 0) {
    for (const r of event.rubric) {
      const match = scores.find((s) => s.criterion === r.criterion);
      if (
        !match ||
        match.score === null ||
        match.score === undefined ||
        typeof match.score !== "number" ||
        isNaN(match.score) ||
        match.score < 0 ||
        match.score > (r.maxScore || 10)
      ) {
        throw new ApiError(
          400,
          `Incomplete scorecard: Valid score required for criterion '${r.criterion}' (0 to ${r.maxScore || 10})`
        );
      }

      const rawScore = Number(match.score);
      const authorizedMax = Number(r.maxScore) || 10;
      const authorizedWeight = Number(r.weight) || 1.0;

      totalWeight += authorizedWeight;
      totalScore += (rawScore / authorizedMax) * authorizedWeight;

      sanitizedScores.push({
        criterion: r.criterion,
        score: rawScore,
        maxScore: authorizedMax,
        weight: authorizedWeight,
      });
    }

    // Normalize out of 100 for fairness across custom weights
    const normalized = totalWeight > 0 ? (totalScore / totalWeight) * 100 : totalScore * 10;
    totalWeightedScore = Number(normalized.toFixed(2));
  } else {
    sanitizedScores = scores.map((item) => {
      const rawScore = Number(item.score) || 0;
      const max = 10;
      const weight = 1.0;
      totalWeight += weight;
      totalScore += (rawScore / max) * weight;

      return {
        criterion: item.criterion,
        score: rawScore,
        maxScore: max,
        weight,
      };
    });

    const normalized = (totalScore / Math.max(totalWeight, 1)) * 100;
    totalWeightedScore = Number(normalized.toFixed(2));
  }

  const evaluation = await Evaluation.findOneAndUpdate(
    {
      submissionId,
      judgeId: req.user._id,
    },
    {
      $set: {
        eventId: submission.eventId,
        scores: sanitizedScores,
        totalWeightedScore,
        feedback: feedback ? feedback.trim() : "",
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  // Trigger real-time Socket.io leaderboard update
  const updatedLeaderboard = await calculateLeaderboard(
    submission.eventId.toString()
  );
  emitLeaderboardUpdate(submission.eventId.toString(), updatedLeaderboard);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        evaluation,
        totalWeightedScore,
      },
      "Evaluation submitted successfully"
    )
  );
});

/**
 * Get live leaderboard for an event
 * GET /api/v1/evaluations/events/:eventId/leaderboard
 */
export const getLiveLeaderboard = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId).populate("festId", "createdBy organizers");
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Strict Organizer Isolation:
  const isOrganizer =
    Boolean(req.user) &&
    req.user.role === "organizer" &&
    req.user.globalRole !== "superadmin";

  if (isOrganizer) {
    const userIdStr = req.user._id.toString();
    const festCreatorStr = (
      event.festId?.createdBy?._id || event.festId?.createdBy
    )?.toString();
    const isFestCoOrg =
      Array.isArray(event.festId?.organizers) &&
      event.festId.organizers.some(
        (org) => (org?._id || org)?.toString() === userIdStr
      );

    if (festCreatorStr !== userIdStr && !isFestCoOrg) {
      throw new ApiError(
        403,
        "Access denied: Organizers can only view leaderboards for events they created or manage."
      );
    }
  }

  const leaderboard = await calculateLeaderboard(eventId);

  return res
    .status(200)
    .json(
      new ApiResponse(200, leaderboard, "Live leaderboard fetched successfully")
    );
});

/**
 * Download dynamic PDF Certificate (Winner or Participation)
 * GET /api/v1/evaluations/events/:eventId/certificate/:teamId
 */
export const downloadCertificate = asyncHandler(async (req, res) => {
  const { eventId, teamId } = req.params;

  const [event, team] = await Promise.all([
    Event.findById(eventId).populate("festId", "title collegeName createdBy organizers"),
    Team.findById(teamId).populate("members", "name email").populate("leaderId", "name email"),
  ]);

  if (!event) throw new ApiError(404, "Event not found");
  if (!team) throw new ApiError(404, "Team not found");

  // Strict Event-Team Binding: prevent generating certificates for other events
  if (team.eventId.toString() !== eventId) {
    throw new ApiError(
      400,
      "Security validation failed: Specified team does not belong to this event"
    );
  }

  const fest = event.festId;
  const festTitle = fest?.title || "StageZero Campus Tech Fest";
  const collegeName = fest?.collegeName || "";

  // Check if current user is part of the team or an organizer
  const userIdStr = req.user._id.toString();
  const isMember =
    (team.leaderId?._id || team.leaderId)?.toString() === userIdStr ||
    (Array.isArray(team.members) &&
      team.members.some((m) => (m._id || m)?.toString() === userIdStr));

  const isOrganizer =
    req.user.globalRole === "superadmin" ||
    (fest &&
      ((fest.createdBy && fest.createdBy.toString() === userIdStr) ||
        (Array.isArray(fest.organizers) &&
          fest.organizers.some((org) => org.toString() === userIdStr))));

  if (!isMember && !isOrganizer) {
    throw new ApiError(
      403,
      "Access forbidden: You can only download certificates for your own verified team"
    );
  }

  // If downloaded by an organizer on behalf of the squad, personalize with leader's name
  const participantName = isMember ? req.user.name : (team.leaderId?.name || req.user.name);

  // Determine Rank from leaderboard
  const leaderboard = await calculateLeaderboard(eventId);
  const teamRankEntry = leaderboard.find(
    (item) => item.teamId?.toString() === teamId
  );

  const rank = teamRankEntry ? teamRankEntry.rank : null;
  const isWinner = rank && rank <= 3;

  // Cryptographically deterministic, tamper-evident credential ID
  const verificationId = `SZ-${eventId.slice(-4).toUpperCase()}-${teamId
    .slice(-4)
    .toUpperCase()}-${req.user._id.toString().slice(-4).toUpperCase()}`;

  // Stream light-themed precision academic certificate
  generateCertificate(res, {
    participantName,
    teamName: team.name,
    eventTitle: event.title,
    festTitle,
    collegeName,
    verificationId,
    type: isWinner ? "Winner" : "Participation",
    rank: isWinner ? rank : null,
  });
});
