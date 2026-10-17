import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { eventsApi, teamsApi, submissionsApi, festsApi } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { RoleBadge } from "../components/RoleBadge";
import { formatDateTime } from "../utils/formatters";
import {
  ShieldCheck,
  BellRing,
  Users,
  CheckCircle2,
  XCircle,
  Sliders,
  UserPlus,
  Send,
  Loader2,
  Plus,
  Trash2,
  Trophy,
  AlertTriangle,
  FileCheck,
  Radio,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

export const OrganizerDashboard = () => {
  const { eventId } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);
  const [submissionsCount, setSubmissionsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Announcement State
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    priority: "info",
  });
  const [broadcasting, setBroadcasting] = useState(false);

  // Judge Assignment State
  const [judgeEmail, setJudgeEmail] = useState("");
  const [assigningJudge, setAssigningJudge] = useState(false);

  // Co-Organizer State
  const [coOrganizerEmail, setCoOrganizerEmail] = useState("");
  const [addingCoOrganizer, setAddingCoOrganizer] = useState(false);
  const [removingCoOrgId, setRemovingCoOrgId] = useState(null);

  // Rubric editing state
  const [rubric, setRubric] = useState([]);
  const [savingRubric, setSavingRubric] = useState(false);

  const loadData = async () => {
    try {
      const [evRes, teamsRes, subRes] = await Promise.all([
        eventsApi.getEventById(eventId),
        teamsApi.getTeamsByEvent(eventId),
        submissionsApi.getSubmissionsByEvent(eventId).catch(() => ({ data: [] })),
      ]);

      if (evRes?.data) {
        setEvent(evRes.data);
        setRubric(evRes.data.rubric || []);
      }
      if (teamsRes?.data) setTeams(teamsRes.data);
      if (subRes?.data) setSubmissionsCount(subRes.data.length);
    } catch (err) {
      toast.error("Failed to load organizer dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  // Broadcast announcement over Socket.io
  const handleBroadcastAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.message.trim()) return;
    setBroadcasting(true);
    try {
      await eventsApi.broadcastAnnouncement(eventId, announcement);
      toast.success("Live announcement broadcasted to all participants!");
      setAnnouncement({ title: "", message: "", priority: "info" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to broadcast announcement");
    } finally {
      setBroadcasting(false);
    }
  };

  // Toggle Team Check-in status
  const handleToggleCheckIn = async (teamId, currentStatus) => {
    try {
      await teamsApi.toggleCheckIn(teamId, !currentStatus);
      setTeams((prev) =>
        prev.map((t) => (t._id === teamId ? { ...t, checkedIn: !currentStatus } : t))
      );
      toast.success(
        `Team check-in status updated to ${!currentStatus ? "CHECKED IN" : "NOT CHECKED IN"}`
      );
    } catch (err) {
      toast.error("Failed to update check-in status");
    }
  };

  // Assign Judge by email
  const handleAssignJudge = async (e) => {
    e.preventDefault();
    if (!judgeEmail.trim()) return;
    setAssigningJudge(true);
    try {
      await eventsApi.assignJudges(eventId, [judgeEmail.trim()]);
      toast.success(`Judge '${judgeEmail}' assigned successfully!`);
      setJudgeEmail("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign judge");
    } finally {
      setAssigningJudge(false);
    }
  };

  // Add Co-Organizer to Fest
  const handleAddCoOrganizer = async (e) => {
    e.preventDefault();
    if (!coOrganizerEmail.trim()) return;
    const festId = event?.festId?._id || event?.festId;
    if (!festId) {
      toast.error("Fest information not found");
      return;
    }

    setAddingCoOrganizer(true);
    try {
      await festsApi.addOrganizer(festId, coOrganizerEmail.trim());
      toast.success(`Co-organizer '${coOrganizerEmail}' added successfully!`);
      setCoOrganizerEmail("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add co-organizer");
    } finally {
      setAddingCoOrganizer(false);
    }
  };

  // Remove Co-Organizer from Fest
  const handleRemoveCoOrganizer = async (userId) => {
    const festId = event?.festId?._id || event?.festId;
    if (!festId) return;

    setRemovingCoOrgId(userId);
    try {
      await festsApi.removeOrganizer(festId, userId);
      toast.success("Co-organizer removed successfully");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove co-organizer");
    } finally {
      setRemovingCoOrgId(null);
    }
  };

  // Rubric modifications
  const handleAddCriterion = () => {
    setRubric((prev) => [
      ...prev,
      { criterion: "New Scoring Criterion", maxScore: 10, weight: 1.0 },
    ]);
  };

  const handleUpdateCriterion = (index, field, value) => {
    setRubric((prev) => {
      const updated = [...prev];
      updated[index][field] =
        field === "maxScore" || field === "weight" ? parseFloat(value) || 0 : value;
      return updated;
    });
  };

  const handleDeleteCriterion = (index) => {
    setRubric((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRubric = async () => {
    setSavingRubric(true);
    try {
      await eventsApi.updateEvent(eventId, { rubric });
      toast.success("Event judging rubric saved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save rubric");
    } finally {
      setSavingRubric(false);
    }
  };

  // Calculated Metrics
  const checkedInCount = useMemo(() => teams.filter((t) => t.checkedIn).length, [teams]);
  const checkInRate = teams.length > 0 ? Math.round((checkedInCount / teams.length) * 100) : 0;
  const judgesCount = event?.judges?.length || 0;

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" aria-hidden="true" />
        <p className="text-sm font-mono text-slate-600">Loading Organizer Command Center…</p>
      </div>
    );
  }

  const userIdStr = user?._id?.toString();
  const isOrganizer = Boolean(
    user && (
      user.globalRole === "superadmin" ||
      event?.festId?.createdBy?.toString() === userIdStr ||
      event?.festId?.createdBy?._id?.toString() === userIdStr ||
      (Array.isArray(event?.festId?.organizers) &&
        event.festId.organizers.some(
          (o) => (o._id?.toString() || o.toString()) === userIdStr
        ))
    )
  );

  if (!isOrganizer) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-slate-900">
          Organizer Access Only
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          You are not registered as an organizer for this fest. Only the fest creator and authorized co-organizers can access operational controls, rubrics, and judge assignments.
        </p>
        <div className="pt-2">
          <Link
            to={`/events/${eventId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Return to Event Arena</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="precision-card p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 font-medium">Organizer Console:</span>
              <RoleBadge role="organizer" size="xs" />
            </div>
            <h1 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight text-balance">
              {event?.title}
            </h1>
            <p className="text-xs text-slate-500">
              Fest: {event?.festId?.title} &bull; University: {event?.festId?.collegeName}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to={`/events/${eventId}/leaderboard`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Trophy className="w-4 h-4 text-slate-950" aria-hidden="true" />
              <span>Projector Leaderboard &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Action / Health Warnings Strip */}
        {judgesCount === 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <strong>Notice: No judges assigned yet.</strong> Add at least one verified judge by email below so teams can receive scores during judging rounds.
            </div>
          </div>
        )}

        {rubric.length === 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <strong>Warning: Rubric is currently empty.</strong> Add criteria in the Rubric Builder below to allow scoring sliders to calculate rankings.
            </div>
          </div>
        )}
      </div>

      {/* Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1: Total Teams */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase">Total Teams</span>
            <Users className="w-4 h-4 text-indigo-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {teams.length}
          </div>
          <p className="text-[11px] text-slate-500">Registered across event</p>
        </div>

        {/* Metric 2: Check-in Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase">Checked In</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-600 tabular-nums">
            {checkedInCount} <span className="text-xs text-slate-400 font-sans font-normal">({checkInRate}%)</span>
          </div>
          <p className="text-[11px] text-slate-500">Verified at venue</p>
        </div>

        {/* Metric 3: Submissions Received */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase">Submissions</span>
            <FileCheck className="w-4 h-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {submissionsCount}
          </div>
          <p className="text-[11px] text-slate-500">MVP prototypes logged</p>
        </div>

        {/* Metric 4: Assigned Judges */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-semibold uppercase">Judges</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {judgesCount}
          </div>
          <p className="text-[11px] text-slate-500">Active evaluation panel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Real-time Announcement Broadcaster & Judge Assignment */}
        <div className="lg:col-span-6 space-y-6">
          {/* Real-time Socket.io Announcement Broadcaster */}
          <div className="precision-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <BellRing className="w-5 h-5 animate-pulse" aria-hidden="true" />
              <h2 className="text-lg font-heading font-bold text-slate-900">Broadcast Live Announcement</h2>
            </div>
            <p className="text-xs text-slate-500">
              Pushes immediate Socket.io audio/visual alerts to all connected participants and project dashboard displays.
            </p>

            <form onSubmit={handleBroadcastAnnouncement} className="space-y-4">
              <div>
                <label
                  htmlFor="organizer-alert-title"
                  className="block text-xs font-mono text-slate-700 font-medium mb-1 uppercase tracking-wider"
                >
                  Alert Title
                </label>
                <input
                  id="organizer-alert-title"
                  type="text"
                  placeholder="e.g. Round 1 Submissions Extended by 30 Mins!"
                  value={announcement.title}
                  onChange={(e) =>
                    setAnnouncement({ ...announcement, title: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label
                  htmlFor="organizer-alert-priority"
                  className="block text-xs font-mono text-slate-700 font-medium mb-1 uppercase tracking-wider"
                >
                  Priority
                </label>
                <select
                  id="organizer-alert-priority"
                  value={announcement.priority}
                  onChange={(e) =>
                    setAnnouncement({ ...announcement, priority: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30"
                >
                  <option value="info">Info / General Notification</option>
                  <option value="warning">Warning / Schedule Update</option>
                  <option value="urgent">Urgent / Action Required</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="organizer-alert-message"
                  className="block text-xs font-mono text-slate-700 font-medium mb-1 uppercase tracking-wider"
                >
                  Message Content *
                </label>
                <textarea
                  id="organizer-alert-message"
                  required
                  rows={3}
                  placeholder="Dinner is served at Hall B! Also, please verify all GitHub repo links are public."
                  value={announcement.message}
                  onChange={(e) =>
                    setAnnouncement({ ...announcement, message: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={broadcasting}
                className="w-full py-3 px-4 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex items-center justify-center gap-2 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {broadcasting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>Broadcast Real-time Alert</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Assign Judges Panel */}
          <div className="precision-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <UserPlus className="w-5 h-5" aria-hidden="true" />
              <h2 className="text-lg font-heading font-bold text-slate-900">Assign Event Judges</h2>
            </div>
            <p className="text-xs text-slate-500">
              Grant scoring privileges for this hackathon by verified judge email address or private invite code.
            </p>

            {event?.judgeInviteToken && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-mono text-amber-800 uppercase tracking-wider block font-bold">
                    Judge Self-Invite Code
                  </span>
                  <span className="font-mono font-extrabold text-amber-950 text-sm">
                    {event.judgeInviteToken}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(event.judgeInviteToken);
                    toast.success("Judge invite code copied to clipboard!");
                  }}
                  className="px-2.5 py-1 text-[11px] font-mono bg-white border border-amber-300 rounded-lg text-amber-900 font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Copy Code
                </button>
              </div>
            )}

            <form onSubmit={handleAssignJudge} className="flex gap-2">
              <label htmlFor="organizer-judge-email" className="sr-only">
                Judge Email Address
              </label>
              <input
                id="organizer-judge-email"
                type="email"
                required
                autoComplete="email"
                spellCheck={false}
                placeholder="judge@demo.com"
                value={judgeEmail}
                onChange={(e) => setJudgeEmail(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={assigningJudge}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs border border-slate-900 shadow-sm transition-colors shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer"
              >
                {assigningJudge ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : "Assign"}
              </button>
            </form>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono tabular-nums uppercase tracking-wider text-slate-500 font-semibold">
                Active Judging Panel ({judgesCount})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.isArray(event?.judges) &&
                  event.judges.map((j) => (
                    <div
                      key={j._id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs"
                    >
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] border border-amber-300 font-mono">
                        {j.name?.charAt(0) || "J"}
                      </span>
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 truncate">{j.name}</div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          {j.email}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Manage Co-Organizers Panel */}
          <div className="precision-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-purple-600">
              <Users className="w-5 h-5" aria-hidden="true" />
              <h2 className="text-lg font-heading font-bold text-slate-900">Fest Co-Organizers</h2>
            </div>
            <p className="text-xs text-slate-500">
              Co-organizers share operational controls to manage events, rubric criteria, announcements, and check-ins.
            </p>

            <form onSubmit={handleAddCoOrganizer} className="flex gap-2">
              <label htmlFor="organizer-co-email" className="sr-only">
                Co-Organizer Email Address
              </label>
              <input
                id="organizer-co-email"
                type="email"
                required
                autoComplete="email"
                spellCheck={false}
                placeholder="co-organizer@university.edu"
                value={coOrganizerEmail}
                onChange={(e) => setCoOrganizerEmail(e.target.value)}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-purple-600 focus-visible:ring-2 focus-visible:ring-purple-600/30 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={addingCoOrganizer}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs border border-slate-900 shadow-sm transition-colors shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 cursor-pointer"
              >
                {addingCoOrganizer ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : "Invite"}
              </button>
            </form>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono tabular-nums uppercase tracking-wider text-slate-500 font-semibold">
                Organizing Team ({1 + (event?.festId?.organizers?.length || 0)})
              </span>
              <div className="space-y-2">
                {/* Primary Creator */}
                {event?.festId?.createdBy && (
                  <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-6 h-6 rounded-full bg-purple-200 text-purple-900 font-bold flex items-center justify-center text-[10px] border border-purple-300 font-mono">
                        {(event.festId.createdBy.name || "C").charAt(0)}
                      </span>
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                          <span>{event.festId.createdBy.name || "Lead Organizer"}</span>
                          <span className="text-[9px] font-mono uppercase bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-bold">
                            Lead
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">
                          {event.festId.createdBy.email}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Co-Organizers list */}
                {Array.isArray(event?.festId?.organizers) &&
                  event.festId.organizers
                    .filter((org) => {
                      const orgId = (org?._id || org)?.toString();
                      const creatorId = (event?.festId?.createdBy?._id || event?.festId?.createdBy)?.toString();
                      return orgId !== creatorId;
                    })
                    .map((org) => {
                      const orgId = (org?._id || org).toString();
                      const isCurrentUserCreator =
                        user &&
                        (user.globalRole === "superadmin" ||
                          (event?.festId?.createdBy?._id || event?.festId?.createdBy)?.toString() === user._id);

                      return (
                        <div
                          key={orgId}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-[10px] border border-slate-300 font-mono">
                              {(org.name || "O").charAt(0)}
                            </span>
                            <div className="truncate">
                              <div className="font-semibold text-slate-900 truncate">
                                {org.name || "Co-Organizer"}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate font-mono">
                                {org.email || orgId}
                              </div>
                            </div>
                          </div>

                          {isCurrentUserCreator && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCoOrganizer(orgId)}
                              disabled={removingCoOrgId === orgId}
                              className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                              title="Remove co-organizer"
                            >
                              {removingCoOrgId === orgId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Team Check-Ins Roster & Rubric Builder */}
        <div className="lg:col-span-6 space-y-6">
          {/* Team Check-in Roster */}
          <div className="precision-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600">
                <Users className="w-5 h-5" aria-hidden="true" />
                <h2 className="text-lg font-heading font-bold text-slate-900">
                  Team Check-In Manager ({teams.length})
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                {checkedInCount} Checked In
              </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1" tabIndex={0} role="region" aria-label="Team roster">
              {teams.length > 0 ? (
                teams.map((t) => (
                  <div
                    key={t._id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                          {t.inviteCode}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Leader: {t.leaderId?.name || "Participant"} &bull;{" "}
                        <span className="font-mono tabular-nums font-semibold text-slate-700">{t.members?.length || 1}</span> members
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleCheckIn(t._id, t.checkedIn)}
                      aria-label={t.checkedIn ? `Check out team ${t.name}` : `Check in team ${t.name}`}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        t.checkedIn
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                          : "bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-300 shadow-sm"
                      }`}
                    >
                      {t.checkedIn ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                          <span>Checked In</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>Check In</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No teams registered for this event yet.</p>
              )}
            </div>
          </div>

          {/* Rubric Builder */}
          <div className="precision-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sliders className="w-5 h-5" aria-hidden="true" />
                <h2 className="font-heading text-lg font-bold text-slate-900">Evaluation Rubric Builder</h2>
              </div>
              <button
                type="button"
                onClick={handleAddCriterion}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium hover:bg-indigo-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add Criterion</span>
              </button>
            </div>

            <div className="space-y-3">
              {rubric.map((criterion, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={criterion.criterion}
                    onChange={(e) =>
                      handleUpdateCriterion(idx, "criterion", e.target.value)
                    }
                    placeholder="Criterion Name"
                    aria-label={`Criterion ${idx + 1} Name`}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30"
                  />
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={criterion.maxScore}
                      onChange={(e) =>
                        handleUpdateCriterion(idx, "maxScore", e.target.value)
                      }
                      title="Max Score"
                      placeholder="Max"
                      aria-label={`Criterion ${idx + 1} Max Score`}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono tabular-nums text-slate-900 text-center focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={criterion.weight}
                      onChange={(e) =>
                        handleUpdateCriterion(idx, "weight", e.target.value)
                      }
                      title="Weight Multiplier"
                      placeholder="Weight"
                      aria-label={`Criterion ${idx + 1} Weight Multiplier`}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono tabular-nums text-slate-900 text-center focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCriterion(idx)}
                    aria-label={`Delete criterion ${idx + 1}: ${criterion.criterion}`}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveRubric}
              disabled={savingRubric}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              {savingRubric ? <Loader2 className="w-4 h-4 animate-spin mx-auto" aria-hidden="true" /> : "Save Rubric Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
