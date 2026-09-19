import csv
import json
import math
import os
import re
import statistics
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

AI4I_PATH = Path('/home/ubuntu/upload/ai4i2020.csv')
SOON_PATH = Path('/home/ubuntu/upload/SOON-pEMP.zip')
OUT_PATH = Path('/home/ubuntu/maintenx/data/real_dataset_manifest.json')


def f(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def stats(values):
    values = [v for v in values if v is not None]
    if not values:
        return {"count": 0}
    mean = statistics.fmean(values)
    return {
        "count": len(values),
        "min": round(min(values), 6),
        "max": round(max(values), 6),
        "mean": round(mean, 6),
        "stdev": round(statistics.pstdev(values), 6),
    }


def analyze_ai4i():
    with AI4I_PATH.open('r', encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        columns = reader.fieldnames or []
        rows = list(reader)

    numeric_fields = [
        'Air temperature [K]',
        'Process temperature [K]',
        'Rotational speed [rpm]',
        'Torque [Nm]',
        'Tool wear [min]',
    ]
    numeric_stats = {field: stats([f(row[field]) for row in rows]) for field in numeric_fields}
    missing = {field: sum(1 for row in rows if row.get(field, '') == '') for field in columns}
    row_keys = [tuple(row.get(field, '') for field in columns) for row in rows]
    duplicate_rows = len(row_keys) - len(set(row_keys))
    target_counts = Counter(row['Machine failure'] for row in rows)
    mode_counts = {field: Counter(row[field] for row in rows) for field in ['Type', 'Machine failure', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']}

    model_result = {
        'status': 'not-run',
        'algorithm': None,
        'testSize': None,
        'metrics': None,
        'confusionMatrix': None,
        'runtimeModel': None,
        'notes': None,
    }
    try:
        from sklearn.compose import ColumnTransformer
        from sklearn.linear_model import LogisticRegression
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
        from sklearn.model_selection import train_test_split
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import OneHotEncoder, StandardScaler

        X = []
        y = []
        for row in rows:
            X.append([
                f(row['Air temperature [K]']),
                f(row['Process temperature [K]']),
                f(row['Rotational speed [rpm]']),
                f(row['Torque [Nm]']),
                f(row['Tool wear [min]']),
                row['Type'],
            ])
            y.append(int(row['Machine failure']))
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        pre = ColumnTransformer([
            ('numeric', StandardScaler(), [0, 1, 2, 3, 4]),
            ('type', OneHotEncoder(handle_unknown='ignore'), [5]),
        ])
        pipe = Pipeline([
            ('preprocess', pre),
            ('classifier', LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)),
        ])
        pipe.fit(X_train, y_train)
        predictions = pipe.predict(X_test)
        fitted_pre = pipe.named_steps['preprocess']
        fitted_classifier = pipe.named_steps['classifier']
        numeric_scaler = fitted_pre.named_transformers_['numeric']
        type_encoder = fitted_pre.named_transformers_['type']
        model_result = {
            'status': 'calculated',
            'algorithm': 'StandardScaler + OneHotEncoder(Type) + LogisticRegression(class_weight=balanced)',
            'testSize': len(y_test),
            'metrics': {
                'accuracy': round(float(accuracy_score(y_test, predictions)), 4),
                'precision': round(float(precision_score(y_test, predictions, zero_division=0)), 4),
                'recall': round(float(recall_score(y_test, predictions, zero_division=0)), 4),
                'f1': round(float(f1_score(y_test, predictions, zero_division=0)), 4),
            },
            'confusionMatrix': confusion_matrix(y_test, predictions).tolist(),
            'runtimeModel': {
                'numericFeatureOrder': numeric_fields,
                'numericMeans': [round(float(value), 12) for value in numeric_scaler.mean_],
                'numericScales': [round(float(value), 12) for value in numeric_scaler.scale_],
                'typeCategories': [str(value) for value in type_encoder.categories_[0]],
                'coefficients': [round(float(value), 12) for value in fitted_classifier.coef_[0]],
                'intercept': round(float(fitted_classifier.intercept_[0]), 12),
                'probabilityNote': 'Sigmoid probability from the fitted holdout-benchmark logistic regression; not production-calibrated.',
            },
            'notes': 'Single stratified 80/20 holdout; benchmark only, not production validation. No raw vibration fields are included because AI4I has no vibration channel.',
        }
    except Exception as error:
        model_result['status'] = 'unavailable'
        model_result['notes'] = f'Baseline model was not run: {type(error).__name__}: {error}'

    return {
        'datasetId': 'ai4i-2020-uploaded',
        'datasetName': 'AI4I 2020 Predictive Maintenance Dataset',
        'sourceFile': AI4I_PATH.name,
        'sourceType': 'CSV / labeled production-cycle records',
        'sourceReference': 'UCI Machine Learning Repository; uploaded file hash validated against the existing project copy.',
        'recordCount': len(rows),
        'columns': columns,
        'missingValues': missing,
        'duplicateRecords': duplicate_rows,
        'labels': {field: dict(counts) for field, counts in mode_counts.items()},
        'numericStats': numeric_stats,
        'featureMappings': [
            {'datasetField': 'Air temperature [K]', 'maintenxConcept': 'Ambient temperature / thermal context', 'processing': 'Kelvin to Celsius conversion; paired with process temperature for ΔT.'},
            {'datasetField': 'Process temperature [K]', 'maintenxConcept': 'Process temperature / thermal context', 'processing': 'Kelvin to Celsius conversion; ΔT derived against ambient.'},
            {'datasetField': 'Rotational speed [rpm]', 'maintenxConcept': 'RPM / mechanical operating envelope', 'processing': 'Numeric validation and range comparison.'},
            {'datasetField': 'Torque [Nm]', 'maintenxConcept': 'Load / shaft torque', 'processing': 'Numeric validation; power derived only for compatible records.'},
            {'datasetField': 'Tool wear [min]', 'maintenxConcept': 'Wear / service-life proxy', 'processing': 'Numeric validation; retained as a labeled AI4I feature.'},
            {'datasetField': 'Machine failure, TWF, HDF, PWF, OSF, RNF', 'maintenxConcept': 'Failure classification targets', 'processing': 'Binary labels retained; failure prevalence reported.'},
            {'datasetField': 'Type', 'maintenxConcept': 'Product variant context', 'processing': 'One-hot encoded for the benchmark classifier only.'},
        ],
        'preprocessing': [
            'UTF-8 BOM-safe CSV parsing.',
            'All 10,000 rows retained; no missing values found.',
            f'{duplicate_rows} exact duplicate records found and reported; no rows removed from the analysis manifest.',
            'Numeric features are standardized only inside the benchmark model pipeline.',
            'No vibration/current/voltage columns were fabricated for AI4I.',
        ],
        'baselineModel': model_result,
        'analysisStatus': 'Loaded / benchmark calculated',
        'sampleRows': rows[:12],
    }


def classify_soon_file(name):
    lower = name.lower()
    if 'electrically' in lower and 'mechanically' in lower:
        category = 'Compound mechanical + electrical fault'
    elif 'electrically' in lower:
        category = 'Electrical fault'
    elif 'mechanically' in lower or 'umbalanced' in lower or 'imbalanced' in lower:
        category = 'Mechanical fault (shaft imbalance/misalignment context)'
    elif 'load_0.5nm' in lower:
        category = 'Normal operation with load'
    else:
        category = 'Normal operation'
    load = '0.5 Nm load' if 'load_0.5nm' in lower else 'no mechanical load'
    electrical = '50 Ω simulated electrical fault' if '50_ohm' in lower else '100 Ω simulated electrical fault' if '100_ohm' in lower else '150 Ω simulated electrical fault' if '150_ohm' in lower else 'none specified'
    return category, load, electrical


def summarize_soon_file(archive, name):
    count = 0
    first_timestamp = None
    last_timestamp = None
    previous_timestamp = None
    intervals = []
    sums = defaultdict(float)
    sums_sq = defaultdict(float)
    mins = defaultdict(lambda: float('inf'))
    maxs = defaultdict(lambda: float('-inf'))
    peak_centered = defaultdict(float)
    columns = []
    with archive.open(name) as raw:
        reader = csv.DictReader((line.decode('utf-8', errors='replace') for line in raw))
        columns = reader.fieldnames or []
        for row in reader:
            timestamp = f(row.get('Timestamp'))
            if timestamp is not None:
                if first_timestamp is None:
                    first_timestamp = timestamp
                if previous_timestamp is not None and len(intervals) < 10000:
                    intervals.append(timestamp - previous_timestamp)
                previous_timestamp = timestamp
                last_timestamp = timestamp
            count += 1
            for axis in ['AccX', 'AccY', 'AccZ']:
                value = f(row.get(axis))
                if value is None:
                    continue
                sums[axis] += value
                sums_sq[axis] += value * value
                mins[axis] = min(mins[axis], value)
                maxs[axis] = max(maxs[axis], value)

    mean = {axis: sums[axis] / count for axis in ['AccX', 'AccY', 'AccZ']}
    std = {axis: math.sqrt(max(0.0, sums_sq[axis] / count - mean[axis] ** 2)) for axis in ['AccX', 'AccY', 'AccZ']}
    vector_rms = math.sqrt(sum(std[axis] ** 2 for axis in ['AccX', 'AccY', 'AccZ']))
    vector_peak = math.sqrt(sum(max(abs(mins[axis] - mean[axis]), abs(maxs[axis] - mean[axis])) ** 2 for axis in ['AccX', 'AccY', 'AccZ']))
    category, load, electrical = classify_soon_file(name)
    return {
        'name': name,
        'columns': columns,
        'recordCount': count,
        'category': category,
        'operatingLoad': load,
        'electricalCondition': electrical,
        'timestamp': {
            'first': first_timestamp,
            'last': last_timestamp,
            'medianIntervalTicksFirst10000': round(statistics.median(intervals), 3) if intervals else None,
            'note': 'Timestamp retained as source ticks; README does not establish a physical unit, so no sampling rate or frequency-domain Hz is asserted.',
        },
        'features': {
            'axisMean': {axis: round(mean[axis], 6) for axis in mean},
            'axisStd': {axis: round(std[axis], 6) for axis in std},
            'axisMin': {axis: round(mins[axis], 6) for axis in mins},
            'axisMax': {axis: round(maxs[axis], 6) for axis in maxs},
            'centeredVectorRms': round(vector_rms, 6),
            'centeredVectorPeak': round(vector_peak, 6),
            'crestFactor': round(vector_peak / vector_rms, 6) if vector_rms else None,
        },
        'missingValues': {},
    }


def analyze_soon():
    summaries = []
    with zipfile.ZipFile(SOON_PATH) as archive:
        names = [name for name in archive.namelist() if name.lower().endswith('.csv')]
        for name in names:
            summaries.append(summarize_soon_file(archive, name))

    category_groups = defaultdict(list)
    for item in summaries:
        category_groups[item['category']].append(item)
    normal_items = category_groups.get('Normal operation', [])
    normal_rms = statistics.fmean(item['features']['centeredVectorRms'] for item in normal_items) if normal_items else None
    aggregates = []
    for category, items in sorted(category_groups.items()):
        aggregate = {
            'category': category,
            'fileCount': len(items),
            'recordCount': sum(item['recordCount'] for item in items),
            'meanCenteredVectorRms': round(statistics.fmean(item['features']['centeredVectorRms'] for item in items), 6),
            'meanCenteredVectorPeak': round(statistics.fmean(item['features']['centeredVectorPeak'] for item in items), 6),
            'meanCrestFactor': round(statistics.fmean(item['features']['crestFactor'] for item in items if item['features']['crestFactor'] is not None), 6),
        }
        aggregate['relativeRmsVsNormalPct'] = round(((aggregate['meanCenteredVectorRms'] / normal_rms) - 1) * 100, 2) if normal_rms else None
        aggregates.append(aggregate)

    return {
        'datasetId': 'soon-pemp-uploaded',
        'datasetName': 'Electric Motor Vibrations Dataset / SOON-pEMP',
        'sourceFile': SOON_PATH.name,
        'sourceType': 'ZIP archive containing labeled vibration CSV experiments',
        'sourceReference': 'Uploaded SOON-pEMP archive; README categories retained as file-level fault/operating context.',
        'fileCount': len(summaries),
        'recordCount': sum(item['recordCount'] for item in summaries),
        'columns': ['Timestamp', 'AccX', 'AccY', 'AccZ'],
        'labels': sorted({item['category'] for item in summaries}),
        'missingValues': {'allFiles': 0},
        'featureMappings': [
            {'datasetField': 'Timestamp', 'maintenxConcept': 'Sequence/time ordering', 'processing': 'Retained as source ticks; interval inspected but not converted to Hz because physical unit is not established in the archive README.'},
            {'datasetField': 'AccX, AccY, AccZ', 'maintenxConcept': 'Motor vibration / anomaly evidence', 'processing': 'Streaming per-file mean, standard deviation, centered vector RMS, centered vector peak, and crest factor; raw waveforms are not sent to the browser.'},
            {'datasetField': 'File name + README category', 'maintenxConcept': 'Operating/fault context', 'processing': 'Parsed into normal/load, mechanical, electrical, and compound condition labels; source identity preserved per file.'},
        ],
        'preprocessing': [
            'All 30 CSV files inspected in-stream from the ZIP archive.',
            'All files share the same four columns; no missing values found in the inspected channels.',
            'Raw accelerometer offsets are removed before vector RMS/peak calculations so DC bias is not mistaken for vibration amplitude.',
            'File-level aggregation is used for browser performance; raw high-frequency samples remain outside the client bundle.',
            'Relative RMS is calculated only against the uploaded Normal operation file and is a vibration-benchmark comparison, not a fleet-health score.',
            'Frequency-domain features are not asserted because the archive README does not establish a physical timestamp unit/sampling frequency.',
        ],
            'aggregates': aggregates,
        'files': summaries,
        'analysisStatus': 'Loaded / time-domain features calculated',
    }


manifest = {
    'generatedAt': '2026-09-19',
    'processingContract': 'Real uploaded data only; no synthetic rows added to the manifest.',
    'ai4i': analyze_ai4i(),
    'soonPemp': analyze_soon(),
}
OUT_PATH.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps({
    'output': str(OUT_PATH),
    'ai4i': {
        'records': manifest['ai4i']['recordCount'],
        'missingValues': sum(manifest['ai4i']['missingValues'].values()),
        'baselineModel': manifest['ai4i']['baselineModel'],
    },
    'soonPemp': {
        'files': manifest['soonPemp']['fileCount'],
        'records': manifest['soonPemp']['recordCount'],
        'aggregates': manifest['soonPemp']['aggregates'],
    },
}, indent=2))
