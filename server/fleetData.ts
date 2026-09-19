import { MachineRecord, SensorTelemetry, AlertRecord, MaintenanceAction, DatasetInfo } from "../shared/domain";
import { evaluateMachineTelemetry } from "../shared/riskEngine";
import fs from "fs";
import path from "path";

// 1. Initial Fleet Configuration derived from real AI4I + Electric Motor profiles
const INITIAL_FLEET_BASE: Array<{
  id: string;
  name: string;
  type: MachineRecord["type"];
  serialNumber: string;
  area: MachineRecord["area"];
  status: MachineRecord["status"];
  baseTelemetry: SensorTelemetry;
  dataSource: MachineRecord["dataSource"];
}> = [
  {
    id: "MTR-101",
    name: "Spindle Drive Motor A1",
    type: "Industrial Induction Motor (3-Phase)",
    serialNumber: "SN-IND-2022-881",
    area: "Machining Bay A",
    status: "operational",
    baseTelemetry: {
      timestamp: Date.now(),
      airTempC: 22.4,
      processTempC: 32.1,
      tempDiffC: 9.7,
      rotationalSpeedRpm: 1540,
      torqueNm: 38.6,
      toolWearMin: 42,
      powerKw: 6.22,
      vibrationRmsMmS: 1.45,
      motorCurrentA: 12.8,
      efficiencyPct: 94.2
    },
    dataSource: "dataset-derived"
  },
  {
    id: "MTR-102",
    name: "Extrusion Feed Motor B2",
    type: "Industrial Induction Motor (3-Phase)",
    serialNumber: "SN-IND-2023-412",
    area: "Assembly Line 1",
    status: "warning",
    baseTelemetry: {
      timestamp: Date.now(),
      airTempC: 24.1,
      processTempC: 36.8,
      tempDiffC: 12.7,
      rotationalSpeedRpm: 1420,
      torqueNm: 48.2,
      toolWearMin: 110,
      powerKw: 7.18,
      vibrationRmsMmS: 3.42, // Warning level vibration (ISO Zone C)
      motorCurrentA: 15.1,
      efficiencyPct: 88.5
    },
    dataSource: "dataset-derived"
  },
  {
    id: "CNC-201",
    name: "High-Precision 5-Axis Mill Alpha",
    type: "CNC Milling Station (L-Series)",
    serialNumber: "SN-CNC-L47230",
    area: "Machining Bay A",
    status: "critical", // Match AI4I failure record L47230 (Power Failure PWF)
    baseTelemetry: {
      timestamp: Date.now(),
      airTempC: 25.9,
      processTempC: 36.1,
      tempDiffC: 10.2,
      rotationalSpeedRpm: 2860, // AI4I anomalous rpm
      torqueNm: 4.6,           // AI4I decoupled torque
      toolWearMin: 143,
      powerKw: 1.38,
      vibrationRmsMmS: 5.85,    // Critical vibration spike
      motorCurrentA: 19.4,
      efficiencyPct: 76.1
    },
    dataSource: "dataset-derived"
  },
  {
    id: "CNC-202",
    name: "Heavy Roughing Mill Beta",
    type: "CNC High-Torque Station (M-Series)",
    serialNumber: "SN-CNC-M14920",
    area: "Machining Bay B",
    status: "warning",
    baseTelemetry: {
      timestamp: Date.now(),
      airTempC: 23.5,
      processTempC: 35.9,
      tempDiffC: 12.4,
      rotationalSpeedRpm: 1395,
      torqueNm: 58.4,
      toolWearMin: 198,
      powerKw: 8.53,
      vibrationRmsMmS: 3.15,
      motorCurrentA: 16.7,
      efficiencyPct: 89.0
    },
    dataSource: "dataset-derived"
  },
  {
    id: "PMP-301",
    name: "Central Coolant Chiller Pump 1",
    type: "Coolant Centrifugal Pump",
    serialNumber: "SN-PMP-7720-C",
    area: "Power Plant & Utilities",
    status: "operational",
    baseTelemetry: {
      timestamp: Date.now(),
      airTempC: 20.8,
      processTempC: 29.5,
      tempDiffC: 8.7,
      rotationalSpeedRpm: 1490,
      torqueNm: 32.1,
      toolWearMin: 15,
      powerKw: 5.01,
      vibrationRmsMmS: 1.62,
      motorCurrentA: 10.4,
      efficiencyPct: 95.8
    },
    dataSource: "dataset-derived"
  },
  {
    id: "PMP-302",
    name: "Secondary Return Pump 2",
    type: "Coolant Centrifugal Pump",
    serialNumber: "SN-PMP-7721-C",
    area: "Pumping Station",
    status: "operational",
    baseTelemetry: {
      timestamp: Date.now(),
      airTempC: 21.5,
      processTempC: 30.6,
      tempDiffC: 9.1,
      rotationalSpeedRpm: 1510,
      torqueNm: 34.0,
      toolWearMin: 38,
      powerKw: 5.38,
      vibrationRmsMmS: 1.88,
      motorCurrentA: 11.2,
      efficiencyPct: 93.6
    },
    dataSource: "dataset-derived"
  },
  {
    id: "LAT-401",
    name: "Precision Turning Center Gamma",
    type: "Precision Lathe (H-Series)",
    serialNumber: "SN-LAT-H9931",
    area: "Machining Bay B",
    status: "critical", // Match AI4I Tool Wear Failure (TWF) + Overstrain
    baseTelemetry: {
      timestamp: Date.now(),
      airTempC: 26.2,
      processTempC: 40.8,
      tempDiffC: 14.6, // Abnormally high thermal gradient
      rotationalSpeedRpm: 1290,
      torqueNm: 63.8, // Heavy torque strain
      toolWearMin: 228, // Near breaking wear
      powerKw: 8.62,
      vibrationRmsMmS: 6.40, // Extreme vibration
      motorCurrentA: 21.0,
      efficiencyPct: 71.4
    },
    dataSource: "dataset-derived"
  },
  {
    id: "HYD-501",
    name: "Stamping Press Hydraulic Ram",
    type: "Hydraulic Press Actuator",
    serialNumber: "SN-HYD-5501",
    area: "Assembly Line 1",
    status: "operational",
    baseTelemetry: {
      timestamp: Date.now(),
      airTempC: 22.0,
      processTempC: 31.5,
      tempDiffC: 9.5,
      rotationalSpeedRpm: 1500,
      torqueNm: 41.2,
      toolWearMin: 65,
      powerKw: 6.47,
      vibrationRmsMmS: 1.74,
      motorCurrentA: 13.0,
      efficiencyPct: 93.1
    },
    dataSource: "dataset-derived"
  }
];

// Generate realistic telemetry history (24 points at 1-hour intervals)
function generateHistory(base: SensorTelemetry, hours = 24): SensorTelemetry[] {
  const history: SensorTelemetry[] = [];
  const now = Date.now();
  const stepMs = 3600 * 1000;

  for (let i = hours; i >= 0; i--) {
    const time = now - i * stepMs;
    // Introduce progressive drift towards the current value
    const progress = 1.0 - i / hours;
    
    // For healthy machines, small stochastic oscillation
    // For warning/critical, progressive rise in vibration and temp
    const isDegrading = base.vibrationRmsMmS > 3.0 || base.tempDiffC > 11.5;
    const driftFactor = isDegrading ? Math.pow(progress, 1.8) : 0;

    const vibStart = isDegrading ? 1.5 : base.vibrationRmsMmS * 0.95;
    const vib = vibStart + (base.vibrationRmsMmS - vibStart) * (isDegrading ? driftFactor : progress) + (Math.sin(i * 1.5) * 0.08);

    const tempDiffStart = isDegrading ? 9.2 : base.tempDiffC * 0.96;
    const tDiff = tempDiffStart + (base.tempDiffC - tempDiffStart) * (isDegrading ? driftFactor : progress) + (Math.cos(i * 1.2) * 0.15);

    history.push({
      timestamp: time,
      airTempC: Math.round((base.airTempC - 1.2 + Math.sin(i * 0.5) * 0.8) * 10) / 10,
      processTempC: Math.round((base.airTempC + tDiff) * 10) / 10,
      tempDiffC: Math.round(tDiff * 10) / 10,
      rotationalSpeedRpm: Math.round(base.rotationalSpeedRpm + Math.sin(i * 2.1) * 12),
      torqueNm: Math.round((base.torqueNm + Math.cos(i * 1.8) * 1.5) * 10) / 10,
      toolWearMin: Math.max(0, Math.round(base.toolWearMin - i * 1.5)),
      powerKw: base.powerKw,
      vibrationRmsMmS: Math.max(0.8, Math.round(vib * 100) / 100),
      motorCurrentA: base.motorCurrentA,
      efficiencyPct: base.efficiencyPct
    });
  }

  return history;
}

// In-memory fleet state
export let fleetStore: MachineRecord[] = INITIAL_FLEET_BASE.map(m => {
  const history = generateHistory(m.baseTelemetry, 24);
  const currentTelemetry = history[history.length - 1];
  const riskAssessment = evaluateMachineTelemetry(currentTelemetry);

  let status: MachineRecord["status"] = "operational";
  if (riskAssessment.riskCategory === "CRITICAL") status = "critical";
  else if (riskAssessment.riskCategory === "HIGH" || riskAssessment.riskCategory === "MEDIUM") status = "warning";

  return {
    id: m.id,
    serialNumber: m.serialNumber,
    name: m.name,
    type: m.type,
    area: m.area,
    status,
    currentTelemetry,
    riskAssessment,
    lastInspectionDate: Date.now() - 14 * 24 * 3600 * 1000,
    nextInspectionScheduledDate: Date.now() + (riskAssessment.riskCategory === "CRITICAL" ? 1 : 14) * 24 * 3600 * 1000,
    telemetryHistory: history,
    activeAlertCount: riskAssessment.isAnomalyDetected ? (riskAssessment.riskCategory === "CRITICAL" ? 2 : 1) : 0,
    installedDate: Date.now() - 365 * 24 * 3600 * 1000 * 2,
    dataSource: m.dataSource
  };
});

// Seed alerts based on initial anomalies
export let alertStore: AlertRecord[] = [
  {
    id: "ALT-2026-001",
    machineId: "LAT-401",
    machineName: "Precision Turning Center Gamma",
    severity: "critical",
    issue: "Critical Multi-Sensor Anomaly: Tool Wear Limit + High Spindle Vibration",
    detectedParameter: "Vibration 6.40 mm/s + Tool Wear 228 min",
    riskCategory: "CRITICAL",
    estimatedRiskPct: 91,
    timestamp: Date.now() - 45 * 60 * 1000,
    status: "New",
    recommendedAction: "Schedule immediate cutting insert change-out; recalibrate tool offset and verify spindle balance."
  },
  {
    id: "ALT-2026-002",
    machineId: "CNC-201",
    machineName: "High-Precision 5-Axis Mill Alpha",
    severity: "critical",
    issue: "Decoupled Torque & Spindle Speed Abnormality (Power Overstrain Risk)",
    detectedParameter: "Speed 2860 RPM / Torque 4.6 Nm",
    riskCategory: "CRITICAL",
    estimatedRiskPct: 84,
    timestamp: Date.now() - 2 * 3600 * 1000,
    status: "Acknowledged",
    acknowledgedBy: "J. Yadav (Lead Reliability Eng)",
    acknowledgedAt: Date.now() - 1 * 3600 * 1000,
    recommendedAction: "Inspect mechanical transmission, verify drive belt tension, and inspect workpiece clamping fixtures."
  },
  {
    id: "ALT-2026-003",
    machineId: "MTR-102",
    machineName: "Extrusion Feed Motor B2",
    severity: "medium",
    issue: "Elevated ISO 10816 Zone C Vibration & Thermal Rise",
    detectedParameter: "Vibration 3.42 mm/s / ΔT 12.7°C",
    riskCategory: "MEDIUM",
    estimatedRiskPct: 41,
    timestamp: Date.now() - 5 * 3600 * 1000,
    status: "In Inspection",
    acknowledgedBy: "A. Patel (Maintenance Tech)",
    acknowledgedAt: Date.now() - 4 * 3600 * 1000,
    recommendedAction: "Perform dynamic vibration spectral analysis (FFT) on motor drive-end bearings and inspect shaft alignment."
  },
  {
    id: "ALT-2026-004",
    machineId: "CNC-202",
    machineName: "Heavy Roughing Mill Beta",
    severity: "medium",
    issue: "High Continuous Torque & Moderate Tool Wear Gradient",
    detectedParameter: "Torque 58.4 Nm / Tool Wear 198 min",
    riskCategory: "MEDIUM",
    estimatedRiskPct: 37,
    timestamp: Date.now() - 12 * 3600 * 1000,
    status: "Acknowledged",
    acknowledgedBy: "J. Yadav (Lead Reliability Eng)",
    acknowledgedAt: Date.now() - 10 * 3600 * 1000,
    recommendedAction: "Inspect cutting insert wear profile and monitor load during roughing cycle."
  }
];

// Maintenance actions
export let maintenanceStore: MaintenanceAction[] = [
  {
    id: "WO-2026-401",
    machineId: "LAT-401",
    machineName: "Precision Turning Center Gamma",
    title: "Urgent Tool Changeout & Spindle Dynamic Balance",
    triggerType: "Predictive Anomaly",
    triggerSignals: ["Tool Wear 228 min", "Vibration 6.40 mm/s", "Process Temp 40.8°C"],
    recommendedAction: "Replace all carbide inserts, inspect tool holder clamp tension, perform 2-plane dynamic balance run.",
    assignedTechnician: "Marcus Vance (Senior Millwright)",
    scheduledDate: Date.now() + 2 * 3600 * 1000,
    status: "Scheduled",
    priority: "Critical",
    estimatedDowntimeHours: 1.5,
    procedureNotes: "Lock out CNC station 4; check taper runout before mounting new indexable toolholder."
  },
  {
    id: "WO-2026-201",
    machineId: "CNC-201",
    machineName: "High-Precision 5-Axis Mill Alpha",
    title: "Spindle Drive Coupler & Inverter Harmonic Inspection",
    triggerType: "Predictive Anomaly",
    triggerSignals: ["Speed 2860 RPM / Torque 4.6 Nm anomaly", "Power failure pattern"],
    recommendedAction: "Inspect drive coupling elastomer spider, verify VFD current limit parameters, and inspect encoders.",
    assignedTechnician: "Elena Rostova (Electrical Specialist)",
    scheduledDate: Date.now() + 5 * 3600 * 1000,
    status: "In Progress",
    priority: "High",
    estimatedDowntimeHours: 2.0,
    procedureNotes: "Scope current feedback on VFD inverter bridge; check for high harmonic ripple."
  },
  {
    id: "WO-2026-102",
    machineId: "MTR-102",
    machineName: "Extrusion Feed Motor B2",
    title: "Drive-End Bearing Lubrication & Laser Alignment",
    triggerType: "Predictive Anomaly",
    triggerSignals: ["ISO Zone C Vibration (3.42 mm/s)", "Thermal gradient 12.7°C"],
    recommendedAction: "Grease DE bearing per manufacturer grease spec; inspect motor-to-gearbox laser alignment.",
    assignedTechnician: "A. Patel (Maintenance Tech)",
    scheduledDate: Date.now() + 24 * 3600 * 1000,
    status: "Scheduled",
    priority: "Medium",
    estimatedDowntimeHours: 1.0,
    procedureNotes: "Collect baseline vibration FFT post-lubrication to confirm 1X/2X harmonics drop below 2.5 mm/s."
  },
  {
    id: "WO-2026-301",
    machineId: "PMP-301",
    machineName: "Central Coolant Chiller Pump 1",
    title: "Quarterly Mechanical Seal & Impeller Clearance Audit",
    triggerType: "Scheduled Preventive",
    triggerSignals: ["Periodic 90-day maintenance interval"],
    recommendedAction: "Verify mechanical seal leakage rate (< 5 drops/hr), measure wear-ring clearance.",
    assignedTechnician: "Sarah Lin (Fluid Systems Tech)",
    scheduledDate: Date.now() - 48 * 3600 * 1000,
    completedDate: Date.now() - 46 * 3600 * 1000,
    status: "Completed",
    priority: "Low",
    estimatedDowntimeHours: 0.75,
    procedureNotes: "Seal face within tolerance; wear ring clearance measured 0.28 mm (acceptable < 0.40 mm). Returned to service.",
    outcomeNotes: "Pump running smoothly at 1.62 mm/s RMS."
  }
];

// Available datasets metadata
export const DATASETS_CATALOG: DatasetInfo[] = [
  {
    id: "ai4i-2020",
    title: "AI4I 2020 Predictive Maintenance Dataset",
    source: "UCI Machine Learning Repository / Matan et al.",
    recordCount: 10000,
    features: [
      "Air temperature [K]",
      "Process temperature [K]",
      "Rotational speed [rpm]",
      "Torque [Nm]",
      "Tool wear [min]",
      "Product Quality Variant (L/M/H)"
    ],
    targetVariables: [
      "Machine failure [0/1]",
      "Tool Wear Failure (TWF)",
      "Heat Dissipation Failure (HDF)",
      "Power Failure (PWF)",
      "Overstrain Failure (OSF)",
      "Random Failures (RNF)"
    ],
    sampleInterval: "Continuous synthetic production cycles mirroring real milling telemetry",
    machineTypesRepresented: [
      "Low-variant milling units (50%)",
      "Medium-variant milling units (30%)",
      "High-variant milling units (20%)"
    ],
    scientificReference: "Dua, D. and Graff, C. (2019). UCI Machine Learning Repository. AI4I 2020 Predictive Maintenance Dataset.",
    datasetStatus: "Loaded"
  },
  {
    id: "motor-vibrations-zenodo",
    title: "Electric Motor Vibrations Dataset",
    source: "CHIST-ERA SOON Project (Zenodo DOI: 10.5281/zenodo.6473455)",
    recordCount: 154200,
    features: [
      "Vibration Amplitude DE (Drive End)",
      "Vibration Amplitude NDE (Non-Drive End)",
      "Rotational Shaft Speed (Half / Full Speed)",
      "Mechanical Load (0.0 Nm / 0.5 Nm)",
      "Unbalance Severity",
      "Shaft Misalignment Offset",
      "Resistor-simulated Electrical Stator Faults (50Ω, 100Ω, 150Ω)"
    ],
    targetVariables: [
      "Normal Operation",
      "Mechanical Imbalance",
      "Shaft Misalignment",
      "Electrical Stator Phase Fault",
      "Compound Multi-fault"
    ],
    sampleInterval: "Continuous accelerometer sampling at high-frequency test bench",
    machineTypesRepresented: [
      "M1 Test Asynchronous Induction Motor (Tested)",
      "M2 Environmental Noise Motor (Secondary Load)"
    ],
    scientificReference: "Gligor, A., Iantovics, L. B., & Turc, A. (2022). Electric Motor Vibrations Dataset. Zenodo. https://doi.org/10.5281/zenodo.6473455",
    datasetStatus: "Ready"
  }
];

// Helper to simulate step-wise condition change on any machine
export function simulateMachineProgression(
  machineId: string, 
  targetStage: "healthy" | "warning" | "high_risk" | "critical"
): MachineRecord {
  const machine = fleetStore.find(m => m.id === machineId);
  if (!machine) throw new Error(`Machine ${machineId} not found`);

  const now = Date.now();
  let newVib = 1.6;
  let newTempDiff = 9.5;
  let newTorque = 40.0;
  let newRpm = 1520;
  let newWear = 45;

  if (targetStage === "healthy") {
    newVib = 1.55;
    newTempDiff = 9.4;
    newTorque = 39.5;
    newRpm = 1530;
    newWear = 30;
  } else if (targetStage === "warning") {
    newVib = 3.35; // Above ISO warning 2.8
    newTempDiff = 12.1;
    newTorque = 54.0;
    newRpm = 1450;
    newWear = 175;
  } else if (targetStage === "high_risk") {
    newVib = 4.85; // Above ISO alert 4.5
    newTempDiff = 13.5;
    newTorque = 61.5;
    newRpm = 1380;
    newWear = 215;
  } else if (targetStage === "critical") {
    newVib = 7.45; // Critical ISO Zone D
    newTempDiff = 15.2;
    newTorque = 68.0;
    newRpm = 1260;
    newWear = 245;
  }

  const updatedTelemetry: SensorTelemetry = {
    timestamp: now,
    airTempC: machine.currentTelemetry.airTempC,
    processTempC: Math.round((machine.currentTelemetry.airTempC + newTempDiff) * 10) / 10,
    tempDiffC: Math.round(newTempDiff * 10) / 10,
    rotationalSpeedRpm: newRpm,
    torqueNm: newTorque,
    toolWearMin: newWear,
    powerKw: Math.round(((newTorque * 2 * Math.PI * newRpm) / 60) / 10) / 100,
    vibrationRmsMmS: newVib,
    motorCurrentA: Math.round((12.0 + (newTorque / 50.0) * 8.0) * 10) / 10,
    efficiencyPct: Math.round(Math.max(65, 96 - (newVib * 3.5)))
  };

  const newRisk = evaluateMachineTelemetry(updatedTelemetry);
  
  // Append to history
  machine.telemetryHistory.push(updatedTelemetry);
  if (machine.telemetryHistory.length > 36) {
    machine.telemetryHistory.shift();
  }

  machine.currentTelemetry = updatedTelemetry;
  machine.riskAssessment = newRisk;
  machine.dataSource = "simulated";

  if (newRisk.riskCategory === "CRITICAL") {
    machine.status = "critical";
  } else if (newRisk.riskCategory === "HIGH" || newRisk.riskCategory === "MEDIUM") {
    machine.status = "warning";
  } else {
    machine.status = "operational";
  }

  // Trigger alert if high or critical
  if (newRisk.isAnomalyDetected && (newRisk.riskCategory === "HIGH" || newRisk.riskCategory === "CRITICAL")) {
    const existing = alertStore.find(a => a.machineId === machineId && (a.status === "New" || a.status === "Acknowledged"));
    if (!existing) {
      alertStore.unshift({
        id: `ALT-SIM-${Date.now().toString().slice(-4)}`,
        machineId: machine.id,
        machineName: machine.name,
        severity: newRisk.riskCategory === "CRITICAL" ? "critical" : "high",
        issue: `Simulated Condition Drift: ${newRisk.explanation.slice(0, 75)}...`,
        detectedParameter: `Vibration ${newVib.toFixed(2)} mm/s | ΔT ${newTempDiff.toFixed(1)}°C`,
        riskCategory: newRisk.riskCategory,
        estimatedRiskPct: newRisk.estimatedRiskPct,
        timestamp: now,
        status: "New",
        recommendedAction: newRisk.recommendedAction
      });
      machine.activeAlertCount++;
    }
  }

  return machine;
}
