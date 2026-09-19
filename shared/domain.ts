export type RiskCategory = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type MachineStatus = "operational" | "warning" | "critical" | "in_maintenance" | "offline";

export type MachineType = 
  | "CNC Milling Station (L-Series)"
  | "CNC High-Torque Station (M-Series)"
  | "Precision Lathe (H-Series)"
  | "Industrial Induction Motor (3-Phase)"
  | "Coolant Centrifugal Pump"
  | "Hydraulic Press Actuator";

export interface SensorTelemetry {
  timestamp: number; // Unix ms
  airTempC: number;
  processTempC: number;
  tempDiffC: number;
  rotationalSpeedRpm: number;
  torqueNm: number;
  toolWearMin: number;
  powerKw: number;
  vibrationRmsMmS: number; // ISO 10816 vibration severity (mm/s)
  vibrationPeakG?: number;
  motorCurrentA?: number;
  efficiencyPct?: number;
}

export interface ContributingSignal {
  signal: string;
  category: "thermal" | "vibration" | "mechanical" | "electrical" | "wear";
  deviationLevel: "slight" | "moderate" | "severe" | "extreme";
  observedValue: string;
  nominalRange: string;
  description: string;
  weightPct: number;
}

export interface RiskAssessment {
  estimatedRiskPct: number; // 0 to 100
  riskCategory: RiskCategory;
  healthScorePct: number; // 100 - risk or condition-weighted
  confidencePct: number; // 0 to 100 transparent confidence metric based on sensor coverage and historical baseline stability
  isAnomalyDetected: boolean;
  anomalyScore: number; // 0.0 to 1.0
  contributingSignals: ContributingSignal[];
  explanation: string;
  recommendedAction: string;
  recommendedInspectionType: "Bearing & Rotor Check" | "Thermal & Cooling Loop" | "Tool Wear Replacement" | "Power Supply & Harmonics" | "Dynamic Balancing & Alignment" | "Routine Operational Inspection";
  urgency: "Routine (within 30 days)" | "Scheduled (within 7 days)" | "Urgent (within 48 hours)" | "Immediate (within 4 hours)";
}

export interface MachineRecord {
  id: string; // e.g., "MTR-104", "CNC-208"
  serialNumber: string;
  name: string;
  type: MachineType;
  area: "Machining Bay A" | "Machining Bay B" | "Assembly Line 1" | "Power Plant & Utilities" | "Pumping Station";
  status: MachineStatus;
  currentTelemetry: SensorTelemetry;
  riskAssessment: RiskAssessment;
  lastInspectionDate: number; // Unix ms
  nextInspectionScheduledDate: number; // Unix ms
  telemetryHistory: SensorTelemetry[]; // Last 24-48 historical points
  activeAlertCount: number;
  installedDate: number;
  dataSource: "dataset-derived" | "simulated" | "real-time-sensor";
}

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertStatus = "New" | "Acknowledged" | "In Inspection" | "Resolved";

export interface AlertRecord {
  id: string; // e.g. "ALT-2026-091"
  machineId: string;
  machineName: string;
  severity: AlertSeverity;
  issue: string;
  detectedParameter: string;
  riskCategory: RiskCategory;
  estimatedRiskPct: number;
  timestamp: number;
  status: AlertStatus;
  recommendedAction: string;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolvedAt?: number;
  notes?: string;
}

export type MaintenanceStatus = "Scheduled" | "In Progress" | "Completed" | "Deferred" | "Overdue";

export interface MaintenanceAction {
  id: string;
  machineId: string;
  machineName: string;
  title: string;
  triggerType: "Predictive Anomaly" | "Scheduled Preventive" | "Corrective" | "Post-Failure Inspection";
  triggerSignals: string[];
  recommendedAction: string;
  assignedTechnician: string;
  scheduledDate: number;
  completedDate?: number;
  status: MaintenanceStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  estimatedDowntimeHours: number;
  procedureNotes: string;
  rootCauseAnalysis?: string;
  outcomeNotes?: string;
}

export interface DatasetInfo {
  id: string;
  title: string;
  source: string;
  recordCount: number;
  features: string[];
  targetVariables: string[];
  sampleInterval: string;
  machineTypesRepresented: string[];
  scientificReference: string;
  datasetStatus: "Loaded" | "Ready" | "Available";
}
