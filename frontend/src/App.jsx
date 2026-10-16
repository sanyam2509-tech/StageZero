import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { AnnouncementBanner } from "./components/AnnouncementBanner";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Route-level code splitting for optimized production bundle performance
const LandingPage = React.lazy(() =>
  import("./pages/LandingPage").then((m) => ({ default: m.LandingPage }))
);
const LoginRegisterPage = React.lazy(() =>
  import("./pages/LoginRegisterPage").then((m) => ({ default: m.LoginRegisterPage }))
);
const FestExplorerPage = React.lazy(() =>
  import("./pages/FestExplorerPage").then((m) => ({ default: m.FestExplorerPage }))
);
const EventDetailPage = React.lazy(() =>
  import("./pages/EventDetailPage").then((m) => ({ default: m.EventDetailPage }))
);
const TeamWorkspacePage = React.lazy(() =>
  import("./pages/TeamWorkspacePage").then((m) => ({ default: m.TeamWorkspacePage }))
);
const JudgeScoringConsole = React.lazy(() =>
  import("./pages/JudgeScoringConsole").then((m) => ({ default: m.JudgeScoringConsole }))
);
const OrganizerDashboard = React.lazy(() =>
  import("./pages/OrganizerDashboard").then((m) => ({ default: m.OrganizerDashboard }))
);
const LiveLeaderboardPage = React.lazy(() =>
  import("./pages/LiveLeaderboardPage").then((m) => ({ default: m.LiveLeaderboardPage }))
);

const RouteLoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[45vh] space-y-3" role="status" aria-live="polite">
    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-mono font-medium text-slate-500 uppercase tracking-wider">
      Loading StageZero Workspace…
    </span>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("StageZero UI ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center" role="alert">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200 text-2xl font-bold">
            !
          </div>
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-1">
            Application View Encountered an Error
          </h2>
          <p className="text-xs text-slate-500 max-w-md mb-4">
            {this.state.error?.message || "An unexpected error occurred while rendering this view."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Reload Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Real-time Socket.io Global Announcement Banner */}
      <AnnouncementBanner />

      {/* Primary Sticky Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <ErrorBoundary>
          <React.Suspense fallback={<RouteLoadingSpinner />}>
            <Routes>
              {/* Public Unprotected Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginRegisterPage />} />

              {/* Protected Exploring, Event, and Leaderboard Routes */}
              <Route
                path="/fests"
                element={
                  <ProtectedRoute>
                    <FestExplorerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fests/:slug"
                element={
                  <ProtectedRoute>
                    <FestExplorerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId"
                element={
                  <ProtectedRoute>
                    <EventDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId/leaderboard"
                element={
                  <ProtectedRoute>
                    <LiveLeaderboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Role-Specific Workspaces */}
              <Route
                path="/events/:eventId/workspace"
                element={
                  <ProtectedRoute>
                    <TeamWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId/judge"
                element={
                  <ProtectedRoute allowedRoles={["judge"]}>
                    <JudgeScoringConsole />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:eventId/organizer"
                element={
                  <ProtectedRoute allowedRoles={["organizer"]}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-800 font-medium">
            StageZero &mdash; Where every hackathon team and campus event starts.
          </span>
          <span className="text-[11px] text-slate-500">
            Node.js &bull; Express &bull; Mongoose &bull; React &bull; Tailwind &bull; Socket.io
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
