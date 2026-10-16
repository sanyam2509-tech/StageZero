import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { RoleBadge } from "./RoleBadge";
import {
  Sparkles,
  Zap,
  Radio,
  LogOut,
  LogIn,
  UserPlus,
  ChevronDown,
  Layers,
  FolderGit2,
  Compass,
} from "lucide-react";
import clsx from "clsx";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: "Explore Fests", path: "/fests", icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-xl"
            aria-label="StageZero Home"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 p-[1px] shadow-sm flex items-center justify-center border border-slate-900">
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-lg tracking-tight text-slate-950 flex items-center gap-1.5">
                Stage<span className="text-indigo-600 font-black">Zero</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FACC15] text-slate-950 border border-slate-900 font-bold tabular-nums shadow-[1.5px_1.5px_0px_#0F172A]">
                  v1.0
                </span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase -mt-0.5">
                CAMPUS STACK
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Socket.io Live Status Pill */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono"
            role="status"
            aria-live="polite"
            title={
              isConnected
                ? "Connected to real-time event pipeline"
                : "Connecting to real-time server…"
            }
          >
            <span
              className={clsx(
                "w-2 h-2 rounded-full shrink-0",
                isConnected
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-amber-500"
              )}
              aria-hidden="true"
            />
            <span className={isConnected ? "text-emerald-800 font-bold" : "text-slate-500"}>
              {isConnected ? "LIVE STREAM" : "CONNECTING…"}
            </span>
          </div>

          {/* User Account / Auth Actions */}
          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <RoleBadge role={user.role} size="xs" />
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-bold text-slate-900">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono truncate max-w-[130px]">
                    {user.college || user.clubName || user.organization || user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                aria-label="Logout of StageZero"
                title="Logout"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Login</span>
              </Link>
              <Link
                to="/login?mode=register"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
