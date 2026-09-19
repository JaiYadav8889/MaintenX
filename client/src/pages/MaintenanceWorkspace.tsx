import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Wrench, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  User, 
  Layers,
  ChevronRight,
  ShieldCheck,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MaintenanceStatus } from "../../../shared/domain";

export default function MaintenanceWorkspace() {
  const maintenanceQuery = trpc.maintenance.list.useQuery();
  const maintenance = maintenanceQuery.data || [];

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState("");

  const updateStatusMutation = trpc.maintenance.updateStatus.useMutation({
    onSuccess: (wo) => {
      toast.success(`Work Order ${wo.id} marked as ${wo.status}`);
      setSelectedOrder(null);
      maintenanceQuery.refetch();
    }
  });

  const handleCompleteOrder = (id: string) => {
    updateStatusMutation.mutate({
      id,
      status: "Completed",
      outcomeNotes: outcomeNotes || "Field inspection and component replacement executed per SOP. Vibration levels returned to ISO Zone A/B."
    });
  };

  const handleStartOrder = (id: string) => {
    updateStatusMutation.mutate({
      id,
      status: "In Progress"
    });
  };

  const filtered = maintenance.filter(w => {
    if (filterStatus === "ALL") return true;
    return w.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2.5">
            <Wrench className="w-6 h-6 text-amber-400" />
            <span>Maintenance Action Workspace</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Bridging AI anomaly detections to frontline work orders, technician dispatch, and root-cause verification
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/alerts">
            <Button size="sm" variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs">
              Check New Alerts
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900/90 border-slate-800 p-4">
          <div className="text-xs font-mono text-slate-400 uppercase">Total Work Orders</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{maintenance.length}</div>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-4">
          <div className="text-xs font-mono text-slate-400 uppercase">Scheduled Active</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {maintenance.filter(m => m.status === "Scheduled").length}
          </div>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-4">
          <div className="text-xs font-mono text-slate-400 uppercase">In Progress</div>
          <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
            {maintenance.filter(m => m.status === "In Progress").length}
          </div>
        </Card>
        <Card className="bg-slate-900/90 border-slate-800 p-4">
          <div className="text-xs font-mono text-slate-400 uppercase">Completed This Cycle</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {maintenance.filter(m => m.status === "Completed").length}
          </div>
        </Card>
      </div>

      {/* Status Filter */}
      <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none pb-1">
        {["ALL", "Scheduled", "In Progress", "Completed"].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition-colors ${
              filterStatus === st 
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Work Orders List */}
      <div className="space-y-4">
        {filtered.map(wo => {
          const isSelected = selectedOrder === wo.id;

          return (
            <Card 
              key={wo.id}
              className={`border-slate-800 bg-slate-900/90 overflow-hidden ${
                wo.priority === "Critical" ? "border-red-500/30" : ""
              }`}
            >
              <CardContent className="p-4 sm:p-5 space-y-3">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-sky-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {wo.id}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      wo.priority === "Critical" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                      wo.priority === "High" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                      "bg-slate-800 text-slate-300"
                    }`}>
                      {wo.priority} Priority
                    </span>
                    <Link href={`/machine/${wo.machineId}`} className="font-bold text-white hover:text-amber-400 transition-colors text-sm">
                      {wo.machineName}
                    </Link>
                    <span className="text-xs text-slate-400 font-mono">({wo.machineId})</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-slate-400">Trigger: <strong className="text-amber-400">{wo.triggerType}</strong></span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      wo.status === "In Progress" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                      wo.status === "Completed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
                      "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}>
                      {wo.status}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-slate-100">{wo.title}</h3>
                  <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded border border-slate-800 space-y-1">
                    <div className="font-semibold text-amber-300 font-mono text-[11px]">Recommended Engineering Action:</div>
                    <p>{wo.recommendedAction}</p>
                    <div className="font-mono text-[11px] text-slate-400 pt-1">
                      Procedure: {wo.procedureNotes}
                    </div>
                  </div>
                </div>

                {/* Outcome notes if completed */}
                {wo.outcomeNotes && (
                  <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/30 text-xs text-emerald-300 space-y-0.5">
                    <div className="font-bold font-mono text-[11px] flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Post-Service Verification & Telemetry Restoration:</span>
                    </div>
                    <p>{wo.outcomeNotes}</p>
                  </div>
                )}

                {/* Footer and Dispatch Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-4 text-slate-400 font-mono text-[11px]">
                    <span>Assigned Millwright: <strong className="text-slate-200">{wo.assignedTechnician}</strong></span>
                    <span>Scheduled: <strong className="text-slate-200">{new Date(wo.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    <span>Est. Downtime: <strong className="text-slate-200">{wo.estimatedDowntimeHours} hours</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/machine/${wo.machineId}`}>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-300">
                        View Machine
                      </Button>
                    </Link>

                    {wo.status === "Scheduled" && (
                      <Button 
                        size="sm"
                        onClick={() => handleStartOrder(wo.id)}
                        className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium"
                      >
                        Start Maintenance
                      </Button>
                    )}

                    {wo.status === "In Progress" && (
                      <Button 
                        size="sm"
                        onClick={() => handleCompleteOrder(wo.id)}
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Complete & Restore Asset Health
                      </Button>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}
