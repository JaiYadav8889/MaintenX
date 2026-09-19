import fs from "fs";
import path from "path";
import { DatasetInfo } from "../shared/domain";

export type RealDatasetManifest = {
  generatedAt: string;
  processingContract: string;
  ai4i: {
    datasetId: string;
    datasetName: string;
    sourceFile: string;
    sourceType: string;
    sourceReference: string;
    recordCount: number;
    columns: string[];
    missingValues: Record<string, number>;
    duplicateRecords: number;
    labels: Record<string, Record<string, number>>;
    numericStats: Record<string, { count: number; min: number; max: number; mean: number; stdev: number }>;
    featureMappings: Array<{ datasetField: string; maintenxConcept: string; processing: string }>;
    preprocessing: string[];
    baselineModel: {
      status: string;
      algorithm: string | null;
      testSize: number | null;
      metrics: Record<string, number> | null;
      confusionMatrix: number[][] | null;
      runtimeModel: {
        numericFeatureOrder: string[];
        numericMeans: number[];
        numericScales: number[];
        typeCategories: string[];
        coefficients: number[];
        intercept: number;
        probabilityNote: string;
      } | null;
      notes: string | null;
    };
    analysisStatus: string;
    sampleRows: Array<Record<string, string>>;
  };
  soonPemp: {
    datasetId: string;
    datasetName: string;
    sourceFile: string;
    sourceType: string;
    sourceReference: string;
    fileCount: number;
    recordCount: number;
    columns: string[];
    labels: string[];
    missingValues: Record<string, number>;
    featureMappings: Array<{ datasetField: string; maintenxConcept: string; processing: string }>;
    preprocessing: string[];
    aggregates: Array<{ category: string; fileCount: number; recordCount: number; meanCenteredVectorRms: number; meanCenteredVectorPeak: number; meanCrestFactor: number; relativeRmsVsNormalPct: number | null }>;
    files: Array<{ name: string; recordCount: number; category: string; operatingLoad: string; electricalCondition: string; features: Record<string, unknown> }>;
    analysisStatus: string;
  };
};

const manifestPath = path.resolve(process.cwd(), "data/real_dataset_manifest.json");
let cachedManifest: RealDatasetManifest | null | undefined;

export function getRealDatasetManifest(): RealDatasetManifest | null {
  if (cachedManifest !== undefined) return cachedManifest;
  try {
    if (!fs.existsSync(manifestPath)) {
      cachedManifest = null;
      return cachedManifest;
    }
    cachedManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as RealDatasetManifest;
    return cachedManifest;
  } catch (error) {
    console.warn("[Datasets] Failed to load real dataset manifest:", error);
    cachedManifest = null;
    return cachedManifest;
  }
}

export function getRealDatasetCatalog(): DatasetInfo[] {
  const manifest = getRealDatasetManifest();
  if (!manifest) return [];
  const ai4iLabels = Object.keys(manifest.ai4i.labels).filter((label) => label !== "Type");
  return [
    {
      id: manifest.ai4i.datasetId,
      title: manifest.ai4i.datasetName,
      source: manifest.ai4i.sourceReference,
      recordCount: manifest.ai4i.recordCount,
      features: ["Air temperature [K]", "Process temperature [K]", "Rotational speed [rpm]", "Torque [Nm]", "Tool wear [min]", "Type"],
      targetVariables: ai4iLabels,
      sampleInterval: "Production-cycle records; no wall-clock timestamp in uploaded CSV",
      machineTypesRepresented: ["L: 6,000", "M: 2,997", "H: 1,003"],
      scientificReference: manifest.ai4i.sourceReference,
      datasetStatus: "Loaded",
      analysisStatus: manifest.ai4i.analysisStatus,
      provenance: manifest.ai4i.sourceFile,
      actualColumns: manifest.ai4i.columns,
      availableLabels: ai4iLabels,
    },
    {
      id: manifest.soonPemp.datasetId,
      title: manifest.soonPemp.datasetName,
      source: manifest.soonPemp.sourceReference,
      recordCount: manifest.soonPemp.recordCount,
      features: ["Timestamp", "AccX", "AccY", "AccZ", "Centered vector RMS", "Centered vector peak", "Crest factor"],
      targetVariables: manifest.soonPemp.labels,
      sampleInterval: "Source timestamp ticks retained; physical sampling rate not asserted",
      machineTypesRepresented: ["m1 test asynchronous induction motor", "m2 background motor context in selected experiments"],
      scientificReference: manifest.soonPemp.sourceReference,
      datasetStatus: "Loaded",
      analysisStatus: manifest.soonPemp.analysisStatus,
      provenance: manifest.soonPemp.sourceFile,
      actualColumns: manifest.soonPemp.columns,
      availableLabels: manifest.soonPemp.labels,
    },
  ];
}

export function getRealDatasetStatus() {
  const manifest = getRealDatasetManifest();
  if (!manifest) {
    return { loaded: false, message: "Real uploaded dataset manifest is unavailable." };
  }
  return {
    loaded: true,
    generatedAt: manifest.generatedAt,
    processingContract: manifest.processingContract,
    catalogs: getRealDatasetCatalog(),
    ai4i: {
      model: manifest.ai4i.baselineModel,
      numericStats: manifest.ai4i.numericStats,
      missingValues: manifest.ai4i.missingValues,
      duplicateRecords: manifest.ai4i.duplicateRecords,
      featureMappings: manifest.ai4i.featureMappings,
      preprocessing: manifest.ai4i.preprocessing,
      labels: manifest.ai4i.labels,
      samples: manifest.ai4i.sampleRows,
    },
    soonPemp: {
      fileCount: manifest.soonPemp.fileCount,
      recordCount: manifest.soonPemp.recordCount,
      aggregates: manifest.soonPemp.aggregates,
      featureMappings: manifest.soonPemp.featureMappings,
      preprocessing: manifest.soonPemp.preprocessing,
      files: manifest.soonPemp.files,
    },
  };
}

export type AI4IRuntimeInput = {
  airTempK: number;
  processTempK: number;
  rpm: number;
  torqueNm: number;
  toolWearMin: number;
  type: "L" | "M" | "H";
};

export function predictAI4IFailure(input: AI4IRuntimeInput) {
  const manifest = getRealDatasetManifest();
  const runtimeModel = manifest?.ai4i.baselineModel.runtimeModel;
  if (!runtimeModel) {
    return {
      available: false as const,
      datasetId: "ai4i-2020-uploaded",
      label: "unavailable",
      probabilityPct: null,
      note: "The exported benchmark model parameters are unavailable.",
    };
  }

  const numericValues = [input.airTempK, input.processTempK, input.rpm, input.torqueNm, input.toolWearMin];
  const standardized = numericValues.map((value, index) => (value - runtimeModel.numericMeans[index]) / (runtimeModel.numericScales[index] || 1));
  const encodedType = runtimeModel.typeCategories.map((category) => category === input.type ? 1 : 0);
  const features = [...standardized, ...encodedType];
  const logit = runtimeModel.intercept + features.reduce((sum, value, index) => sum + value * (runtimeModel.coefficients[index] || 0), 0);
  const probability = 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, logit))));
  return {
    available: true as const,
    datasetId: "ai4i-2020-uploaded",
    label: probability >= 0.5 ? "Machine failure likely" : "Machine failure not likely",
    predictedFailure: probability >= 0.5,
    probabilityPct: Math.round(probability * 10000) / 100,
    threshold: 0.5,
    model: "Holdout-benchmark logistic regression",
    basis: "model-prediction" as const,
    note: runtimeModel.probabilityNote,
  };
}
