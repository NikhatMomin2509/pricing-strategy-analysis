# 📊 PriceIQ — Pricing Strategy Analysis using One-Sample t-Test

A full-stack web application that statistically analyzes whether a price reduction leads to a significant increase in daily sales using the **One-Sample t-Test**.

---

## 🚀 Features

- **Enter daily sales data** directly in the browser
- **Adjust price discount** using an interactive slider
- **One-Sample t-Test** via `scipy.stats.ttest_1samp`
- **Results dashboard** with mean, std dev, t-value, p-value, and confidence interval
- **Charts**: Bar chart (daily sales vs expected) + scatter distribution
- **Optimal discount suggestion** based on observed uplift
- **Sample datasets** for quick testing

---

## 📁 Project Structure

```
pricing-strategy-app/
├── app.py                    # Flask backend — routes + t-test logic
├── requirements.txt          # Python dependencies
├── README.md
├── sample_data/
│   └── sample_sales.csv      # Sample sales dataset
├── templates/
│   └── index.html            # Main HTML page
└── static/
    ├── css/
    │   └── style.css         # Styles (dark, editorial theme)
    └── js/
        └── app.js            # Frontend JS — fetch, charts, validation
```

---

## ⚙️ Setup & Run

### 1. Clone / Download the project
```bash
git clone https://github.com/YOUR_USERNAME/pricing-strategy-analysis.git
cd pricing-strategy-analysis
```

### 2. Create a virtual environment (recommended)
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Flask server
```bash
python app.py
```

### 5. Open in browser
```
http://localhost:5000
```

---

## 🔬 How the One-Sample t-Test Works

### Statistical Setup
| Component | Value |
|-----------|-------|
| Null Hypothesis H₀ | μ = μ₀ (mean sales = expected sales) |
| Alternative H₁ | μ > μ₀ (mean sales > expected, i.e., increased) |
| Significance Level | α = 0.05 |
| Test Type | One-tailed (right tail) |

### Formula
```
t = (x̄ − μ₀) / (s / √n)
```
Where:
- `x̄` = sample mean of daily sales
- `μ₀` = expected/baseline mean (default: 100)
- `s` = sample standard deviation
- `n` = number of data points

### Decision Rule
- If `p < 0.05` AND `t > 0` → **Reject H₀** → Sales increased significantly ✅
- If `p ≥ 0.05` → **Fail to Reject H₀** → No significant increase ❌

### Code Implementation (app.py)
```python
from scipy import stats
import numpy as np

sales = np.array([105, 120, 98, 115, 130, ...])
expected_mean = 100

# Two-tailed t-test
t_stat, p_two_tailed = stats.ttest_1samp(sales, expected_mean)

# Convert to one-tailed (right-tail)
p_value = p_two_tailed / 2 if t_stat > 0 else 1 - p_two_tailed / 2

# Decision
if t_stat > 0 and p_value < 0.05:
    print("Sales increased significantly!")
else:
    print("No significant increase.")
```

---

## 📊 Sample Data

Try the built-in sample datasets in the UI:
- 📉 **Low Impact** — sales barely above baseline (no significant increase)
- 📊 **Medium Impact** — moderate uplift (~10–20% above baseline)
- 📈 **High Impact** — strong uplift (~30–50% above baseline, highly significant)

Or load from `sample_data/sample_sales.csv`.

---

## 🎯 Bonus Features Implemented

- [x] Input validation (minimum data points, positive values)
- [x] Optimal discount suggestion based on elasticity heuristic
- [x] Interactive discount slider
- [x] Quick-load sample datasets
- [x] 95% Confidence interval calculation
- [x] Two charts: bar chart + scatter distribution
- [x] Ctrl+Enter keyboard shortcut to run analysis

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask |
| Statistics | scipy.stats, NumPy |
| Frontend | HTML5, CSS3, Vanilla JS |
| Charts | Chart.js v4 |
| Fonts | Google Fonts (DM Serif Display, DM Sans, DM Mono) |

---

## 📝 License

MIT License — free to use for educational projects.
Initial setup done
Initial setup 