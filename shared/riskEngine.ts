import {
  ContributingSignal,
  FaultHypothesis,
  HealthFactor,
  RiskAssessment,
  RiskCategory,
  SensorTelemetry,
} from "./domain";

/**
 * MaintenX hybrid intelligence pipeline:
 * 1) engineering/rule detection, 2) anomaly evidence, 3) probable-fault hypotheses,
 * 4) risk estimation, 5) maintenance recommendation.
 *
 * The engine is intentionally transparent. Each risk estimate can be traced back to
 * health factors and observed deviations. RUL is explicitly a demo estimate until
 * a time-to-event model is trained and evaluated against labeled run-to-failure data.
 */
export const NOMINAL_BASELINES = {
  vibrationRmsMmS: { nominal: 1.8, warning: 2.8, alert: 4.5, critical: 7.1 },
  tempDiffC: { nominal: 9.5, warning: 11.2, alert: 12.8, critical: 14.5 },
  airTempC: { min: 18.0, max: 32.0 },
  processTempC: { min: 28.0, max: 42.0 },
  rotationalSpeedRpm: { min: 1350, max: 1750, nominal: 1530 },
  torqueNm: { min: 25.0, max: 55.0, nominal: 40.0 },
  toolWearMin: { nominalMax: 200, critical: 240 },
  powerKw: { min: 2.5, max: 9.0 },
  currentA: { min: 8.0, max: 18.0, nominal: 13.0 },
  voltageV: { min: 380, max: 420, nominal: 400 },
  loadPct: { min: 20, max: 85, nominal: 55 },
};

function statusForContribution(penalty: number): HealthFactor["status"] {
  if (penalty >= 25) return "critical";
  if (penalty >= 14) return "degraded";
  if (penalty > 0) return "watch";
  return "normal";
}

function deviationLevelForPenalty(penalty: number): ContributingSignal["deviationLevel"] {
  if (penalty >= 30) return "extreme";
  if (penalty >= 20) return "severe";
  if (penalty >= 10) return "moderate";
  return "slight";
}

function makeFactor(
  key: HealthFactor["key"],
  label: string,
  observedValue: string,
  nominalRange: string,
  contributionPct: number,
  basis: HealthFactor["basis"],
  explanation: string,
): HealthFactor {
  return {
    key,
    label,
    observedValue,
    nominalRange,
    contributionPct,
    status: statusForContribution(contributionPct),
    basis,
    explanation,
  };
}

function probableFaults(
  vibrationPenalty: number,
  thermalPenalty: number,
  mechanicalPenalty: number,
  wearPenalty: number,
  currentPenalty: number,
  trendPenalty: number,
): FaultHypothesis[] {
  const candidates: FaultHypothesis[] = [];
  const add = (
    label: FaultHypothesis["label"],
    probabilityPct: number,
    evidence: string[],
  ) => {
    if (probabilityPct <= 0) return;
    candidates.push({
      label,
      probabilityPct: Math.min(92, probabilityPct),
      evidence,
      basis: "derived",
      disclaimer: "Probable issue only; confirm with field inspection and the applicable OEM procedure.",
    });
  };

  if (vibrationPenalty >= 14) {
    add("Abnormal vibration", 35 + vibrationPenalty, ["Vibration exceeds the nominal ISO 10816 operating band"]);
  }
  if (vibrationPenalty >= 20 && trendPenalty > 0) {
    add("Bearing degradation", 38 + Math.round(vibrationPenalty * 0.65), [
      "Vibration severity is elevated",
      "Trend indicates increasing mechanical deviation",
    ]);
  }
  if (thermalPenalty >= 14) {
    add("Overheating", 36 + thermalPenalty, ["Thermal gradient exceeds the expected dissipation envelope"]);
  }
  if (mechanicalPenalty >= 14) {
    add("Overload", 34 + mechanicalPenalty, ["Torque/load is outside the expected operating envelope"]);
  }
  if (vibrationPenalty >= 14 && mechanicalPenalty >= 12) {
    add("Imbalance", 32 + Math.round((vibrationPenalty + mechanicalPenalty) / 3), [
      "Vibration and torque dynamics are abnormal together",
    ]);
  }
  if (wearPenalty >= 14 || thermalPenalty >= 14) {
    add("Lubrication-related concern", 26 + Math.round((wearPenalty + thermalPenalty) / 3), [
      "Wear or heat accumulation could be consistent with lubrication or cooling restriction",
    ]);
  }
  if (currentPenalty >= 14) {
    add("Overload", 30 + currentPenalty, ["Electrical current is outside the nominal load envelope"]);
  }

  const unique = new Map<string, FaultHypothesis>();
  candidates.forEach((candidate) => {
    const existing = unique.get(candidate.label);
    if (!existing || candidate.probabilityPct > existing.probabilityPct) unique.set(candidate.label, candidate);
  });
  const ordered = Array.from(unique.values()).sort((a, b) => b.probabilityPct - a.probabilityPct);
  return ordered.length > 0
    ? ordered.slice(0, 3)
    : [{
        label: "No dominant fault signature",
        probabilityPct: 92,
        evidence: ["Current measured and derived parameters remain within nominal boundaries"],
        basis: "derived",
        disclaimer: "No dominant fault signature detected; continue routine monitoring.",
      }];
}

function estimateRul(riskPct: number, trend: RiskAssessment["degradationTrend"], signalCount: number): RiskAssessment["rulEstimate"] {
  // Transparent demo scenario bands, not a trained prognostics model.
  if (riskPct >= 75) {
    return {
      minDays: 2,
      maxDays: 7,
      label: "2–7 days (demo estimate)",
      basis: "transparent-demo-estimate",
      confidencePct: 46,
      explanation: "High current risk and multiple deviations place this asset in the shortest demo degradation band; no run-to-failure model is asserted.",
    };
  }
  if (riskPct >= 50) {
    return {
      minDays: 18,
      maxDays: 26,
      label: "18–26 days (demo estimate)",
      basis: "transparent-demo-estimate",
      confidencePct: trend === "rapidly increasing" ? 54 : 48,
      explanation: "A moderate-to-high risk state with observed trend evidence maps to the prototype's 18–26 day scenario band.",
    };
  }
  if (riskPct >= 25) {
    return {
      minDays: 45,
      maxDays: 75,
      label: "45–75 days (demo estimate)",
      basis: "transparent-demo-estimate",
      confidencePct: 42,
      explanation: "The prototype estimates a wider inspection window for developing degradation; this is not a dataset-proven lifetime.",
    };
  }
  return {
    minDays: 90,
    maxDays: 120,
    label: "90–120 days (demo estimate)",
    basis: "transparent-demo-estimate",
    confidencePct: Math.max(36, 62 - signalCount * 4),
    explanation: "Nominal telemetry maps to a broad healthy-operation scenario band, not a guaranteed service life.",
  };
}

export function evaluateMachineTelemetry(t: SensorTelemetry): RiskAssessment {
  const signals: ContributingSignal[] = [];
  const healthFactors: HealthFactor[] = [];
  let vibrationPenalty = 0;
  let thermalPenalty = 0;
  let mechanicalPenalty = 0;
  let wearPenalty = 0;
  let currentPenalty = 0;
  let voltagePenalty = 0;
  let loadPenalty = 0;
  let rpmPenalty = 0;
  let trendPenalty = 0;

  const currentA = t.motorCurrentA ?? Math.max(8, Math.min(24, 8 + (t.torqueNm / 50) * 10));
  const voltageV = t.motorVoltageV ?? 400;
  const loadPct = t.loadPct ?? Math.max(15, Math.min(100, (t.torqueNm / 55) * 70));
  const operatingHours = t.operatingHours ?? Math.round(t.toolWearMin * 3.1);
  const vibrationTrendPct = t.vibrationTrendPct ?? 0;
  const temperatureTrendPct = t.temperatureTrendPct ?? 0;

  // Layer 1: engineering-inspired threshold rules.
  const vib = t.vibrationRmsMmS;
  if (vib > NOMINAL_BASELINES.vibrationRmsMmS.critical) {
    vibrationPenalty = 42;
    signals.push({ signal: "Vibration Severity", category: "vibration", deviationLevel: "extreme", observedValue: `${vib.toFixed(2)} mm/s RMS`, nominalRange: "< 2.80 mm/s", description: "Vibration exceeds ISO 10816-3 Zone D; confirm bearing, balance, and alignment condition.", weightPct: 31 });
  } else if (vib > NOMINAL_BASELINES.vibrationRmsMmS.alert) {
    vibrationPenalty = 28;
    signals.push({ signal: "Vibration Severity", category: "vibration", deviationLevel: "severe", observedValue: `${vib.toFixed(2)} mm/s RMS`, nominalRange: "< 2.80 mm/s", description: "Vibration is in a severe band and should not be left in long-term continuous service.", weightPct: 25 });
  } else if (vib > NOMINAL_BASELINES.vibrationRmsMmS.warning) {
    vibrationPenalty = 14;
    signals.push({ signal: "Vibration Severity", category: "vibration", deviationLevel: "moderate", observedValue: `${vib.toFixed(2)} mm/s RMS`, nominalRange: "< 2.80 mm/s", description: "Vibration is above the nominal band; monitor the trend and inspect mounting/bearing condition.", weightPct: 18 });
  }
  if (vibrationTrendPct >= 12) {
    trendPenalty = Math.min(18, Math.round(vibrationTrendPct / 4));
  }

  const tempDiff = t.tempDiffC;
  if (tempDiff > NOMINAL_BASELINES.tempDiffC.critical) {
    thermalPenalty = 26;
    signals.push({ signal: "Thermal Dissipation Gradient", category: "thermal", deviationLevel: "extreme", observedValue: `Δ ${tempDiff.toFixed(1)}°C`, nominalRange: "Δ < 11.2°C", description: "Thermal gradient suggests restricted cooling or abnormal heat generation.", weightPct: 22 });
  } else if (tempDiff > NOMINAL_BASELINES.tempDiffC.alert) {
    thermalPenalty = 18;
    signals.push({ signal: "Thermal Dissipation Gradient", category: "thermal", deviationLevel: "severe", observedValue: `Δ ${tempDiff.toFixed(1)}°C`, nominalRange: "Δ < 11.2°C", description: "Thermal transfer is degraded; inspect cooling and heat rejection path.", weightPct: 18 });
  } else if (tempDiff > NOMINAL_BASELINES.tempDiffC.warning) {
    thermalPenalty = 9;
    signals.push({ signal: "Thermal Dissipation Gradient", category: "thermal", deviationLevel: "moderate", observedValue: `Δ ${tempDiff.toFixed(1)}°C`, nominalRange: "Δ < 11.2°C", description: "Heat accumulation is above the preferred operating band.", weightPct: 12 });
  }
  if (temperatureTrendPct >= 10) trendPenalty = Math.max(trendPenalty, Math.min(14, Math.round(temperatureTrendPct / 4)));

  const torque = t.torqueNm;
  const rpm = t.rotationalSpeedRpm;
  if (torque > 65 || torque < 12) {
    mechanicalPenalty = 24;
    signals.push({ signal: "Torque & Shaft Load", category: "mechanical", deviationLevel: deviationLevelForPenalty(mechanicalPenalty), observedValue: `${torque.toFixed(1)} Nm (${rpm.toFixed(0)} RPM)`, nominalRange: "25.0–55.0 Nm", description: torque > 65 ? "Torque spike exceeds the expected mechanical envelope." : "Low torque with high speed suggests decoupling, slip, or abnormal load transfer.", weightPct: 20 });
  } else if (torque > 56 || torque < 20) {
    mechanicalPenalty = 12;
    signals.push({ signal: "Torque Load Deviation", category: "mechanical", deviationLevel: "moderate", observedValue: `${torque.toFixed(1)} Nm`, nominalRange: "25.0–55.0 Nm", description: "Shaft load is outside the preferred operating envelope.", weightPct: 11 });
  }

  const wear = t.toolWearMin;
  if (wear > NOMINAL_BASELINES.toolWearMin.critical) {
    wearPenalty = 28;
    signals.push({ signal: "Tool Wear Accumulation", category: "wear", deviationLevel: "extreme", observedValue: `${wear} min`, nominalRange: "< 200 min", description: "Tool wear exceeds the prototype's critical service-life boundary.", weightPct: 18 });
  } else if (wear > NOMINAL_BASELINES.toolWearMin.nominalMax) {
    wearPenalty = 14;
    signals.push({ signal: "Tool Wear Accumulation", category: "wear", deviationLevel: "moderate", observedValue: `${wear} min`, nominalRange: "< 200 min", description: "Tool is approaching the service-life boundary and can raise cutting resistance.", weightPct: 13 });
  }

  if (currentA > NOMINAL_BASELINES.currentA.max || currentA < NOMINAL_BASELINES.currentA.min) {
    currentPenalty = currentA > 22 ? 20 : 12;
    signals.push({ signal: "Motor Current", category: "electrical", deviationLevel: deviationLevelForPenalty(currentPenalty), observedValue: `${currentA.toFixed(1)} A`, nominalRange: "8–18 A", description: "Current is outside the derived motor-load envelope; confirm actual phase current and load.", weightPct: 10 });
  }
  if (voltageV < NOMINAL_BASELINES.voltageV.min || voltageV > NOMINAL_BASELINES.voltageV.max) {
    voltagePenalty = 10;
    signals.push({ signal: "Motor Voltage", category: "electrical", deviationLevel: "moderate", observedValue: `${voltageV.toFixed(0)} V`, nominalRange: "380–420 V", description: "Voltage is outside the nominal three-phase supply band.", weightPct: 8 });
  }
  if (loadPct > NOMINAL_BASELINES.loadPct.max || loadPct < NOMINAL_BASELINES.loadPct.min) {
    loadPenalty = loadPct > 92 ? 14 : 7;
    signals.push({ signal: "Operating Load", category: "mechanical", deviationLevel: deviationLevelForPenalty(loadPenalty), observedValue: `${loadPct.toFixed(0)}%`, nominalRange: "20–85%", description: "Operating load is outside the preferred duty window.", weightPct: 9 });
  }
  if (rpm < NOMINAL_BASELINES.rotationalSpeedRpm.min || rpm > NOMINAL_BASELINES.rotationalSpeedRpm.max) {
    rpmPenalty = 8;
    signals.push({ signal: "Rotational Speed", category: "mechanical", deviationLevel: "moderate", observedValue: `${rpm.toFixed(0)} RPM`, nominalRange: "1350–1750 RPM", description: "Speed is outside the derived operating envelope; correlate with torque before action.", weightPct: 7 });
  }

  healthFactors.push(
    makeFactor("vibration", "Vibration deviation", `${vib.toFixed(2)} mm/s RMS`, "< 2.80 mm/s", vibrationPenalty, "derived", "Compared with ISO 10816-inspired severity bands."),
    makeFactor("temperature", "Temperature gradient", `Δ ${tempDiff.toFixed(1)}°C`, "< 11.2°C", thermalPenalty, "derived", "Process-to-air differential used as a heat-dissipation proxy."),
    makeFactor("current", "Motor current", `${currentA.toFixed(1)} A`, "8–18 A", currentPenalty, t.motorCurrentA === undefined ? "derived" : "measured", "Measured when available; otherwise derived from torque for the demo."),
    makeFactor("voltage", "Motor voltage", `${voltageV.toFixed(0)} V`, "380–420 V", voltagePenalty, t.motorVoltageV === undefined ? "derived" : "measured", "Measured when available; otherwise held at the nominal three-phase reference."),
    makeFactor("load", "Operating load", `${loadPct.toFixed(0)}%`, "20–85%", loadPenalty, t.loadPct === undefined ? "derived" : "measured", "Load is derived from torque when a load channel is unavailable."),
    makeFactor("rpm", "Rotational speed", `${rpm.toFixed(0)} RPM`, "1350–1750 RPM", rpmPenalty, "measured", "Compared with the machine profile's operating envelope."),
    makeFactor("runtime", "Operating runtime", `${operatingHours.toLocaleString()} h`, "Profile-specific", Math.min(8, Math.round(operatingHours / 5000)), "derived", "Runtime is a demo proxy derived from the tool-wear/runtime profile."),
    makeFactor("trend", "Degradation trend", `Vibration +${vibrationTrendPct.toFixed(0)}% / Temp +${temperatureTrendPct.toFixed(0)}%`, "Stable or declining", trendPenalty, "derived", "Trend contribution is derived from the historical replay window."),
  );

  const anomalySignal = signals.length > 0;
  const signalCount = signals.length;
  const multiSignalAmplifier = signalCount >= 4 ? 1.22 : signalCount >= 2 ? 1.10 : 1.0;
  const rawRisk = (vibrationPenalty + thermalPenalty + mechanicalPenalty + wearPenalty + currentPenalty + voltagePenalty + loadPenalty + rpmPenalty + trendPenalty) * multiSignalAmplifier;
  const estimatedRiskPct = Math.min(99, Math.max(3, Math.round(rawRisk)));

  let riskCategory: RiskCategory = "LOW";
  let urgency: RiskAssessment["urgency"] = "Routine (within 30 days)";
  let maintenancePriority: RiskAssessment["maintenancePriority"] = "P4";
  if (estimatedRiskPct >= 75) {
    riskCategory = "CRITICAL";
    urgency = "Immediate (within 4 hours)";
    maintenancePriority = "P1";
  } else if (estimatedRiskPct >= 50) {
    riskCategory = "HIGH";
    urgency = "Urgent (within 48 hours)";
    maintenancePriority = "P1";
  } else if (estimatedRiskPct >= 25) {
    riskCategory = "MEDIUM";
    urgency = "Scheduled (within 7 days)";
    maintenancePriority = "P2";
  } else if (estimatedRiskPct >= 12) {
    maintenancePriority = "P3";
  }

  const degradationTrend: RiskAssessment["degradationTrend"] =
    trendPenalty >= 10 ? "rapidly increasing" : trendPenalty > 0 || signalCount >= 2 ? "increasing" : signalCount === 1 ? "watch" : "stable";
  const faults = probableFaults(vibrationPenalty, thermalPenalty, mechanicalPenalty, wearPenalty, currentPenalty, trendPenalty);
  const primaryFault = faults[0];
  const primaryAnomaly = signals[0]?.signal || "No abnormal deviation detected";

  let recommendedAction = "Continue standard monitoring. Current parameters are within the nominal operating envelope.";
  let recommendedInspectionType: RiskAssessment["recommendedInspectionType"] = "Routine Operational Inspection";
  if (riskCategory !== "LOW") {
    if (vibrationPenalty >= 20 && thermalPenalty >= 15) {
      recommendedAction = "Inspect bearing condition and lubrication, then verify rotor balance and cooling flow within the recommended window.";
      recommendedInspectionType = "Bearing & Rotor Check";
    } else if (vibrationPenalty >= 20) {
      recommendedAction = "Inspect bearing and alignment condition; perform a vibration spectrum check before returning the asset to unrestricted duty.";
      recommendedInspectionType = "Dynamic Balancing & Alignment";
    } else if (thermalPenalty >= 18) {
      recommendedAction = "Check cooling loop, heat exchanger, and thermal path for restriction before the next high-load cycle.";
      recommendedInspectionType = "Thermal & Cooling Loop";
    } else if (currentPenalty >= 14 || voltagePenalty >= 8) {
      recommendedAction = "Verify phase current/voltage balance, supply quality, and inverter settings with an electrical specialist.";
      recommendedInspectionType = "Power Supply & Harmonics";
    } else if (wearPenalty >= 14) {
      recommendedAction = "Inspect tool wear and replace the cutting insert within the recommended inspection window.";
      recommendedInspectionType = "Tool Wear Replacement";
    } else {
      recommendedAction = "Run a multi-point condition assessment and review the recent telemetry replay before the next production cycle.";
    }
  }

  let explanation = "All measured and derived parameters remain within standard operating baselines.";
  if (signals.length > 0) {
    const signalNames = signals.slice(0, 3).map((signal) => `${signal.signal} (${signal.observedValue})`).join(" + ");
    explanation = riskCategory === "CRITICAL"
      ? `Critical multi-variable failure condition detected: ${signalNames}. The combined deviations raise estimated maintenance risk and require immediate inspection; this is not a guarantee of failure.`
      : riskCategory === "HIGH"
        ? `Estimated risk is elevated by ${signalNames}. The combination is consistent with a ${primaryFault?.label.toLowerCase()} signature and should be investigated before the next high-load window.`
        : `A developing deviation is present in ${signals.map((signal) => signal.signal).join(" and ")}. The current evidence supports scheduled inspection rather than a definitive diagnosis.`;
  }

  const healthScorePct = Math.max(1, 100 - estimatedRiskPct);
  const confidencePct = Math.min(94, Math.max(58, 86 - signalCount * 2));
  return {
    estimatedRiskPct,
    riskCategory,
    healthScorePct,
    confidencePct,
    isAnomalyDetected: anomalySignal && estimatedRiskPct >= 25,
    anomalyScore: Math.min(1, Math.round((estimatedRiskPct / 100) * 100) / 100),
    primaryAnomaly,
    healthFactors: [
      ...healthFactors,
      makeFactor("anomaly", "Detected anomaly evidence", `${signalCount} contributing signal${signalCount === 1 ? "" : "s"}`, "No active anomaly", Math.min(18, signalCount * 4), "derived", "Count of rule and trend signals used in the current risk estimate."),
    ],
    contributingSignals: signals,
    probableFaults: faults,
    rulEstimate: estimateRul(estimatedRiskPct, degradationTrend, signalCount),
    maintenancePriority,
    degradationTrend,
    explanation,
    recommendedAction,
    recommendedInspectionType,
    urgency,
  };
}
