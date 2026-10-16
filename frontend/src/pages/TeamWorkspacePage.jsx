import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { teamsApi, submissionsApi, evaluationsApi, eventsApi } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { RoleBadge } from "../components/RoleBadge";
import {
  Users,
  Copy,
  Check,
  Send,
  Download,
  GitBranch,
  ExternalLink,
  Video,
  Layers,
  Sparkles,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  LogOut,
  UserPlus,
  Clock,
  Award,
  FileCheck,
} from "lucide-react";
import toast from "react-hot-toast";

export const TeamWorkspacePage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { socket, joinTeam, leaveTeam } = useSocket();

  const [event, setEvent] = useState(null);
  const [team, setTeam] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);

  // Forms
  const [createTeamName, setCreateTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [submittingProject, setSubmittingProject] = useState(false);

  const [submissionForm, setSubmissionForm] = useState({
    roundNumber: 1,
    projectTitle: "",
    tagline: "",
    description: "",
    repoUrl: "",
    demoUrl: "",
    videoUrl: "",
    techStack: "",
  });

  const loadTeamData = async () => {
    try {
      const [evRes, teamRes] = await Promise.all([
        eventsApi.getEventById(eventId),
        teamsApi.getMyTeam(eventId),
      ]);
      if (evRes?.data) setEvent(evRes.data);
      if (teamRes?.data) {
        setTeam(teamRes.data);
        joinTeam(teamRes.data._id);

        // Load existing submission if any
        try {
          const subRes = await submissionsApi.getSubmissionsByEvent(eventId, {
            roundNumber: 1,
          });
          const mySub = subRes.data?.find(
            (s) =>
              s.teamId?._id?.toString() === teamRes.data._id.toString() ||
              s.teamId?.toString() === teamRes.data._id.toString()
          );
          if (mySub) {
            setHasSubmitted(true);
            setSubmissionForm({
              roundNumber: mySub.roundNumber || 1,
              projectTitle: mySub.projectTitle || "",
              tagline: mySub.tagline || "",
              description: mySub.description || "",
              repoUrl: mySub.repoUrl || "",
              demoUrl: mySub.demoUrl || "",
              videoUrl: mySub.videoUrl || "",
              techStack: Array.isArray(mySub.techStack)
                ? mySub.techStack.join(", ")
                : mySub.techStack || "",
            });
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      // not in team yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [eventId]);

  // Real-time team updates listener
  useEffect(() => {
    if (!socket || !team?._id) return;

    const handleTeamUpdate = (updatedTeam) => {
      if (updatedTeam._id === team._id) {
        setTeam(updatedTeam);
        toast.success("Team roster updated in real time!");
      }
    };

    socket.on("team:update", handleTeamUpdate);

    return () => {
      socket.off("team:update", handleTeamUpdate);
    };
  }, [socket, team]);

  const handleCopyCode = () => {
    if (!team?.inviteCode) return;
    navigator.clipboard.writeText(team.inviteCode);
    setCopiedCode(true);
    toast.success("Invite code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createTeamName.trim()) return;
    try {
      setLoading(true);
      const res = await teamsApi.createTeam({
        eventId,
        name: createTeamName.trim(),
      });
      setTeam(res.data);
      joinTeam(res.data._id);
      toast.success(`Team '${res.data.name}' created! Share your invite code.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      setLoading(true);
      const res = await teamsApi.joinTeam(joinCode.trim().toUpperCase());
      setTeam(res.data);
      joinTeam(res.data._id);
      toast.success(`Joined team '${res.data.name}'!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join team");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm("Are you sure you want to leave this team?")) return;
    try {
      setLoading(true);
      if (team?._id) leaveTeam(team._id);
      await teamsApi.leaveTeam(team._id);
      setTeam(null);
      setHasSubmitted(false);
      toast.success("You have left the team");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to leave team");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!team?._id) return;
    setSubmittingProject(true);
    try {
      await submissionsApi.createOrUpdateSubmission({
        eventId,
        teamId: team._id,
        roundNumber: Number(submissionForm.roundNumber),
        projectTitle: submissionForm.projectTitle,
        tagline: submissionForm.tagline,
        description: submissionForm.description,
        repoUrl: submissionForm.repoUrl,
        demoUrl: submissionForm.demoUrl,
        videoUrl: submissionForm.videoUrl,
        techStack: submissionForm.techStack,
      });
      setHasSubmitted(true);
      toast.success("Project submitted successfully for evaluation!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!eventId || !team?._id) return;
    setDownloadingCert(true);
    try {
      toast.loading("Generating your verified PDF certificate...", { id: "cert-toast" });
      await evaluationsApi.downloadCertificate(
        eventId,
        team._id,
        `Certificate_${team.name.replace(/\s+/g, "_")}.pdf`
      );
      toast.success("Certificate downloaded successfully!", { id: "cert-toast" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Certificate generation failed", {
        id: "cert-toast",
      });
    } finally {
      setDownloadingCert(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" aria-hidden="true" />
        <p className="text-sm font-mono text-slate-600">Loading hacker workspace…</p>
      </div>
    );
  }

  // If user is not yet in a team for this event:
  if (!team) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight text-balance">
            Join or Create a Team
          </h1>
          <p className="text-sm text-slate-600">
            {event?.title || "Event"} &bull; Teams of <span className="font-mono tabular-nums font-semibold text-slate-800">{event?.teamSize?.min}&ndash;{event?.teamSize?.max}</span> members
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Team Box */}
          <div className="precision-card p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-slate-900">Create a New Team</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                You will be assigned as Team Leader and receive an invite code for your teammates.
              </p>
            </div>
            <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="create-team-name-input"
                  className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider"
                >
                  Team Name
                </label>
                <input
                  id="create-team-name-input"
                  type="text"
                  required
                  placeholder="Team Name (e.g. NeuralNexus)"
                  value={createTeamName}
                  onChange={(e) => setCreateTeamName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Create Team
              </button>
            </form>
          </div>

          {/* Join with Invite Code Box */}
          <div className="precision-card p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <UserPlus className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-slate-900">Join via Invite Code</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Enter the 6-character code provided by your team leader.
              </p>
            </div>
            <form onSubmit={handleJoinTeam} className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="join-team-code-input"
                  className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider"
                >
                  6-Character Invite Code
                </label>
                <input
                  id="join-team-code-input"
                  type="text"
                  required
                  maxLength={6}
                  spellCheck={false}
                  placeholder="6-CHAR CODE (e.g. NEXUS1)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono uppercase tracking-widest text-center focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Join Team
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // User is in a team: show 4-Stage Progress Stepper, Team Workspace & Submission Form
  const isLeader =
    team.leaderId?._id?.toString() === user?._id?.toString() ||
    team.leaderId?.toString() === user?._id?.toString();

  return (
    <div className="space-y-8 py-4">
      {/* 4-Stage Hacker Journey Progress Stepper */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Step 1: Team Formed */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
              <Check className="w-3.5 h-3.5" />
            </span>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate">1. Team Formed</div>
              <div className="text-[10px] text-emerald-700 font-medium">Ready ({team.members?.length || 1} mbrs)</div>
            </div>
          </div>

          {/* Step 2: Campus Check-In */}
          <div className={`flex items-center gap-2.5 p-2 rounded-xl border ${
            team.checkedIn
              ? "bg-slate-50 border-slate-200"
              : "bg-amber-50/50 border-amber-200"
          }`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
              team.checkedIn
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800 font-mono"
            }`}>
              {team.checkedIn ? <Check className="w-3.5 h-3.5" /> : "2"}
            </span>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate">2. Venue Check-in</div>
              <div className="text-[10px] text-slate-500 font-medium">
                {team.checkedIn ? "Verified at Venue" : "Pending Check-In"}
              </div>
            </div>
          </div>

          {/* Step 3: MVP Prototype Submitted */}
          <div className={`flex items-center gap-2.5 p-2 rounded-xl border ${
            hasSubmitted
              ? "bg-slate-50 border-slate-200"
              : "bg-indigo-50/50 border-indigo-200"
          }`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
              hasSubmitted
                ? "bg-emerald-100 text-emerald-800"
                : "bg-indigo-100 text-indigo-700 font-mono"
            }`}>
              {hasSubmitted ? <Check className="w-3.5 h-3.5" /> : "3"}
            </span>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate">3. Submission</div>
              <div className="text-[10px] text-slate-500 font-medium">
                {hasSubmitted ? "Prototype Logged" : "Draft In Progress"}
              </div>
            </div>
          </div>

          {/* Step 4: Judging & Certificate */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-mono font-bold shrink-0">
              4
            </span>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate">4. Live Evaluation</div>
              <div className="text-[10px] text-slate-500 font-medium">Stream Credentials</div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Header & Roster */}
      <div className="precision-card p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-slate-500">Team Workspace:</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                {event?.title}
              </span>
              {team.checkedIn && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                  Checked In
                </span>
              )}
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
              {team.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Invite Code Box with Neubrutalism Accent */}
            <div className="flex items-center gap-2.5 bg-[#FEF08A] border-2 border-slate-900 rounded-xl px-3.5 py-1.5 shadow-[2px_2px_0px_#0F172A]">
              <div className="text-left">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-900 block -mb-0.5">
                  Invite Code
                </span>
                <span className="text-sm font-mono font-black text-slate-950 tracking-wider">
                  {team.inviteCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Copy team invite code"
                className="p-1.5 text-slate-900 hover:text-black rounded-lg hover:bg-yellow-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer"
                title="Copy Invite Code"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleLeaveTeam}
              aria-label="Leave team"
              className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
              title="Leave Team"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Team Members Roster */}
        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold mb-3">
            Team Members (<span className="tabular-nums font-semibold text-slate-800">{team.members?.length || 1}</span> / <span className="tabular-nums font-semibold text-slate-800">{event?.teamSize?.max || 4}</span>)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {Array.isArray(team.members) &&
              team.members.map((member) => {
                const isMemLeader =
                  (team.leaderId?._id || team.leaderId)?.toString() ===
                  (member._id || member)?.toString();
                return (
                  <div
                    key={member._id || member}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 font-mono">
                      {member.name ? member.name.charAt(0) : "M"}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <span className="truncate">{member.name || "Member"}</span>
                        {isMemLeader && (
                          <span className="text-[9px] font-mono font-bold text-amber-900 bg-amber-100 px-1 rounded border border-amber-300">
                            LEAD
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate font-mono">
                        {member.college || member.email}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Main Grid: Submission Form & Certificate Streamer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Project Submission Form */}
        <div className="lg:col-span-8 precision-card p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" aria-hidden="true" />
              <span>Project Submission Form</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Submit your code repository, live demo URLs, and stack details for judge review. You can update this at any time before the deadline.
            </p>
          </div>

          <form onSubmit={handleSubmitProject} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="submission-project-title"
                  className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider"
                >
                  Project Title *
                </label>
                <input
                  id="submission-project-title"
                  type="text"
                  required
                  placeholder="e.g. StageZero Autonomous Fleet Dispatcher"
                  value={submissionForm.projectTitle}
                  onChange={(e) =>
                    setSubmissionForm({
                      ...submissionForm,
                      projectTitle: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label
                  htmlFor="submission-round-number"
                  className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider"
                >
                  Round
                </label>
                <select
                  id="submission-round-number"
                  value={submissionForm.roundNumber}
                  onChange={(e) =>
                    setSubmissionForm({
                      ...submissionForm,
                      roundNumber: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30"
                >
                  <option value={1}>Round 1: MVP Prototype</option>
                  <option value={2}>Round 2: Grand Finale</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="submission-tagline"
                className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider"
              >
                Tagline (One-sentence pitch)
              </label>
              <input
                id="submission-tagline"
                type="text"
                placeholder="e.g. Real-time AI logistics and incident triage for campus fests"
                value={submissionForm.tagline}
                onChange={(e) =>
                  setSubmissionForm({
                    ...submissionForm,
                    tagline: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label
                htmlFor="submission-description"
                className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider"
              >
                Detailed Description &amp; Architecture *
              </label>
              <textarea
                id="submission-description"
                required
                rows={4}
                placeholder="Explain the problem solved, tech architecture, and what makes your project unique…"
                value={submissionForm.description}
                onChange={(e) =>
                  setSubmissionForm({
                    ...submissionForm,
                    description: e.target.value,
                  })
                }
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="submission-repo-url"
                  className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1"
                >
                  <GitBranch className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                  <span>GitHub Repository URL</span>
                </label>
                <input
                  id="submission-repo-url"
                  type="url"
                  autoComplete="url"
                  spellCheck={false}
                  placeholder="https://github.com/username/project"
                  value={submissionForm.repoUrl}
                  onChange={(e) =>
                    setSubmissionForm({
                      ...submissionForm,
                      repoUrl: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label
                  htmlFor="submission-demo-url"
                  className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                  <span>Live Demo / App URL</span>
                </label>
                <input
                  id="submission-demo-url"
                  type="url"
                  autoComplete="url"
                  spellCheck={false}
                  placeholder="https://myproject.demo.app"
                  value={submissionForm.demoUrl}
                  onChange={(e) =>
                    setSubmissionForm({
                      ...submissionForm,
                      demoUrl: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="submission-video-url"
                  className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1"
                >
                  <Video className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                  <span>Demo Video / Pitch URL</span>
                </label>
                <input
                  id="submission-video-url"
                  type="url"
                  autoComplete="url"
                  spellCheck={false}
                  placeholder="https://youtube.com/watch?v=..."
                  value={submissionForm.videoUrl}
                  onChange={(e) =>
                    setSubmissionForm({
                      ...submissionForm,
                      videoUrl: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label
                  htmlFor="submission-tech-stack"
                  className="block text-xs font-mono font-medium text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                  <span>Tech Stack (Comma-separated)</span>
                </label>
                <input
                  id="submission-tech-stack"
                  type="text"
                  spellCheck={false}
                  placeholder="React, Node.js, Socket.io, Tailwind"
                  value={submissionForm.techStack}
                  onChange={(e) =>
                    setSubmissionForm({
                      ...submissionForm,
                      techStack: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingProject}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] flex items-center justify-center gap-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {submittingProject ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>Submit Project to Judging Queue</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Dynamic Verified Certificate Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="precision-card p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Download className="w-5 h-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-base font-heading font-bold text-slate-900">
                Verifiable PDF Certificate
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Download your official StageZero credential streaming dynamically from PDFKit with digital verification hash.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Recipient:</span>
                <span className="font-semibold text-slate-900">{user?.name}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Team:</span>
                <span className="font-semibold text-slate-900">{team.name}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Event:</span>
                <span className="font-semibold text-slate-900">{event?.title}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadCertificate}
              disabled={downloadingCert}
              className="w-full py-3 px-4 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex items-center justify-center gap-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {downloadingCert ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Download Verified PDF</span>
                </>
              )}
            </button>

            <Link
              to={`/events/${eventId}/leaderboard`}
              className="block text-center text-xs font-semibold text-indigo-600 hover:text-indigo-700 pt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg"
            >
              View Live Leaderboard Rankings &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
