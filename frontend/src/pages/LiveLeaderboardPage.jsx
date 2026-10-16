import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { evaluationsApi, eventsApi, teamsApi } from "../api/endpoints";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../hooks/useAuth";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { formatScore } from "../utils/formatters";
import {
  Trophy,
  Maximize2,
  Minimize2,
  RefreshCw,
  Radio,
  ArrowLeft,
  Sparkles,
  Sliders,
  ShieldCheck,
  Medal,
  Award,
  ExternalLink,
  GitBranch,
  Download,
  CheckCircle2,
  Tv,
  Table as TableIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export const LiveLeaderboardPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { socket, joinEvent, leaveEvent, isConnected } = useSocket();

  const [event, setEvent] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // "table" | "projector"
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadLeaderboardData = async () => {
    try {
      const promises = [
        eventsApi.getEventById(eventId),
        evaluationsApi.getLiveLeaderboard(eventId),
      ];
      if (user) {
        promises.push(teamsApi.getMyTeam(eventId).catch(() => ({ data: null })));
      }

      const [evRes, leadRes, teamRes] = await Promise.all(promises);

      if (evRes?.data) setEvent(evRes.data);
      if (leadRes?.data) {
        setLeaderboard(leadRes.data);
        setLastUpdated(new Date());
      }
      if (teamRes?.data) {
        setMyTeam(teamRes.data);
      }
    } catch (err) {
      toast.error("Failed to load live leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
    joinEvent(eventId);

    return () => {
      leaveEvent(eventId);
    };
  }, [eventId]);

  // Real-time leaderboard updates from Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleLeaderboardUpdate = (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
      setLastUpdated(new Date());
      toast(
        () => (
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-mono text-xs font-bold text-amber-300">
              Live Leaderboard Re-ordered!
            </span>
          </div>
        ),
        {
          duration: 3000,
          position: "bottom-center",
          style: {
            background: "#090D16",
            border: "1px solid #F59E0B",
            color: "#FFF",
          },
        }
      );
    };

    socket.on("leaderboard:update", handleLeaderboardUpdate);

    return () => {
      socket.off("leaderboard:update", handleLeaderboardUpdate);
    };
  }, [socket]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const topThree = leaderboard.slice(0, 3);
  const rank1 = topThree[0];
  const rank2 = topThree[1];
  const rank3 = topThree[2];

  return (
    <div className={`space-y-6 py-4 ${isFullscreen ? "p-6 bg-slate-50 min-h-screen" : ""}`}>
      {/* Top Projector Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl precision-card bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to={`/events/${eventId}`}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label="Back to Event Arena"
            title="Back to Event Arena"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-950 uppercase tracking-widest bg-[#FEF08A] border border-slate-900 px-2.5 py-0.5 rounded-full shadow-[1px_1px_0px_#0F172A]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                LIVE SOCKET FEED
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 text-balance">
              {event?.title || "Hackathon Arena"} Leaderboard
            </h1>
            <p className="text-xs text-slate-500">
              {event?.festId?.title} &bull; {event?.festId?.collegeName}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("projector")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "projector"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-indigo-600" />
              <span>Projector Podium</span>
            </button>
          </div>

          <button
            onClick={loadLeaderboardData}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label="Force refresh live leaderboard"
            title="Force refresh"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights (Projector Mode or featured at top) */}
      {leaderboard.length > 0 && (viewMode === "projector" || isFullscreen) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
          {/* Silver Rank 2 */}
          {rank2 && (
            <div className="p-6 rounded-2xl bg-white border-2 border-slate-300 shadow-sm space-y-3 order-2 md:order-1 transform hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-800 border-2 border-slate-400 font-mono font-black text-base shadow-xs">
                  2
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
                  Silver Runner-Up
                </span>
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-slate-900">{rank2.teamName}</h3>
                <p className="text-xs text-indigo-600 font-semibold">{rank2.projectTitle}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">{rank2.judgesCount || 0} Judges</span>
                <span className="font-mono text-2xl font-black text-slate-900 tabular-nums">
                  {formatScore(rank2.averageScore)} pts
                </span>
              </div>
            </div>
          )}

          {/* Gold Rank 1 (Tallest / Center) */}
          {rank1 && (
            <div className="p-7 rounded-2xl bg-[#FEF08A] border-3 border-slate-950 shadow-[4px_4px_0px_#0F172A] space-y-4 order-1 md:order-2 transform hover:-translate-y-1 transition-transform relative">
              <div className="flex items-center justify-between">
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-slate-950 border-2 border-slate-950 font-mono font-black text-lg shadow-[2px_2px_0px_#0F172A]">
                  <Trophy className="w-6 h-6 text-slate-950" />
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-black uppercase tracking-wider bg-slate-950 text-white shadow-xs">
                  1st Place Champion
                </span>
              </div>
              <div>
                <h3 className="font-heading text-2xl font-black text-slate-950">{rank1.teamName}</h3>
                <p className="text-sm text-slate-800 font-bold mt-0.5">{rank1.projectTitle}</p>
              </div>
              <div className="pt-3 border-t-2 border-slate-950/20 flex items-center justify-between">
                <span className="text-xs text-slate-800 font-mono font-semibold">{rank1.judgesCount || 0} Judges Evaluated</span>
                <span className="font-mono text-3xl font-black text-slate-950 tabular-nums">
                  {formatScore(rank1.averageScore)} pts
                </span>
              </div>
            </div>
          )}

          {/* Bronze Rank 3 */}
          {rank3 && (
            <div className="p-6 rounded-2xl bg-white border-2 border-amber-300 shadow-sm space-y-3 order-3 transform hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 text-amber-900 border-2 border-amber-500 font-mono font-black text-base shadow-xs">
                  3
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300">
                  Bronze 3rd Place
                </span>
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-slate-900">{rank3.teamName}</h3>
                <p className="text-xs text-indigo-600 font-semibold">{rank3.projectTitle}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">{rank3.judgesCount || 0} Judges</span>
                <span className="font-mono text-2xl font-black text-slate-900 tabular-nums">
                  {formatScore(rank3.averageScore)} pts
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard Table */}
      {(() => {
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
        return (
          <LeaderboardTable
            leaderboard={leaderboard}
            eventId={eventId}
            currentUserId={user?._id}
            userTeamId={myTeam?._id}
            isOrganizer={isOrganizer}
            onRefresh={loadLeaderboardData}
          />
        );
      })()}

      {/* Footer Timestamp */}
      <div className="text-center text-[11px] font-mono tabular-nums text-slate-500 flex items-center justify-center gap-2" role="status" aria-live="polite">
        <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" aria-hidden="true" />
        <span>
          Socket.io Stream Active &bull; Last recalculated at{" "}
          {lastUpdated.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
