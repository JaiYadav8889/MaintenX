import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("MaintenX MTR-042 end-to-end demo flow", () => {
  it("moves from normal to critical, compares what-if branches, and closes maintenance", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await caller.simulation.resetFleet();

    const initial = await caller.fleet.getById({ id: "MTR-042" });
    expect(initial.machine.id).toBe("MTR-042");
    const healthy = await caller.simulation.triggerStep({ machineId: "MTR-042", stage: "healthy" });
    expect(healthy.machineId).toBe("MTR-042");
    expect(healthy.newRisk.healthScorePct).toBeGreaterThan(healthy.newRisk.estimatedRiskPct);

    const warning = await caller.simulation.triggerStep({ machineId: "MTR-042", stage: "warning" });
    const highRisk = await caller.simulation.triggerStep({ machineId: "MTR-042", stage: "high_risk" });
    const critical = await caller.simulation.triggerStep({ machineId: "MTR-042", stage: "critical" });
    expect(warning.newRisk.healthScorePct).toBeGreaterThan(highRisk.newRisk.healthScorePct);
    expect(highRisk.newRisk.healthScorePct).toBeGreaterThan(critical.newRisk.healthScorePct);
    expect(critical.newRisk.riskCategory).toBe("CRITICAL");
    expect(critical.newRisk.probableFaults.length).toBeGreaterThan(0);
    expect(critical.newRisk.recommendedAction.length).toBeGreaterThan(10);

    const noMaintenance = await caller.simulation.whatIf({ machineId: "MTR-042", scenario: "no-maintenance" });
    const maintenance = await caller.simulation.whatIf({ machineId: "MTR-042", scenario: "maintenance" });
    expect(noMaintenance.points).toHaveLength(4);
    expect(maintenance.points).toHaveLength(4);
    expect(maintenance.points.at(-1)!.estimatedRiskPct).toBeLessThanOrEqual(noMaintenance.points.at(-1)!.estimatedRiskPct);
    expect(maintenance.points.at(-1)!.healthScorePct).toBeGreaterThanOrEqual(noMaintenance.points.at(-1)!.healthScorePct);

    const alert = (await caller.alerts.list()).find((candidate) => candidate.machineId === "MTR-042");
    expect(alert).toBeDefined();
    const workOrder = await caller.alerts.createWorkOrderFromAlert({ alertId: alert!.id, technician: "Demo Technician", scheduledHoursAhead: 1, priority: "Critical" });
    expect(workOrder.machineId).toBe("MTR-042");
    expect(workOrder.priority).toBe("Critical");
    await caller.maintenance.updateStatus({ id: workOrder.id, status: "In Progress" });
    const completed = await caller.maintenance.updateStatus({ id: workOrder.id, status: "Completed", outcomeNotes: "Demo loop completed; post-service verification recorded." });
    expect(completed.status).toBe("Completed");

    const restored = await caller.fleet.getById({ id: "MTR-042" });
    expect(restored.machine.dataSource).toBe("simulated");
    expect(restored.machine.riskAssessment.riskCategory).toBe("LOW");
  });
});
