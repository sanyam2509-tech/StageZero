import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { RoleBadge } from "../components/RoleBadge";
import {
  Sparkles,
  Lock,
  Mail,
  User,
  GraduationCap,
  GitBranch,
  ArrowRight,
  ArrowLeft,
  Building,
  Sliders,
  Check,
  Loader2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const LoginRegisterPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, user } = useAuth();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [selectedRole, setSelectedRole] = useState(null); // null | "participant" | "organizer" | "judge"
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    githubUrl: "",
    clubName: "",
    designation: "",
    organization: "",
    judgeInviteCode: "",
  });

  // Parse URL query params on mount or when search changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modeParam = params.get("mode");
    const roleParam = params.get("role");

    if (modeParam === "register") {
      setMode("register");
      if (roleParam && ["participant", "organizer", "judge"].includes(roleParam)) {
        setSelectedRole(roleParam);
      } else {
        setSelectedRole(null);
      }
    } else {
      setMode("login");
      setSelectedRole(null);
    }
  }, [location.search]);

  // If already logged in, redirect to destination
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/fests";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    // Update URL query param cleanly without full reload
    navigate(`/login?mode=register&role=${role}`, { replace: true });
  };

  const handleBackToRoles = () => {
    setSelectedRole(null);
    navigate(`/login?mode=register`, { replace: true });
  };

  const handleSwitchToLogin = () => {
    setMode("login");
    setSelectedRole(null);
    navigate("/login", { replace: true });
  };

  const handleSwitchToRegister = () => {
    setMode("register");
    setSelectedRole(null);
    navigate("/login?mode=register", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        await register({
          ...formData,
          role: selectedRole || "participant",
        });
      } else {
        await login({ email: formData.email, password: formData.password });
      }
      const from = location.state?.from?.pathname || "/fests";
      navigate(from, { replace: true });
    } catch (err) {
      // toast notification handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: REGISTRATION WORKFLOW - STEP 1: ROLE SELECTION
  // -------------------------------------------------------------
  if (mode === "register" && !selectedRole) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>STEP 1 OF 2 &bull; CHOOSE YOUR STAGEZERO ROLE</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            How will you participate in StageZero?
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed text-pretty">
            StageZero provides dedicated consoles tailored to each campus persona. Select your primary role to configure your verified workspace.
          </p>
        </div>

        {/* 3 Role Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Card 1: Participant */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#4F46E5] hover:shadow-[6px_6px_0px_#4F46E5] transition-all flex flex-col justify-between p-6 sm:p-7 relative group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl" aria-hidden="true">🚀</span>
                <RoleBadge role="participant" size="sm" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-extrabold text-slate-950">
                  Participant / Hacker
                </h2>
                <p className="text-xs text-indigo-600 font-mono font-medium mt-0.5">
                  Build squads, ship code &amp; win
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Join campus hackathons, form squads with invite codes, submit GitHub repos &amp; project demos, and earn verified certificates.
              </p>
              <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
                  <span>Squad team formation &amp; roster codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
                  <span>Direct GitHub &amp; video link submission</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
                  <span>Verified cryptographic completion PDF</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleRoleSelect("participant")}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Continue as Participant</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Card 2: Campus Organizer */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#9333EA] hover:shadow-[6px_6px_0px_#9333EA] transition-all flex flex-col justify-between p-6 sm:p-7 relative group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl" aria-hidden="true">🏛️</span>
                <RoleBadge role="organizer" size="sm" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-extrabold text-slate-950">
                  Campus Organizer
                </h2>
                <p className="text-xs text-purple-600 font-mono font-medium mt-0.5">
                  Host symposiums &amp; command ops
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Host collegiate symposiums, configure mathematical rubrics, manage student arrivals, assign judge panels, and push live broadcasts.
              </p>
              <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" aria-hidden="true" />
                  <span>Create fests &amp; competitive tracks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" aria-hidden="true" />
                  <span>Custom rubric criteria &amp; score weights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" aria-hidden="true" />
                  <span>Push Socket.io broadcasts to all screens</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleRoleSelect("organizer")}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Continue as Organizer</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Card 3: Event Judge */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#D97706] hover:shadow-[6px_6px_0px_#D97706] transition-all flex flex-col justify-between p-6 sm:p-7 relative group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl" aria-hidden="true">⚖️</span>
                <RoleBadge role="judge" size="sm" />
              </div>
              <div>
                <h2 className="text-xl font-heading font-extrabold text-slate-950">
                  Event Judge / Mentor
                </h2>
                <p className="text-xs text-amber-600 font-mono font-medium mt-0.5">
                  Evaluate &amp; calibrate standings
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluate assigned submissions side-by-side using interactive range sliders, autosave drafts safely, and compute official rankings.
              </p>
              <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>Split-screen submission &amp; rubric console</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>Unsaved changes &amp; zero-default safeguards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>Direct event binding via invite token</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleRoleSelect("judge")}
              className="mt-6 w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>Continue as Judge</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Switch to Login Link */}
        <div className="mt-12 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className="text-indigo-600 hover:text-indigo-700 font-bold underline cursor-pointer"
            >
              Sign In here
            </button>
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: REGISTRATION WORKFLOW - STEP 2: ROLE-TAILORED FORM
  // -------------------------------------------------------------
  if (mode === "register" && selectedRole) {
    const roleThemes = {
      participant: {
        accent: "indigo",
        title: "Participant Registration",
        subtitle: "Create your student hacker profile to form squads and enter competitions.",
        icon: "🚀",
        borderColor: "border-indigo-600",
        shadowColor: "shadow-[4px_4px_0px_#4F46E5]",
        buttonBg: "bg-indigo-600 hover:bg-indigo-700",
      },
      organizer: {
        accent: "purple",
        title: "Campus Organizer Registration",
        subtitle: "Verify your collegiate student society or chapter to host official fests.",
        icon: "🏛️",
        borderColor: "border-purple-600",
        shadowColor: "shadow-[4px_4px_0px_#9333EA]",
        buttonBg: "bg-purple-600 hover:bg-purple-700",
      },
      judge: {
        accent: "amber",
        title: "Event Judge Registration",
        subtitle: "Provide your professional credentials to evaluate hackathon submissions.",
        icon: "⚖️",
        borderColor: "border-amber-600",
        shadowColor: "shadow-[4px_4px_0px_#D97706]",
        buttonBg: "bg-amber-600 hover:bg-amber-700",
      },
    };

    const currentTheme = roleThemes[selectedRole] || roleThemes.participant;

    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        {/* Back to Step 1 Role Selection */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBackToRoles}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-600 hover:text-slate-950 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
            <span>Change Selected Role</span>
          </button>

          <RoleBadge role={selectedRole} size="sm" />
        </div>

        {/* Tailored Form Container */}
        <div className={`precision-card p-6 sm:p-8 rounded-2xl bg-white border-2 border-slate-900 ${currentTheme.shadowColor}`}>
          <div className="mb-6 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">{currentTheme.icon}</span>
              <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                {currentTheme.title}
              </h1>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentTheme.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="auth-name-input"
                className="block text-xs font-mono font-medium text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="auth-name-input"
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Chen"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label
                htmlFor="auth-email-input"
                className="block text-xs font-mono font-medium text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="auth-email-input"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  spellCheck={false}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. alex@university.edu"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-mono font-medium text-slate-700 mb-1.5 uppercase tracking-wider"
              >
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="auth-password-input"
                  type="password"
                  name="password"
                  required
                  autoComplete="new-password"
                  spellCheck={false}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 transition-colors placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* ROLE-SPECIFIC FIELDS: PARTICIPANT */}
            {selectedRole === "participant" && (
              <>
                <div>
                  <label
                    htmlFor="auth-college-input"
                    className="block text-xs font-mono font-medium text-slate-700 mb-1.5 uppercase tracking-wider"
                  >
                    College / University (Optional)
                  </label>
                  <div className="relative">
                    <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="auth-college-input"
                      type="text"
                      name="college"
                      autoComplete="organization"
                      value={formData.college}
                      onChange={handleChange}
                      placeholder="e.g. Stanford University"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="auth-github-input"
                    className="block text-xs font-mono font-medium text-slate-700 mb-1.5 uppercase tracking-wider"
                  >
                    GitHub Profile URL (Optional)
                  </label>
                  <div className="relative">
                    <GitBranch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                    <input
                      id="auth-github-input"
                      type="url"
                      name="githubUrl"
                      autoComplete="url"
                      spellCheck={false}
                      value={formData.githubUrl}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 transition-colors placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ROLE-SPECIFIC FIELDS: ORGANIZER */}
            {selectedRole === "organizer" && (
              <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                <div className="flex items-center gap-1.5 text-purple-900 text-xs font-bold font-mono">
                  <Building className="w-4 h-4 text-purple-600" aria-hidden="true" />
                  <span>Campus Club / Society Verification</span>
                </div>

                <div>
                  <label
                    htmlFor="auth-college-org-input"
                    className="block text-[11px] font-mono text-slate-700 mb-1 font-semibold uppercase tracking-wider"
                  >
                    University / College *
                  </label>
                  <input
                    id="auth-college-org-input"
                    type="text"
                    name="college"
                    required
                    placeholder="e.g. Stanford University"
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600 placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="auth-club-input"
                      className="block text-[11px] font-mono text-slate-700 mb-1 font-semibold uppercase tracking-wider"
                    >
                      Club / Student Body *
                    </label>
                    <input
                      id="auth-club-input"
                      type="text"
                      name="clubName"
                      required
                      placeholder="e.g. ACM Student Chapter"
                      value={formData.clubName}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="auth-designation-input"
                      className="block text-[11px] font-mono text-slate-700 mb-1 font-semibold uppercase tracking-wider"
                    >
                      Designation / Role *
                    </label>
                    <input
                      id="auth-designation-input"
                      type="text"
                      name="designation"
                      required
                      placeholder="e.g. Lead Organizer / President"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-purple-800 leading-relaxed font-mono">
                  Verified campus organizers have exclusive authorization to host fests and configure sub-events.
                </p>
              </div>
            )}

            {/* ROLE-SPECIFIC FIELDS: JUDGE */}
            {selectedRole === "judge" && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold font-mono">
                  <Sliders className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  <span>Judge Credentials &amp; Verification</span>
                </div>

                <div>
                  <label
                    htmlFor="auth-org-input"
                    className="block text-[11px] font-mono text-slate-700 mb-1 font-semibold uppercase tracking-wider"
                  >
                    Organization &amp; Title *
                  </label>
                  <input
                    id="auth-org-input"
                    type="text"
                    name="organization"
                    required
                    placeholder="e.g. Senior Staff Engineer @ Google / CS Professor"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600 placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-invite-code-input"
                    className="block text-[11px] font-mono text-slate-700 mb-1 font-semibold uppercase tracking-wider"
                  >
                    Event Code / Invite Token (Optional)
                  </label>
                  <input
                    id="auth-invite-code-input"
                    type="text"
                    name="judgeInviteCode"
                    placeholder="Enter event ID to automatically join the judge panel"
                    value={formData.judgeInviteCode}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-600 placeholder:text-slate-400 font-mono"
                  />
                </div>

                <p className="text-[10px] text-amber-800 leading-relaxed font-mono">
                  Notice: Organizers can also assign you to their judge panel by typing your registered email address.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 px-4 rounded-xl text-white font-bold text-sm border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer ${currentTheme.buttonBg}`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <span>Complete {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Registration</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: STANDARD LOGIN SCREEN
  // -------------------------------------------------------------
  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="precision-card p-6 sm:p-8 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0F172A]">
        <div className="mb-6 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono font-bold mb-2">
            <Sparkles className="w-3 h-3 text-amber-600" aria-hidden="true" />
            <span>STAGEZERO ACCOUNT</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-950 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-600">
            Sign in to access your hackathons, team workspaces, and consoles.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="auth-login-email"
              className="block text-xs font-mono font-medium text-slate-700 mb-1.5 uppercase tracking-wider"
            >
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="auth-login-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                spellCheck={false}
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@university.edu"
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-login-password"
              className="block text-xs font-mono font-medium text-slate-700 mb-1.5 uppercase tracking-wider"
            >
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                id="auth-login-password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                spellCheck={false}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-600/30 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm border-2 border-slate-900 shadow-[2px_2px_0px_#0F172A] flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <span>Sign In to StageZero</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={handleSwitchToRegister}
              className="text-indigo-600 hover:text-indigo-700 font-bold underline cursor-pointer"
            >
              Create an Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
