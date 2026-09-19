export type RiskCategory = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type MachineStatus = "operational" | "warning" | "critical" | "in_maintenance" | "offline";

export type MachineType =
  | "CNC Milling Station (L-Series)"
  | "CNC High-Torque Station (M-Series)"
  | "Precision Lathe (H-Series)"
  | "Industrial Induction Motor (3-Phase)"
  | "Coolant Centrifugal Pump"
  | "Hydraulic Press Actuator";

export type DataBasis = "measured" | "derived" | "simulated";

export interface SensorTelemetry {
  timestamp: number;
  airTempC: number;
  processTempC: number;
  tempDiffC: number;
  rotationalSpeedRpm: number;
  torqueNm: number;
  toolWearMin: number;
  powerKw: number;
  vibrationRmsMmS: number;
  vibrationPeakG?: number;
  motorCurrentA?: number;
  motorVoltageV?: number;
  loadPct?: number;
  operatingHours?: number;
  vibrationTrendPct?: number;
  temperatureTrendPct?: number;
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

export interface HealthFactor {
  key: "vibration" | "temperature" | "current" | "voltage" | "load" | "rpm" | "runtime" | "trend" | "anomaly";
  label: string;
  observedValue: string;
  nominalRange: string;
  contributionPct: number;
  status: "normal" | "watch" | "degraded" | "critical";
  basis: DataBasis;
  explanation: string;
}

export interface FaultHypothesis {
  label: "Bearing degradation" | "Overheating" | "Overload" | "Imbalance" | "Abnormal vibration" | "Lubrication-related concern" | "No dominant fault signature";
  probabilityPct: number;
  evidence: string[];
  basis: DataBasis;
  disclaimer: string;
}

export interface RulEstimate {
  minDays: number;
  maxDays: number;
  label: string;
  basis: "transparent-demo-estimate" | "not-supported-by-current-data";
  confidencePct: number;
  explanation: string;
}

export type DigitalTwinState = "NORMAL" | "AGING" | "DEGRADING" | "HIGH_RISK" | "CRITICAL";

export interface DigitalTwinSnapshot {
  state: DigitalTwinState;
  currentState: string;
  degradationState: string;
  predictedState: string;
  nextExpectedChange: string;
  scenarioMode: "observed" | "maintenance" | "no-maintenance";
  basis: DataBasis;
}

export type MaintenancePriority = "P1" | "P2" | "P3" | "P4";

export interface RiskAssessment {
  estimatedRiskPct: number;
  riskCategory: RiskCategory;
  healthScorePct: number;
  confidencePct: number;
  isAnomalyDetected: boolean;
  anomalyScore: number;
  primaryAnomaly: string;
  healthFactors: HealthFactor[];
  contributingSignals: ContributingSignal[];
  probableFaults: FaultHypothesis[];
  rulEstimate: RulEstimate;
  maintenancePriority: MaintenancePriority;
  degradationTrend: "stable" | "watch" | "increasing" | "rapidly increasing";
  explanation: string;
  recommendedAction: string;
  recommendedInspectionType:
    | "Bearing & Rotor Check"
    | "Thermal & Cooling Loop"
    | "Tool Wear Replacement"
    | "Power Supply & Harmonics"
    | "Dynamic Balancing & Alignment"
    | "Routine Operational Inspection";
  urgency: "Routine (within 30 days)" | "Scheduled (within 7 days)" | "Urgent (within 48 hours)" | "Immediate (within 4 hours)";
}

export interface MachineRecord {
  id: string;
  serialNumber: string;
  name: string;
  type: MachineType;
  area: "Machining Bay A" | "Machining Bay B" | "Assembly Line 1" | "Power Plant & Utilities" | "Pumping Station";
  status: MachineStatus;
  currentTelemetry: SensorTelemetry;
  riskAssessment: RiskAssessment;
  digitalTwin: DigitalTwinSnapshot;
  lastInspectionDate: number;
  nextInspectionScheduledDate: number;
  telemetryHistory: SensorTelemetry[];
  activeAlertCount: number;
  installedDate: number;
  dataSource: "dataset-derived" | "simulated" | "real-time-sensor";
}

export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "New" | "Acknowledged" | "In Inspection" | "Resolved";

export interface AlertRecord {
  id: string;
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

export interface ScenarioPoint {
  day: number;
  vibrationRmsMmS: number;
  tempDiffC: number;
  healthScorePct: number;
  estimatedRiskPct: number;
  riskCategory: RiskCategory;
}

export interface ScenarioAnalysis {
  machineId: string;
  scenario: "maintenance" | "no-maintenance";
  title: string;
  disclaimer: string;
  points: ScenarioPoint[];
  outcome: string;
}
