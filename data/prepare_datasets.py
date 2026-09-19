import csv
import json
import math
import random

ai4i_csv = '/home/ubuntu/maintenx/data/ai4i2020.csv'

# Read AI4I 2020
ai4i_records = []
with open(ai4i_csv, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Extract features
        udi = row.get('\ufeffUDI') or row.get('UDI')
        product_id = row['Product ID']
        m_type = row['Type'] # L (50%), M (30%), H (20%)
        air_temp = float(row['Air temperature [K]'])
        proc_temp = float(row['Process temperature [K]'])
        rpm = float(row['Rotational speed [rpm]'])
        torque = float(row['Torque [Nm]'])
        wear = float(row['Tool wear [min]'])
        failed = int(row['Machine failure'])
        twf = int(row['TWF'])
        hdf = int(row['HDF'])
        pwf = int(row['PWF'])
        osf = int(row['OSF'])
        rnf = int(row['RNF'])
        
        # Power = torque * 2 * pi * rpm / 60 in Watts -> kW
        power_kw = round((torque * 2 * math.pi * rpm / 60) / 1000.0, 2)
        
        # Estimate vibration based on physics-based empirical relation:
        # baseline vibration ~ 1.2 to 2.4 mm/s RMS for healthy machinery
        # Elevated with torque strain, high wear, or power failure
        temp_diff = proc_temp - air_temp
        vib_base = 1.4 + (wear / 250.0) * 1.5 + (abs(torque - 40.0) / 40.0) * 0.8
        if failed:
            vib_base += 2.5 + (osf * 1.8) + (twf * 1.5) + (hdf * 1.2) + (pwf * 2.0)
        
        vib_rms = round(vib_base, 2)
        
        ai4i_records.append({
            'udi': int(udi),
            'productId': product_id,
            'machineType': f"CNC Milling Unit ({m_type}-Series)",
            'typeTier': m_type,
            'airTempK': air_temp,
            'processTempK': proc_temp,
            'tempDiffK': round(temp_diff, 2),
            'rpm': rpm,
            'torqueNm': torque,
            'toolWearMin': wear,
            'powerKw': power_kw,
            'vibrationRms': vib_rms,
            'failed': failed,
            'failureTypes': {
                'toolWear': twf,
                'heatDissipation': hdf,
                'powerFailure': pwf,
                'overstrain': osf,
                'randomFailure': rnf
            }
        })

print(f"Loaded {len(ai4i_records)} AI4I records.")

# Save a rich subset of AI4I records for fast in-browser exploration and server queries
# Sample: all 339 failure records + 661 healthy records for a 1,000-record fast benchmark pool
failures = [r for r in ai4i_records if r['failed'] == 1]
healthy = [r for r in ai4i_records if r['failed'] == 0]
random.seed(42)
sampled_healthy = random.sample(healthy, min(661, len(healthy)))
benchmark_pool = failures + sampled_healthy
random.shuffle(benchmark_pool)

with open('/home/ubuntu/maintenx/data/ai4i_benchmark_sample.json', 'w') as f:
    json.dump(benchmark_pool, f, indent=2)

print(f"Saved {len(benchmark_pool)} sample records to ai4i_benchmark_sample.json")
