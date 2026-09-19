import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import { 
  ArrowLeft, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Wrench, 
  Clock, 
  Cpu, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  Thermometer, 
  Zap, 
  RotateCw, 
  FileCheck2,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskPill, StatusPill } from "@/components/RiskPill";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { toast } from "sonner";

export default function MachineDetail() {
  const [, params] = useRoute("/machine/:id");
  const machineId = params?.id || "MTR-101";

  const machineQuery = trpc.fleet.getById.useQuery({ id: machineId }, {
    refetchInterval: 5000
  });

  const [activeTab, setActiveTab] = useState<"vibration" | "thermal" | "mechanical">("vibration");
  const [isSimulating, setIsSimulating] = useState(false);

  const triggerSimMutation = trpc.simulation.triggerStep.useMutation({
    onSuccess: (data) => {
      toast.success(`Simulated ${data.stage} state on ${machineId}`);
      machineQuery.refetch();
    }
  });

  if (machineQuery.isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Activity className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
        <p className="text-sm text-slate-400 font-mono">Loading telemetry stream for {machineId}...</p>
      </div>
    );
  }

  if (!machineQuery.data?.machine) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Machine Not Found</h2>
        <p className="text-sm text-slate-400">Asset identifier {machineId} was not located in fleet inventory.</p>
        <Link href="/fleet">
          <Button variant="outline" className="border-slate-700 text-slate-200">Return to Fleet</Button>
        </Link>
      </div>
    );
  }

  const { machine, alerts, workOrders } = machineQuery.data;
  const t = machine.currentTelemetry;
  const r = machine.riskAssessment;

  // Format historical trend data for recharts
  const chartData = machine.telemetryHistory.map(pt => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    vibration: pt.vibrationRmsMmS,
    tempDiff: pt.tempDiffC,
    processTemp: pt.processTempC,
    torque: pt.torqueNm,
    speed: pt.rotationalSpeedRpm,
    wear: pt.toolWearMin
  }));

  const handleSimulate = (stage: "healthy" | "warning" | "high_risk" | "critical") => {
    setIsSimulating(true);
    triggerSimMutation.mutate({ machineId: machine.id, stage });
    setTimeout(() => setIsSimulating(false), 600);
  };

  return (
    <div className="space-y-6">
      
      {/* Back breadcrumb and quick title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/fleet" className="inline-flex items-center text-xs text-slate-400 hover:text-amber-400 transition-colors mb-1 font-mono">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Fleet Monitoring
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {machine.name}
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
              {machine.id}
            </span>
            <StatusPill status={machine.status} />
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Serial: {machine.serialNumber} • Type: {machine.type} • Bay: {machine.area}
          </p>
        </div>

        {/* Live Simulation Controls for Evaluators */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-lg">
          <span className="text-[10px] font-mono text-slate-400 px-2 font-bold uppercase tracking-wider">
            Simulate Stage:
          </span>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleSimulate("healthy")}
            className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            Normal
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleSimulate("warning")}
            className="h-7 text-xs text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
          >
            Warning
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleSimulate("high_risk")}
            className="h-7 text-xs text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
          >
            High Risk
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleSimulate("critical")}
            className="h-7 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            Critical
          </Button>
        </div>
      </div>

      {/* Top Machine Status & Explainability Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Failure Risk & Health Score */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 border-b border-slate-800 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Condition Assessment
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Transparent multi-sensor scoring
              </CardDescription>
            </div>
            <RiskPill category={r.riskCategory} pct={r.estimatedRiskPct} />
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold font-mono text-white">
                  {r.estimatedRiskPct}%
                </div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">Estimated Failure Risk</div>
              </div>

              <div className="text-right">
                <div className={`text-2xl font-bold font-mono ${
                  r.healthScorePct < 50 ? "text-red-400" :
                  r.healthScorePct < 75 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {r.healthScorePct}%
                </div>
                <div className="text-[11px] text-slate-400 uppercase font-mono">Asset Health Score</div>
              </div>
            </div>

            {/* Health Score Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  r.healthScorePct < 50 ? "bg-red-500" :
                  r.healthScorePct < 75 ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${r.healthScorePct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <div>Anomaly Score: <strong className="text-slate-200">{r.anomalyScore.toFixed(2)}</strong></div>
              <div>Confidence: <strong className="text-slate-200">{r.confidencePct}%</strong></div>
              <div>Urgency: <strong className={r.urgency.includes("Immediate") ? "text-red-400" : "text-slate-200"}>{r.urgency.split(" ")[0]}</strong></div>
              <div>Data Mode: <strong className="text-amber-400">{machine.dataSource}</strong></div>
            </div>
          </CardContent>
        </Card>

        {/* Center & Right Card: Explanation & Recommended Maintenance Action */}
        <Card className="lg:col-span-2 bg-slate-900/90 border-slate-800 flex flex-col justify-between">
          <CardHeader className="p-4 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Transparent Multi-Signal Diagnosis</span>
              </span>
              <span className="text-xs font-mono font-normal text-slate-400">
                Inspection Target: <strong className="text-amber-300">{r.recommendedInspectionType}</strong>
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 space-y-3.5">
            {/* Plain-English Explanation */}
            <div className="p-3 bg-slate-950/80 rounded border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wide font-mono flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Why Was This Machine Flagged?</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                {r.explanation}
              </p>
            </div>

            {/* Recommended Action */}
            <div className="p-3 bg-amber-500/5 rounded border border-amber-500/30 space-y-1">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wide font-mono flex items-center space-x-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Recommended Maintenance Action</span>
              </div>
              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                {r.recommendedAction}
              </p>
            </div>

            {/* Contributing factors tags */}
            {r.contributingSignals.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                  Contributing Physical Deviations:
                </span>
                <div className="flex flex-wrap gap-2">
                  {r.contributingSignals.map((sig, i) => (
                    <div key={i} className="px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs">
                      <span className="font-semibold text-amber-300">{sig.signal}:</span>{" "}
                      <span className="text-slate-200 font-mono">{sig.observedValue}</span>{" "}
                      <span className="text-[10px] text-slate-400 font-mono">(Nominal: {sig.nominalRange})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Current Real-time Sensor Grid (ISO vibration, thermal, torque, wear, power) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Vibration */}
        <Card className={`border-slate-800 ${t.vibrationRmsMmS > 4.5 ? "bg-red-500/10 border-red-500/30" : "bg-slate-900/80"}`}>
          <CardContent className="p-3 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Vibration</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono-num">
              {t.vibrationRmsMmS.toFixed(2)} <span className="text-xs font-normal text-slate-400">mm/s</span>
            </div>
            <div className="text-[10px] text-slate-400">ISO 10816 Zone</div>
          </CardContent>
        </Card>

        {/* Process Temp & Differential */}
        <Card className={`border-slate-800 ${t.tempDiffC > 12.0 ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-900/80"}`}>
          <CardContent className="p-3 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Thermal ΔT</span>
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono-num">
              Δ {t.tempDiffC.toFixed(1)} <span className="text-xs font-normal text-slate-400">°C</span>
            </div>
            <div className="text-[10px] text-slate-400">Proc: {t.processTempC.toFixed(1)}°C</div>
          </CardContent>
        </Card>

        {/* Speed */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-3 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Shaft Speed</span>
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono-num">
              {t.rotationalSpeedRpm.toFixed(0)} <span className="text-xs font-normal text-slate-400">RPM</span>
            </div>
            <div className="text-[10px] text-slate-400">Drive Rating</div>
          </CardContent>
        </Card>

        {/* Torque */}
        <Card className={`border-slate-800 ${t.torqueNm > 58.0 ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-900/80"}`}>
          <CardContent className="p-3 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Spindle Torque</span>
              <Zap className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono-num">
              {t.torqueNm.toFixed(1)} <span className="text-xs font-normal text-slate-400">Nm</span>
            </div>
            <div className="text-[10px] text-slate-400">Overstrain Index</div>
          </CardContent>
        </Card>

        {/* Tool Wear */}
        <Card className={`border-slate-800 ${t.toolWearMin > 210 ? "bg-red-500/10 border-red-500/30" : "bg-slate-900/80"}`}>
          <CardContent className="p-3 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Tool Wear</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono-num">
              {t.toolWearMin} <span className="text-xs font-normal text-slate-400">min</span>
            </div>
            <div className="text-[10px] text-slate-400">Limit: 240 min</div>
          </CardContent>
        </Card>

        {/* Power */}
        <Card className="bg-slate-900/80 border-slate-800">
          <CardContent className="p-3 space-y-1 font-mono">
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <span>Motor Power</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono-num">
              {t.powerKw.toFixed(2)} <span className="text-xs font-normal text-slate-400">kW</span>
            </div>
            <div className="text-[10px] text-slate-400">Eff: {t.efficiencyPct || 92}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Telemetry Chart & Trend Analysis */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>24-Hour Telemetry Trend & Sensor Drift</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Correlating sensor progression with failure threshold boundaries
            </CardDescription>
          </div>

          {/* Chart View Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setActiveTab("vibration")}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === "vibration" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Vibration (ISO 10816)
            </button>
            <button
              onClick={() => setActiveTab("thermal")}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === "thermal" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Thermal Gradient (ΔT)
            </button>
            <button
              onClick={() => setActiveTab("mechanical")}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === "mechanical" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Torque & Wear
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "vibration" ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 8]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "6px" }}
                    labelStyle={{ color: "#94a3b8", fontFamily: "monospace" }}
                  />
                  <Area type="monotone" dataKey="vibration" name="Vibration RMS (mm/s)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorVib)" />
                </AreaChart>
              ) : activeTab === "thermal" ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[5, 18]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "6px" }}
                    labelStyle={{ color: "#94a3b8", fontFamily: "monospace" }}
                  />
                  <Area type="monotone" dataKey="tempDiff" name="Thermal Gradient ΔT (°C)" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "6px" }}
                    labelStyle={{ color: "#94a3b8", fontFamily: "monospace" }}
                  />
                  <Line type="monotone" dataKey="torque" name="Torque (Nm)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="wear" name="Tool Wear (min)" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Machine Associated Alerts and Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Alerts for this machine */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Machine Anomaly History ({alerts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-800">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No active anomaly triggers logged for this asset.
              </div>
            ) : (
              alerts.map(a => (
                <div key={a.id} className="p-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-amber-400 font-bold">{a.id}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(a.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-slate-200 font-semibold">{a.issue}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Trigger: <strong className="text-slate-300 font-mono">{a.detectedParameter}</strong></span>
                    <span className="font-mono text-amber-400">{a.status}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Maintenance Actions for this machine */}
        <Card className="bg-slate-900/90 border-slate-800">
          <CardHeader className="p-4 border-b border-slate-800">
            <CardTitle className="text-sm font-bold text-white flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-sky-400" />
              <span>Maintenance Records ({workOrders.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-800">
            {workOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                No maintenance work orders currently linked to this machine.
              </div>
            ) : (
              workOrders.map(w => (
                <div key={w.id} className="p-4 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sky-400 font-bold">{w.id}</span>
                    <span className="font-mono text-[10px] text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-800">
                      {w.status}
                    </span>
                  </div>
                  <p className="text-slate-200 font-semibold">{w.title}</p>
                  <p className="text-[11px] text-slate-400">{w.procedureNotes}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Assigned: <strong className="text-slate-300">{w.assignedTechnician}</strong></span>
                    <span>Downtime: <strong className="text-slate-300">{w.estimatedDowntimeHours}h</strong></span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
