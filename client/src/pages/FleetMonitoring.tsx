import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Activity, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  ChevronRight, 
  ArrowUpDown, 
  ExternalLink,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RiskPill, StatusPill } from "@/components/RiskPill";
import { RiskCategory } from "../../../shared/domain";

export default function FleetMonitoring() {
  const fleetQuery = trpc.fleet.list.useQuery();
  const fleet = fleetQuery.data || [];

  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<string>("ALL");
  const [filterArea, setFilterArea] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"risk" | "health" | "name" | "id">("risk");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filtering
  const filtered = fleet.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase()) ||
      m.area.toLowerCase().includes(search.toLowerCase());

    const matchesRisk = filterRisk === "ALL" || m.riskAssessment.riskCategory === filterRisk;
    const matchesArea = filterArea === "ALL" || m.area === filterArea;

    return matchesSearch && matchesRisk && matchesArea;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "risk") {
      comparison = b.riskAssessment.estimatedRiskPct - a.riskAssessment.estimatedRiskPct;
    } else if (sortBy === "health") {
      comparison = b.riskAssessment.healthScorePct - a.riskAssessment.healthScorePct;
    } else if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "id") {
      comparison = a.id.localeCompare(b.id);
    }
    return sortOrder === "asc" ? -comparison : comparison;
  });

  const areas = Array.from(new Set(fleet.map(m => m.area)));

  return (
    <div className="space-y-6">
      
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
            <Activity className="w-6 h-6 text-amber-400" />
            <span>Industrial Fleet Monitoring</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time condition telemetry, ISO vibration compliance, and failure risk estimation across all machinery
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/simulation">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Simulate Machine Fault
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search by ID (MTR-042), machine name, model or bay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-xs placeholder:text-slate-500 text-white"
            />
          </div>

          {/* Risk Filter Buttons */}
          <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterRisk(cat)}
                className={`px-2.5 py-1.5 rounded text-xs font-mono font-medium border transition-colors ${
                  filterRisk === cat
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Area Selector */}
          <div className="flex items-center space-x-2">
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Factory Areas</option>
              {areas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Telemetry Data Table */}
      <Card className="bg-slate-900/90 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4 font-semibold">Machine ID & Type</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold cursor-pointer hover:text-white" onClick={() => { setSortBy("risk"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                  <div className="flex items-center space-x-1">
                    <span>Est. Failure Risk</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 font-semibold">Vibration (ISO 10816)</th>
                <th className="py-3 px-3 font-semibold">Thermal Gradient</th>
                <th className="py-3 px-3 font-semibold">Shaft Speed / Torque</th>
                <th className="py-3 px-3 font-semibold">Tool Wear</th>
                <th className="py-3 px-3 font-semibold">Power</th>
                <th className="py-3 px-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No machinery matches the selected filter criteria.
                  </td>
                </tr>
              ) : (
                sorted.map((m) => {
                  const t = m.currentTelemetry;
                  const r = m.riskAssessment;
                  const isCritical = r.riskCategory === "CRITICAL";
                  const isWarning = r.riskCategory === "HIGH" || r.riskCategory === "MEDIUM";

                  return (
                    <tr 
                      key={m.id}
                      className={`hover:bg-slate-800/60 transition-colors ${
                        isCritical ? "bg-red-500/[0.03]" : isWarning ? "bg-amber-500/[0.02]" : ""
                      }`}
                    >
                      {/* Machine identity */}
                      <td className="py-3.5 px-4">
                        <Link href={`/machine/${m.id}`} className="font-bold text-slate-100 hover:text-amber-400 transition-colors block">
                          {m.name}
                        </Link>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                          <span className="text-amber-400 font-semibold">{m.id}</span>
                          <span>•</span>
                          <span>{m.type}</span>
                          <span>•</span>
                          <span className="text-slate-500">{m.area}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <StatusPill status={m.status} />
                      </td>

                      {/* Failure Risk Score */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <RiskPill category={r.riskCategory} pct={r.estimatedRiskPct} />
                          <div className="w-24 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full rounded-full ${
                                isCritical ? "bg-red-500" : isWarning ? "bg-amber-400" : "bg-emerald-400"
                              }`}
                              style={{ width: `${r.estimatedRiskPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Vibration */}
                      <td className="py-3.5 px-3 font-mono">
                        <span className={`font-semibold ${
                          t.vibrationRmsMmS > 4.5 ? "text-red-400 font-bold" :
                          t.vibrationRmsMmS > 2.8 ? "text-amber-400" : "text-emerald-400"
                        }`}>
                          {t.vibrationRmsMmS.toFixed(2)} mm/s
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {t.vibrationRmsMmS > 4.5 ? "Zone D (Critical)" :
                           t.vibrationRmsMmS > 2.8 ? "Zone C (Unrestricted)" : "Zone A/B (Good)"}
                        </div>
                      </td>

                      {/* Thermal gradient */}
                      <td className="py-3.5 px-3 font-mono">
                        <span className={`${
                          t.tempDiffC > 12.5 ? "text-red-400 font-bold" :
                          t.tempDiffC > 11.0 ? "text-amber-400" : "text-slate-300"
                        }`}>
                          Δ {t.tempDiffC.toFixed(1)}°C
                        </span>
                        <div className="text-[10px] text-slate-500">
                          Proc: {t.processTempC.toFixed(1)}°C
                        </div>
                      </td>

                      {/* Speed / Torque */}
                      <td className="py-3.5 px-3 font-mono">
                        <div className="text-slate-200">
                          {t.rotationalSpeedRpm.toFixed(0)} RPM
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Torque: <span className={t.torqueNm > 58 ? "text-amber-400 font-bold" : "text-slate-300"}>{t.torqueNm.toFixed(1)} Nm</span>
                        </div>
                      </td>

                      {/* Tool wear */}
                      <td className="py-3.5 px-3 font-mono">
                        <span className={`${
                          t.toolWearMin > 210 ? "text-red-400 font-bold" :
                          t.toolWearMin > 180 ? "text-amber-400" : "text-slate-300"
                        }`}>
                          {t.toolWearMin} min
                        </span>
                      </td>

                      {/* Power */}
                      <td className="py-3.5 px-3 font-mono text-slate-300">
                        {t.powerKw.toFixed(2)} kW
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/machine/${m.id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700 hover:bg-slate-800 hover:text-amber-400">
                            Deep Dive <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ISO 10816 & AI4I Reference Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
        <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-1">
          <span className="font-semibold text-slate-200 font-mono">ISO 10816-3 Vibration Severity Reference</span>
          <p>
            Zone A/B (&lt; 2.8 mm/s): Normal new machine condition. Zone C (2.8–4.5 mm/s): Unrestricted continuous operation not recommended. Zone D (&gt; 4.5 mm/s): Danger of imminent damage.
          </p>
        </div>
        <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-1">
          <span className="font-semibold text-slate-200 font-mono">AI4I 2020 Multi-physics Fault Correlation</span>
          <p>
            Process/Air temperature gradient &gt; 11.2°C flags Heat Dissipation Failure (HDF). Torque × RPM power divergence flags Power Failure (PWF). Wear &gt; 200 min flags Tool Wear Failure (TWF).
          </p>
        </div>
      </div>

    </div>
  );
}
