import { Team } from "../models/Team.model.js";
import { Event } from "../models/Event.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateInviteCode } from "../utils/generateInviteCode.js";
import { emitTeamUpdate } from "../socket.js";

/**
 * Create a new team for an event
 * POST /api/v1/teams
 */
export const createTeam = asyncHandler(async (req, res) => {
  const { eventId, name } = req.body;

  if (!eventId || !name) {
    throw new ApiError(400, "Event ID and Team Name are required");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Check if user is already in a team for this event
  const existingTeam = await Team.findOne({
    eventId,
    $or: [{ leaderId: req.user._id }, { members: req.user._id }],
  });

  if (existingTeam) {
    throw new ApiError(
      400,
      `You are already a member/leader of team '${existingTeam.name}' in this event`
    );
  }

  // Generate unique 6-character invite code
  let inviteCode = generateInviteCode();
  let codeExists = await Team.findOne({ inviteCode });
  while (codeExists) {
    inviteCode = generateInviteCode();
    codeExists = await Team.findOne({ inviteCode });
  }

  const team = await Team.create({
    eventId,
    name: name.trim(),
    inviteCode,
    leaderId: req.user._id,
    members: [req.user._id],
    checkedIn: false,
  });

  const populatedTeam = await Team.findById(team._id)
    .populate("leaderId", "name email college githubUrl")
    .populate("members", "name email college githubUrl")
    .populate("eventId", "title category teamSize rounds status");

  return res
    .status(201)
    .json(new ApiResponse(201, populatedTeam, "Team created successfully"));
});

/**
 * Join an existing team using invite code
 * POST /api/v1/teams/join
 */
export const joinTeam = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;

  if (!inviteCode) {
    throw new ApiError(400, "6-character invite code is required");
  }

  const cleanCode = inviteCode.trim().toUpperCase();
  const team = await Team.findOne({ inviteCode: cleanCode });
  if (!team) {
    throw new ApiError(404, "Invalid invite code: Team not found");
  }

  const event = await Event.findById(team.eventId);
  if (!event) {
    throw new ApiError(404, "Associated event not found");
  }

  const userIdStr = req.user._id.toString();

  // Check if user is already in this team
  const isAlreadyMember = team.members.some(
    (mId) => mId.toString() === userIdStr
  );
  if (isAlreadyMember) {
    throw new ApiError(400, "You are already a member of this team");
  }

  // Check if user is already in another team for this event
  const alreadyInOtherTeam = await Team.findOne({
    eventId: team.eventId,
    $or: [{ leaderId: req.user._id }, { members: req.user._id }],
  });

  if (alreadyInOtherTeam) {
    throw new ApiError(
      400,
      `You are already registered in team '${alreadyInOtherTeam.name}' for this event`
    );
  }

  // Check team maximum size
  const maxTeamSize = event.teamSize?.max || 4;
  if (team.members.length >= maxTeamSize) {
    throw new ApiError(
      400,
      `Team has already reached maximum capacity of ${maxTeamSize} members`
    );
  }

  team.members.push(req.user._id);
  await team.save();

  const populatedTeam = await Team.findById(team._id)
    .populate("leaderId", "name email college githubUrl")
    .populate("members", "name email college githubUrl")
    .populate("eventId", "title category teamSize rounds status");

  // Broadcast real-time team roster update
  emitTeamUpdate(team._id.toString(), populatedTeam);

  return res
    .status(200)
    .json(
      new ApiResponse(200, populatedTeam, `Successfully joined team '${team.name}'`)
    );
});

/**
 * Leave a team
 * POST /api/v1/teams/:teamId/leave
 */
export const leaveTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const userIdStr = req.user._id.toString();

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  const isMember = team.members.some((m) => m.toString() === userIdStr);
  if (!isMember) {
    throw new ApiError(400, "You are not a member of this team");
  }

  // If leader is leaving
  if (team.leaderId.toString() === userIdStr) {
    const remainingMembers = team.members.filter(
      (m) => m.toString() !== userIdStr
    );

    if (remainingMembers.length === 0) {
      // Disband team if leader is sole member
      await Team.findByIdAndDelete(teamId);
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Team disbanded as the last member left"));
    } else {
      // Pass leadership to the next member
      team.leaderId = remainingMembers[0];
      team.members = remainingMembers;
      await team.save();
    }
  } else {
    // Normal member leaving
    team.members = team.members.filter((m) => m.toString() !== userIdStr);
    await team.save();
  }

  const updatedTeam = await Team.findById(teamId)
    .populate("leaderId", "name email college")
    .populate("members", "name email college");

  emitTeamUpdate(teamId, updatedTeam);

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTeam, "Successfully left team"));
});

/**
 * Toggle or set check-in status for a team (Organizer action)
 * PATCH /api/v1/teams/:teamId/checkin
 */
export const toggleTeamCheckIn = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { checkedIn } = req.body;

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, "Team not found");
  }

  team.checkedIn = typeof checkedIn === "boolean" ? checkedIn : !team.checkedIn;
  await team.save();

  const updatedTeam = await Team.findById(teamId)
    .populate("leaderId", "name email college")
    .populate("members", "name email college");

  emitTeamUpdate(teamId, updatedTeam);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedTeam,
        `Team check-in status updated to ${team.checkedIn}`
      )
    );
});

/**
 * Get current user's team for a given event
 * GET /api/v1/teams/events/:eventId/my-team
 */
export const getMyTeam = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const team = await Team.findOne({
    eventId,
    $or: [{ leaderId: req.user._id }, { members: req.user._id }],
  })
    .populate("leaderId", "name email college githubUrl")
    .populate("members", "name email college githubUrl")
    .populate("eventId", "title category teamSize rounds rubric status");

  return res
    .status(200)
    .json(new ApiResponse(200, team, "My team fetched successfully"));
});

/**
 * Get all teams for an event (for Organizer view / check-ins)
 * GET /api/v1/teams/events/:eventId
 */
export const getTeamsByEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const teams = await Team.find({ eventId })
    .populate("leaderId", "name email college githubUrl")
    .populate("members", "name email college githubUrl")
    .sort({ createdAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, teams, "Teams fetched successfully"));
});
