import React from "react";
import { RiskCategory, MachineStatus, AlertSeverity } from "../../../shared/domain";

export function RiskPill({ category, pct }: { category: RiskCategory; pct?: number }) {
  let color = "bg-slate-800 text-slate-300 border-slate-700";

  if (category === "CRITICAL") {
    color = "bg-red-500/15 text-red-400 border-red-500/40";
  } else if (category === "HIGH") {
    color = "bg-amber-500/15 text-amber-400 border-amber-500/40";
  } else if (category === "MEDIUM") {
    color = "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  } else if (category === "LOW") {
    color = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  }

  return (
    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        category === "CRITICAL" ? "bg-red-500 animate-pulse" :
        category === "HIGH" ? "bg-amber-400" :
        category === "MEDIUM" ? "bg-yellow-400" : "bg-emerald-400"
      }`} />
      <span>{category}</span>
      {pct !== undefined && <span className="opacity-80">({pct}%)</span>}
    </span>
  );
}

export function StatusPill({ status }: { status: MachineStatus }) {
  let badgeClass = "bg-slate-800 text-slate-300 border-slate-700";
  let label = "Operational";

  switch (status) {
    case "critical":
      badgeClass = "bg-red-500/20 text-red-400 border-red-500/50";
      label = "Critical Condition";
      break;
    case "warning":
      badgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
      label = "Requires Inspection";
      break;
    case "in_maintenance":
      badgeClass = "bg-sky-500/20 text-sky-400 border-sky-500/40";
      label = "In Maintenance";
      break;
    case "offline":
      badgeClass = "bg-slate-800 text-slate-400 border-slate-700";
      label = "Offline";
      break;
    case "operational":
    default:
      badgeClass = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      label = "Normal Operation";
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}`}>
      {label}
    </span>
  );
}
