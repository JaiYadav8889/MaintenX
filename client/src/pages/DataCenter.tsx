import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Database, FileSpreadsheet, Cpu, Sparkles, CheckCircle2, Activity, BarChart3, ShieldCheck, GitBranch, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskPill } from "@/components/RiskPill";
import { toast } from "sonner";

const telemetryFields = [
  { key: "airTempK", label: "Air Temp (K)", step: "0.1" },
  { key: "processTempK", label: "Process Temp (K)", step: "0.1" },
  { key: "rpm", label: "Speed (RPM)", step: "1" },
  { key: "torqueNm", label: "Torque (Nm)", step: "0.1" },
  { key: "toolWearMin", label: "Tool Wear (min)", step: "1" },
  { key: "vibrationMmS", label: "Vibration (mm/s)", step: "0.1" },
] as const;

type TelemetryKey = (typeof telemetryFields)[number]["key"];
type TelemetryValues = Record<TelemetryKey, number>;

type SampleRow = Record<string, string>;

export default function DataCenter() {
  const catalogsQuery = trpc.datasets.listCatalogs.useQuery();
  const realStatusQuery = trpc.datasets.getRealStatus.useQuery();
  const samplesQuery = trpc.datasets.getAI4ISamples.useQuery({ limit: 10, onlyFailures: false });
  const catalogs = catalogsQuery.data || [];
  const samples = samplesQuery.data || [];
  const analysis = realStatusQuery.data?.loaded ? realStatusQuery.data : undefined;

  const [machineId, setMachineId] = useState("MTR-102");
  const [values, setValues] = useState<TelemetryValues>({ airTempK: 298.5, processTempK: 310.2, rpm: 1450, torqueNm: 52.5, toolWearMin: 195, vibrationMmS: 3.8 });
  const [evaluatedResult, setEvaluatedResult] = useState<any>(null);

  const ingestMutation = trpc.datasets.ingestRecord.useMutation({
    onSuccess: (data) => {
      setEvaluatedResult(data);
      toast.success("Compatible telemetry parsed and scored via MaintenX rules");
    },
  });

  const updateValue = (key: TelemetryKey, value: number) => setValues((current) => ({ ...current, [key]: value }));
  const handleRunEvaluation = () => ingestMutation.mutate({ machineId, airTempK: values.airTempK, processTempK: values.processTempK, rpm: values.rpm, torqueNm: values.torqueNm, toolWearMin: values.toolWearMin, vibrationRmsMmS: values.vibrationMmS });
  const getField = (row: SampleRow, actual: string, fallback: string) => row[actual] ?? row[fallback] ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5"><Database className="w-6 h-6 text-amber-400" /><span>Data Center & Ingestion</span></h1>
        <p className="text-sm text-slate-400 mt-1">Actual uploaded datasets, schema validation, preprocessing decisions, model status, and MaintenX-compatible feature paths.</p>
      </div>

      <div className="p-3 rounded border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-200 flex items-start gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" /><span>{analysis?.processingContract || "Uploaded dataset manifest is loading…"}</span></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {catalogs.map((dataset) => (
          <Card key={dataset.id} className="bg-slate-900/90 border-slate-800">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-800">
              <div className="flex items-center justify-between gap-2"><span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">{dataset.id}</span><span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{dataset.analysisStatus || dataset.datasetStatus}</span></div>
              <CardTitle className="text-base font-bold text-white mt-2">{dataset.title}</CardTitle>
              <CardDescription className="text-xs text-slate-400">Provenance: {dataset.provenance || dataset.source}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 font-mono text-slate-400"><div>Records: <strong className="text-white">{dataset.recordCount.toLocaleString()}</strong></div><div>Labels: <strong className="text-white">{dataset.availableLabels?.length || dataset.targetVariables.length}</strong></div></div>
              <div><span className="font-mono text-slate-400 font-semibold uppercase text-[11px]">Actual columns</span><div className="flex flex-wrap gap-1.5 mt-1.5">{(dataset.actualColumns || dataset.features).map((field) => <span key={field} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">{field}</span>)}</div></div>
              <div><span className="font-mono text-slate-400 font-semibold uppercase text-[11px]">Available labels / conditions</span><div className="flex flex-wrap gap-1.5 mt-1.5">{(dataset.availableLabels || dataset.targetVariables).map((label) => <span key={label} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[10px]">{label}</span>)}</div></div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400"><span className="text-slate-200 font-semibold">Analysis status:</span> {dataset.analysisStatus || "Cataloged"}. <span className="text-slate-500">{dataset.sampleInterval}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {analysis?.ai4i && analysis.soonPemp && (
        <>
          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-800"><CardTitle className="text-base font-bold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-sky-400" />Actual AI4I baseline model evaluation</CardTitle><CardDescription className="text-xs text-slate-400">Calculated on the uploaded AI4I target with a stratified holdout; not production validation.</CardDescription></CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">{Object.entries(analysis.ai4i.model.metrics || {}).map(([metric, value]) => <div key={metric} className="p-3 rounded bg-slate-950 border border-slate-800"><div className="text-[10px] font-mono uppercase text-slate-500">{metric}</div><div className="text-xl font-bold text-sky-300 font-mono mt-1">{(Number(value) * 100).toFixed(2)}%</div></div>)}</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300"><div className="font-mono text-slate-200 font-bold">Model</div><div className="mt-1">{analysis.ai4i.model.algorithm}</div><div className="text-slate-500 mt-1">{analysis.ai4i.model.notes}</div></div><div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs"><div className="font-mono text-slate-200 font-bold">Confusion matrix</div><div className="font-mono text-slate-300 mt-2">{analysis.ai4i.model.confusionMatrix?.map((row) => `[${row.join(", ")}]`).join(" ")}</div><div className="text-slate-500 mt-1">Rows: actual 0/1 • Columns: predicted 0/1</div></div></div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-800"><CardTitle className="text-base font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" />SOON-pEMP vibration feature aggregates</CardTitle><CardDescription className="text-xs text-slate-400">Derived from all {analysis.soonPemp.fileCount} uploaded files and {analysis.soonPemp.recordCount.toLocaleString()} accelerometer records. Raw waveforms remain server-side.</CardDescription></CardHeader>
            <CardContent className="p-0 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono text-[11px]"><th className="py-2.5 px-4">Condition label</th><th className="py-2.5 px-3">Files</th><th className="py-2.5 px-3">Records</th><th className="py-2.5 px-3">Mean centered RMS</th><th className="py-2.5 px-3">Mean centered peak</th><th className="py-2.5 px-4">Mean crest factor</th></tr></thead><tbody className="divide-y divide-slate-800">{analysis.soonPemp.aggregates.map((item) => <tr key={item.category} className="hover:bg-slate-800/40"><td className="py-3 px-4 font-semibold text-slate-100">{item.category}</td><td className="py-3 px-3 font-mono text-slate-300">{item.fileCount}</td><td className="py-3 px-3 font-mono text-slate-300">{item.recordCount.toLocaleString()}</td><td className="py-3 px-3 font-mono text-amber-300">{item.meanCenteredVectorRms.toLocaleString()}</td><td className="py-3 px-3 font-mono text-sky-300">{item.meanCenteredVectorPeak.toLocaleString()}</td><td className="py-3 px-4 font-mono text-purple-300">{item.meanCrestFactor.toFixed(2)}</td></tr>)}</tbody></table></CardContent>
          </Card>

          <Card className="bg-slate-900/90 border-slate-800">
            <CardHeader className="p-4 sm:p-5 border-b border-slate-800"><CardTitle className="text-base font-bold text-white flex items-center gap-2"><GitBranch className="w-4 h-4 text-emerald-400" />Preprocessing & source mapping</CardTitle><CardDescription className="text-xs text-slate-400">Important decisions are surfaced instead of silently discarding incompatible fields.</CardDescription></CardHeader>
            <CardContent className="p-4 space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><div><div className="text-[11px] font-mono uppercase text-slate-500 mb-2">AI4I mapping</div><div className="space-y-2">{analysis.ai4i.featureMappings.map((mapping) => <div key={mapping.datasetField} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs"><div className="font-semibold text-slate-100">{mapping.datasetField} → {mapping.maintenxConcept}</div><div className="text-slate-400 mt-0.5">{mapping.processing}</div></div>)}</div></div><div><div className="text-[11px] font-mono uppercase text-slate-500 mb-2">SOON-pEMP mapping</div><div className="space-y-2">{analysis.soonPemp.featureMappings.map((mapping) => <div key={mapping.datasetField} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs"><div className="font-semibold text-slate-100">{mapping.datasetField} → {mapping.maintenxConcept}</div><div className="text-slate-400 mt-0.5">{mapping.processing}</div></div>)}</div></div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="p-3 rounded bg-slate-950 border border-slate-800"><div className="font-mono text-slate-200 text-xs font-bold mb-2">AI4I decisions</div>{analysis.ai4i.preprocessing.map((note) => <div key={note} className="text-[11px] text-slate-400 flex gap-2 mt-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{note}</div>)}</div><div className="p-3 rounded bg-slate-950 border border-slate-800"><div className="font-mono text-slate-200 text-xs font-bold mb-2">SOON-pEMP decisions</div>{analysis.soonPemp.preprocessing.map((note) => <div key={note} className="text-[11px] text-slate-400 flex gap-2 mt-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{note}</div>)}</div></div>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-800"><CardTitle className="text-base font-bold text-white flex items-center space-x-2"><Cpu className="w-4 h-4 text-amber-400" /><span>MaintenX-compatible telemetry evaluation sandbox</span></CardTitle><CardDescription className="text-xs text-slate-400">Uses AI4I-compatible fields and the transparent rule engine; absent vibration/current/voltage fields are not fabricated.</CardDescription></CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-5"><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{telemetryFields.map((field) => <div key={field.key}><label className="text-[11px] font-mono text-slate-400 block mb-1">{field.label}</label><Input type="number" step={field.step} value={values[field.key]} onChange={(event) => updateValue(field.key, parseFloat(event.target.value) || 0)} className="bg-slate-950 border-slate-800 text-xs font-mono text-white" /></div>)}</div><div className="flex justify-end"><Button onClick={handleRunEvaluation} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs"><Sparkles className="w-3.5 h-3.5 mr-1.5" />Ingest & Evaluate Compatible Record</Button></div>{evaluatedResult && <div className="p-4 rounded bg-slate-950 border border-slate-800 space-y-3"><div className="flex items-center justify-between border-b border-slate-800 pb-2"><span className="text-xs font-bold text-white font-mono">Rule-engine output</span><RiskPill category={evaluatedResult.assessed.riskCategory} pct={evaluatedResult.assessed.estimatedRiskPct} /></div><div className="text-xs text-slate-200"><strong>Explanation:</strong> {evaluatedResult.assessed.explanation}</div><div className="text-xs text-amber-300"><strong>Recommendation:</strong> {evaluatedResult.assessed.recommendedAction}</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400"><div>Power: <strong className="text-white">{evaluatedResult.normalizedTelemetry.powerKw} kW</strong></div><div>Temp ΔT: <strong className="text-white">{evaluatedResult.normalizedTelemetry.tempDiffC}°C</strong></div><div>Anomaly: <strong className="text-white">{evaluatedResult.assessed.anomalyScore}</strong></div><div>Health: <strong className="text-white">{evaluatedResult.assessed.healthScorePct}/100</strong></div></div></div>}</CardContent>
      </Card>

      <Card className="bg-slate-900/90 border-slate-800">
        <CardHeader className="p-4 sm:p-5 border-b border-slate-800"><CardTitle className="text-base font-bold text-white flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-emerald-400" />Uploaded AI4I ground-truth sample</CardTitle><CardDescription className="text-xs text-slate-400">Real records from the uploaded 10,000-row file; columns shown exactly as provided.</CardDescription></CardHeader>
        <CardContent className="p-0 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono text-[11px]"><th className="py-2.5 px-4">Product ID</th><th className="py-2.5 px-3">Type</th><th className="py-2.5 px-3">Air K</th><th className="py-2.5 px-3">Process K</th><th className="py-2.5 px-3">RPM</th><th className="py-2.5 px-3">Torque</th><th className="py-2.5 px-3">Tool wear</th><th className="py-2.5 px-4 text-right">Machine failure</th></tr></thead><tbody className="divide-y divide-slate-800 font-mono">{samples.map((row: SampleRow, index: number) => { const failed = getField(row, "Machine failure", "failed") === "1"; return <tr key={index} className={`hover:bg-slate-800/40 ${failed ? "bg-red-500/[0.04]" : ""}`}><td className="py-2.5 px-4 font-bold text-amber-400">{getField(row, "Product ID", "productId")}</td><td className="py-2.5 px-3 text-slate-300">{getField(row, "Type", "typeTier")}</td><td className="py-2.5 px-3 text-slate-300">{getField(row, "Air temperature [K]", "airTempK")}</td><td className="py-2.5 px-3 text-slate-300">{getField(row, "Process temperature [K]", "processTempK")}</td><td className="py-2.5 px-3 text-slate-300">{getField(row, "Rotational speed [rpm]", "rpm")}</td><td className="py-2.5 px-3 text-slate-300">{getField(row, "Torque [Nm]", "torqueNm")}</td><td className="py-2.5 px-3 text-slate-300">{getField(row, "Tool wear [min]", "toolWearMin")}</td><td className="py-2.5 px-4 text-right">{failed ? <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">Failure</span> : <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Healthy</span>}</td></tr>; })}</tbody></table></CardContent>
      </Card>
    </div>
  );
}
