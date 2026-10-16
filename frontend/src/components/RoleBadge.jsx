import React from "react";
import clsx from "clsx";

export const RoleBadge = ({ role = "participant", size = "sm" }) => {
  const normalizedRole = (role || "").toLowerCase();

  const configs = {
    organizer: {
      label: "ORGANIZER",
      bg: "bg-purple-50 border-purple-200 text-purple-800",
      dot: "bg-purple-600",
    },
    superadmin: {
      label: "SUPERADMIN",
      bg: "bg-rose-50 border-rose-200 text-rose-800",
      dot: "bg-rose-600",
    },
    judge: {
      label: "JUDGE",
      bg: "bg-amber-50 border-amber-300 text-amber-900",
      dot: "bg-amber-600",
    },
    leader: {
      label: "TEAM LEADER",
      bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      dot: "bg-emerald-600",
    },
    participant: {
      label: "PARTICIPANT",
      bg: "bg-indigo-50 border-indigo-200 text-indigo-800",
      dot: "bg-indigo-600",
    },
  };

  const current = configs[normalizedRole] || configs.participant;

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5",
    sm: "text-xs px-2.5 py-1",
    md: "text-sm px-3 py-1.5",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-mono font-medium rounded-full border shadow-sm tracking-wider uppercase",
        current.bg,
        sizeClasses[size] || sizeClasses.sm
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", current.dot)} />
      {current.label}
    </span>
  );
};
