import React, { useState } from "react";
import { formatScore } from "../utils/formatters";
import { Trophy, Award, Medal, ExternalLink, GitBranch, Download, CheckCircle2, User, Loader2 } from "lucide-react";
import { evaluationsApi } from "../api/endpoints";
import toast from "react-hot-toast";
import clsx from "clsx";

export const LeaderboardTable = ({
  leaderboard = [],
  eventId,
  currentUserId,
  userTeamId,
  isOrganizer = false,
  onRefresh,
}) => {
  const [downloadingTeamId, setDownloadingTeamId] = useState(null);

  const handleDownloadCertificate = async (teamId, teamName) => {
    if (!eventId || !teamId) return;
    try {
      setDownloadingTeamId(teamId);
      toast.loading("Generating your verified PDF certificate…", { id: "cert-toast" });
      await evaluationsApi.downloadCertificate(
        eventId,
        teamId,
        `Certificate_${teamName.replace(/\s+/g, "_")}.pdf`
      );
      toast.success("Certificate downloaded successfully!", { id: "cert-toast" });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to download certificate",
        { id: "cert-toast" }
      );
    } finally {
      setDownloadingTeamId(null);
    }
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <span
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FEF08A] text-slate-950 border-2 border-slate-900 font-mono tabular-nums font-black text-sm shadow-[2px_2px_0px_#0F172A]"
            aria-label="Rank 1 - Gold"
          >
            <Trophy className="w-4 h-4 text-slate-950" aria-hidden="true" />
          </span>
        );
      case 2:
        return (
          <span
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-800 border-2 border-slate-400 font-mono tabular-nums font-black text-sm shadow-[1px_1px_0px_#64748B]"
            aria-label="Rank 2 - Silver"
          >
            <Medal className="w-4 h-4 text-slate-700" aria-hidden="true" />
          </span>
        );
      case 3:
        return (
          <span
            className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-900 border-2 border-amber-500 font-mono tabular-nums font-black text-sm shadow-[1px_1px_0px_#92400E]"
            aria-label="Rank 3 - Bronze"
          >
            <Award className="w-4 h-4 text-amber-800" aria-hidden="true" />
          </span>
        );
      default:
        return (
          <span
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono tabular-nums text-xs font-semibold"
            aria-label={`Rank ${rank}`}
          >
            #{rank}
          </span>
        );
    }
  };

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="precision-card bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-200">
          <Trophy className="w-8 h-8" aria-hidden="true" />
        </div>
        <h3 className="font-heading text-lg font-bold text-slate-900 mb-2">
          No Evaluated Submissions Yet
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          As soon as event judges submit scorecards from the Judge Console, real-time rankings and weighted averages will instantly update here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile View: High-density interactive cards for 360-767px screens */}
      <div className="md:hidden space-y-3.5">
        {leaderboard.map((entry) => {
          const isWinner = entry.rank <= 3;
          return (
            <div
              key={`mob-${entry.submissionId || entry._id}`}
              className={clsx(
                "p-4 rounded-2xl border transition-all precision-card",
                entry.rank === 1
                  ? "bg-amber-50/50 border-amber-300 shadow-[3px_3px_0px_#0F172A]"
                  : entry.rank === 2
                  ? "bg-slate-50/70 border-slate-300 shadow-[2px_2px_0px_#475569]"
                  : entry.rank === 3
                  ? "bg-orange-50/40 border-orange-300 shadow-[2px_2px_0px_#9A3412]"
                  : "bg-white border-slate-200 shadow-sm"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {getRankBadge(entry.rank)}
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-slate-900 text-base truncate">
                      {entry.teamName}
                    </h4>
                    <p className="text-xs text-indigo-600 font-semibold truncate">
                      {entry.projectTitle}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-xl text-slate-950 leading-none">
                    {formatScore(entry.averageScore)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold mt-0.5">
                    pts
                  </div>
                </div>
              </div>

              {entry.tagline && (
                <p className="text-xs text-slate-500 italic mb-2 line-clamp-2">
                  &ldquo;{entry.tagline}&rdquo;
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {entry.checkedIn && (
                  <span className="inline-flex items-center text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" aria-hidden="true" />
                    Checked In
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                  {entry.judgesCount || 0} {entry.judgesCount === 1 ? "Judge" : "Judges"}
                </span>
                {Array.isArray(entry.techStack) &&
                  entry.techStack.slice(0, 3).map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium"
                    >
                      {tech}
                    </span>
                  ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                {entry.repoUrl && (
                  <a
                    href={entry.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    aria-label={`View GitHub repository for ${entry.teamName}`}
                  >
                    <GitBranch className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}
                {entry.demoUrl && (
                  <a
                    href={entry.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                    aria-label={`View live demo application for ${entry.teamName}`}
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}
                {Boolean(
                  isOrganizer ||
                    (userTeamId &&
                      ((entry.teamId?._id || entry.teamId)?.toString() ===
                        userTeamId?.toString()))
                ) && (
                  <button
                    onClick={() => handleDownloadCertificate(entry.teamId, entry.teamName)}
                    disabled={downloadingTeamId === entry.teamId}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50",
                      isWinner
                        ? "bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold border border-slate-900 shadow-[1px_1px_0px_#0F172A] focus-visible:ring-amber-500"
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 focus-visible:ring-indigo-600"
                    )}
                  >
                    {downloadingTeamId === entry.teamId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{isWinner ? "Winner Certificate" : "Certificate"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop View: Precision Structured Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white precision-card shadow-sm">
        <table className="w-full text-left border-collapse" aria-label="Live Hackathon Leaderboard">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-mono text-slate-600 uppercase tracking-wider font-semibold">
            <th scope="col" className="py-4 px-5 text-center w-16">Rank</th>
            <th scope="col" className="py-4 px-5">Team &amp; Project</th>
            <th scope="col" className="py-4 px-5">Tech Stack</th>
            <th scope="col" className="py-4 px-5 text-center">Judges</th>
            <th scope="col" className="py-4 px-5 text-right">Weighted Score</th>
            <th scope="col" className="py-4 px-5 text-center">Credentials &amp; Links</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {leaderboard.map((entry) => {
            const isWinner = entry.rank <= 3;
            return (
              <tr
                key={entry.submissionId || entry._id}
                className={clsx(
                  "transition-colors duration-150 group",
                  entry.rank === 1
                    ? "bg-amber-50/50 hover:bg-amber-50/80"
                    : entry.rank === 2
                    ? "bg-slate-50/40 hover:bg-slate-50/80"
                    : entry.rank === 3
                    ? "bg-orange-50/30 hover:bg-orange-50/70"
                    : "hover:bg-slate-50/60"
                )}
              >
                {/* Rank column */}
                <td className="py-4 px-5 text-center align-middle">
                  <div className="flex justify-center">
                    {getRankBadge(entry.rank)}
                  </div>
                </td>

                {/* Team & Project Details */}
                <td className="py-4 px-5 align-middle min-w-0">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors truncate">
                        {entry.teamName}
                      </span>
                      {entry.checkedIn && (
                        <span
                          className="inline-flex items-center text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 font-medium"
                          title="Verified Checked-In"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-0.5" aria-hidden="true" />
                          Checked In
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-indigo-600 font-semibold truncate">
                      {entry.projectTitle}
                    </span>
                    {entry.tagline && (
                      <span className="text-xs text-slate-500 line-clamp-1">
                        {entry.tagline}
                      </span>
                    )}
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <User className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">Leader: {entry.leaderName || "Participant"}</span>
                    </div>
                  </div>
                </td>

                {/* Tech Stack Pills */}
                <td className="py-4 px-5 align-middle">
                  <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                    {Array.isArray(entry.techStack) && entry.techStack.length > 0 ? (
                      entry.techStack.slice(0, 4).map((tech, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                        >
                          {tech}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">
                        Not specified
                      </span>
                    )}
                  </div>
                </td>

                {/* Judges Scored Count */}
                <td className="py-4 px-5 text-center align-middle">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-mono tabular-nums font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {entry.judgesCount || 0}{" "}
                    {entry.judgesCount === 1 ? "Judge" : "Judges"}
                  </span>
                </td>

                {/* Weighted Score */}
                <td className="py-4 px-5 text-right align-middle">
                  <div className="flex flex-col items-end">
                    <span
                      className={clsx(
                        "font-mono tabular-nums tracking-tight",
                        entry.rank === 1
                          ? "text-2xl font-black text-slate-950"
                          : "text-xl font-extrabold text-slate-900"
                      )}
                    >
                      {formatScore(entry.averageScore)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                      pts
                    </span>
                  </div>
                </td>

                {/* Links & Certificate Download */}
                <td className="py-4 px-5 align-middle">
                  <div className="flex items-center justify-center gap-2">
                    {entry.repoUrl && (
                      <a
                        href={entry.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                        aria-label={`View GitHub repository for ${entry.teamName}`}
                        title="GitHub Repository"
                      >
                        <GitBranch className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    {entry.demoUrl && (
                      <a
                        href={entry.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                        aria-label={`View live demo application for ${entry.teamName}`}
                        title="Live Demo"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                    {Boolean(
                      isOrganizer ||
                        (userTeamId &&
                          ((entry.teamId?._id || entry.teamId)?.toString() ===
                            userTeamId?.toString()))
                    ) && (
                      <button
                        onClick={() =>
                          handleDownloadCertificate(entry.teamId, entry.teamName)
                        }
                        disabled={downloadingTeamId === entry.teamId}
                        className={clsx(
                          "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50",
                          isWinner
                            ? "bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold border border-slate-900 shadow-[1px_1px_0px_#0F172A] focus-visible:ring-amber-500"
                            : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 focus-visible:ring-indigo-600"
                        )}
                        aria-label={
                          isWinner
                            ? `Download Winner Certificate for ${entry.teamName}`
                            : `Download Participation Certificate for ${entry.teamName}`
                        }
                        title={
                          isWinner
                            ? "Download Winner Certificate (PDF)"
                            : "Download Participation Certificate (PDF)"
                        }
                      >
                        {downloadingTeamId === entry.teamId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">
                          {isWinner ? "Certificate" : "Participation"}
                        </span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
};
