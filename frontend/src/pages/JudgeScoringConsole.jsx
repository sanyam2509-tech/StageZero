import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { eventsApi, submissionsApi, evaluationsApi } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { RoleBadge } from "../components/RoleBadge";
import { formatScore } from "../utils/formatters";
import {
  Sliders,
  Trophy,
  GitBranch,
  ExternalLink,
  Video,
  Layers,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronRight,
  User,
  X,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

export const JudgeScoringConsole = () => {
  const { eventId } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Rubric scores state: { [criterionName]: scoreValue }
  const [criterionScores, setCriterionScores] = useState({});
  const [feedback, setFeedback] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Review confirmation modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [evRes, subRes] = await Promise.all([
        eventsApi.getEventById(eventId),
        submissionsApi.getSubmissionsByEvent(eventId),
      ]);

      if (evRes?.data) setEvent(evRes.data);
      if (subRes?.data) {
        setSubmissions(subRes.data);
        if (subRes.data.length > 0) {
          initScores(subRes.data[0], evRes.data?.rubric || []);
        }
      }
    } catch (err) {
      toast.error("Failed to load judge console data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  // Modal keyboard accessibility: Escape to close review modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isReviewModalOpen) {
        setIsReviewModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReviewModalOpen]);

  const initScores = (submission, rubric) => {
    const initial = {};
    const existingScores = submission?.myEvaluation?.scores || [];

    (rubric || []).forEach((r) => {
      // Preserve previously saved scores for this criterion; initialize new criteria as null (unscored)
      const match = existingScores.find((s) => s.criterion === r.criterion);
      if (match && typeof match.score === "number" && !isNaN(match.score)) {
        initial[r.criterion] = match.score;
      } else {
        // Explicitly unscored - NEVER silently defaulted to 80% or arbitrary points
        initial[r.criterion] = null;
      }
    });

    setCriterionScores(initial);
    setFeedback(submission?.myEvaluation?.feedback || "");
    setHasUnsavedChanges(false);
  };

  const handleSelectSubmission = (index) => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        "You have unsaved score adjustments on this submission. Switch anyway?"
      );
      if (!confirmSwitch) return;
    }

    setSelectedSubIndex(index);
    if (submissions[index] && event?.rubric) {
      initScores(submissions[index], event.rubric);
    }
  };

  const handleScoreChange = (criterion, val) => {
    const num = parseFloat(val);
    setCriterionScores((prev) => ({
      ...prev,
      [criterion]: isNaN(num) ? null : num,
    }));
    setHasUnsavedChanges(true);
  };

  const handleClearScore = (criterion) => {
    setCriterionScores((prev) => ({
      ...prev,
      [criterion]: null,
    }));
    setHasUnsavedChanges(true);
  };

  const handleFeedbackChange = (val) => {
    setFeedback(val);
    setHasUnsavedChanges(true);
  };

  const currentSubmission = submissions[selectedSubIndex];

  // Completeness analysis: verify every rubric criterion has a valid numeric score
  const rubricList = event?.rubric || [];
  const unscoredCriteria = rubricList.filter(
    (r) =>
      criterionScores[r.criterion] === null ||
      criterionScores[r.criterion] === undefined ||
      typeof criterionScores[r.criterion] !== "number" ||
      isNaN(criterionScores[r.criterion])
  );
  const isScorecardComplete =
    rubricList.length > 0 && unscoredCriteria.length === 0;

  // Calculate live weighted score for scored criteria
  const calculateTotalPreview = () => {
    if (!event?.rubric) return "0.00";
    let total = 0;
    event.rubric.forEach((r) => {
      const score = criterionScores[r.criterion];
      if (typeof score === "number" && !isNaN(score)) {
        total += (score / (r.maxScore || 10)) * (r.weight || 1.0) * 10;
      }
    });
    return total.toFixed(2);
  };

  const handleOpenReviewModal = (e) => {
    e.preventDefault();
    if (!currentSubmission?._id) return;
    if (!isScorecardComplete) {
      toast.error(
        `Cannot submit: ${unscoredCriteria.length} required criteria remain unscored.`
      );
      return;
    }
    setIsReviewModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!currentSubmission?._id) return;
    setSubmitting(true);

    try {
      const scoresPayload = (event?.rubric || []).map((r) => ({
        criterion: r.criterion,
        score: criterionScores[r.criterion] ?? 0,
        maxScore: r.maxScore || 10,
        weight: r.weight || 1.0,
      }));

      await evaluationsApi.submitEvaluation({
        eventId,
        submissionId: currentSubmission._id,
        scores: scoresPayload,
        feedback,
      });

      toast.success(
        `Scorecard submitted for Team '${currentSubmission.teamId?.name}'! Live Leaderboard updated.`
      );
      setHasUnsavedChanges(false);
      setIsReviewModalOpen(false);

      // Refresh submissions
      const subRes = await submissionsApi.getSubmissionsByEvent(eventId);
      if (subRes?.data) setSubmissions(subRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Score submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Queue metrics
  const scoredCount = useMemo(
    () => submissions.filter((s) => !!s.myEvaluation).length,
    [submissions]
  );
  const queueProgressPercent =
    submissions.length > 0 ? Math.round((scoredCount / submissions.length) * 100) : 0;

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" aria-hidden="true" />
        <p className="text-sm font-mono text-slate-600">Loading Judge Scoring Console…</p>
      </div>
    );
  }

  const userIdStr = user?._id?.toString();
  const isAuthorizedJudge = Boolean(
    user && (
      user.globalRole === "superadmin" ||
      (Array.isArray(event?.judges) &&
        event.judges.some(
          (j) => (j._id?.toString() || j.toString()) === userIdStr
        )) ||
      event?.festId?.createdBy?.toString() === userIdStr ||
      event?.festId?.createdBy?._id?.toString() === userIdStr ||
      (Array.isArray(event?.festId?.organizers) &&
        event.festId.organizers.some(
          (o) => (o._id?.toString() || o.toString()) === userIdStr
        ))
    )
  );

  if (!isAuthorizedJudge) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-heading font-extrabold text-slate-900">
          Judge Access Only
        </h1>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          You are not registered as an assigned judge or organizer for this event. Participants and unauthorized accounts cannot evaluate submissions or access scoring consoles.
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
    <div className="space-y-6 py-4">
      {/* Console Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl precision-card bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Sliders className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-bold text-slate-900 tracking-tight">
                Judge Scoring Console
              </h1>
              <RoleBadge role="judge" size="xs" />
            </div>
            <p className="text-xs text-slate-500">
              Event: {event?.title} &bull; <span className="font-mono tabular-nums font-semibold text-slate-700">{submissions.length}</span> Submissions in Queue
            </p>
          </div>
        </div>

        <Link
          to={`/events/${eventId}/leaderboard`}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold self-start sm:self-auto shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span>View Live Leaderboard</span>
        </Link>
      </div>

      {/* Queue Progress Bar Strip */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono font-semibold text-slate-700">
            <span>Judging Progress:</span>
            <span className="text-indigo-600 tabular-nums">
              {scoredCount} of {submissions.length} teams scored ({queueProgressPercent}%)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {submissions.length - scoredCount} teams remaining
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${queueProgressPercent}%` }}
          />
        </div>
      </div>

      {/* Submissions Queue Horizontal Carousel / Selector */}
      {submissions.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin" role="tablist" aria-label="Submissions queue">
          {submissions.map((sub, idx) => {
            const isSelected = idx === selectedSubIndex;
            const hasEvaluated = !!sub.myEvaluation;
            return (
              <button
                key={sub._id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleSelectSubmission(idx)}
                className={clsx(
                  "p-3.5 rounded-xl border text-left min-w-[210px] shrink-0 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                  isSelected
                    ? "bg-indigo-50/70 border-2 border-indigo-600 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                )}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-heading font-bold text-slate-900 truncate max-w-[120px]">
                    {sub.teamId?.name || "Team"}
                  </span>
                  {hasEvaluated ? (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono flex items-center gap-0.5 font-medium">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      Scored
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono font-medium">
                      Pending
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {sub.projectTitle}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="precision-card bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500 shadow-sm">
          No projects submitted for this event yet.
        </div>
      )}

      {/* Split-Screen: Left (Project Info) | Right (Interactive Rubric Sliders) */}
      {currentSubmission && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Project Submission Details */}
          <div className="lg:col-span-6 precision-card p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                  Round {currentSubmission.roundNumber || 1} Submission
                </span>
                {currentSubmission.teamId?.checkedIn && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                    Verified Checked-In
                  </span>
                )}
              </div>
              <h2 className="font-heading text-2xl font-extrabold text-slate-900 text-balance mt-2">
                {currentSubmission.projectTitle}
              </h2>
              <div className="text-sm text-indigo-600 font-semibold mt-0.5">
                by {currentSubmission.teamId?.name?.startsWith("Team") ? currentSubmission.teamId?.name : `Team ${currentSubmission.teamId?.name || "Participant"}`}
              </div>
              {currentSubmission.tagline && (
                <p className="text-xs text-slate-500 italic mt-2">
                  &ldquo;{currentSubmission.tagline}&rdquo;
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono uppercase text-slate-500 font-semibold tracking-wider">
                Project Overview &amp; Execution
              </span>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 text-pretty whitespace-pre-line">
                {currentSubmission.description}
              </p>
            </div>

            {/* Tech Stack Tags */}
            {Array.isArray(currentSubmission.techStack) &&
              currentSubmission.techStack.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono uppercase text-slate-500 font-semibold tracking-wider">
                    Tech Stack
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSubmission.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Submission Links */}
            <div className="pt-2 flex flex-wrap gap-3">
              {currentSubmission.repoUrl && (
                <a
                  href={currentSubmission.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  aria-label="Open GitHub Repository"
                >
                  <GitBranch className="w-4 h-4 text-slate-600" aria-hidden="true" />
                  <span>GitHub Repository</span>
                </a>
              )}
              {currentSubmission.demoUrl && (
                <a
                  href={currentSubmission.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 border border-indigo-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  aria-label="Open Live Demo Application"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  <span>Live Demo App</span>
                </a>
              )}
              {currentSubmission.videoUrl && (
                <a
                  href={currentSubmission.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                  aria-label="Open Pitch Video"
                >
                  <Video className="w-4 h-4 text-slate-600" aria-hidden="true" />
                  <span>Pitch Video</span>
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Rubric Sliders & Scorecard Submission */}
          <div className="lg:col-span-6 precision-card p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-lg font-bold text-slate-900">
                    Dynamic Rubric Scorecard
                  </h3>
                  {hasUnsavedChanges && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Unsaved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {isScorecardComplete ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      All {rubricList.length} criteria evaluated
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-amber-600" aria-hidden="true" />
                      {unscoredCriteria.length} {unscoredCriteria.length === 1 ? "criterion" : "criteria"} unscored
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                  Weighted Total
                </span>
                <span className="text-2xl font-mono tabular-nums font-black text-slate-900">
                  {calculateTotalPreview()} pts
                </span>
                {!isScorecardComplete && (
                  <span className="text-[10px] font-mono text-amber-700 block font-semibold">
                    (Incomplete)
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleOpenReviewModal} className="space-y-6">
              {Array.isArray(event?.rubric) &&
                event.rubric.map((criterion, idx) => {
                  const currentVal = criterionScores[criterion.criterion];
                  const isScored = typeof currentVal === "number" && !isNaN(currentVal);
                  const max = criterion.maxScore || 10;
                  const weightedPoints = isScored
                    ? ((currentVal / max) * (criterion.weight || 1.0) * 10).toFixed(1)
                    : "0.0";

                  return (
                    <div
                      key={idx}
                      className={clsx(
                        "p-4 rounded-xl border space-y-3 transition-colors",
                        isScored
                          ? "bg-slate-50 border-slate-200"
                          : "bg-amber-50/40 border-amber-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={`slider-${idx}`}
                              className="text-xs font-bold text-slate-900 block cursor-pointer"
                            >
                              {criterion.criterion}
                            </label>
                            {!isScored && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-mono text-[9px] font-bold uppercase tracking-wider">
                                Unscored
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                            Weight: {criterion.weight}x multiplier
                          </span>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          {isScored ? (
                            <>
                              <span className="text-sm font-bold text-indigo-700">
                                {currentVal} / {max}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                +{weightedPoints} pts
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-mono font-semibold text-amber-800">
                              Score Required
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Range Slider */}
                      <div className="space-y-1.5">
                        <input
                          id={`slider-${idx}`}
                          type="range"
                          min="0"
                          max={max}
                          step="0.5"
                          value={isScored ? currentVal : 0}
                          aria-label={`Score for ${criterion.criterion}`}
                          onChange={(e) =>
                            handleScoreChange(criterion.criterion, e.target.value)
                          }
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                        />
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>0 pts</span>
                          <div className="flex items-center gap-1.5">
                            {isScored ? (
                              <button
                                type="button"
                                onClick={() => handleClearScore(criterion.criterion)}
                                className="text-slate-500 hover:text-rose-600 underline cursor-pointer text-[10px]"
                                title="Reset this criterion to unscored"
                              >
                                Mark Unscored
                              </button>
                            ) : (
                              <span className="text-amber-700 font-medium">
                                Drag slider to score
                              </span>
                            )}
                          </div>
                          <span>{max} pts max</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Qualitative Feedback */}
              <div className="space-y-1.5">
                <label htmlFor="judge-feedback-textarea" className="block text-xs font-mono uppercase text-slate-700 font-medium">
                  Judge Feedback &amp; Recommendations
                </label>
                <textarea
                  id="judge-feedback-textarea"
                  name="feedback"
                  rows={3}
                  value={feedback}
                  onChange={(e) => handleFeedbackChange(e.target.value)}
                  placeholder="Constructive feedback, code review praise, and scalability tips for the hackers…"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-600"
                />
              </div>

              {/* Validation Alert when incomplete */}
              {!isScorecardComplete && (
                <div
                  className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2.5 text-xs"
                  role="alert"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="leading-relaxed">
                    <span className="font-bold">Evaluation Incomplete:</span> All rubric criteria must be scored with a valid evaluation before broadcasting results. Remaining unscored:{" "}
                    <span className="font-semibold underline">
                      {unscoredCriteria.map((u) => u.criterion).join(", ")}
                    </span>.
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !isScorecardComplete}
                className={clsx(
                  "w-full py-3.5 px-6 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                  isScorecardComplete
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white border-slate-900 shadow-[3px_3px_0px_#0F172A] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 cursor-pointer"
                    : "bg-slate-100 text-slate-400 border-slate-300 shadow-none cursor-not-allowed opacity-75"
                )}
                aria-disabled={!isScorecardComplete}
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>
                  {isScorecardComplete
                    ? "Review & Broadcast Scorecard"
                    : `Score All Criteria to Submit (${unscoredCriteria.length} remaining)`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review & Submit Confirmation Modal */}
      {isReviewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-scorecard-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg"
              aria-label="Close Review Modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Confirm Official Scorecard</span>
              </div>
              <h2 id="review-scorecard-modal-title" className="font-heading text-xl font-bold text-slate-950">
                Scorecard for {currentSubmission?.teamId?.name?.startsWith("Team") ? currentSubmission?.teamId?.name : `Team ${currentSubmission?.teamId?.name || "Participant"}`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Project: {currentSubmission?.projectTitle}
              </p>
            </div>

            {/* Criteria Score Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="text-xs font-mono font-bold uppercase text-slate-500">Criterion Breakdown</div>
              {Array.isArray(event?.rubric) &&
                event.rubric.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                    <span className="text-slate-700 font-medium">{r.criterion}</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {criterionScores[r.criterion] || 0} / {r.maxScore || 10}
                    </span>
                  </div>
                ))}

              <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-900">Total Weighted Score:</span>
                <span className="font-mono font-black text-indigo-600 text-lg tabular-nums">
                  {calculateTotalPreview()} pts
                </span>
              </div>
            </div>

            {feedback && (
              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-500 uppercase font-semibold">Judge Notes:</span>
                <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                  &ldquo;{feedback}&rdquo;
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Edit Scores
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSubmit}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Confirm &amp; Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
