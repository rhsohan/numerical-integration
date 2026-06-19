/* Numerical Integration Solver & Learning Platform - Graphing Module */

// Store current plot config globally to allow redrawing on theme change
let currentPlotConfig = null;

window.addEventListener('themechanged', (e) => {
  if (currentPlotConfig) {
    drawGraph(
      currentPlotConfig.containerId,
      currentPlotConfig.method,
      currentPlotConfig.data,
      e.detail.theme
    );
  }
});

/**
 * Main entry point to plot numerical integration
 * @param {string} containerId - The ID of the div to contain the plot
 * @param {string} method - 'trapezoidal', 'simpson13', or 'simpson38'
 * @param {object} data - { type, expr, a, b, x_vals, y_vals }
 */
function plotNumericalIntegration(containerId, method, data) {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  currentPlotConfig = { containerId, method, data };
  drawGraph(containerId, method, data, currentTheme);
}

function drawGraph(containerId, method, data, theme) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const { type, expr, a, b, x_vals, y_vals } = data;
  
  // Theme styling configurations
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e9ecef' : '#222222';
  const gridColor = isDark ? '#2b3940' : '#dee2e6';
  const bgColor = isDark ? '#1c272c' : '#ffffff';
  
  const traces = [];
  
  // 1. Continuous Function Curve f(x) (only if input type is function)
  if (type === 'function' && expr) {
    try {
      const compiledExpr = math.compile(expr);
      const plot_x = [];
      const plot_y = [];
      
      // Add a 10% margin to the sides of the plot for better viewing
      const range = b - a;
      const plot_start = a - range * 0.1;
      const plot_end = b + range * 0.1;
      
      const numPoints = 300;
      const step = (plot_end - plot_start) / numPoints;
      
      for (let i = 0; i <= numPoints; i++) {
        const x = plot_start + i * step;
        try {
          const y = compiledExpr.evaluate({ x: x });
          // Filter out complex or invalid numbers
          if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
            plot_x.push(x);
            plot_y.push(y);
          }
        } catch (e) {
          // Ignore evaluation errors at specific points (e.g. division by zero)
        }
      }
      
      traces.push({
        x: plot_x,
        y: plot_y,
        mode: 'lines',
        name: 'f(x)',
        line: {
          color: '#2b6777',
          width: 3
        }
      });
    } catch (e) {
      console.error("Failed to compile function for plotting:", e);
    }
  } else if (type === 'table') {
    // If table data, draw straight lines connecting points as the pseudo "f(x)"
    traces.push({
      x: x_vals,
      y: y_vals,
      mode: 'lines',
      name: 'Interpolated Line',
      line: {
        color: '#2b6777',
        width: 1.5,
        dash: 'dash'
      }
    });
  }

  // 2. Approximating Shaded Regions
  const n = x_vals.length - 1;
  const shade_x = [];
  const shade_y = [];

  if (method === 'trapezoidal') {
    // Trapezoidal rule: linear interpolation between each (x_i, y_i)
    for (let i = 0; i < n; i++) {
      const x0 = x_vals[i];
      const x1 = x_vals[i+1];
      const y0 = y_vals[i];
      const y1 = y_vals[i+1];
      
      shade_x.push(x0, x0, x1, x1, null);
      shade_y.push(0, y0, y1, 0, null);
    }
  } 
  else if (method === 'simpson13') {
    // Simpson's 1/3 Rule: Parabolic curves for each pair of subintervals
    // Since Simpson's 1/3 requires even subintervals, we group by pairs: (0,1,2), (2,3,4)...
    // If the number of intervals is odd (which is invalid, but we validate earlier), we handle safely.
    for (let i = 0; i < n; i += 2) {
      if (i + 2 <= n) {
        const x0 = x_vals[i], x1 = x_vals[i+1], x2 = x_vals[i+2];
        const y0 = y_vals[i], y1 = y_vals[i+1], y2 = y_vals[i+2];
        
        // Lagrange interpolation for 3 points
        const numEval = 15;
        const h_pair = x2 - x0;
        
        // Start shape at (x0, 0)
        shade_x.push(x0);
        shade_y.push(0);
        
        for (let j = 0; j <= numEval; j++) {
          const x = x0 + (j / numEval) * h_pair;
          const y = Lagrange3(x, x0, x1, x2, y0, y1, y2);
          shade_x.push(x);
          shade_y.push(y);
        }
        
        // Close shape to (x2, 0) and reset with null
        shade_x.push(x2, null);
        shade_y.push(0, null);
      } else {
        // Fallback for an odd trailing interval (use linear trapezoid)
        const x0 = x_vals[i], x1 = x_vals[i+1];
        const y0 = y_vals[i], y1 = y_vals[i+1];
        shade_x.push(x0, x0, x1, x1, null);
        shade_y.push(0, y0, y1, 0, null);
      }
    }
  } 
  else if (method === 'simpson38') {
    // Simpson's 3/8 Rule: Cubic curves for groups of three subintervals
    for (let i = 0; i < n; i += 3) {
      if (i + 3 <= n) {
        const x0 = x_vals[i], x1 = x_vals[i+1], x2 = x_vals[i+2], x3 = x_vals[i+3];
        const y0 = y_vals[i], y1 = y_vals[i+1], y2 = y_vals[i+2], y3 = y_vals[i+3];
        
        // Lagrange interpolation for 4 points
        const numEval = 20;
        const h_group = x3 - x0;
        
        // Start shape at (x0, 0)
        shade_x.push(x0);
        shade_y.push(0);
        
        for (let j = 0; j <= numEval; j++) {
          const x = x0 + (j / numEval) * h_group;
          const y = Lagrange4(x, x0, x1, x2, x3, y0, y1, y2, y3);
          shade_x.push(x);
          shade_y.push(y);
        }
        
        // Close shape to (x3, 0) and reset with null
        shade_x.push(x3, null);
        shade_y.push(0, null);
      } else {
        // Fallback for remaining 1 or 2 intervals at the end
        const rem = n - i;
        if (rem === 1) {
          const x0 = x_vals[i], x1 = x_vals[i+1];
          const y0 = y_vals[i], y1 = y_vals[i+1];
          shade_x.push(x0, x0, x1, x1, null);
          shade_y.push(0, y0, y1, 0, null);
        } else if (rem === 2) {
          const x0 = x_vals[i], x1 = x_vals[i+1], x2 = x_vals[i+2];
          const y0 = y_vals[i], y1 = y_vals[i+1], y2 = y_vals[i+2];
          const numEval = 15;
          const h_pair = x2 - x0;
          shade_x.push(x0);
          shade_y.push(0);
          for (let j = 0; j <= numEval; j++) {
            const x = x0 + (j / numEval) * h_pair;
            const y = Lagrange3(x, x0, x1, x2, y0, y1, y2);
            shade_x.push(x);
            shade_y.push(y);
          }
          shade_x.push(x2, null);
          shade_y.push(0, null);
        }
      }
    }
  }

  // Add the shaded trace to traces
  traces.push({
    x: shade_x,
    y: shade_y,
    fill: 'toself',
    fillcolor: isDark ? 'rgba(82, 171, 152, 0.25)' : 'rgba(82, 171, 152, 0.2)',
    line: {
      color: isDark ? 'rgba(82, 171, 152, 0.5)' : 'rgba(43, 103, 119, 0.4)',
      width: 1.5
    },
    name: 'Approximated Area',
    hoverinfo: 'skip'
  });

  // 3. Partition Node Points
  traces.push({
    x: x_vals,
    y: y_vals,
    mode: 'markers',
    name: 'Partition Points',
    marker: {
      color: '#dc3545',
      size: 8,
      line: {
        color: isDark ? '#ffffff' : '#222222',
        width: 1
      }
    },
    hovertemplate: 'x: %{x:.4f}<br>y: %{y:.6f}<extra></extra>'
  });

  // Layout Configuration
  const layout = {
    backgroundColor: bgColor,
    paper_bgcolor: bgColor,
    plot_bgcolor: bgColor,
    title: {
      text: `Numerical Integration Area Visualizer`,
      font: {
        family: 'Poppins, sans-serif',
        size: 16,
        color: textColor,
        weight: 'bold'
      }
    },
    margin: { l: 50, r: 30, t: 50, b: 50 },
    xaxis: {
      title: 'x',
      titlefont: { color: textColor },
      tickfont: { color: textColor },
      gridcolor: gridColor,
      zerolinecolor: textColor,
      zeroline: true
    },
    yaxis: {
      title: 'y = f(x)',
      titlefont: { color: textColor },
      tickfont: { color: textColor },
      gridcolor: gridColor,
      zerolinecolor: textColor,
      zeroline: true
    },
    legend: {
      font: { color: textColor },
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1
    },
    hovermode: 'closest',
    autosize: true
  };

  const config = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d']
  };

  Plotly.newPlot(container, traces, layout, config);
}

/**
 * Lagrange Quadratic Interpolation helper
 */
function Lagrange3(x, x0, x1, x2, y0, y1, y2) {
  const term0 = y0 * ((x - x1) * (x - x2)) / ((x0 - x1) * (x0 - x2));
  const term1 = y1 * ((x - x0) * (x - x2)) / ((x1 - x0) * (x1 - x2));
  const term2 = y2 * ((x - x0) * (x - x1)) / ((x2 - x0) * (x2 - x1));
  return term0 + term1 + term2;
}

/**
 * Lagrange Cubic Interpolation helper
 */
function Lagrange4(x, x0, x1, x2, x3, y0, y1, y2, y3) {
  const term0 = y0 * ((x - x1) * (x - x2) * (x - x3)) / ((x0 - x1) * (x0 - x2) * (x0 - x3));
  const term1 = y1 * ((x - x0) * (x - x2) * (x - x3)) / ((x1 - x0) * (x1 - x2) * (x1 - x3));
  const term2 = y2 * ((x - x0) * (x - x1) * (x - x3)) / ((x2 - x0) * (x2 - x1) * (x2 - x3));
  const term3 = y3 * ((x - x0) * (x - x1) * (x - x2)) / ((x3 - x0) * (x3 - x1) * (x3 - x2));
  return term0 + term1 + term2 + term3;
}

/**
 * Evaluate numerical reference integral with high precision (Adaptive Simpson's / High resolution)
 * Serves as the "True Value" comparison for error analysis.
 */
function evaluateExactIntegral(expr, a, b) {
  try {
    const compiledExpr = math.compile(expr);
    const N = 10000; // Large number of steps for high accuracy
    const h = (b - a) / N;
    
    // Evaluate using standard Composite Simpson's 1/3 Rule at N=10000 (extremely precise)
    let sumOdd = 0;
    let sumEven = 0;
    
    const y0 = compiledExpr.evaluate({ x: a });
    const yN = compiledExpr.evaluate({ x: b });
    
    for (let i = 1; i < N; i++) {
      const x = a + i * h;
      const y = compiledExpr.evaluate({ x: x });
      if (i % 2 === 0) {
        sumEven += y;
      } else {
        sumOdd += y;
      }
    }
    
    const exact = (h / 3) * (y0 + yN + 4 * sumOdd + 2 * sumEven);
    return exact;
  } catch (e) {
    console.error("Could not calculate reference integral:", e);
    return null;
  }
}

// Global exports for module loading
window.plotNumericalIntegration = plotNumericalIntegration;
window.evaluateExactIntegral = evaluateExactIntegral;
