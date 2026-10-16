import React from "react";
import { useSocket } from "../hooks/useSocket";
import { BellRing, X, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";

export const AnnouncementBanner = () => {
  const { latestAnnouncement, clearAnnouncement } = useSocket();

  if (!latestAnnouncement) return null;

  const priorityStyles = {
    urgent: {
      bg: "bg-rose-100 border-2 border-slate-900 text-slate-950 shadow-[3px_3px_0px_#0F172A]",
      badge: "bg-rose-600 text-white border border-slate-900 shadow-[1.5px_1.5px_0px_#0F172A]",
      icon: AlertTriangle,
    },
    warning: {
      bg: "bg-[#FEF08A] border-2 border-slate-900 text-slate-950 shadow-[3px_3px_0px_#0F172A]",
      badge: "bg-amber-400 text-slate-950 border border-slate-900 font-bold shadow-[1.5px_1.5px_0px_#0F172A]",
      icon: BellRing,
    },
    info: {
      bg: "bg-indigo-50 border-2 border-slate-900 text-slate-950 shadow-[3px_3px_0px_#0F172A]",
      badge: "bg-indigo-600 text-white border border-slate-900 shadow-[1.5px_1.5px_0px_#0F172A]",
      icon: Info,
    },
  };

  const style =
    priorityStyles[latestAnnouncement.priority?.toLowerCase()] ||
    priorityStyles.info;
  const IconComponent = style.icon;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative z-40 w-full px-4 py-2"
    >
      <div
        className={clsx(
          "max-w-7xl mx-auto rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 transition-all duration-300 animate-in slide-in-from-top",
          style.bg
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <span className="shrink-0 p-1.5 rounded-lg bg-black/10">
            <IconComponent className="w-4 h-4 text-slate-950" aria-hidden="true" />
          </span>
          <span
            className={clsx(
              "text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0",
              style.badge
            )}
          >
            {latestAnnouncement.priority || "BROADCAST"}
          </span>
          <div className="flex items-center gap-2 truncate text-sm min-w-0">
            <span className="font-heading font-bold text-slate-950 truncate shrink-0">
              {latestAnnouncement.title}:
            </span>
            <span className="truncate text-slate-800 font-medium">
              {latestAnnouncement.message}
            </span>
          </div>
        </div>

        <button
          onClick={clearAnnouncement}
          className="shrink-0 p-1.5 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-black/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          aria-label="Dismiss broadcast announcement"
          title="Dismiss announcement"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
