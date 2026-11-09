# 🤖 AI Battery Health & Failure Prediction Agent

This directory provides the modular prediction engine architecture and machine learning pipeline for the **Smart Battery Management System (BMS)** platform.

---

## ⚡ Architectural Overview

The system strictly decouples the **quantitative Machine Learning Prediction Engine** from the **natural language AI Assistant**:

```
┌────────────────────────────────────────────────────────┐
│               Battery Telemetry Stream                 │
│ (voltage, current, temp, SOC, SOH, cycle count, time)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             Signal Processing & Feature Extraction      │
│  1. Temperature Rise Rate (dT/dt in °C/min)            │
│  2. Voltage Sag under load (ΔV_sag, R_int impedance)   │
│  3. Current Variation (RMS, σ_I ripple, peak bursts)   │
│  4. SOC Behavior (dSOC/dt vs Coulomb consistency)      │
│  5. Degradation Trend (ΔSOH/cycle, EOL knee point)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Modular ML Prediction Engine Adapter         │
│  ├── Local Surrogate Ensemble (Random Forest)          │
│  ├── Backend ML Microservice (FastAPI / Node / Express)│
│  └── Pluggable Trained Model (XGBoost / ONNX / LSTM)   │
│                                                        │
│  Outputs:                                              │
│  • Risk Level: Normal / Warning / Critical             │
│  • Predicted SOH (%)                                   │
│  • Failure Probability (%)                             │
│  • Main Detected Reason                                │
│  • Engineering Recommended Action                      │
│  • Sub-risks: Overheating, Over-Current, Voltage Sag   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                AI Battery Assistant                    │
│  Translates technical ML quantitative features and     │
│  predictions into clear, simple human explanations.    │
└────────────────────────────────────────────────────────┘
```

---

## 🔬 1. Extracted Physical Features

| Feature | Physical Meaning | Normal Threshold | Critical Threshold |
|---|---|---|---|
| **Temperature Rise Rate ($dT/dt$)** | Rate of thermal accumulation per minute | $< 0.50^\circ\text{C/min}$ | $> 1.50^\circ\text{C/min}$ |
| **Voltage Sag ($\Delta V_{sag}$)** | Bus voltage droop under discharge & internal impedance | $< 1.20\text{ V}$ | $> 2.40\text{ V}$ |
| **Current Variation ($\sigma_I$)** | Standard deviation and ripple of dynamic load | $\sigma < 6.0\text{ A}$ | $\sigma > 14.0\text{ A}$ or Peak $> 40\text{ A}$ |
| **SOC Behavior** | Discharge linearity and Coulombic efficiency | Linear slope | Sudden capacity cliff |
| **Degradation Trend** | SOH loss per 100 operational cycles | $\le 0.012\% / \text{cycle}$ | $> 0.022\% / \text{cycle}$ or SOH $< 80\%$ |

---

## 🌲 2. Pluggable Machine Learning Models

The prediction engine is designed to support:
1. **Random Forest Classifier / Regressor** (via scikit-learn `.pkl` or ONNX runtime)
2. **XGBoost Gradient Boosted Trees**
3. **LSTM Recurrent Neural Networks** for multi-step time series forecasting

To connect a custom trained model:
- Implement the `predict(feature_data)` method or expose endpoint `POST /api/agent/predict`.
- The engine returns the standardized JSON schema consumed directly by the React dashboard.

---

## 💬 3. AI Battery Assistant

The assistant acts as an expert diagnostic interpreter:
- It explains *why* the ML model flagged a Warning or Critical state.
- Translates electrical terms (voltage sag, impedance, Coulombic efficiency) into everyday analogies.
- Formulates specific step-by-step engineering mitigations (e.g., throttling charge rate, balancing cell delta, improving ventilation).
