import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { festsApi } from "../api/endpoints";
import { formatDate } from "../utils/formatters";
import { RoleBadge } from "../components/RoleBadge";
import {
  Sparkles,
  Zap,
  Trophy,
  Sliders,
  ShieldCheck,
  FileCheck,
  Users,
  Calendar,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Activity,
  Compass,
  Laptop,
  Check,
  Clock,
  ExternalLink,
  Code2,
  Radio,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fests, setFests] = useState([]);
  const [loadingFests, setLoadingFests] = useState(true);

  // Interactive Arena Preview state
  const [previewTab, setPreviewTab] = useState("leaderboard"); // "leaderboard" | "rubric" | "certificate"
  const [interactiveScore, setInteractiveScore] = useState(8.5);
  const [interactiveWeight, setInteractiveWeight] = useState(2.0);

  // Countdown timer state for featured event (48 hours from a fixed anchor)
  const [timeLeft, setTimeLeft] = useState({
    days: "02",
    hours: "14",
    minutes: "38",
    seconds: "45",
  });

  useEffect(() => {
    const fetchFests = async () => {
      try {
        const res = await festsApi.getAllFests({ limit: 3 });
        if (res?.data?.fests) {
          setFests(res.data.fests);
        }
      } catch (err) {
        // Fallback or quiet
      } finally {
        setLoadingFests(false);
      }
    };
    fetchFests();
  }, []);

  // Find the first upcoming or live fest from real database
  const featuredFest = useMemo(() => {
    if (!fests || fests.length === 0) {
      return {
        title: "Technova Apex 2026",
        collegeName: "Indian Institute of Technology",
        description: "48-hour multi-track hackathon spanning Web3, Agentic AI, and Sustainable Hardware.",
        slug: "technova-apex-2026",
        startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        endDate: new Date(Date.now() + 4 * 86400000).toISOString(),
      };
    }
    const now = new Date();
    // Prioritize upcoming or live fests
    const upcoming = fests.find((f) => new Date(f.startDate) > now);
    if (upcoming) return upcoming;
    const live = fests.find((f) => new Date(f.endDate) >= now);
    if (live) return live;
    return fests[0];
  }, [fests]);

  // Real-time ticking countdown based on actual fest dates
  const [countdownLabel, setCountdownLabel] = useState("STARTS IN");
  useEffect(() => {
    if (!featuredFest?.startDate) return;

    const computeTime = () => {
      const now = new Date().getTime();
      const start = new Date(featuredFest.startDate).getTime();
      const end = new Date(featuredFest.endDate || start + 48 * 3600000).getTime();

      let targetTime;
      if (now < start) {
        setCountdownLabel("REGISTRATION CLOSING SOON");
        targetTime = start;
      } else if (now <= end) {
        setCountdownLabel("HACKING LIVE NOW &bull; FINALE IN");
        targetTime = end;
      } else {
        setCountdownLabel("EVENT CONCLUDED");
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        return;
      }

      const difference = targetTime - now;
      if (difference <= 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days: String(d).padStart(2, "0"),
          hours: String(h).padStart(2, "0"),
          minutes: String(m).padStart(2, "0"),
          seconds: String(s).padStart(2, "0"),
        });
      }
    };

    computeTime();
    const timer = setInterval(computeTime, 1000);
    return () => clearInterval(timer);
  }, [featuredFest]);

  const handleRoleAction = (role) => {
    if (user) {
      navigate("/fests");
    } else {
      navigate(`/login?mode=register&role=${role}`);
    }
  };

  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto space-y-7 pt-4" aria-label="Introduction">
        {/* Lemon Neubrutalist badge */}
        <div className="inline-flex max-w-[95vw] sm:max-w-none items-center gap-2 px-3 py-1.5 rounded-full bg-[#FEF08A] border-2 border-slate-900 text-slate-950 text-[10px] sm:text-xs font-mono font-bold shadow-[2px_2px_0px_#0F172A] text-center">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" aria-hidden="true" />
          <span className="truncate sm:overflow-visible">STAGEZERO &bull; WHERE EVERY HACKATHON TEAM AND CAMPUS EVENT STARTS</span>
        </div>

        {/* Main Title */}
        <h1 className="font-heading text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 leading-[1.1] text-balance break-words">
          Where campus hackathons launch and <span className="text-indigo-600">elite teams form.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed text-pretty font-normal">
          The unified operating system for collegiate builder competitions. Custom rubric grading, live projector leaderboards, real-time team check-ins, and cryptographic PDF credentials.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <Link
            to="/fests"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>Explore Events ↗</span>
          </Link>
          <Link
            to="/fests"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <span>Host a Campus Fest</span>
          </Link>
        </div>

        {/* Live Featured Hackathon Countdown Banner */}
        <div className="pt-4 max-w-2xl mx-auto">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono font-bold uppercase">
                  <Radio className="w-3 h-3 text-amber-600 animate-pulse" aria-hidden="true" />
                  <span>{countdownLabel}</span>
                </span>
                <span className="text-xs font-mono text-slate-400">&bull;</span>
                <span className="text-xs font-semibold text-slate-600">{featuredFest.collegeName}</span>
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base">{featuredFest.title}</h3>
            </div>

            {/* Countdown Clock */}
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <div className="text-center px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 min-w-[48px]">
                <div className="text-sm font-bold text-slate-900">{timeLeft.days}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-sans">Days</div>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="text-center px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 min-w-[48px]">
                <div className="text-sm font-bold text-slate-900">{timeLeft.hours}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-sans">Hours</div>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="text-center px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 min-w-[48px]">
                <div className="text-sm font-bold text-slate-900">{timeLeft.minutes}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-sans">Mins</div>
              </div>
              <span className="text-slate-400 font-bold">:</span>
              <div className="text-center px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 min-w-[48px]">
                <div className="text-sm font-bold text-indigo-600">{timeLeft.seconds}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-500 font-sans">Secs</div>
              </div>
            </div>

            <Link
              to={`/fests/${featuredFest.slug}`}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 transition-colors shadow-sm"
            >
              Enter Arena &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Product Preview Mock Window */}
      <section className="max-w-5xl mx-auto" aria-label="Interactive Product Preview">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-indigo-700 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            <span>Interactive StageZero Arena</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950">
            See the platform in real-time action
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Switch between the live projector stream, judge scoring sliders, and verified cryptographic credentials.
          </p>
        </div>

        {/* Mock Window Container */}
        <div className="rounded-2xl border border-slate-300 bg-white shadow-xl overflow-hidden">
          {/* Window Chrome / Titlebar */}
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500 inline-block" />
            </div>

            {/* URL Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs font-mono text-slate-500 shadow-xs">
              <span className="text-emerald-600 font-bold">https://</span>
              <span>stagezero.campus/apex-2026/live-arena</span>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setPreviewTab("leaderboard")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  previewTab === "leaderboard"
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Live Leaderboard
              </button>
              <button
                onClick={() => setPreviewTab("rubric")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  previewTab === "rubric"
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Judge Rubric
              </button>
              <button
                onClick={() => setPreviewTab("certificate")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  previewTab === "certificate"
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Verified Credential
              </button>
            </div>
          </div>

          {/* Window Body */}
          <div className="p-6 sm:p-8 bg-slate-50/50 min-h-[340px] flex items-center justify-center">
            {/* TAB 1: Live Leaderboard Stream */}
            {previewTab === "leaderboard" && (
              <div className="w-full max-w-3xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                      INTERACTIVE SANDBOX SIMULATOR &bull; LIVE PROJECTOR STREAM
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Live Preview</span>
                </div>

                <div className="space-y-2.5">
                  {/* Rank 1 */}
                  <div className="p-4 rounded-xl bg-white border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FEF08A] text-slate-950 font-black text-sm border border-slate-900">
                        1
                      </span>
                      <div>
                        <div className="font-heading font-bold text-slate-950 text-sm flex items-center gap-2">
                          <span>Team NeuralCraft</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono font-semibold border border-emerald-200">
                            VERIFIED MVP
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">Project: Autonomous Multi-Agent Lab Assistant</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-indigo-600 tabular-nums">96.4 pts</div>
                      <div className="text-[10px] font-mono text-slate-400">4 Judges Scored</div>
                    </div>
                  </div>

                  {/* Rank 2 */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-sm border border-slate-300">
                        2
                      </span>
                      <div>
                        <div className="font-heading font-bold text-slate-900 text-sm">Team ByteForge</div>
                        <div className="text-xs text-slate-500">Project: Zero-Knowledge Decentralized Identity</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-slate-800 tabular-nums">93.8 pts</div>
                      <div className="text-[10px] font-mono text-slate-400">4 Judges Scored</div>
                    </div>
                  </div>

                  {/* Rank 3 */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-800 font-bold text-sm border border-amber-300">
                        3
                      </span>
                      <div>
                        <div className="font-heading font-bold text-slate-900 text-sm">Team SolanaSphere</div>
                        <div className="text-xs text-slate-500">Project: High-Throughput Micro-Payments Gateway</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-base font-bold text-slate-800 tabular-nums">89.2 pts</div>
                      <div className="text-[10px] font-mono text-slate-400">4 Judges Scored</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Interactive Rubric Preview */}
            {previewTab === "rubric" && (
              <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-sm">Judge Evaluation Slider Simulator</h3>
                    <p className="text-xs text-slate-500">Adjust the score slider below to test the weighted scoring math in real time.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Weighted Points</span>
                    <span className="font-mono text-xl font-extrabold text-indigo-600 tabular-nums">
                      {((interactiveScore / 10) * interactiveWeight * 10).toFixed(1)} / {(interactiveWeight * 10).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Criterion: Technical Execution &amp; Code Quality</span>
                      <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        Weight: {interactiveWeight.toFixed(1)}x
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={interactiveScore}
                        onChange={(e) => setInteractiveScore(parseFloat(e.target.value))}
                        className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        aria-label="Technical Execution Score Slider"
                      />
                      <span className="w-12 text-center font-mono font-bold text-sm text-slate-900 bg-indigo-50 border border-indigo-200 py-1 rounded-md tabular-nums">
                        {interactiveScore.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>1 (Basic Script)</span>
                      <span>5 (Functional MVP)</span>
                      <span>10 (Production Grade)</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      <span>Scores auto-save to MongoDB &amp; recalculate auditorium standings in &lt;100ms.</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      Auto-sync ON
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Verified Credential Preview */}
            {previewTab === "certificate" && (
              <div className="w-full max-w-xl bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" aria-hidden="true" />
                    <span className="font-heading font-bold text-slate-950 text-sm">Official StageZero Credential</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold">
                    VERIFIED ISSUER
                  </span>
                </div>

                <div className="text-center space-y-1.5 py-3">
                  <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">Certificate of Achievement</p>
                  <h4 className="font-heading text-xl font-bold text-slate-900">Arjun Sharma</h4>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">
                    Awarded <strong>1st Place Winner</strong> at Technova Apex 2026 for engineering autonomous multi-agent systems.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                    UUID: 7f8a9b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-200">
                    <FileCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Download Vector PDF</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3 Dedicated Role Pathways */}
      <section className="space-y-8" aria-label="Role Pathways">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-indigo-600 font-bold">
            Built for Every Stakeholder
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-950 text-balance">
            One platform. Dedicated workspaces.
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed text-pretty">
            StageZero tailors workflows for hackathon participants, college organizing committees, and expert judges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* For Hackers */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
                <Users className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-900">For Builders &amp; Hackers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Form squads with instant invite codes, track countdowns across rounds, submit GitHub &amp; demo URLs, and download cryptographic vector PDF diplomas.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Instant 6-character team invite codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Live submission checklist verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Real-time audio/visual organizer alerts</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleAction("participant")}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Join as Participant</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* For Organizers */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEF08A] text-slate-950 flex items-center justify-center border border-slate-900 shadow-[1px_1px_0px_#0F172A]">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-900">For Campus Organizers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create multi-round fests, check-in campus arrivals, configure mathematical rubric weights, assign judging panels, and broadcast emergency alerts.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>1-click team check-in roster manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Custom rubric criteria &amp; score weights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Push Socket.io broadcasts to all screens</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleAction("organizer")}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FEF08A] hover:bg-[#FDE047] text-slate-950 font-bold text-xs border border-slate-900 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Host as Campus Organizer</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* For Judges */}
          <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200">
                <Sliders className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="font-heading text-lg font-bold text-slate-900">For Judges &amp; Mentors</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluate assigned submissions side-by-side with interactive range sliders, criterion guidance, auto-saved drafts, and instant leaderboard recalculation.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Split-screen submission &amp; rubric console</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Unsaved changes safety indicator</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Review &amp; submit verification modal</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleRoleAction("judge")}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 font-semibold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Register as Event Judge</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Fests Section */}
      <section className="space-y-6" aria-label="Featured Campus Fests">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-950">
              Active Campus Fests
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Collegiate hackathons and innovation summits currently running on StageZero
            </p>
          </div>
          <Link
            to="/fests"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg px-2 py-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {loadingFests ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Loading fests…">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-200 h-64 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : fests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fests.map((fest) => (
              <Link
                key={fest._id}
                to={`/fests/${fest.slug}`}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <div className="h-40 w-full relative overflow-hidden bg-slate-100">
                  <img
                    src={
                      !fest.bannerUrl || fest.bannerUrl.includes("photo-1540575467063")
                        ? "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80"
                        : fest.bannerUrl
                    }
                    alt={`${fest.title} banner image`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-[#FEF08A] border border-slate-900 px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_#0F172A]">
                      {fest.collegeName}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {fest.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {fest.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>{formatDate(fest.startDate)}</span>
                    </div>
                    <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Explore &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-slate-500">
            No active fests found. Seed the database or create your first fest!
          </div>
        )}
      </section>
    </div>
  );
};
