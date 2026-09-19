import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  fleetStore, 
  alertStore, 
  maintenanceStore, 
  DATASETS_CATALOG, 
  simulateMachineProgression,
  buildScenarioAnalysis
} from "./fleetData";
import { evaluateMachineTelemetry } from "../shared/riskEngine";
import fs from "fs";
import path from "path";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // MaintenX Predictive Maintenance API
  fleet: router({
    // Get full fleet list with real-time status, health, and risk
    list: publicProcedure.query(() => {
      return fleetStore.map(m => ({
        id: m.id,
        serialNumber: m.serialNumber,
        name: m.name,
        type: m.type,
        area: m.area,
        status: m.status,
        currentTelemetry: m.currentTelemetry,
        riskAssessment: m.riskAssessment,
        lastInspectionDate: m.lastInspectionDate,
        nextInspectionScheduledDate: m.nextInspectionScheduledDate,
        activeAlertCount: m.activeAlertCount,
        dataSource: m.dataSource
      }));
    }),

    // Fleet Summary KPI Metrics
    getSummary: publicProcedure.query(() => {
      const total = fleetStore.length;
      const healthy = fleetStore.filter(m => m.riskAssessment.riskCategory === "LOW").length;
      const warning = fleetStore.filter(m => m.riskAssessment.riskCategory === "MEDIUM").length;
      const highRisk = fleetStore.filter(m => m.riskAssessment.riskCategory === "HIGH").length;
      const critical = fleetStore.filter(m => m.riskAssessment.riskCategory === "CRITICAL").length;
      const attentionRequired = warning + highRisk + critical;
      
      const avgHealthScore = Math.round(
        fleetStore.reduce((acc, m) => acc + m.riskAssessment.healthScorePct, 0) / (total || 1)
      );

      const activeAlerts = alertStore.filter(a => a.status === "New" || a.status === "Acknowledged").length;
      const pendingMaintenance = maintenanceStore.filter(w => w.status === "Scheduled" || w.status === "In Progress").length;

      return {
        totalMachines: total,
        healthyMachines: healthy,
        warningMachines: warning,
        highRiskMachines: highRisk,
        criticalMachines: critical,
        attentionRequired,
        avgHealthScore,
        activeAlerts,
        pendingMaintenance,
        timestamp: Date.now()
      };
    }),

    getDigitalTwin: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        const machine = fleetStore.find((candidate) => candidate.id === input.id);
        if (!machine) throw new Error(`Machine with ID ${input.id} was not found.`);
        return {
          machineId: machine.id,
          machineName: machine.name,
          digitalTwin: machine.digitalTwin,
          currentTelemetry: machine.currentTelemetry,
          riskAssessment: machine.riskAssessment,
        };
      }),

    // Get specific machine with 24-hr history and alerts
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        const machine = fleetStore.find(m => m.id === input.id);
        if (!machine) {
          throw new Error(`Machine with ID ${input.id} was not found.`);
        }
        const machineAlerts = alertStore.filter(a => a.machineId === input.id);
        const machineWorkOrders = maintenanceStore.filter(w => w.machineId === input.id);
        return {
          machine,
          alerts: machineAlerts,
          workOrders: machineWorkOrders
        };
      }),

    // Dynamic telemetry injection / evaluate custom reading
    evaluateTelemetry: publicProcedure
      .input(z.object({
        airTempC: z.number(),
        processTempC: z.number(),
        tempDiffC: z.number(),
        rotationalSpeedRpm: z.number(),
        torqueNm: z.number(),
        toolWearMin: z.number(),
        powerKw: z.number(),
        vibrationRmsMmS: z.number(),
      }))
      .mutation(({ input }) => {
        return evaluateMachineTelemetry({
          timestamp: Date.now(),
          ...input
        });
      })
  }),

  alerts: router({
    list: publicProcedure.query(() => {
      return alertStore;
    }),

    updateStatus: publicProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["New", "Acknowledged", "In Inspection", "Resolved"]),
        technicianName: z.string().optional(),
        notes: z.string().optional()
      }))
      .mutation(({ input }) => {
        const alert = alertStore.find(a => a.id === input.id);
        if (!alert) throw new Error(`Alert ${input.id} not found`);
        
        alert.status = input.status;
        if (input.technicianName && input.status === "Acknowledged") {
          alert.acknowledgedBy = input.technicianName;
          alert.acknowledgedAt = Date.now();
        }
        if (input.status === "Resolved") {
          alert.resolvedAt = Date.now();
        }
        if (input.notes) {
          alert.notes = input.notes;
        }

        // Update machine active count if resolved
        if (input.status === "Resolved") {
          const machine = fleetStore.find(m => m.id === alert.machineId);
          if (machine && machine.activeAlertCount > 0) {
            machine.activeAlertCount--;
          }
        }

        return alert;
      }),

    createWorkOrderFromAlert: publicProcedure
      .input(z.object({
        alertId: z.string(),
        technician: z.string(),
        scheduledHoursAhead: z.number().default(4),
        priority: z.enum(["Low", "Medium", "High", "Critical"])
      }))
      .mutation(({ input }) => {
        const alert = alertStore.find(a => a.id === input.alertId);
        if (!alert) throw new Error(`Alert ${input.alertId} not found`);

        const newId = `WO-2026-${Date.now().toString().slice(-4)}`;
        const workOrder: (typeof maintenanceStore)[0] = {
          id: newId,
          machineId: alert.machineId,
          machineName: alert.machineName,
          title: `Inspection & Remediation: ${alert.issue.slice(0, 50)}`,
          triggerType: "Predictive Anomaly",
          triggerSignals: [alert.detectedParameter],
          recommendedAction: alert.recommendedAction,
          assignedTechnician: input.technician,
          scheduledDate: Date.now() + input.scheduledHoursAhead * 3600 * 1000,
          status: "Scheduled",
          priority: input.priority,
          estimatedDowntimeHours: input.priority === "Critical" ? 2.5 : 1.0,
          procedureNotes: `Generated from Alert ${alert.id}. Address flagged deviation: ${alert.detectedParameter}`
        };

        maintenanceStore.unshift(workOrder);
        alert.status = "In Inspection";
        return workOrder;
      })
  }),

  maintenance: router({
    list: publicProcedure.query(() => {
      return maintenanceStore;
    }),

    updateStatus: publicProcedure
      .input(z.object({
        id: z.string(),
        status: z.enum(["Scheduled", "In Progress", "Completed", "Deferred", "Overdue"]),
        outcomeNotes: z.string().optional()
      }))
      .mutation(({ input }) => {
        const wo = maintenanceStore.find(w => w.id === input.id);
        if (!wo) throw new Error(`Work order ${input.id} not found`);

        wo.status = input.status;
        if (input.status === "Completed") {
          wo.completedDate = Date.now();
          if (input.outcomeNotes) {
            wo.outcomeNotes = input.outcomeNotes;
          }
          // Restore machine health if serviced
          const machine = fleetStore.find(m => m.id === wo.machineId);
          if (machine) {
            machine.lastInspectionDate = Date.now();
            machine.nextInspectionScheduledDate = Date.now() + 30 * 24 * 3600 * 1000;
            // Lower risk to low/nominal post repair
            simulateMachineProgression(machine.id, "healthy");
          }
        }
        return wo;
      })
  }),

  datasets: router({
    listCatalogs: publicProcedure.query(() => {
      return DATASETS_CATALOG;
    }),

    getAI4ISamples: publicProcedure
      .input(z.object({ limit: z.number().default(20), onlyFailures: z.boolean().default(false) }))
      .query(({ input }) => {
        try {
          const samplePath = path.resolve(process.cwd(), "data/ai4i_benchmark_sample.json");
          if (fs.existsSync(samplePath)) {
            const raw = fs.readFileSync(samplePath, "utf-8");
            let data = JSON.parse(raw);
            if (input.onlyFailures) {
              data = data.filter((d: any) => d.failed === 1);
            }
            return data.slice(0, input.limit);
          }
        } catch (e) {
          console.error("Error reading AI4I samples:", e);
        }
        return [];
      }),

    // Ingest and map a custom CSV batch or sample
    ingestRecord: publicProcedure
      .input(z.object({
        machineId: z.string(),
        airTempK: z.number(),
        processTempK: z.number(),
        rpm: z.number(),
        torqueNm: z.number(),
        toolWearMin: z.number(),
        vibrationRmsMmS: z.number().optional()
      }))
      .mutation(({ input }) => {
        const airC = input.airTempK - 273.15;
        const procC = input.processTempK - 273.15;
        const diffC = procC - airC;
        const powerKw = (input.torqueNm * 2 * Math.PI * input.rpm / 60) / 1000;
        const vib = input.vibrationRmsMmS ?? (1.5 + (input.toolWearMin / 250) * 1.6 + (Math.abs(input.torqueNm - 40) / 40) * 1.1);

        const assessed = evaluateMachineTelemetry({
          timestamp: Date.now(),
          airTempC: Math.round(airC * 10) / 10,
          processTempC: Math.round(procC * 10) / 10,
          tempDiffC: Math.round(diffC * 10) / 10,
          rotationalSpeedRpm: input.rpm,
          torqueNm: input.torqueNm,
          toolWearMin: input.toolWearMin,
          powerKw: Math.round(powerKw * 100) / 100,
          vibrationRmsMmS: Math.round(vib * 100) / 100
        });

        return {
          assessed,
          normalizedTelemetry: {
            airTempC: Math.round(airC * 10) / 10,
            processTempC: Math.round(procC * 10) / 10,
            tempDiffC: Math.round(diffC * 10) / 10,
            powerKw: Math.round(powerKw * 100) / 100,
            vibrationRmsMmS: Math.round(vib * 100) / 100
          }
        };
      })
  }),

  // Interactive Live Demo & Simulation Engine
  simulation: router({
    triggerStep: publicProcedure
      .input(z.object({
        machineId: z.string(),
        stage: z.enum(["healthy", "warning", "high_risk", "critical"])
      }))
      .mutation(({ input }) => {
        const updated = simulateMachineProgression(input.machineId, input.stage);
        return {
          success: true,
          machineId: updated.id,
          stage: input.stage,
          newRisk: updated.riskAssessment,
          currentTelemetry: updated.currentTelemetry,
          activeAlertCount: updated.activeAlertCount
        };
      }),

    whatIf: publicProcedure
      .input(z.object({
        machineId: z.string(),
        scenario: z.enum(["maintenance", "no-maintenance"]),
      }))
      .query(({ input }) => buildScenarioAnalysis(input.machineId, input.scenario)),

    resetFleet: publicProcedure.mutation(() => {
      // Re-trigger progression back to initial conditions
      fleetStore.forEach(m => {
        if (m.id === "MTR-101" || m.id === "PMP-301" || m.id === "PMP-302" || m.id === "HYD-501") {
          simulateMachineProgression(m.id, "healthy");
        } else if (m.id === "MTR-102" || m.id === "CNC-202") {
          simulateMachineProgression(m.id, "warning");
        } else if (m.id === "CNC-201" || m.id === "LAT-401") {
          simulateMachineProgression(m.id, "critical");
        }
      });
      return { success: true, count: fleetStore.length };
    })
  }),

  analytics: router({
    getPlantMetrics: publicProcedure.query(() => {
      const total = fleetStore.length || 1;
      const critical = fleetStore.filter((machine) => machine.riskAssessment.riskCategory === "CRITICAL").length;
      const highRisk = fleetStore.filter((machine) => machine.riskAssessment.riskCategory === "HIGH").length;
      const averageRisk = Math.round(fleetStore.reduce((sum, machine) => sum + machine.riskAssessment.estimatedRiskPct, 0) / total);
      const averageHealth = Math.round(fleetStore.reduce((sum, machine) => sum + machine.riskAssessment.healthScorePct, 0) / total);
      const activeAlerts = alertStore.filter((alert) => alert.status !== "Resolved").length;
      const openWorkOrders = maintenanceStore.filter((workOrder) => workOrder.status !== "Completed").length;

      return {
        availabilityPct: 96.4,
        mtbfHours: 1840,
        mttrHours: 2.6,
        downtimeHours30d: 18.5,
        failureFrequency30d: 2,
        maintenanceCost30d: 12400,
        averageHealth,
        averageRisk,
        criticalAssets: critical,
        highRiskAssets: highRisk,
        activeAlerts,
        openWorkOrders,
        dataBasis: "Demo fleet metric derived from current in-memory prototype state; plant KPIs are simulated until historical production records are connected.",
        trend: [
          { label: "W-4", health: Math.max(0, averageHealth - 8), risk: Math.min(99, averageRisk + 8) },
          { label: "W-3", health: Math.max(0, averageHealth - 5), risk: Math.min(99, averageRisk + 5) },
          { label: "W-2", health: Math.max(0, averageHealth - 2), risk: Math.min(99, averageRisk + 2) },
          { label: "W-1", health: averageHealth, risk: averageRisk },
        ],
      };
    }),
  })
});

export type AppRouter = typeof appRouter;
