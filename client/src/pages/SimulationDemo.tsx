import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { PlayCircle, Sparkles, Activity, Wrench, RotateCcw, Cpu, TimerReset, ArrowRight, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskPill, StatusPill } from "@/components/RiskPill";
import { toast } from "sonner";

type Stage = "healthy" | "warning" | "high_risk" | "critical";
type Scenario = "maintenance" | "no-maintenance";

export default function SimulationDemo() {
  const fleetQuery = trpc.fleet.list.useQuery();
  const fleet = fleetQuery.data || [];
  const [selectedMachineId, setSelectedMachineId] = useState("MTR-101");
  const [currentStage, setCurrentStage] = useState<Stage>("healthy");
  const [scenario, setScenario] = useState<Scenario>("no-maintenance");
  const selectedMachine = fleet.find((machine) => machine.id === selectedMachineId) || fleet[0];
  const scenarioQuery = trpc.simulation.whatIf.useQuery({ machineId: selectedMachineId, scenario }, { enabled: Boolean(selectedMachineId) });

  const triggerSimMutation = trpc.simulation.triggerStep.useMutation({ onSuccess: () => fleetQuery.refetch() });
  const resetMutation = trpc.simulation.resetFleet.useMutation({ onSuccess: () => { toast.success("Fleet replay reset to initial state"); fleetQuery.refetch(); setCurrentStage("healthy"); } });
  const completeMutation = trpc.maintenance.updateStatus.useMutation({ onSuccess: (workOrder) => { toast.success(`${workOrder.id} completed; asset condition recalculated`); fleetQuery.refetch(); } });

  const steps: Array<{ stage: Stage; label: string; description: string; health: string }> = [
    { stage: "healthy", label: "01 — NORMAL", description: "Plant operating normally; telemetry stays within nominal bounds.", health: "Health 91 → stable" },
    { stage: "warning", label: "02 — SENSOR REPLAY", description: "Vibration slowly rises into a watch band; anomaly evidence appears.", health: "Health 91 → 84" },
    { stage: "high_risk", label: "03 — PREDICTIVE INSIGHT", description: "Combined vibration and thermal drift increases failure risk.", health: "Health 84 → 68" },
    { stage: "critical", label: "04 — RECOMMENDATION", description: "Critical risk creates an alert and prioritizes a targeted inspection.", health: "Action required" },
  ];

  const triggerStage = (stage: Stage) => {
    setCurrentStage(stage);
    if (selectedMachine) {
      triggerSimMutation.mutate({ machineId: selectedMachine.id, stage });
      toast.success(`${selectedMachine.id} transitioned to ${stage.replace("_", " ")}`);
    }
  };

  if (!selectedMachine) return <div className="py-20 text-center text-slate-400">Loading simulation fleet…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5"><PlayCircle className="w-6 h-6 text-amber-400" />Interactive Evaluator Demo</h1><p className="text-sm text-slate-400 mt-1">A coherent 2–3 minute story: normal → replay → insight → recommendation → maintenance outcome.</p></div><Button variant="outline" size="sm" onClick={() => resetMutation.mutate()} className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs"><RotateCcw className="w-3.5 h-3.5 mr-1.5" />Reset replay</Button></div>

      <Card className="bg-slate-900/90 border-slate-800"><CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="text-xs font-mono text-slate-400 uppercase font-semibold">Select asset</span><select value={selectedMachineId} onChange={(event) => setSelectedMachineId(event.target.value)} className="bg-slate-950 border border-slate-800 text-xs rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500">{fleet.map((machine) => <option key={machine.id} value={machine.id}>{machine.id} — {machine.name}</option>)}</select></div><div className="flex items-center gap-2 text-xs font-mono text-slate-400">Current: <StatusPill status={selectedMachine.status} /><RiskPill category={selectedMachine.riskAssessment.riskCategory} pct={selectedMachine.riskAssessment.estimatedRiskPct} /></div></CardContent></Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{steps.map((step) => <button key={step.stage} onClick={() => triggerStage(step.stage)} className={`p-4 rounded-lg text-left border transition-all ${currentStage === step.stage ? "bg-amber-500/15 border-amber-500 shadow-md shadow-amber-950/20" : "bg-slate-900/80 border-slate-800 hover:bg-slate-900"}`}><div className="flex items-center justify-between"><span className={`font-mono font-bold text-xs ${currentStage === step.stage ? "text-amber-400" : "text-slate-300"}`}>{step.label}</span>{currentStage === step.stage && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}</div><p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{step.description}</p><div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">{step.health}</div></button>)}</div>

      <Card className="bg-slate-900/90 border-slate-800"><CardHeader className="p-4 sm:p-5 border-b border-slate-800"><CardTitle className="text-base font-bold text-white flex items-center justify-between"><span className="flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" />Live system response — {selectedMachine.name}</span><Link href={`/machine/${selectedMachine.id}`}><Button size="sm" variant="outline" className="h-7 text-xs border-slate-700">Open machine twin</Button></Link></CardTitle><CardDescription className="text-xs text-slate-400">The replay changes machine state, risk, digital twin, and downstream alerts together.</CardDescription></CardHeader><CardContent className="p-4 sm:p-5 space-y-4"><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[{ label: "Health score", value: `${selectedMachine.riskAssessment.healthScorePct}/100`, tone: "text-emerald-400" }, { label: "Vibration", value: `${selectedMachine.currentTelemetry.vibrationRmsMmS.toFixed(2)} mm/s`, tone: "text-amber-400" }, { label: "Failure risk", value: `${selectedMachine.riskAssessment.estimatedRiskPct}%`, tone: "text-red-400" }, { label: "Probable issue", value: selectedMachine.riskAssessment.probableFaults[0]?.label || "None", tone: "text-sky-300" }].map((metric) => <div key={metric.label} className="p-3 bg-slate-950 rounded border border-slate-800"><span className="text-[10px] text-slate-400 uppercase font-mono">{metric.label}</span><div className={`text-sm sm:text-base font-bold mt-1 ${metric.tone}`}>{metric.value}</div></div>)}</div><div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-200 leading-relaxed"><span className="font-mono text-amber-400 font-bold uppercase">MaintenX explanation: </span>{selectedMachine.riskAssessment.explanation}</div><div className="p-3 bg-amber-500/10 rounded border border-amber-500/30 text-xs"><div className="font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" />Recommended action</div><p className="text-slate-200 font-medium mt-1">{selectedMachine.riskAssessment.recommendedAction}</p></div></CardContent></Card>

      <Card className="bg-slate-900/90 border-amber-500/30"><CardHeader className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><CardTitle className="text-base font-bold text-white flex items-center gap-2"><TimerResetIcon />What-if maintenance simulator</CardTitle><CardDescription className="text-xs text-slate-400">Scenario analysis only — not a physically guaranteed prediction.</CardDescription></div><div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800"><button onClick={() => setScenario("no-maintenance")} className={`px-3 py-1.5 rounded text-xs font-mono ${scenario === "no-maintenance" ? "bg-red-500/20 text-red-300" : "text-slate-400"}`}>Simulate No Maintenance</button><button onClick={() => setScenario("maintenance")} className={`px-3 py-1.5 rounded text-xs font-mono ${scenario === "maintenance" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400"}`}>Simulate Maintenance</button></div></CardHeader><CardContent className="p-4 space-y-3"><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{(scenarioQuery.data?.points || []).map((point) => <div key={point.day} className="p-3 rounded bg-slate-950 border border-slate-800"><div className="text-[10px] font-mono text-slate-500">+{point.day} days</div><div className="text-xs font-mono text-slate-200 mt-1">Vibration {point.vibrationRmsMmS.toFixed(2)}</div><div className="text-xs font-mono text-amber-300">Risk {point.estimatedRiskPct}%</div><div className="text-xs font-mono text-emerald-300">Health {point.healthScorePct}</div></div>)}</div><div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs"><span className="font-semibold text-slate-100">Outcome: </span><span className={scenario === "maintenance" ? "text-emerald-300" : "text-red-300"}>{scenarioQuery.data?.outcome}</span></div><div className="text-[11px] text-slate-500 font-mono">{scenarioQuery.data?.disclaimer}</div></CardContent></Card>

      <Card className="bg-slate-900/90 border-slate-800"><CardHeader className="p-4 border-b border-slate-800"><CardTitle className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Completion step</CardTitle><CardDescription className="text-xs text-slate-400">Complete an existing in-progress work order to close the loop and restore asset health.</CardDescription></CardHeader><CardContent className="p-4 space-y-3">{selectedMachine.id && <div className="text-xs text-slate-300">Current asset work orders: <strong className="text-white">{fleetQuery.data?.find((machine) => machine.id === selectedMachine.id)?.activeAlertCount || 0} active alert(s)</strong>. Visit Maintenance to complete a work order and recalculate the machine state.</div>}<Link href="/maintenance"><Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"><Wrench className="w-3.5 h-3.5 mr-1.5" />Open Maintenance Center</Button></Link></CardContent></Card>
    </div>
  );
}

function TimerResetIcon() {
  return <TimerReset className="w-4 h-4 text-amber-400" />;
}
