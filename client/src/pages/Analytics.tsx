import React from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { BarChart3, Activity, Clock3, TimerReset, Wrench, AlertTriangle, Info, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const metricCards = [
  { key: "availabilityPct", label: "Availability", suffix: "%", icon: Activity, color: "text-emerald-400" },
  { key: "mtbfHours", label: "MTBF", suffix: " h", icon: Clock3, color: "text-sky-400" },
  { key: "mttrHours", label: "MTTR", suffix: " h", icon: TimerReset, color: "text-amber-400" },
  { key: "downtimeHours30d", label: "Downtime / 30d", suffix: " h", icon: AlertTriangle, color: "text-red-400" },
  { key: "failureFrequency30d", label: "Failure Events / 30d", suffix: "", icon: Wrench, color: "text-orange-400" },
  { key: "maintenanceCost30d", label: "Maintenance Cost / 30d", prefix: "$", suffix: "", icon: BarChart3, color: "text-purple-400" },
] as const;

export default function Analytics() {
  const metricsQuery = trpc.analytics.getPlantMetrics.useQuery();
  const metrics = metricsQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Plant Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Useful operational metrics for the complete asset-health picture.</p>
        </div>
        <Link href="/fleet">
          <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs">Open Fleet Monitor</Button>
        </Link>
      </div>

      <div className="p-3 rounded border border-amber-500/30 bg-amber-500/5 text-xs text-amber-200 flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
        <span>{metrics?.dataBasis || "Plant metrics are loading…"}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          const value = metrics?.[card.key] as number | undefined;
          return (
            <Card key={card.key} className="bg-slate-900/90 border-slate-800">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-mono uppercase tracking-wider">{card.label}</span>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className={`text-2xl font-bold font-mono ${card.color}`}>
                  {value === undefined ? "…" : `${"prefix" in card ? card.prefix : ""}${value.toLocaleString()}${card.suffix || ""}`}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Prototype metric</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-800">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-400" />Health & risk trend</CardTitle>
            <CardDescription className="text-xs text-slate-400">Current fleet state replayed as a short plant trend.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.trend || []} margin={{ left: -18, right: 10, top: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "#020617", borderColor: "#334155" }} />
                  <Line type="monotone" dataKey="health" name="Health score" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="risk" name="Estimated risk" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-800">
            <CardTitle className="text-base font-bold text-white">Decision metrics</CardTitle>
            <CardDescription className="text-xs text-slate-400">What the engineer needs to know at plant level.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Average fleet health</span><strong className="font-mono text-emerald-400">{metrics?.averageHealth ?? "…"}/100</strong></div>
            <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Average estimated risk</span><strong className="font-mono text-amber-400">{metrics?.averageRisk ?? "…"}%</strong></div>
            <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Critical assets</span><strong className="font-mono text-red-400">{metrics?.criticalAssets ?? "…"}</strong></div>
            <div className="flex items-center justify-between text-xs"><span className="text-slate-400">High-risk assets</span><strong className="font-mono text-orange-400">{metrics?.highRiskAssets ?? "…"}</strong></div>
            <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Active alerts</span><strong className="font-mono text-red-400">{metrics?.activeAlerts ?? "…"}</strong></div>
            <div className="flex items-center justify-between text-xs"><span className="text-slate-400">Open work orders</span><strong className="font-mono text-sky-400">{metrics?.openWorkOrders ?? "…"}</strong></div>
            <div className="mt-4 p-3 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              MTBF, MTTR, availability, downtime, and maintenance cost are currently **simulated demo metrics** because production history and cost ledger records are not connected yet.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
