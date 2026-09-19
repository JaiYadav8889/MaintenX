import csv
import json
import os

ai4i_csv = '/home/ubuntu/maintenx/data/ai4i2020.csv'

rows = []
with open(ai4i_csv, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for r in reader:
        rows.append(r)

print(f"Total AI4I rows: {len(rows)}")
first = rows[0]
print("Columns:", list(first.keys()))

# Check failure counts
failures = [r for r in rows if r.get('Machine failure') == '1']
print(f"Failures in AI4I: {len(failures)} out of {len(rows)}")
for f in failures[:5]:
    print("Failure example:", {k: f[k] for k in ['Product ID', 'Type', 'Air temperature [K]', 'Process temperature [K]', 'Rotational speed [rpm]', 'Torque [Nm]', 'Tool wear [min]', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF']})
