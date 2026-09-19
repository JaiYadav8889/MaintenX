import { describe, expect, it } from "vitest";
import { evaluateMachineTelemetry, NOMINAL_BASELINES } from "../shared/riskEngine";
import { SensorTelemetry } from "../shared/domain";

describe("MaintenX Transparent Risk Engine", () => {
  it("evaluates healthy operating baseline as LOW risk", () => {
    const nominalTelemetry: SensorTelemetry = {
      timestamp: Date.now(),
      airTempC: 22.0,
      processTempC: 31.0,
      tempDiffC: 9.0, // within nominal < 11.2
      rotationalSpeedRpm: 1530,
      torqueNm: 40.0,
      toolWearMin: 35,
      powerKw: 6.4,
      vibrationRmsMmS: 1.45 // within ISO nominal < 2.8
    };

    const assessment = evaluateMachineTelemetry(nominalTelemetry);
    expect(assessment.riskCategory).toBe("LOW");
    expect(assessment.estimatedRiskPct).toBeLessThan(25);
    expect(assessment.isAnomalyDetected).toBe(false);
    expect(assessment.healthScorePct).toBeGreaterThanOrEqual(75);
  });

  it("detects elevated ISO vibration and thermal gradient as HIGH or CRITICAL risk with explanations", () => {
    const degradedTelemetry: SensorTelemetry = {
      timestamp: Date.now(),
      airTempC: 25.0,
      processTempC: 39.5,
      tempDiffC: 14.5, // Critical thermal differential
      rotationalSpeedRpm: 1350,
      torqueNm: 62.0, // High torque overstrain
      toolWearMin: 225, // Critical wear
      powerKw: 8.7,
      vibrationRmsMmS: 6.80 // Critical ISO Zone D vibration
    };

    const assessment = evaluateMachineTelemetry(degradedTelemetry);
    expect(assessment.riskCategory).toBe("CRITICAL");
    expect(assessment.estimatedRiskPct).toBeGreaterThanOrEqual(75);
    expect(assessment.isAnomalyDetected).toBe(true);
    expect(assessment.contributingSignals.length).toBeGreaterThanOrEqual(3);
    
    // Check signal transparency
    const vibSignal = assessment.contributingSignals.find(s => s.signal === "Vibration Severity");
    expect(vibSignal).toBeDefined();
    expect(vibSignal?.observedValue).toContain("6.80 mm/s RMS");
    expect(assessment.explanation).toContain("Critical multi-variable failure condition");
    expect(assessment.recommendedAction).toContain("Inspect");
  });
});
