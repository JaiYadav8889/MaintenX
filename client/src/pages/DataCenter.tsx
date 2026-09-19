import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { 
  Database, 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  ExternalLink, 
  Layers, 
  Cpu, 
  BookOpen, 
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskPill } from "@/components/RiskPill";
import { toast } from "sonner";

export default function DataCenter() {
  const catalogsQuery = trpc.datasets.listCatalogs.useQuery();
  const samplesQuery = trpc.datasets.getAI4ISamples.useQuery({ limit: 10, onlyFailures: false });

  const catalogs = catalogsQuery.data || [];
  const samples = samplesQuery.data || [];

  // Ingest sandbox form state
  const [machineId, setMachineId] = useState("MTR-102");
  const [airTempK, setAirTempK] = useState(298.5);
  const [processTempK, setProcessTempK] = useState(310.2);
  const [rpm, setRpm] = useState(1450);
  const [torqueNm, setTorqueNm] = useState(52.5);
  const [toolWearMin, setToolWearMin] = useState(195);
  const [vibrationMmS, setVibrationMmS] = useState(3.8);
  const [evaluatedResult, setEvaluatedResult] = useState<any>(null);

  const ingestMutation = trpc.datasets.ingestRecord.useMutation({
    onSuccess: (data) => {
      setEvaluatedResult(data);
      toast.success("Telemetry record parsed and scored via risk engine!");
    }
  });

  const handleRunEvaluation = () => {
    ingestMutation.mutate({
      machineId,
      airTempK,
      processTempK,
      rpm,
      torqueNm,
      toolWearMin,
      vibrationRmsMmS: vibrationMmS
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
          <Database className="w-6 h-6 text-amber-400" />
          <span>Industrial Datasets & Ingestion Pipeline</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Grounded in the UCI AI4I 2020 Predictive Maintenance Dataset and the Zenodo Electric Motor Vibrations Dataset
        </p>
      </div>

      {/* Dataset Catalog Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {catalogs.map(d => (
          <Card key={d.id} className="bg-slate-900/90 border-slate-800 flex flex-col justify-between">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                  {d.id}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {d.datasetStatus}
                </span>
              </div>
              <CardTitle className="text-base font-bold text-white mt-2">
                {d.title}
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Source: {d.source}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono text-slate-400">
                <div>Total Records: <strong className="text-white">{d.recordCount.toLocaleString()}</strong></div>
                <div>Format: <strong className="text-white">Continuous Time-series CSV</strong></div>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-slate-400 font-semibold uppercase text-[11px]">Primary Ingested Features:</span>
                <div className="flex flex-wrap gap-1.5">
                  {d.features.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-slate-400 font-semibold uppercase text-[11px]">Target Anomaly Modes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {d.targetVariables.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[11px]">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
                Academic Citation: {d.scientificReference}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Interactive Telemetry Ingestion & Scoring Sandbox */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-800">
          <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>Interactive Multi-Sensor Data Ingestion & Scoring Sandbox</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Feed raw Kelvin temperatures, RPM, torque, and ISO vibration to observe transparent real-time feature normalization and risk calculation
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Air Temp (K)</label>
              <Input
                type="number"
                step="0.1"
                value={airTempK}
                onChange={e => setAirTempK(parseFloat(e.target.value) || 298.0)}
                className="bg-slate-950 border-slate-800 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">≈ {(airTempK - 273.15).toFixed(1)}°C</span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Process Temp (K)</label>
              <Input
                type="number"
                step="0.1"
                value={processTempK}
                onChange={e => setProcessTempK(parseFloat(e.target.value) || 308.0)}
                className="bg-slate-950 border-slate-800 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">Δ {(processTempK - airTempK).toFixed(1)}°C</span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Speed (RPM)</label>
              <Input
                type="number"
                value={rpm}
                onChange={e => setRpm(parseFloat(e.target.value) || 1500)}
                className="bg-slate-950 border-slate-800 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">Drive Spindle</span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Torque (Nm)</label>
              <Input
                type="number"
                step="0.1"
                value={torqueNm}
                onChange={e => setTorqueNm(parseFloat(e.target.value) || 40)}
                className="bg-slate-950 border-slate-800 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">Load Rating</span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Tool Wear (min)</label>
              <Input
                type="number"
                value={toolWearMin}
                onChange={e => setToolWearMin(parseFloat(e.target.value) || 50)}
                className="bg-slate-950 border-slate-800 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">Max: 240 min</span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Vibration (mm/s)</label>
              <Input
                type="number"
                step="0.1"
                value={vibrationMmS}
                onChange={e => setVibrationMmS(parseFloat(e.target.value) || 1.8)}
                className="bg-slate-950 border-slate-800 text-xs font-mono text-white"
              />
              <span className="text-[10px] text-slate-500 font-mono">ISO 10816 RMS</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleRunEvaluation}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Ingest & Evaluate Telemetry
            </Button>
          </div>

          {/* Evaluation output result */}
          {evaluatedResult && (
            <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white font-mono">Evaluated Risk Result:</span>
                <RiskPill 
                  category={evaluatedResult.assessed.riskCategory} 
                  pct={evaluatedResult.assessed.estimatedRiskPct} 
                />
              </div>

              <div className="text-xs text-slate-200">
                <strong>Diagnosis:</strong> {evaluatedResult.assessed.explanation}
              </div>

              <div className="text-xs text-amber-300">
                <strong>Recommended Maintenance:</strong> {evaluatedResult.assessed.recommendedAction}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono text-slate-400">
                <div>Normalized Power: <strong className="text-white">{evaluatedResult.normalizedTelemetry.powerKw} kW</strong></div>
                <div>Normalized Temp ΔT: <strong className="text-white">{evaluatedResult.normalizedTelemetry.tempDiffC}°C</strong></div>
                <div>Anomaly Score: <strong className="text-white">{evaluatedResult.assessed.anomalyScore}</strong></div>
                <div>Health Score: <strong className="text-white">{evaluatedResult.assessed.healthScorePct}%</strong></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI4I Benchmark Telemetry Records Stream */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-800">
          <CardTitle className="text-base font-bold text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>AI4I 2020 Ground Truth Benchmark Sample (Sampled 10 Records)</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Real records from the 10,000-row predictive maintenance benchmark with failure modes
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono text-[11px]">
                <th className="py-2.5 px-4 font-semibold">Product ID</th>
                <th className="py-2.5 px-3 font-semibold">Tier</th>
                <th className="py-2.5 px-3 font-semibold">Air Temp (K)</th>
                <th className="py-2.5 px-3 font-semibold">Process Temp (K)</th>
                <th className="py-2.5 px-3 font-semibold">Rotational Speed</th>
                <th className="py-2.5 px-3 font-semibold">Torque (Nm)</th>
                <th className="py-2.5 px-3 font-semibold">Tool Wear</th>
                <th className="py-2.5 px-4 text-right font-semibold">Ground Truth Failure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {samples.map((row: any, i: number) => (
                <tr key={i} className={`hover:bg-slate-800/40 ${row.failed === 1 ? "bg-red-500/[0.04]" : ""}`}>
                  <td className="py-2.5 px-4 font-bold text-amber-400">{row.productId}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.typeTier}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.airTempK} K</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.processTempK} K</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.rpm} RPM</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.torqueNm} Nm</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.toolWearMin} min</td>
                  <td className="py-2.5 px-4 text-right">
                    {row.failed === 1 ? (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                        Failure (Ground Truth)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Healthy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

    </div>
  );
}
