import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" aria-hidden="true" />
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
          Authenticating StageZero Session…
        </p>
      </div>
    );
  }

  // If not logged in, redirect to login and preserve the intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role-based restriction is specified, check role
  if (allowedRoles && allowedRoles.length > 0) {
    const isSuperAdmin = user.globalRole === "superadmin";
    const hasRole = allowedRoles.includes(user.role);

    if (!isSuperAdmin && !hasRole) {
      return (
        <div className="min-h-[55vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
            <ShieldAlert className="w-7 h-7" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-1">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-600 max-w-md mb-5 leading-relaxed">
            Your current role (<span className="font-mono font-bold capitalize text-slate-900">{user.role}</span>) does not have authorization to view this workspace. This console is restricted to <span className="font-medium text-slate-900">{allowedRoles.join(" or ")}</span> accounts.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/fests"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              Back to Fest Explorer
            </Link>
          </div>
        </div>
      );
    }
  }

  return children;
};
