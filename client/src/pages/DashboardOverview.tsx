import React from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  ArrowUpRight, 
  Layers, 
  Cpu, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Flame,
  Radio,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskPill, StatusPill } from "@/components/RiskPill";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from "recharts";

export default function DashboardOverview() {
  const summaryQuery = trpc.fleet.getSummary.useQuery();
  const fleetQuery = trpc.fleet.list.useQuery();
  const alertsQuery = trpc.alerts.list.useQuery();
  const maintenanceQuery = trpc.maintenance.list.useQuery();

  const summary = summaryQuery.data;
  const fleet = fleetQuery.data || [];
  const alerts = alertsQuery.data || [];
  const maintenance = maintenanceQuery.data || [];

  // Sort machines requiring immediate attention
  const prioritizedMachines = [...fleet].sort((a, b) => 
    b.riskAssessment.estimatedRiskPct - a.riskAssessment.estimatedRiskPct
  );

  // Risk distribution data
  const riskDistributionData = [
    { name: "Low Risk", value: summary?.healthyMachines || 0, color: "#10b981" },
    { name: "Medium Risk", value: summary?.warningMachines || 0, color: "#f59e0b" },
    { name: "High Risk", value: summary?.highRiskMachines || 0, color: "#f97316" },
    { name: "Critical Risk", value: summary?.criticalMachines || 0, color: "#ef4444" }
  ];

  // Fleet Health Distribution Bar Data
  const fleetHealthBars = [
    { category: "Nominal (>= 80%)", count: fleet.filter(m => m.riskAssessment.healthScorePct >= 80).length, fill: "#10b981" },
    { category: "Degrading (50-79%)", count: fleet.filter(m => m.riskAssessment.healthScorePct >= 50 && m.riskAssessment.healthScorePct < 80).length, fill: "#f59e0b" },
    { category: "Critical Danger (< 50%)", count: fleet.filter(m => m.riskAssessment.healthScorePct < 50).length, fill: "#ef4444" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Value Banner & Hackathon Pitch Callout */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-widest font-mono text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Core Workflow
              </span>
              <span className="text-slate-500 text-xs font-mono">•</span>
              <span className="text-slate-400 text-xs font-mono">Sense → Detect → Understand → Predict → Act</span>
              <span className="text-slate-500 text-xs font-mono hidden md:inline">•</span>
              <span className="text-emerald-400 text-xs font-mono hidden md:inline">Last telemetry sync: live</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Industrial Predictive Maintenance Intelligence
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              MaintenX continuously analyzes multi-sensor machine telemetry, isolates anomalous vibration and thermal gradients, calculates transparent failure risk, and prescribes prioritized maintenance actions before breakdown occurs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/simulation">
              <Button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-lg shadow-amber-500/20 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 mr-1.5" />
                Launch 3-Min Hackathon Demo
              </Button>
            </Link>
            <Link href="/fleet">
              <Button variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs sm:text-sm">
                Inspect All Machines
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Fleet Health KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Monitored Machines */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider font-mono">Monitored Assets</span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white">
                {summaryQuery.isLoading ? "..." : summary?.totalMachines || 0}
              </span>
              <span className="text-xs text-slate-400 font-mono">Active Units</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center space-x-1 pt-1 border-t border-slate-800/80">
              <span className="text-emerald-400 font-medium">100% Ingesting</span>
              <span>• AI4I & Motor Benchmarks</span>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Health Average */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider font-mono">Avg Fleet Health</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                {summaryQuery.isLoading ? "..." : `${summary?.avgHealthScore || 0}%`}
              </span>
              <span className="text-xs text-slate-400 font-mono">Condition Index</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span>{summary?.healthyMachines || 0} in optimal condition</span>
              <span className="text-emerald-400">ISO 10816 Zone A/B</span>
            </div>
          </CardContent>
        </Card>

        {/* Machines Requiring Attention with heightened contrast */}
        <Card className={`border-slate-800 transition-all ${
          (summary?.criticalMachines || 0) > 0 
            ? "bg-red-500/10 border-red-500/40 shadow-sm shadow-red-950/30" 
            : (summary?.attentionRequired || 0) > 0 
            ? "bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-950/20" 
            : "bg-slate-900/90"
        }`}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider font-mono">Requires Attention</span>
              <AlertTriangle className={`w-4 h-4 ${(summary?.criticalMachines || 0) > 0 ? "text-red-400" : "text-amber-400"}`} />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl sm:text-3xl font-bold font-mono ${(summary?.criticalMachines || 0) > 0 ? "text-red-400" : "text-amber-400"}`}>
                {summaryQuery.isLoading ? "..." : summary?.attentionRequired || 0}
              </span>
              <span className="text-xs text-slate-400 font-mono">Flagged Machines</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-amber-400 font-medium">{summary?.warningMachines || 0} Warning</span>
              <span className="text-red-400 font-medium">{summary?.criticalMachines || 0} Critical Risk</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts & Maintenance Due */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider font-mono">Active Alerts / Work</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-red-400">
                {summaryQuery.isLoading ? "..." : summary?.activeAlerts || 0}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ {summary?.pendingMaintenance || 0} Work Orders</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
              <Link href="/alerts" className="text-amber-400 hover:underline">
                Review alert queue →
              </Link>
              <Link href="/maintenance" className="text-slate-400 hover:text-slate-200">
                Work Orders
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Primary Section: Prioritization Table "Which machine should I inspect first?" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Prioritized Machine Inspection Queue */}
        <Card className="lg:col-span-2 bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
                <span>Machine Inspection Prioritization Queue</span>
                <span className="text-xs font-mono font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Priority Ranked
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-1">
                Answering the frontline question: <em>"Which machine should I inspect first and why?"</em>
              </CardDescription>
            </div>
            <Link href="/fleet">
              <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-white">
                View Fleet <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-4 font-semibold">Priority & Asset</th>
                  <th className="py-2.5 px-3 font-semibold">Condition Status</th>
                  <th className="py-2.5 px-3 font-semibold">Estimated Failure Risk</th>
                  <th className="py-2.5 px-3 font-semibold">Primary Deviations</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {prioritizedMachines.slice(0, 5).map((m, idx) => {
                  const risk = m.riskAssessment;
                  const isHigh = risk.riskCategory === "CRITICAL" || risk.riskCategory === "HIGH";

                  return (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isHigh ? "bg-red-500/[0.02]" : ""
                      }`}
                    >
                      {/* Priority Rank & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[11px] ${
                            idx === 0 && isHigh ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                            idx === 1 && isHigh ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <Link href={`/machine/${m.id}`} className="font-semibold text-slate-100 hover:text-amber-400 transition-colors">
                              {m.name}
                            </Link>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {m.id} • {m.area}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <StatusPill status={m.status} />
                      </td>

                      {/* Risk */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <RiskPill category={risk.riskCategory} pct={risk.estimatedRiskPct} />
                          <div className="text-[10px] text-slate-400 font-mono">
                            Health: <strong className="text-slate-300">{risk.healthScorePct}%</strong>
                          </div>
                        </div>
                      </td>

                      {/* Contributing signals */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="space-y-0.5">
                          {risk.contributingSignals.length > 0 ? (
                            risk.contributingSignals.slice(0, 2).map((sig, i) => (
                              <div key={i} className="text-[11px] text-slate-300 truncate">
                                <span className="text-amber-400 font-medium font-mono">{sig.signal}:</span> {sig.observedValue}
                              </div>
                            ))
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-mono">All signals within nominal bounds</span>
                          )}
                        </div>
                      </td>

                      {/* Link to detail */}
                      <td className="py-3 px-4 text-right">
                        <Link href={`/machine/${m.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 hover:bg-slate-800 hover:text-amber-400">
                            Diagnose
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Right Col: Risk Distribution & Visual Fleet Split */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-800">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span>Fleet Risk Distribution</span>
              <BarChart3 className="w-4 h-4 text-slate-400" />
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Condition breakdown across {fleet.length} monitored industrial assets
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            
            {/* Distribution Bars */}
            <div className="space-y-3">
              {riskDistributionData.map((d) => {
                const total = fleet.length || 1;
                const pct = Math.round((d.value / total) * 100);
                return (
                  <div key={d.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                        <span>{d.name}</span>
                      </span>
                      <span className="text-slate-400">
                        <strong className="text-white">{d.value}</strong> units ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanatory Industrial Note */}
            <div className="p-3 bg-slate-950/80 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Deterministic Scoring Standard</span>
              </div>
              <p>
                Risk calculations adhere to ISO 10816 vibration severity limits and AI4I thermal/mechanical boundary models. Does not extrapolate fabricated neural certainty.
              </p>
            </div>

            {/* Quick Demo Replay Trigger */}
            <div className="pt-2">
              <Link href="/simulation">
                <Button variant="outline" className="w-full text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Test Live Machine Failure Progression
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Active Alerts Stream & Maintenance Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Alerts */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
                <span>Active Anomaly Alerts</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
                  {alerts.filter(a => a.status === "New" || a.status === "Acknowledged").length} Active
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Multi-sensor triggers requiring operator acknowledgement
              </CardDescription>
            </div>
            <Link href="/alerts">
              <Button variant="ghost" size="sm" className="text-xs text-slate-300">
                All Alerts →
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-slate-800">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="p-4 hover:bg-slate-800/40 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <RiskPill category={alert.riskCategory} />
                    <span className="text-xs font-bold text-white">{alert.machineName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({alert.machineId})</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium">
                  {alert.issue}
                </p>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400 font-mono">
                    Trigger: <span className="text-amber-400">{alert.detectedParameter}</span>
                  </span>
                  <Link href={`/machine/${alert.machineId}`} className="text-amber-400 hover:underline">
                    View telemetry →
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Maintenance Actions & Work Orders */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
                <span>Maintenance Work Orders</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  {maintenance.filter(m => m.status === "Scheduled" || m.status === "In Progress").length} Pending
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 mt-0.5">
                Connecting predictive anomalies to field inspections
              </CardDescription>
            </div>
            <Link href="/maintenance">
              <Button variant="ghost" size="sm" className="text-xs text-slate-300">
                Workspace →
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-slate-800">
            {maintenance.slice(0, 3).map((wo) => (
              <div key={wo.id} className="p-4 hover:bg-slate-800/40 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {wo.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-100">{wo.machineName}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    wo.status === "In Progress" ? "bg-amber-500/20 text-amber-300" :
                    wo.status === "Completed" ? "bg-emerald-500/20 text-emerald-300" :
                    "bg-slate-800 text-slate-300"
                  }`}>
                    {wo.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  {wo.title}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tech: <strong className="text-slate-300">{wo.assignedTechnician}</strong></span>
                  <span>Est. Downtime: <strong className="text-slate-300">{wo.estimatedDowntimeHours}h</strong></span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
