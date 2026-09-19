import React from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Cpu, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle, 
  Wrench, 
  ChevronRight, 
  ShieldAlert, 
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskPill } from "@/components/RiskPill";

export default function PredictiveInsights() {
  const fleetQuery = trpc.fleet.list.useQuery();
  const fleet = fleetQuery.data || [];

  // Filter only machines with elevated risk
  const flaggedMachines = fleet
    .filter(m => m.riskAssessment.riskCategory !== "LOW")
    .sort((a, b) => b.riskAssessment.estimatedRiskPct - a.riskAssessment.estimatedRiskPct);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
            <Cpu className="w-6 h-6 text-amber-400" />
            <span>Predictive Insights & Explainability</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Transparent breakdown of why machines were flagged, contributing physical anomalies, and prescribed inspections
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/simulation">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Simulate Risk Transition
            </Button>
          </Link>
        </div>
      </div>

      {/* Transparent Methodology Guidance */}
      <Card className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-amber-500/20">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Industrial Explainability Standard
              </span>
              <span className="text-xs text-slate-400 font-mono">• No Black Boxes</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              MaintenX refuses to state arbitrary AI probabilities without engineering justification. Every failure risk percentage is explicitly decomposed into observed sensor deviations from ISO 10816 standards, thermal gradients, and mechanical load limits.
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-mono px-3 py-1 rounded bg-slate-950 text-slate-300 border border-slate-800">
              Flagged Assets: <strong className="text-amber-400">{flaggedMachines.length}</strong> of {fleet.length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Flagged Machines List */}
      <div className="space-y-4">
        {flaggedMachines.length === 0 ? (
          <Card className="bg-slate-900/90 border-slate-800 p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h2 className="text-base font-bold text-white">All Monitored Fleet Assets in Optimal Condition</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No machines are currently trending above nominal operational thresholds. Launch the interactive demo to simulate condition drift.
            </p>
            <Link href="/simulation">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs">
                Run Simulation Demonstration
              </Button>
            </Link>
          </Card>
        ) : (
          flaggedMachines.map((m, idx) => {
            const r = m.riskAssessment;
            const t = m.currentTelemetry;
            const isCritical = r.riskCategory === "CRITICAL";

            return (
              <Card 
                key={m.id}
                className={`border-slate-800 overflow-hidden ${
                  isCritical ? "bg-slate-900/95 border-red-500/40 shadow-lg shadow-red-950/20" : "bg-slate-900/90"
                }`}
              >
                {/* Header row */}
                <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40">
                  <div className="flex items-center space-x-3">
                    <span className={`w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs ${
                      isCritical ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                      "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/machine/${m.id}`} className="text-base font-bold text-white hover:text-amber-400 transition-colors">
                          {m.name}
                        </Link>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                          {m.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {m.type} • {m.area} • Ingestion Source: <strong className="text-slate-300">{m.dataSource}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <RiskPill category={r.riskCategory} pct={r.estimatedRiskPct} />
                    <Link href={`/machine/${m.id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs border-slate-700 hover:bg-slate-800 hover:text-amber-400">
                        Diagnostics Deep Dive <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Explanation Content */}
                <CardContent className="p-4 sm:p-5 space-y-4">
                  
                  {/* Diagnosis Box */}
                  <div className="p-3.5 bg-slate-950/80 rounded border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wide font-mono flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Synthesized Failure Risk Explanation:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                      {r.explanation}
                    </p>
                  </div>

                  {/* Multi-parameter contributing signals table/grid */}
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                      Individual Contributing Deviations ({r.contributingSignals.length}):
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {r.contributingSignals.map((sig, sIdx) => (
                        <div 
                          key={sIdx}
                          className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300">{sig.signal}</span>
                            <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-bold ${
                              sig.deviationLevel === "extreme" ? "bg-red-500/20 text-red-400" :
                              sig.deviationLevel === "severe" ? "bg-amber-500/20 text-amber-400" :
                              "bg-yellow-500/20 text-yellow-300"
                            }`}>
                              {sig.deviationLevel}
                            </span>
                          </div>

                          <div className="text-slate-300 font-mono text-[11px]">
                            Observed: <strong className="text-white">{sig.observedValue}</strong>
                          </div>
                          <div className="text-slate-500 font-mono text-[10px]">
                            Nominal Range: {sig.nominalRange}
                          </div>
                          <p className="text-[11px] text-slate-400 pt-1 line-clamp-2">
                            {sig.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prescribed Maintenance Recommendation */}
                  <div className="p-3 bg-amber-500/5 rounded border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-amber-300 uppercase tracking-wide font-mono flex items-center space-x-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Recommended Maintenance Action:</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">
                        {r.recommendedAction}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[11px] font-mono text-slate-400 block">Inspection Type</span>
                      <span className="text-xs font-bold text-slate-200 font-mono">{r.recommendedInspectionType}</span>
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })
        )}
      </div>

    </div>
  );
}
