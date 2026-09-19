import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  PlayCircle, 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCcw, 
  RotateCcw,
  Cpu,
  Layers,
  Wrench,
  Thermometer,
  Zap,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskPill, StatusPill } from "@/components/RiskPill";
import { toast } from "sonner";

export default function SimulationDemo() {
  const fleetQuery = trpc.fleet.list.useQuery();
  const fleet = fleetQuery.data || [];

  const [selectedMachineId, setSelectedMachineId] = useState<string>("MTR-101");
  const [currentStage, setCurrentStage] = useState<"healthy" | "warning" | "high_risk" | "critical">("healthy");
  const [demoStep, setDemoStep] = useState<number>(1);

  const selectedMachine = fleet.find(m => m.id === selectedMachineId) || fleet[0];

  const triggerSimMutation = trpc.simulation.triggerStep.useMutation({
    onSuccess: (data) => {
      fleetQuery.refetch();
    }
  });

  const resetFleetMutation = trpc.simulation.resetFleet.useMutation({
    onSuccess: () => {
      toast.success("Fleet telemetry reset to initial benchmark state");
      fleetQuery.refetch();
    }
  });

  const handleStageTransition = (stage: "healthy" | "warning" | "high_risk" | "critical") => {
    setCurrentStage(stage);
    if (selectedMachine) {
      triggerSimMutation.mutate({
        machineId: selectedMachine.id,
        stage
      });
      toast.success(`Transitioned ${selectedMachine.name} to ${stage.toUpperCase()}`);
    }
  };

  const steps = [
    {
      num: 1,
      title: "1. Sense (Normal Operation)",
      desc: "Machine operates with vibration < 2.8 mm/s and thermal gradient < 10°C.",
      stage: "healthy" as const
    },
    {
      num: 2,
      title: "2. Detect (Sensor Drift & Anomaly)",
      desc: "Bearing micro-pitting raises vibration to ISO Zone C (3.35 mm/s); thermal gradient rises.",
      stage: "warning" as const
    },
    {
      num: 3,
      title: "3. Predict & Understand (High Risk)",
      desc: "MaintenX isolates multi-signal deviation, explains physical coupling, calculates 58% failure risk.",
      stage: "high_risk" as const
    },
    {
      num: 4,
      title: "4. Act (Alert & Maintenance)",
      desc: "Critical risk (>75%) triggers operator alert, prioritzes machine #1, and generates targeted work order.",
      stage: "critical" as const
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
            <PlayCircle className="w-6 h-6 text-amber-400" />
            <span>Interactive Evaluator Demo (2–3 Min Hackathon Walkthrough)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Experience the complete closed-loop workflow: Sense → Detect → Understand → Predict → Act
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => resetFleetMutation.mutate()}
            className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Fleet State
          </Button>
        </div>
      </div>

      {/* Target Asset Selection Bar */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400 uppercase font-semibold">Select Asset to Test:</span>
            <select
              value={selectedMachineId}
              onChange={(e) => setSelectedMachineId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded px-3 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
            >
              {fleet.map(m => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.name} ({m.type.split(" ")[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span>Current Status:</span>
            {selectedMachine && <StatusPill status={selectedMachine.status} />}
            {selectedMachine && <RiskPill category={selectedMachine.riskAssessment.riskCategory} pct={selectedMachine.riskAssessment.estimatedRiskPct} />}
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Interactive Workflow Progression Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((st) => {
          const isCurrent = currentStage === st.stage;

          return (
            <button
              key={st.num}
              onClick={() => handleStageTransition(st.stage)}
              className={`p-4 rounded-lg text-left border transition-all text-xs flex flex-col justify-between space-y-2.5 ${
                isCurrent 
                  ? "bg-amber-500/15 border-amber-500 shadow-md shadow-amber-950/20" 
                  : "bg-slate-900/80 border-slate-800 hover:bg-slate-900 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`font-mono font-bold text-xs ${isCurrent ? "text-amber-400" : "text-slate-400"}`}>
                    {st.title}
                  </span>
                  {isCurrent && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-normal font-sans">
                  {st.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Click to Trigger</span>
                <span className={`font-bold uppercase ${
                  st.stage === "critical" ? "text-red-400" :
                  st.stage === "high_risk" ? "text-amber-400" :
                  st.stage === "warning" ? "text-yellow-400" : "text-emerald-400"
                }`}>
                  → {st.stage}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live System Response Display */}
      {selectedMachine && (
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-800">
            <CardTitle className="text-base font-bold text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Live System Response on {selectedMachine.name} ({selectedMachine.id})</span>
              </span>
              <Link href={`/machine/${selectedMachine.id}`}>
                <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-slate-200">
                  Open Deep Dive Page
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            
            {/* Live Telemetry Values */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase">Vibration (ISO 10816)</span>
                <div className={`text-base font-bold mt-0.5 ${
                  selectedMachine.currentTelemetry.vibrationRmsMmS > 4.5 ? "text-red-400" :
                  selectedMachine.currentTelemetry.vibrationRmsMmS > 2.8 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {selectedMachine.currentTelemetry.vibrationRmsMmS.toFixed(2)} mm/s RMS
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase">Thermal Gradient</span>
                <div className="text-base font-bold mt-0.5 text-white">
                  Δ {selectedMachine.currentTelemetry.tempDiffC.toFixed(1)}°C
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase">Calculated Failure Risk</span>
                <div className="text-base font-bold mt-0.5 text-amber-400">
                  {selectedMachine.riskAssessment.estimatedRiskPct}% ({selectedMachine.riskAssessment.riskCategory})
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase">Active Alerts</span>
                <div className="text-base font-bold mt-0.5 text-white">
                  {selectedMachine.activeAlertCount} Triggered
                </div>
              </div>
            </div>

            {/* Synthesized System Explanation */}
            <div className="p-3.5 bg-slate-950 rounded border border-slate-800 space-y-1.5 text-xs">
              <div className="font-mono text-amber-400 font-bold uppercase flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>Multi-Signal Explanation Generated by MaintenX:</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-sans">
                {selectedMachine.riskAssessment.explanation}
              </p>
            </div>

            {/* Recommended Action */}
            <div className="p-3 bg-amber-500/10 rounded border border-amber-500/30 text-xs space-y-1">
              <div className="font-mono text-amber-300 font-bold uppercase flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Recommended Action:</span>
              </div>
              <p className="text-slate-200 font-medium">
                {selectedMachine.riskAssessment.recommendedAction}
              </p>
            </div>

            {/* Navigation links to view action impact across other modules */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">Observe downstream in:</span>
              <Link href="/" className="text-amber-400 hover:underline">
                → Overview Queue
              </Link>
              <Link href="/alerts" className="text-amber-400 hover:underline">
                → Alert Center
              </Link>
              <Link href="/maintenance" className="text-amber-400 hover:underline">
                → Maintenance Workspace
              </Link>
            </div>

          </CardContent>
        </Card>
      )}

    </div>
  );
}
