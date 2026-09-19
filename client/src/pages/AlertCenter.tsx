import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Wrench, 
  UserCheck, 
  Filter, 
  Search, 
  ChevronRight,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskPill } from "@/components/RiskPill";
import { toast } from "sonner";
import { AlertStatus } from "../../../shared/domain";

export default function AlertCenter() {
  const alertsQuery = trpc.alerts.list.useQuery();
  const alerts = alertsQuery.data || [];

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedAlertForWorkOrder, setSelectedAlertForWorkOrder] = useState<string | null>(null);
  const [technicianName, setTechnicianName] = useState("Jai Yadav (Lead Reliability Eng)");

  const updateAlertMutation = trpc.alerts.updateStatus.useMutation({
    onSuccess: (updated) => {
      toast.success(`Alert ${updated.id} marked as ${updated.status}`);
      alertsQuery.refetch();
    }
  });

  const createWorkOrderMutation = trpc.alerts.createWorkOrderFromAlert.useMutation({
    onSuccess: (wo) => {
      toast.success(`Work Order ${wo.id} generated for ${wo.machineName}`);
      setSelectedAlertForWorkOrder(null);
      alertsQuery.refetch();
    }
  });

  const handleUpdateStatus = (id: string, status: AlertStatus) => {
    updateAlertMutation.mutate({
      id,
      status,
      technicianName
    });
  };

  const handleCreateWorkOrder = (alertId: string, priority: "Medium" | "High" | "Critical") => {
    createWorkOrderMutation.mutate({
      alertId,
      technician: technicianName,
      scheduledHoursAhead: priority === "Critical" ? 2 : 12,
      priority
    });
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterStatus === "ALL") return true;
    return a.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
            <ShieldAlert className="w-6 h-6 text-red-400" />
            <span>Alert Center & Triage</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time machine anomaly notifications, operator acknowledgment, and work order creation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/maintenance">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs">
              <Wrench className="w-3.5 h-3.5 mr-1.5" />
              View Maintenance Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="bg-slate-900/90 border-slate-800">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {["ALL", "New", "Acknowledged", "In Inspection", "Resolved"].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors ${
                  filterStatus === st 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {st} {st !== "ALL" && `(${alerts.filter(a => a.status === st).length})`}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-400">
            Active Operator: <strong className="text-amber-400">{technicianName}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <Card className="bg-slate-900/90 border-slate-800 p-12 text-center text-slate-400 text-sm">
            No alerts found matching filter criteria.
          </Card>
        ) : (
          filteredAlerts.map(a => {
            const isCritical = a.riskCategory === "CRITICAL";

            return (
              <Card 
                key={a.id}
                className={`border-slate-800 transition-colors ${
                  a.status === "New" ? "border-amber-500/40 bg-slate-900/95" :
                  a.status === "Resolved" ? "opacity-60 bg-slate-950/80" : "bg-slate-900/80"
                }`}
              >
                <CardContent className="p-4 sm:p-5 space-y-3">
                  
                  {/* Alert Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {a.id}
                      </span>
                      <RiskPill category={a.riskCategory} pct={a.estimatedRiskPct} />
                      <Link href={`/machine/${a.machineId}`} className="font-bold text-white hover:text-amber-400 transition-colors text-sm">
                        {a.machineName}
                      </Link>
                      <span className="text-xs text-slate-400 font-mono">({a.machineId})</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(a.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        a.status === "New" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                        a.status === "Acknowledged" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                        a.status === "In Inspection" ? "bg-sky-500/20 text-sky-400 border border-sky-500/40" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                  </div>

                  {/* Body & Issue */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-slate-100">
                      {a.issue}
                    </h3>
                    <div className="text-xs text-slate-300 font-mono">
                      Trigger Deviations: <span className="text-amber-400 font-bold">{a.detectedParameter}</span>
                    </div>
                    <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                      Recommended Action: <span className="text-slate-200">{a.recommendedAction}</span>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <div className="text-slate-400 text-[11px] font-mono">
                      {a.acknowledgedBy && (
                        <span>Acknowledged by <strong className="text-slate-200">{a.acknowledgedBy}</strong></span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link href={`/machine/${a.machineId}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-300 hover:text-white">
                          Telemetry Deep Dive
                        </Button>
                      </Link>

                      {a.status === "New" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleUpdateStatus(a.id, "Acknowledged")}
                          className="h-7 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Acknowledge Alert
                        </Button>
                      )}

                      {a.status !== "In Inspection" && a.status !== "Resolved" && (
                        <Button 
                          size="sm"
                          onClick={() => handleCreateWorkOrder(a.id, isCritical ? "Critical" : "High")}
                          className="h-7 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                        >
                          <Wrench className="w-3.5 h-3.5 mr-1" />
                          Create Work Order
                        </Button>
                      )}

                      {a.status !== "Resolved" && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateStatus(a.id, "Resolved")}
                          className="h-7 text-xs text-slate-400 hover:text-emerald-400"
                        >
                          Mark Resolved
                        </Button>
                      )}
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
