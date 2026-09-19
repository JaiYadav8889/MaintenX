import zipfile
import csv
import json
import os
import math

zip_path = '/home/ubuntu/maintenx/data/ai4i.zip'
out_dir = '/home/ubuntu/maintenx/data'

if os.path.exists(zip_path):
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(out_dir)
        print("Extracted files:", z.namelist())

# Look for csv
csv_candidates = [f for f in os.listdir(out_dir) if f.endswith('.csv')]
print("Found CSVs:", csv_candidates)
