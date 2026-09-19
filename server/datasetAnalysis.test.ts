import { describe, expect, it } from "vitest";
import { getRealDatasetStatus, getRealDatasetCatalog, predictAI4IFailure } from "./datasetAnalysis";

describe("uploaded dataset analysis", () => {
  it("loads the uploaded AI4I schema and calculated holdout metrics", () => {
    const status = getRealDatasetStatus();
    expect(status.loaded).toBe(true);
    if (!status.loaded) return;

    expect(status.catalogs.find((dataset) => dataset.id === "ai4i-2020-uploaded")?.recordCount).toBe(10000);
    expect(status.ai4i.missingValues).toEqual({
      UDI: 0,
      "Product ID": 0,
      Type: 0,
      "Air temperature [K]": 0,
      "Process temperature [K]": 0,
      "Rotational speed [rpm]": 0,
      "Torque [Nm]": 0,
      "Tool wear [min]": 0,
      "Machine failure": 0,
      TWF: 0,
      HDF: 0,
      PWF: 0,
      OSF: 0,
      RNF: 0,
    });
    expect(status.ai4i.model.status).toBe("calculated");
    expect(status.ai4i.model.testSize).toBe(2000);
    expect(status.ai4i.model.metrics?.f1).toBeCloseTo(0.2419, 4);
    expect(status.ai4i.model.confusionMatrix).toEqual([[1593, 339], [12, 56]]);
    expect(status.ai4i.model.runtimeModel?.coefficients).toHaveLength(8);

    const prediction = predictAI4IFailure({ airTempK: 304.5, processTempK: 313.8, rpm: 2886, torqueNm: 76.6, toolWearMin: 253, type: "H" });
    expect(prediction.available).toBe(true);
    expect(prediction.basis).toBe("model-prediction");
    expect(prediction.probabilityPct).toBeGreaterThan(0);
  });

  it("loads all SOON-pEMP experiments and keeps the source labels separate", () => {
    const status = getRealDatasetStatus();
    expect(status.loaded).toBe(true);
    if (!status.loaded) return;

    expect(status.soonPemp.files).toHaveLength(30);
    expect(status.soonPemp.recordCount).toBe(3532165);
    expect(status.soonPemp.aggregates.find((item) => item.category === "Normal operation")?.relativeRmsVsNormalPct).toBe(0);
    expect(status.soonPemp.preprocessing.some((note) => note.includes("Relative RMS"))).toBe(true);
    expect(status.soonPemp.aggregates.map((item) => item.category)).toEqual([
      "Compound mechanical + electrical fault",
      "Electrical fault",
      "Mechanical fault (shaft imbalance/misalignment context)",
      "Normal operation",
      "Normal operation with load",
    ]);
    expect(status.soonPemp.featureMappings.find((mapping) => mapping.datasetField === "AccX, AccY, AccZ")?.maintenxConcept).toContain("vibration");
  });

  it("returns the real catalog rather than the pre-upload fallback", () => {
    const catalog = getRealDatasetCatalog();
    expect(catalog.map((dataset) => dataset.id)).toEqual(["ai4i-2020-uploaded", "soon-pemp-uploaded"]);
    expect(catalog.every((dataset) => dataset.datasetStatus === "Loaded")).toBe(true);
  });
});
