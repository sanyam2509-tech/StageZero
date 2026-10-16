import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { eventsApi, teamsApi, evaluationsApi } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { formatDate, formatDateTime, formatScore } from "../utils/formatters";
import { RoleBadge } from "../components/RoleBadge";
import {
  Trophy,
  Calendar,
  Users,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle,
  ExternalLink,
  PlusCircle,
  LogIn,
  AlertCircle,
  Award,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";

// In-memory session cache for instant event navigation
const eventSessionCache = new Map();

export const EventDetailPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(() => eventSessionCache.get(eventId)?.event || null);
  const [loading, setLoading] = useState(() => !eventSessionCache.has(eventId));
  const [forbiddenError, setForbiddenError] = useState(null);
  const [myTeam, setMyTeam] = useState(() => eventSessionCache.get(eventId)?.myTeam || null);
  const [topLeaderboard, setTopLeaderboard] = useState(() => eventSessionCache.get(eventId)?.topLeaderboard || []);

  useEffect(() => {
    let isMounted = true;
    const fetchEventData = async () => {
      // Only show full loader if event is not already in memory cache
      if (!eventSessionCache.has(eventId)) {
        setLoading(true);
      }
      setForbiddenError(null);

      const [eventRes, leaderboardRes, teamRes] = await Promise.allSettled([
        eventsApi.getEventById(eventId),
        evaluationsApi.getLiveLeaderboard(eventId),
        user ? teamsApi.getMyTeam(eventId) : Promise.resolve(null),
      ]);

      if (!isMounted) return;

      let freshEvent = null;
      let freshLeaderboard = [];
      let freshTeam = null;

      if (eventRes.status === "fulfilled" && eventRes.value?.data) {
        freshEvent = eventRes.value.data;
        setEvent(freshEvent);
      } else if (eventRes.status === "rejected") {
        if (eventRes.reason?.response?.status === 403) {
          setForbiddenError(
            eventRes.reason.response.data?.message ||
            "Access restricted: As an organizer, you can only view events for fests you created or manage."
          );
        } else {
          toast.error("Failed to load event details");
        }
      }

      if (leaderboardRes.status === "fulfilled" && leaderboardRes.value?.data) {
        freshLeaderboard = leaderboardRes.value.data.slice(0, 3);
        setTopLeaderboard(freshLeaderboard);
      }

      if (teamRes.status === "fulfilled" && teamRes.value?.data) {
        freshTeam = teamRes.value.data;
        setMyTeam(freshTeam);
      }

      if (freshEvent) {
        eventSessionCache.set(eventId, {
          event: freshEvent,
          topLeaderboard: freshLeaderboard,
          myTeam: freshTeam,
        });
      }

      setLoading(false);
    };

    fetchEventData();
    return () => {
      isMounted = false;
    };
  }, [eventId, user]);

  if (loading) {
    return (
      <div className="py-16 text-center space-y-4" role="status" aria-live="polite">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" aria-hidden="true" />
        <p className="text-sm font-mono text-slate-600">Loading event arena…</p>
      </div>
    );
  }

  if (forbiddenError) {
    return (
      <div className="py-16 text-center bg-white border-2 border-slate-900 rounded-3xl p-8 shadow-[4px_4px_0px_#0F172A] max-w-lg mx-auto my-6" role="alert">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-lg font-bold text-slate-900">Organizer Access Restricted</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {forbiddenError}
        </p>
        <div className="mt-6">
          <Link
            to="/fests"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Return to My Managed Fests</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-sm" role="alert">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" aria-hidden="true" />
        <h2 className="font-heading text-lg font-bold text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">This event may have been removed or does not exist.</p>
        <Link to="/fests" className="inline-block mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
          Back to Fests
        </Link>
      </div>
    );
  }

  const userIdStr = user?._id?.toString();
  const isOrganizer = Boolean(
    user && (
      user.globalRole === "superadmin" ||
      event.festId?.createdBy?.toString() === userIdStr ||
      event.festId?.createdBy?._id?.toString() === userIdStr ||
      (Array.isArray(event.festId?.organizers) &&
        event.festId.organizers.some(
          (o) => (o._id?.toString() || o.toString()) === userIdStr
        ))
    )
  );

  const isAssignedJudge = Boolean(
    user && (
      user.globalRole === "superadmin" ||
      (Array.isArray(event.judges) &&
        event.judges.some(
          (j) => (j._id?.toString() || j.toString()) === userIdStr
        ))
    )
  );

  const isParticipantUser = !user || user.role === "participant" || user.globalRole === "superadmin";

  return (
    <div className="space-y-8 py-4">
      {/* Event Header Banner */}
      <div className="precision-card p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {event.category}
          </span>
          <span className="text-xs font-mono tabular-nums font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Teams of {event.teamSize?.min}&ndash;{event.teamSize?.max} members
          </span>
          <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
            Status: {event.status}
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-indigo-600 font-mono font-semibold">
            Fest: {event.festId?.title} ({event.festId?.collegeName})
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-balance">
            {event.title}
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed text-pretty">
            {event.description}
          </p>
        </div>

        {/* Dynamic Action Buttons based on Role */}
        <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-slate-100">
          {isParticipantUser && (
            <Link
              to={`/events/${eventId}/workspace`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>{myTeam ? `My Team: ${myTeam.name}` : "Hacker Workspace & Teams"}</span>
            </Link>
          )}

          <Link
            to={`/events/${eventId}/leaderboard`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-300 shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <span>Live Projector Leaderboard</span>
          </Link>

          {isAssignedJudge && (
            <Link
              to={`/events/${eventId}/judge`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-slate-900 shadow-[2.5px_2.5px_0px_#0F172A] font-semibold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Sliders className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span>Judge Scoring Console</span>
            </Link>
          )}

          {isOrganizer && (
            <Link
              to={`/events/${eventId}/organizer`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border-2 border-slate-900 shadow-[2.5px_2.5px_0px_#0F172A] font-semibold text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" aria-hidden="true" />
              <span>Organizer Controls</span>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Rounds Timeline & Rubric Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Rounds Timeline */}
        <div className="lg:col-span-6 space-y-6">
          <div className="precision-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Clock className="w-5 h-5" aria-hidden="true" />
              <h2 className="font-heading text-lg font-bold text-slate-900">Rounds &amp; Deadlines</h2>
            </div>

            <div className="space-y-3">
              {Array.isArray(event.rounds) && event.rounds.length > 0 ? (
                event.rounds.map((round) => (
                  <div
                    key={round.roundNumber}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono tabular-nums font-bold text-indigo-700 uppercase tracking-wider bg-indigo-100/70 px-2 py-0.5 rounded-md border border-indigo-200">
                        Round {round.roundNumber}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono tabular-nums">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        {formatDateTime(round.deadline)}
                      </span>
                    </div>
                    <h3 className="font-heading text-sm font-bold text-slate-900">{round.title}</h3>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No rounds scheduled yet.</p>
              )}
            </div>
          </div>

          {/* Assigned Judges Section */}
          <div className="precision-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Award className="w-5 h-5" aria-hidden="true" />
              <h2 className="font-heading text-lg font-bold text-slate-900">Judging Panel</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.isArray(event.judges) && event.judges.length > 0 ? (
                event.judges.map((judge) => (
                  <div
                    key={judge._id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs border border-amber-300 font-mono">
                      {judge.name ? judge.name.charAt(0) : "J"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{judge.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        {judge.college || judge.email}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No judges assigned yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Judging Rubric & Mini Leaderboard Preview */}
        <div className="lg:col-span-6 space-y-6">
          <div className="precision-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Sliders className="w-5 h-5" aria-hidden="true" />
              <h2 className="font-heading text-lg font-bold text-slate-900">Evaluation Rubric Breakdown</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Judges score each team against these weighted criteria.
            </p>

            <div className="space-y-3">
              {Array.isArray(event.rubric) && event.rubric.length > 0 ? (
                event.rubric.map((criterion, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        {criterion.criterion}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                        Max Score: {criterion.maxScore} pts
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                      {criterion.weight}x Weight
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No rubric configured.</p>
              )}
            </div>
          </div>

          {/* Mini Top Podium Preview */}
          <div className="precision-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-600">
                <Trophy className="w-5 h-5" aria-hidden="true" />
                <h2 className="font-heading text-lg font-bold text-slate-900">Live Podium Leaders</h2>
              </div>
              <Link
                to={`/events/${eventId}/leaderboard`}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-1"
              >
                Full Leaderboard &rarr;
              </Link>
            </div>

            {topLeaderboard.length > 0 ? (
              <div className="space-y-2">
                {topLeaderboard.map((item) => (
                  <div
                    key={item.teamId}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between min-w-0"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-mono tabular-nums text-xs font-bold text-amber-900 shrink-0">
                        #{item.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.teamName}</div>
                        <div className="text-[10px] text-indigo-600 font-medium truncate">
                          {item.projectTitle}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-mono tabular-nums font-extrabold text-slate-900 shrink-0">
                      {formatScore(item.averageScore)} pts
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Scorecards are currently being evaluated. Stand by for real-time scores!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
