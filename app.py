from flask import Flask, render_template, request, jsonify
from scipy import stats
import numpy as np
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        sales_data = data.get('sales_data', [])
        expected_mean = float(data.get('expected_mean', 100))
        discount = float(data.get('discount', 0))

        # Validation
        if not sales_data or len(sales_data) < 2:
            return jsonify({'error': 'Please enter at least 2 data points.'}), 400

        sales = np.array([float(x) for x in sales_data])

        if np.any(sales < 0):
            return jsonify({'error': 'Sales values cannot be negative.'}), 400

        # Statistical calculations
        mean_sales = float(np.mean(sales))
        std_sales = float(np.std(sales, ddof=1))
        n = len(sales)

        # One-sample t-test (one-tailed: H1: mean > expected_mean)
        t_stat, p_two_tailed = stats.ttest_1samp(sales, expected_mean)
        t_stat = float(t_stat)
        # One-tailed p-value (right tail)
        p_value = float(p_two_tailed / 2) if t_stat > 0 else float(1 - p_two_tailed / 2)

        alpha = 0.05
        significant = bool(t_stat > 0 and p_value < alpha)

        # Confidence interval (95%)
        margin = stats.t.ppf(0.975, df=n-1) * (std_sales / np.sqrt(n))
        ci_lower = float(mean_sales - margin)
        ci_upper = float(mean_sales + margin)

        # Optimal discount suggestion
        # Simple heuristic: estimate elasticity from discount vs mean uplift
        baseline = expected_mean
        uplift_pct = ((mean_sales - baseline) / baseline) * 100 if baseline > 0 else 0
        if discount > 0 and uplift_pct > 0:
            elasticity = uplift_pct / discount
            optimal_discount = round(min(50, max(5, 10 * elasticity)), 1)
        else:
            optimal_discount = None

        conclusion = (
            "Sales increased significantly after price reduction! ✅"
            if significant
            else "No significant increase observed. ❌"
        )

        return jsonify({
            'mean': round(mean_sales, 2),
            'std': round(std_sales, 2),
            'n': n,
            't_stat': round(t_stat, 4),
            'p_value': round(p_value, 4),
            'significant': significant,
            'conclusion': conclusion,
            'ci_lower': round(ci_lower, 2),
            'ci_upper': round(ci_upper, 2),
            'uplift_pct': round(uplift_pct, 2),
            'optimal_discount': optimal_discount,
            'sales_data': sales.tolist(),
            'expected_mean': expected_mean,
            'discount': discount
        })

    except ValueError as e:
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
