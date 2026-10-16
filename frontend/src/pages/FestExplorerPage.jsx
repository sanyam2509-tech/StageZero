import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { festsApi, eventsApi } from "../api/endpoints";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/formatters";
import {
  Compass,
  Search,
  Plus,
  Calendar,
  Building,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  Sparkles,
  Layers,
  Users,
  Filter,
  CheckCircle2,
  Clock,
  Radio,
  SlidersHorizontal,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";

// In-memory session cache for zero-latency page transitions
const festSessionCache = {
  allFests: null,
  singleFests: new Map(),
};

export const FestExplorerPage = () => {
  const { slug } = useParams();
  const { user, currentDemoRole } = useAuth();

  const userIdStr = user?._id?.toString();
  const isOrganizerUser = Boolean(
    user && (user.role === "organizer" || currentDemoRole === "organizer") && user.globalRole !== "superadmin"
  );
  const isJudgeUser = Boolean(
    user && (user.role === "judge" || currentDemoRole === "judge") && user.globalRole !== "superadmin"
  );
  const isParticipantUser = !user || user.role === "participant" || user.globalRole === "superadmin";

  const canHostFest = Boolean(
    user && (
      user.globalRole === "superadmin" ||
      currentDemoRole === "organizer" ||
      user.role === "organizer" ||
      user.email === "organizer@demo.com"
    )
  );

  // Multi-fest listing state with instant memory hydration
  const [fests, setFests] = useState(() => festSessionCache.allFests || []);
  const [loading, setLoading] = useState(() => {
    if (slug) {
      return !festSessionCache.singleFests.has(slug);
    }
    return !festSessionCache.allFests;
  });
  const [forbiddenError, setForbiddenError] = useState(null);
  const [judgeFilterOnly, setJudgeFilterOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("soonest");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Single fest detail state (when /fests/:slug is opened)
  const [singleFest, setSingleFest] = useState(() => {
    return slug && festSessionCache.singleFests.has(slug)
      ? festSessionCache.singleFests.get(slug).fest
      : null;
  });
  const [festEvents, setFestEvents] = useState(() => {
    return slug && festSessionCache.singleFests.has(slug)
      ? festSessionCache.singleFests.get(slug).events
      : [];
  });
  const [subEventCategory, setSubEventCategory] = useState("all");

  // Sub-event creation state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    category: "hackathon",
    description: "",
    minTeamSize: 1,
    maxTeamSize: 4,
    roundTitle: "Round 1: Initial Pitch & Prototype Submission",
    roundDeadline: "",
  });

  const [festForm, setFestForm] = useState({
    title: "",
    slug: "",
    collegeName: "",
    description: "",
    bannerUrl: "",
    startDate: "",
    endDate: "",
  });

  // Modal keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setIsEventModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) {
      // Only show full loader if we have no cached data to display
      if (slug && !festSessionCache.singleFests.has(slug)) {
        setLoading(true);
      } else if (!slug && !festSessionCache.allFests) {
        setLoading(true);
      }
    }

    setForbiddenError(null);
    try {
      if (slug) {
        const res = await festsApi.getFestBySlug(slug);
        if (res?.data) {
          setSingleFest(res.data.fest);
          setFestEvents(res.data.events || []);
          festSessionCache.singleFests.set(slug, {
            fest: res.data.fest,
            events: res.data.events || [],
          });
        }
      } else {
        const res = await festsApi.getAllFests({
          search,
          myJudging: judgeFilterOnly ? "true" : undefined,
        });
        if (res?.data?.fests) {
          setFests(res.data.fests);
          festSessionCache.allFests = res.data.fests;
        }
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setForbiddenError(
          err.response?.data?.message ||
          "Access restricted: As an organizer, you can only view fests you created or manage."
        );
      } else {
        toast.error(slug ? "Failed to load fest details" : "Failed to load fests");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug, judgeFilterOnly]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!slug) {
      loadData();
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSortBy("soonest");
    loadData();
  };

  // Client-side filtering & sorting for rich discovery
  const filteredFests = useMemo(() => {
    return fests
      .filter((fest) => {
        // Search filter
        if (search.trim()) {
          const query = search.toLowerCase();
          const matchTitle = fest.title?.toLowerCase().includes(query);
          const matchCollege = fest.collegeName?.toLowerCase().includes(query);
          const matchDesc = fest.description?.toLowerCase().includes(query);
          if (!matchTitle && !matchCollege && !matchDesc) return false;
        }

        // Status filter
        if (selectedStatus !== "all") {
          const now = new Date();
          const start = new Date(fest.startDate);
          const end = new Date(fest.endDate);

          if (selectedStatus === "live") {
            if (!(now >= start && now <= end)) return false;
          } else if (selectedStatus === "upcoming") {
            if (!(now < start)) return false;
          } else if (selectedStatus === "completed") {
            if (!(now > end)) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "soonest") {
          return new Date(a.startDate) - new Date(b.startDate);
        }
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "");
        }
        if (sortBy === "college") {
          return (a.collegeName || "").localeCompare(b.collegeName || "");
        }
        return 0;
      });
  }, [fests, search, selectedStatus, sortBy]);

  // Sub-events filtered by category
  const filteredSubEvents = useMemo(() => {
    if (subEventCategory === "all") return festEvents;
    return festEvents.filter((ev) => ev.category?.toLowerCase() === subEventCategory.toLowerCase());
  }, [festEvents, subEventCategory]);

  const handleCreateFest = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await festsApi.createFest(festForm);
      toast.success("Fest created successfully!");
      setIsModalOpen(false);
      setFestForm({
        title: "",
        slug: "",
        collegeName: "",
        description: "",
        bannerUrl: "",
        startDate: "",
        endDate: "",
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create fest");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!singleFest?._id) return;
    setCreatingEvent(true);
    try {
      const deadlineDate = eventForm.roundDeadline
        ? new Date(eventForm.roundDeadline).toISOString()
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await eventsApi.createEvent({
        festId: singleFest._id,
        title: eventForm.title.trim(),
        category: eventForm.category,
        description: eventForm.description.trim(),
        teamSize: {
          min: Number(eventForm.minTeamSize) || 1,
          max: Number(eventForm.maxTeamSize) || 4,
        },
        rounds: [
          {
            roundNumber: 1,
            title: eventForm.roundTitle || "Round 1: MVP Prototype Submission",
            deadline: deadlineDate,
          },
        ],
        rubric: [
          { criterion: "Innovation & Originality", maxScore: 10, weight: 1.5 },
          { criterion: "Technical Execution & Architecture", maxScore: 10, weight: 2.0 },
          { criterion: "UI/UX & User Experience", maxScore: 10, weight: 1.0 },
          { criterion: "Real-world Viability & Impact", maxScore: 10, weight: 1.5 },
        ],
      });

      toast.success("Event created successfully!");
      setIsEventModalOpen(false);
      setEventForm({
        title: "",
        category: "hackathon",
        description: "",
        minTeamSize: 1,
        maxTeamSize: 4,
        roundTitle: "Round 1: Initial Pitch & Prototype Submission",
        roundDeadline: "",
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" aria-hidden="true" />
        <p className="text-sm font-mono text-slate-500">Loading campus fests…</p>
      </div>
    );
  }

  if (forbiddenError) {
    return (
      <div className="py-16 text-center bg-white border-2 border-slate-900 rounded-3xl p-8 shadow-[4px_4px_0px_#0F172A] max-w-lg mx-auto my-8" role="alert">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-lg font-bold text-slate-900">Organizer Access Restricted</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {forbiddenError}
        </p>
        <div className="mt-6">
          <Link
            to="/fests"
            onClick={() => setForbiddenError(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Managed Fests</span>
          </Link>
        </div>
      </div>
    );
  }

  // View SINGLE FEST + ITS EVENTS (if :slug is present in URL)
  if (slug && singleFest) {
    return (
      <div className="space-y-8 py-4">
        <Link
          to="/fests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg px-2 py-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back to All Campus Fests</span>
        </Link>

        {/* Fest Header Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm">
          <div className="h-64 sm:h-80 w-full relative">
            <img
              src={
                !singleFest.bannerUrl || singleFest.bannerUrl.includes("photo-1540575467063")
                  ? "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80"
                  : singleFest.bannerUrl
              }
              alt={`${singleFest.title} banner`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent/10" />
            <div className="absolute bottom-6 left-6 right-6 space-y-2">
              <span className="text-xs font-mono font-bold text-slate-900 bg-[#FEF08A] px-2.5 py-1 rounded-lg border border-slate-900 shadow-[1.5px_1.5px_0px_#0F172A]">
                {singleFest.collegeName}
              </span>
              <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-white tracking-tight text-balance drop-shadow-sm">
                {singleFest.title}
              </h1>
              <p className="text-sm text-slate-100 max-w-3xl leading-relaxed text-pretty drop-shadow-sm">
                {singleFest.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-200 pt-1 font-mono tabular-nums">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                  {formatDate(singleFest.startDate)} &ndash; {formatDate(singleFest.endDate)}
                </span>
                <span>&bull;</span>
                <span className="font-semibold text-white">{festEvents.length} Competitive Events</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Events List */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-bold text-slate-950 flex items-center gap-2">
                <Layers className="w-6 h-6 text-indigo-600" aria-hidden="true" />
                <span>Events in this Fest ({filteredSubEvents.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Join a hackathon track, form your squad, and begin building
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                {["all", "hackathon", "coding", "robotics", "cultural"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSubEventCategory(cat)}
                    className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                      subEventCategory === cat
                        ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {Boolean(
                user &&
                  singleFest && (
                    user.globalRole === "superadmin" ||
                    (singleFest.createdBy &&
                      (singleFest.createdBy === userIdStr ||
                        singleFest.createdBy?._id?.toString() === userIdStr ||
                        singleFest.createdBy?.toString() === userIdStr)) ||
                    (Array.isArray(singleFest.organizers) &&
                      singleFest.organizers.some(
                        (o) => (o._id?.toString() || o.toString()) === userIdStr
                      ))
                  )
              ) && (
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FACC15] hover:bg-[#FDE047] text-slate-950 font-bold text-xs border-2 border-slate-900 shadow-[2.5px_2.5px_0px_#0F172A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 shrink-0"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Create Event</span>
                </button>
              )}
            </div>
          </div>

          {filteredSubEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubEvents.map((event) => {
                const isUserAssignedJudge =
                  Array.isArray(event.judges) &&
                  event.judges.some(
                    (j) => (j._id || j)?.toString() === userIdStr
                  );

                return (
                  <div
                    key={event._id}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 flex flex-col justify-between space-y-4 group transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {event.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isUserAssignedJudge && (
                            <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                              ★ Assigned Judge
                            </span>
                          )}
                          {isOrganizerUser && (
                            <span className="text-[11px] font-mono font-bold text-purple-900 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-full">
                              Managed Track
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full capitalize font-semibold">
                            {event.status}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono">
                        Teams of {event.teamSize?.min}&ndash;{event.teamSize?.max}
                      </span>
                      <Link
                        to={`/events/${event._id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <span>Enter Arena</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl text-center space-y-4 border border-dashed border-slate-300 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                <Layers className="w-6 h-6 opacity-80" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">No events matched this category</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Switch categories above or add a new competitive hackathon to this fest.
                </p>
              </div>
              <button
                onClick={() => setSubEventCategory("all")}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Reset Category Filter
              </button>
            </div>
          )}
        </div>

        {/* Create Sub-Event Modal */}
        {isEventModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-subevent-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          >
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg"
                aria-label="Close Create Event Modal"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="mb-6">
                <h2 id="create-subevent-modal-title" className="font-heading text-xl font-bold text-slate-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                  <span>Create Sub-Event in {singleFest.title}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure title, category, team size limits, and submission rounds.
                </p>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label htmlFor="event-title-input" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                    Event Title *
                  </label>
                  <input
                    id="event-title-input"
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. AI & Full-Stack Web3 Hackathon"
                    value={eventForm.title}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="event-category-select" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                      Category *
                    </label>
                    <select
                      id="event-category-select"
                      name="category"
                      value={eventForm.category}
                      onChange={(e) =>
                        setEventForm({ ...eventForm, category: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="hackathon">Hackathon</option>
                      <option value="coding">Coding Sprint</option>
                      <option value="robotics">Robotics</option>
                      <option value="cultural">Cultural</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="event-min-teamsize" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                      Team Size (Min &ndash; Max)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="event-min-teamsize"
                        name="minTeamSize"
                        type="number"
                        min="1"
                        max="10"
                        value={eventForm.minTeamSize}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            minTeamSize: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 text-center font-mono tabular-nums"
                      />
                      <span className="text-slate-500 text-xs font-mono">to</span>
                      <input
                        id="event-max-teamsize"
                        name="maxTeamSize"
                        type="number"
                        min="1"
                        max="10"
                        value={eventForm.maxTeamSize}
                        onChange={(e) =>
                          setEventForm({
                            ...eventForm,
                            maxTeamSize: e.target.value,
                          })
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 text-center font-mono tabular-nums"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="event-desc-input" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                    Description * (At least 10 characters)
                  </label>
                  <textarea
                    id="event-desc-input"
                    name="description"
                    required
                    rows={3}
                    placeholder="Describe the challenge theme, rules, and problem statements…"
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600"
                  />
                </div>

                <div>
                  <label htmlFor="event-round-title" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                    Round 1 Title
                  </label>
                  <input
                    id="event-round-title"
                    name="roundTitle"
                    type="text"
                    value={eventForm.roundTitle}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        roundTitle: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600"
                  />
                </div>

                <div>
                  <label htmlFor="event-round-deadline" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                    Round 1 Submission Deadline
                  </label>
                  <input
                    id="event-round-deadline"
                    name="roundDeadline"
                    type="datetime-local"
                    value={eventForm.roundDeadline}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        roundDeadline: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                >
                  {creatingEvent ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <span>Create Sub-Event</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ALL FESTS EXPLORER VIEW
  return (
    <div className="space-y-8 py-4">
      {/* Header and Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {isOrganizerUser && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold text-purple-900 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full">
                Organizer Workspace
              </span>
            </div>
          )}
          {isJudgeUser && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                Judge Evaluator View
              </span>
            </div>
          )}
          <h1 className="font-heading text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2.5">
            {isOrganizerUser ? (
              <Building className="w-7 h-7 text-indigo-600" aria-hidden="true" />
            ) : (
              <Compass className="w-7 h-7 text-indigo-600" aria-hidden="true" />
            )}
            <span>
              {isOrganizerUser
                ? "My Hosted Fests"
                : "Campus Fests & Hackathons"}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isOrganizerUser
              ? "Displaying only fests and event tracks created or co-managed by you."
              : isJudgeUser
              ? "Explore campus competitions. Competitions you are assigned to evaluate are highlighted."
              : "Discover upcoming engineering symposiums, hackathons, and robotic derbies."}
          </p>
        </div>

        {canHostFest && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs border-2 border-slate-900 shadow-[2.5px_2.5px_0px_#0F172A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3.5px_3.5px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Host New Fest</span>
          </button>
        )}
      </div>

      {/* Discovery Toolbar: Search + Status + Sort */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input Bar */}
          <form onSubmit={handleSearch} className="relative flex-1" role="search" aria-label="Search fests">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <label htmlFor="search-fests-input" className="sr-only">Search fests by title, college, or description</label>
            <input
              id="search-fests-input"
              name="search"
              type="search"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isOrganizerUser ? "Search your hosted fests…" : "Search by fest title, college name, or keywords…"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-20 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  loadData();
                }}
                className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search text"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="sort-fests-select" className="text-xs font-mono text-slate-500 font-semibold uppercase">
              Sort:
            </label>
            <select
              id="sort-fests-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="soonest">Soonest Start Date</option>
              <option value="title">Alphabetical (A&ndash;Z)</option>
              <option value="college">College Name</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills & Result Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-slate-500 font-semibold mr-1">Status:</span>
              {[
                { id: "all", label: "All" },
                { id: "live", label: "Live Now", hasPulse: true },
                { id: "upcoming", label: "Upcoming" },
                { id: "completed", label: "Completed" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedStatus === st.id
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {st.hasPulse && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                  <span>{st.label}</span>
                </button>
              ))}
            </div>

            {isJudgeUser && (
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-xs font-mono text-amber-700 font-semibold mr-1">Judging:</span>
                <button
                  onClick={() => setJudgeFilterOnly(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    !judgeFilterOnly
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  All Fests
                </button>
                <button
                  onClick={() => setJudgeFilterOnly(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    judgeFilterOnly
                      ? "bg-amber-400 text-slate-950 font-bold shadow-xs border border-amber-500"
                      : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300"
                  }`}
                >
                  <span>★ My Assigned Fests</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              Showing <strong>{filteredFests.length}</strong> {filteredFests.length === 1 ? "fest" : "fests"}
            </span>

            {(search || selectedStatus !== "all" || sortBy !== "soonest") && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fests Grid */}
      {filteredFests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFests.map((fest) => (
            <Link
              key={fest._id}
              to={`/fests/${fest.slug}`}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src={
                    !fest.bannerUrl || fest.bannerUrl.includes("photo-1540575467063")
                      ? "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80"
                      : fest.bannerUrl
                  }
                  alt={`${fest.title} banner`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900 bg-[#FEF08A] px-2.5 py-1 rounded-lg border border-slate-900 shadow-[1.5px_1.5px_0px_#0F172A] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" aria-hidden="true" />
                    {fest.collegeName}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-heading font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {fest.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {fest.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    <span>
                      {formatDate(fest.startDate)} &ndash;{" "}
                      {formatDate(fest.endDate)}
                    </span>
                  </div>
                  <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Explore &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border-2 border-slate-900 p-12 rounded-3xl text-center space-y-4 shadow-[3px_3px_0px_#0F172A] max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200">
            {isOrganizerUser ? <Building className="w-6 h-6" /> : <Filter className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isOrganizerUser
                ? "No Fests Found in Your Workspace"
                : "No campus fests matched your filters"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {isOrganizerUser
                ? "As an organizer, you only see fests you created. Host your first campus fest to create competitive tracks and manage registrations."
                : "Try adjusting your search query, changing status filter, or reset all filters to browse all available events."}
            </p>
          </div>
          {isOrganizerUser && canHostFest ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Host New Fest</span>
            </button>
          ) : (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      )}

      {/* Create Fest Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-fest-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 border-2 border-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg"
              aria-label="Close Host Fest Modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="mb-6">
              <h2 id="create-fest-modal-title" className="font-heading text-xl font-bold text-slate-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                <span>Host a Campus Fest</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Register a new inter-collegiate hackathon or technical symposium.
              </p>
            </div>

            <form onSubmit={handleCreateFest} className="space-y-4">
              <div>
                <label htmlFor="fest-title-input" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                  Fest Title *
                </label>
                <input
                  id="fest-title-input"
                  name="title"
                  type="text"
                  required
                  value={festForm.title}
                  onChange={(e) =>
                    setFestForm({ ...festForm, title: e.target.value })
                  }
                  placeholder="HackPulse 2026"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="fest-college-input" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                  Host College / University *
                </label>
                <input
                  id="fest-college-input"
                  name="collegeName"
                  type="text"
                  required
                  value={festForm.collegeName}
                  onChange={(e) =>
                    setFestForm({ ...festForm, collegeName: e.target.value })
                  }
                  placeholder="Stanford University"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="fest-slug-input" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                  URL Slug (Optional, auto-generated if blank)
                </label>
                <input
                  id="fest-slug-input"
                  name="slug"
                  type="text"
                  spellCheck={false}
                  value={festForm.slug}
                  onChange={(e) =>
                    setFestForm({ ...festForm, slug: e.target.value })
                  }
                  placeholder="hackpulse-2026"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600 font-mono"
                />
              </div>

              <div>
                <label htmlFor="fest-desc-input" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                  Description *
                </label>
                <textarea
                  id="fest-desc-input"
                  name="description"
                  required
                  rows={3}
                  value={festForm.description}
                  onChange={(e) =>
                    setFestForm({ ...festForm, description: e.target.value })
                  }
                  placeholder="Annual flagship innovation fest featuring 48-hour competitive hacking…"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fest-start-date" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                    Start Date *
                  </label>
                  <input
                    id="fest-start-date"
                    name="startDate"
                    type="date"
                    required
                    value={festForm.startDate}
                    onChange={(e) =>
                      setFestForm({ ...festForm, startDate: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label htmlFor="fest-end-date" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                    End Date *
                  </label>
                  <input
                    id="fest-end-date"
                    name="endDate"
                    type="date"
                    required
                    value={festForm.endDate}
                    onChange={(e) =>
                      setFestForm({ ...festForm, endDate: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="fest-banner-input" className="block text-xs font-mono text-slate-700 mb-1 uppercase font-semibold">
                  Banner Image URL (Optional)
                </label>
                <input
                  id="fest-banner-input"
                  name="bannerUrl"
                  type="url"
                  value={festForm.bannerUrl}
                  onChange={(e) =>
                    setFestForm({ ...festForm, bannerUrl: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm border-2 border-slate-900 shadow-[3px_3px_0px_#0F172A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0F172A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <span>Publish Fest</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
