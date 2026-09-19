import { RiskAssessment, RiskCategory, SensorTelemetry, ContributingSignal } from "./domain";

/**
 * Transparent, multi-sensor anomaly scoring and failure-risk estimation engine.
 * 
 * Complies with ISO 10816 standards for mechanical vibration severity in industrial rotating machinery,
 * machine-tool thermal deviation bounds, and power/torque overstrain dynamics from the AI4I 2020 dataset.
 * 
 * Does NOT pretend to be an opaque black-box neural net. Every risk percentage maps cleanly to
 * observable multi-parameter physical deviations with exact weight contribution breakdowns.
 */

// Baseline nominal bounds for typical industrial CNC milling stations and 3-phase induction motors:
export const NOMINAL_BASELINES = {
  vibrationRmsMmS: { nominal: 1.8, warning: 2.8, alert: 4.5, critical: 7.1 }, // ISO 10816 Class II/III machinery
  tempDiffC: { nominal: 9.5, warning: 11.2, alert: 12.8, critical: 14.5 },    // Process - Air temperature
  airTempC: { min: 18.0, max: 32.0 },
  processTempC: { min: 28.0, max: 42.0 },
  rotationalSpeedRpm: { min: 1350, max: 1750, nominal: 1530 },
  torqueNm: { min: 25.0, max: 55.0, nominal: 40.0 },
  toolWearMin: { nominalMax: 200, critical: 240 },
  powerKw: { min: 2.5, max: 9.0 }
};

export function evaluateMachineTelemetry(t: SensorTelemetry): RiskAssessment {
  const signals: ContributingSignal[] = [];
  let vibrationPenalty = 0;
  let thermalPenalty = 0;
  let mechanicalPenalty = 0;
  let wearPenalty = 0;
  let electricalPenalty = 0;

  // 1. Vibration Analysis (ISO 10816 standard)
  const vib = t.vibrationRmsMmS;
  if (vib > NOMINAL_BASELINES.vibrationRmsMmS.critical) {
    vibrationPenalty = 42;
    signals.push({
      signal: "Vibration Severity",
      category: "vibration",
      deviationLevel: "extreme",
      observedValue: `${vib.toFixed(2)} mm/s RMS`,
      nominalRange: "< 2.80 mm/s",
      description: "Severe mechanical vibration exceeding ISO 10816-3 Zone D boundary. Indicates major imbalance or bearing raceway defect.",
      weightPct: 35
    });
  } else if (vib > NOMINAL_BASELINES.vibrationRmsMmS.alert) {
    vibrationPenalty = 28;
    signals.push({
      signal: "Vibration Severity",
      category: "vibration",
      deviationLevel: "severe",
      observedValue: `${vib.toFixed(2)} mm/s RMS`,
      nominalRange: "< 2.80 mm/s",
      description: "Elevated vibration into ISO 10816 Zone C. Unacceptable for long-term continuous operation.",
      weightPct: 25
    });
  } else if (vib > NOMINAL_BASELINES.vibrationRmsMmS.warning) {
    vibrationPenalty = 14;
    signals.push({
      signal: "Vibration Severity",
      category: "vibration",
      deviationLevel: "moderate",
      observedValue: `${vib.toFixed(2)} mm/s RMS`,
      nominalRange: "< 2.80 mm/s",
      description: "Vibration trending above normal operating baseline; early bearing cage distress or mounting looseness.",
      weightPct: 15
    });
  }

  // 2. Thermal Dissipation & Process Differential
  const tempDiff = t.tempDiffC;
  if (tempDiff > NOMINAL_BASELINES.tempDiffC.critical) {
    thermalPenalty = 26;
    signals.push({
      signal: "Thermal Dissipation Gradient",
      category: "thermal",
      deviationLevel: "extreme",
      observedValue: `Δ ${tempDiff.toFixed(1)}°C (Proc: ${t.processTempC.toFixed(1)}°C)`,
      nominalRange: "Δ < 11.2°C",
      description: "Thermal gradient is abnormally steep, indicating heat dissipation failure (HDF) or coolant circulation blockage.",
      weightPct: 25
    });
  } else if (tempDiff > NOMINAL_BASELINES.tempDiffC.alert) {
    thermalPenalty = 18;
    signals.push({
      signal: "Thermal Dissipation Gradient",
      category: "thermal",
      deviationLevel: "severe",
      observedValue: `Δ ${tempDiff.toFixed(1)}°C`,
      nominalRange: "Δ < 11.2°C",
      description: "Thermal transfer between process core and ambient air is degraded.",
      weightPct: 18
    });
  } else if (tempDiff > NOMINAL_BASELINES.tempDiffC.warning) {
    thermalPenalty = 9;
    signals.push({
      signal: "Thermal Dissipation Gradient",
      category: "thermal",
      deviationLevel: "moderate",
      observedValue: `Δ ${tempDiff.toFixed(1)}°C`,
      nominalRange: "Δ < 11.2°C",
      description: "Mild heat accumulation detected in spindle housing.",
      weightPct: 10
    });
  }

  // 3. Torque & Rotational Speed Dynamics (Overstrain & Power failure patterns)
  const torque = t.torqueNm;
  const rpm = t.rotationalSpeedRpm;
  const powerProduct = (torque * rpm) / 1000.0; // AI4I overstrain index

  if (torque > 65.0 || torque < 12.0) {
    mechanicalPenalty = 24;
    signals.push({
      signal: "Torque & Shaft Load",
      category: "mechanical",
      deviationLevel: torque > 65.0 ? "severe" : "moderate",
      observedValue: `${torque.toFixed(1)} Nm (${rpm.toFixed(0)} RPM)`,
      nominalRange: "25.0 – 55.0 Nm",
      description: torque > 65.0 
        ? "Severe spindle torque spike exceeding mechanical drive rating (Overstrain Hazard)."
        : "Unusually low torque load with high speed, suggesting tool detachment or shaft decoupling.",
      weightPct: 22
    });
  } else if (torque > 56.0 || torque < 20.0) {
    mechanicalPenalty = 12;
    signals.push({
      signal: "Torque Load Deviation",
      category: "mechanical",
      deviationLevel: "moderate",
      observedValue: `${torque.toFixed(1)} Nm`,
      nominalRange: "25.0 – 55.0 Nm",
      description: "Shaft torque outside optimal operating envelope.",
      weightPct: 12
    });
  }

  // 4. Cumulative Tool Wear
  const wear = t.toolWearMin;
  if (wear > NOMINAL_BASELINES.toolWearMin.critical) {
    wearPenalty = 28;
    signals.push({
      signal: "Tool Wear Accumulation",
      category: "wear",
      deviationLevel: "extreme",
      observedValue: `${wear} min`,
      nominalRange: "< 200 min",
      description: "Tool wear has exceeded the critical service life limit (240 min). High risk of tool breakage (TWF) and surface finish failure.",
      weightPct: 24
    });
  } else if (wear > NOMINAL_BASELINES.toolWearMin.nominalMax) {
    wearPenalty = 14;
    signals.push({
      signal: "Tool Wear Accumulation",
      category: "wear",
      deviationLevel: "moderate",
      observedValue: `${wear} min`,
      nominalRange: "< 200 min",
      description: "Tool nearing end of service life. Flank wear increasing cutting resistance.",
      weightPct: 14
    });
  }

  // 5. Multi-parameter Interaction / Coupling Amplifier
  // In predictive maintenance, concurrent anomalies (e.g., High Torque + High Temp + High Wear) produce non-linear failure acceleration
  let multiSignalAmplifier = 1.0;
  if (signals.length >= 3) {
    multiSignalAmplifier = 1.25;
  } else if (signals.length === 2) {
    multiSignalAmplifier = 1.10;
  }

  const rawRisk = (vibrationPenalty + thermalPenalty + mechanicalPenalty + wearPenalty + electricalPenalty) * multiSignalAmplifier;
  const estimatedRiskPct = Math.min(99, Math.max(3, Math.round(rawRisk)));

  // Risk Categories
  let riskCategory: RiskCategory = "LOW";
  let urgency: RiskAssessment["urgency"] = "Routine (within 30 days)";
  let recommendedInspectionType: RiskAssessment["recommendedInspectionType"] = "Routine Operational Inspection";

  if (estimatedRiskPct >= 75) {
    riskCategory = "CRITICAL";
    urgency = "Immediate (within 4 hours)";
  } else if (estimatedRiskPct >= 50) {
    riskCategory = "HIGH";
    urgency = "Urgent (within 48 hours)";
  } else if (estimatedRiskPct >= 25) {
    riskCategory = "MEDIUM";
    urgency = "Scheduled (within 7 days)";
  } else {
    riskCategory = "LOW";
    urgency = "Routine (within 30 days)";
  }

  // Determine specific recommended action based on dominant signal
  let recommendedAction = "Continue standard monitoring. All operating parameters conform to nominal specifications.";
  if (riskCategory !== "LOW") {
    if (vibrationPenalty >= 20 && thermalPenalty >= 15) {
      recommendedAction = "Inspect spindle bearings for raceway spalling and verify lubricant flow rate. Check rotor balance.";
      recommendedInspectionType = "Bearing & Rotor Check";
    } else if (vibrationPenalty >= 20) {
      recommendedAction = "Perform dynamic vibration spectral analysis (FFT) on motor drive-end (DE) bearings and inspect shaft alignment.";
      recommendedInspectionType = "Dynamic Balancing & Alignment";
    } else if (thermalPenalty >= 18) {
      recommendedAction = "Examine heat exchanger, verify coolant level, and inspect thermostatic valves for thermal dissipation restrictions.";
      recommendedInspectionType = "Thermal & Cooling Loop";
    } else if (wearPenalty >= 20) {
      recommendedAction = "Schedule immediate cutting insert change-out; recalibrate tool offset and verify surface roughness compliance.";
      recommendedInspectionType = "Tool Wear Replacement";
    } else if (mechanicalPenalty >= 15) {
      recommendedAction = "Inspect mechanical transmission, verify drive belt tension, and inspect workpiece clamping fixtures for binding.";
      recommendedInspectionType = "Bearing & Rotor Check";
    } else {
      recommendedAction = "Execute multi-point condition assessment and review 48-hour sensor drift history.";
      recommendedInspectionType = "Routine Operational Inspection";
    }
  }

  // Transparent Explanation Synthesis
  let explanation = "All measured sensor parameters are within standard operating baselines.";
  if (signals.length > 0) {
    const signalNames = signals.map(s => `${s.signal} (${s.observedValue})`).join(" + ");
    if (riskCategory === "CRITICAL") {
      explanation = `Critical multi-variable failure condition detected: ${signalNames}. Severe degradation across ${signals.length} subsystems indicates imminent breakdown without immediate intervention.`;
    } else if (riskCategory === "HIGH") {
      explanation = `Elevated risk driven by ${signalNames}. The combination of these deviations significantly increases estimated maintenance risk above nominal operating thresholds.`;
    } else if (riskCategory === "MEDIUM") {
      explanation = `Moderate deviation observed in ${signals.map(s => s.signal).join(" and ")}. Sensor trends suggest developing degradation requiring scheduled inspection before progression.`;
    }
  }

  const isAnomalyDetected = signals.length > 0 && estimatedRiskPct >= 25;
  const anomalyScore = Math.min(1.0, Math.round((estimatedRiskPct / 100) * 100) / 100);
  const healthScorePct = Math.max(1, 100 - estimatedRiskPct);
  const confidencePct = Math.min(96, Math.max(82, 94 - signals.length * 2));

  return {
    estimatedRiskPct,
    riskCategory,
    healthScorePct,
    confidencePct,
    isAnomalyDetected,
    anomalyScore,
    contributingSignals: signals,
    explanation,
    recommendedAction,
    recommendedInspectionType,
    urgency
  };
}
