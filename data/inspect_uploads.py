import csv
import json
import math
import os
import statistics
import zipfile
from collections import Counter, defaultdict

AI4I = "/home/ubuntu/upload/ai4i2020.csv"
SOON = "/home/ubuntu/upload/SOON-pEMP.zip"
OUT = "/home/ubuntu/maintenx/data/upload_inspection.json"


def safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def inspect_ai4i():
    with open(AI4I, "r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = reader.fieldnames or []
        rows = []
        counts = Counter()
        missing = Counter()
        numeric_values = defaultdict(list)
        for row in reader:
            rows.append(row)
            for field in fieldnames:
                value = row.get(field)
                if value is None or value == "":
                    missing[field] += 1
                counts[(field, value)] += 1
                number = safe_float(value)
                if number is not None:
                    numeric_values[field].append(number)

    numeric_summary = {}
    for field, values in numeric_values.items():
        numeric_summary[field] = {
            "min": min(values),
            "max": max(values),
            "mean": statistics.fmean(values),
            "stdev": statistics.pstdev(values) if len(values) > 1 else 0.0,
        }

    categorical_summary = {}
    for field in fieldnames:
        if field not in numeric_values:
            categorical_summary[field] = Counter(row.get(field, "") for row in rows).most_common(20)

    failure_fields = [field for field in fieldnames if "failure" in field.lower() or "machine failure" in field.lower()]
    return {
        "path": AI4I,
        "recordCount": len(rows),
        "columns": fieldnames,
        "missing": dict(missing),
        "numericSummary": numeric_summary,
        "categoricalSummary": categorical_summary,
        "failureDistributions": {field: Counter(row.get(field, "") for row in rows) for field in failure_fields},
        "sampleRows": rows[:5],
    }


def inspect_soon():
    files = []
    all_column_sets = Counter()
    with zipfile.ZipFile(SOON) as archive:
        csv_names = [name for name in archive.namelist() if name.lower().endswith(".csv")]
        for name in csv_names:
            with archive.open(name) as raw:
                text = (line.decode("utf-8", errors="replace") for line in raw)
                reader = csv.reader(text)
                header = next(reader, [])
                first_rows = []
                row_count = 0
                numeric_values = defaultdict(list)
                missing = Counter()
                for row in reader:
                    row_count += 1
                    if len(first_rows) < 3:
                        first_rows.append(row)
                    for i, value in enumerate(row):
                        field = header[i] if i < len(header) else f"column_{i+1}"
                        if value == "":
                            missing[field] += 1
                        number = safe_float(value)
                        if number is not None and len(numeric_values[field]) < 250000:
                            numeric_values[field].append(number)
                all_column_sets[tuple(header)] += 1
                numeric_summary = {}
                for field, values in numeric_values.items():
                    if values:
                        numeric_summary[field] = {
                            "min": min(values),
                            "max": max(values),
                            "mean": statistics.fmean(values),
                            "stdev": statistics.pstdev(values) if len(values) > 1 else 0.0,
                        }
                files.append({
                    "name": name,
                    "recordCount": row_count,
                    "columns": header,
                    "missing": dict(missing),
                    "numericSummary": numeric_summary,
                    "sampleRows": first_rows,
                })

    return {
        "path": SOON,
        "fileCount": len(files),
        "commonColumnSets": [{"columns": list(columns), "files": count} for columns, count in all_column_sets.items()],
        "files": files,
    }


result = {"ai4i": inspect_ai4i(), "soonPemp": inspect_soon()}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as handle:
    json.dump(result, handle, indent=2, default=list)
print(json.dumps({
    "ai4i": {"recordCount": result["ai4i"]["recordCount"], "columns": result["ai4i"]["columns"]},
    "soonPemp": {"fileCount": result["soonPemp"]["fileCount"], "commonColumnSets": result["soonPemp"]["commonColumnSets"]},
}, indent=2))
print(f"Wrote {OUT}")
