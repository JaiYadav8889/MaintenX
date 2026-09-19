# MaintenX — Predictive Maintenance Intelligence Platform

> **Tagline:** Detect Earlier. Act Before Failure.  
> **Presented by:** Jai Yadav  
> **Hackathon Edition:** Open-Innovation 24-Hour Prototype Milestone  

MaintenX is a serious, realistic industrial predictive-maintenance platform designed to help maintenance teams identify abnormal machine behavior before unexpected breakdowns occur.

Rather than presenting raw sensor dashboards or black-box neural probabilities, MaintenX translates multi-variable telemetry into transparent failure risk, isolates physical contributing signals, and prioritizes maintenance inspections.

---

## ⚙️ Core Operational Flow

```
[ SENSE ] Machine / Sensor Ingestion
   │
[ DETECT ] Multi-parameter Anomaly Scoring (ISO 10816 & AI4I boundary dynamics)
   │
[ UNDERSTAND ] Multi-signal physical attribution (Vibration, Thermal, Torque, Wear)
   │
[ PREDICT ] Estimated Failure Risk & Health Score (LOW, MEDIUM, HIGH, CRITICAL)
   │
[ ACT ] Operator alert triage, prioritized inspection queue, & work order dispatch
```

---

## 🏭 Ground Truth Datasets Grounding

1. **AI4I 2020 Predictive Maintenance Dataset** (UCI Machine Learning Repository / Matan et al.)
   - 10,000 real production cycle records
   - Air Temperature, Process Temperature, Rotational Speed, Torque, Tool Wear
   - Validated failure modes: Heat Dissipation Failure (HDF), Power Failure (PWF), Tool Wear Failure (TWF), Overstrain Failure (OSF)
2. **Electric Motor Vibrations Dataset** (CHIST-ERA SOON Project / Zenodo DOI: 10.5281/zenodo.6473455)
   - Real vibration accelerometer telemetry for asynchronous industrial induction motors (M1 / M2)
   - Mechanical imbalance, shaft misalignment, and electrical stator resistance faults

---

## 🚀 Architecture & Tech Stack

- **Frontend:** React 19, TypeScript, TailwindCSS v4, Recharts, Lucide Icons, Sonner Notifications, Wouter Client-side Routing
- **Backend / API:** Express 4, tRPC 11 (end-to-end typed contracts), SuperJSON
- **Data & Storage:** In-memory fleet state with benchmark sample persistence, Drizzle ORM schema ready for MySQL/TiDB
- **Evaluation & Tests:** Vitest test suite covering multi-sensor risk evaluation, boundary conditions, and session handlers

---

## 🛠️ Getting Started (Local Development)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Test Suite
```bash
pnpm test
```

### 3. Run Dev Server
```bash
pnpm dev
```
Access the application at `http://localhost:3000`.

### 4. Build for Production
```bash
pnpm check
pnpm build
pnpm start
```

---

## 🧭 Demonstrable Hackathon User Stories

1. **Fleet Condition Overview:** Instant answer to *"Which machine should I inspect first?"* with ranked priority.
2. **Multi-Signal Anomaly Diagnosis:** Plain-English explanation decomposing risk into ISO 10816 vibration severity and thermal dissipation gradients.
3. **Interactive Fault Simulation:** Live simulation stepper enabling evaluators to transition machines across Normal → Warning → High Risk → Critical states and observe real-time downstream alert generation.
4. **Maintenance Action Closure:** Work order dispatch, technician assignment, and post-service condition restoration.
