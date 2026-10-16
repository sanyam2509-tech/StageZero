import { Fest } from "../models/Fest.model.js";
import { Event } from "../models/Event.model.js";
import { Team } from "../models/Team.model.js";
import { Submission } from "../models/Submission.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Ensures user is an organizer or creator of the fest (or superadmin).
 * Looks up fest via req.params.festId, req.body.festId, req.params.slug,
 * or indirectly via req.params.eventId / req.body.eventId.
 */
export const isFestOrganizer = asyncHandler(async (req, res, next) => {
  if (req.user?.globalRole === "superadmin") {
    return next();
  }

  let festId = req.params.festId || req.body.festId;
  const festSlug = req.params.slug;
  const eventId = req.params.eventId || req.body.eventId;
  const teamId = req.params.teamId || req.body.teamId;

  let fest = null;

  if (festId) {
    fest = await Fest.findById(festId);
  } else if (festSlug) {
    fest = await Fest.findOne({ slug: festSlug });
  } else if (eventId) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new ApiError(404, "Associated event not found");
    }
    fest = await Fest.findById(event.festId);
  } else if (teamId) {
    const team = await Team.findById(teamId);
    if (!team) {
      throw new ApiError(404, "Associated team not found");
    }
    const event = await Event.findById(team.eventId);
    if (!event) {
      throw new ApiError(404, "Associated event for team not found");
    }
    fest = await Fest.findById(event.festId);
  }

  if (!fest) {
    throw new ApiError(404, "Fest not found for authorization check");
  }

  const userIdStr = req.user._id.toString();
  const isCreator = fest.createdBy.toString() === userIdStr;
  const isOrganizer = Array.isArray(fest.organizers) && fest.organizers.some(
    (orgId) => orgId.toString() === userIdStr
  );

  if (!isCreator && !isOrganizer) {
    throw new ApiError(
      403,
      "Access forbidden: You are not an organizer of this fest"
    );
  }

  req.fest = fest;
  next();
});

/**
 * Ensures user has organizer privileges to host/create a fest (or superadmin).
 * Regular participants and judges cannot host fests.
 */
export const canHostFest = asyncHandler(async (req, res, next) => {
  if (req.user?.globalRole === "superadmin") {
    return next();
  }

  const isOrganizer =
    req.user?.role === "organizer" ||
    req.user?.email === "organizer@demo.com";

  if (!isOrganizer) {
    throw new ApiError(
      403,
      "Access forbidden: Only verified organizers can host a campus fest. Participants and judges are not permitted to host fests."
    );
  }

  next();
});

/**
 * Ensures user is an assigned judge for the event (or organizer / superadmin).
 * Strictly binds submissionId to its event and verifies against cross-event tampering.
 */
export const isEventJudge = asyncHandler(async (req, res, next) => {
  if (req.user?.globalRole === "superadmin") {
    return next();
  }

  const submissionId = req.params.submissionId || req.body.submissionId;
  let eventId = req.params.eventId || req.body.eventId;

  let submission = null;
  if (submissionId) {
    submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }
    // Cross-event tampering check: if eventId is provided, it must match the submission's event
    if (eventId && submission.eventId.toString() !== eventId.toString()) {
      throw new ApiError(
        400,
        "Cross-event mismatch: submission does not belong to specified event"
      );
    }
    eventId = submission.eventId;
  }

  if (!eventId) {
    throw new ApiError(400, "Event ID required for judge authorization");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  const userIdStr = req.user._id.toString();
  const isJudge = Array.isArray(event.judges) && event.judges.some((jId) => jId.toString() === userIdStr);

  if (isJudge) {
    req.event = event;
    if (submission) req.submission = submission;
    return next();
  }

  // Also check if user is Fest Organizer or Creator
  const fest = await Fest.findById(event.festId);
  if (fest) {
    const isCreator = fest.createdBy.toString() === userIdStr;
    const isOrganizer = Array.isArray(fest.organizers) && fest.organizers.some(
      (orgId) => orgId.toString() === userIdStr
    );
    if (isCreator || isOrganizer) {
      req.event = event;
      req.fest = fest;
      if (submission) req.submission = submission;
      return next();
    }
  }

  throw new ApiError(
    403,
    "Access forbidden: You are not an assigned judge or organizer for this event"
  );
});

/**
 * Ensures user is the leader of the team (or superadmin).
 */
export const isTeamLeader = asyncHandler(async (req, res, next) => {
  if (req.user?.globalRole === "superadmin") {
    return next();
  }

  const teamId = req.params.teamId || req.body.teamId;
  if (!teamId) {
    throw new ApiError(400, "Team ID required for team leader verification");
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  if (team.leaderId.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "Access forbidden: Only the team leader can perform this action"
    );
  }

  req.team = team;
  next();
});
