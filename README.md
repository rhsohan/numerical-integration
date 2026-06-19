# Numerical Integration Solver & Learning Platform

An interactive, production-quality educational web application designed for students, teachers, and researchers to explore the mathematical theories and calculate step-by-step solutions for numerical integration problems.

The platform is built strictly on the academic syllabus and derivations documented in `np1.docx`.

## Technology Stack

* **Structure & UI Layout:** Semantic HTML5 & Bootstrap 5 (Responsive Grid and Styling Components)
* **Icons:** Bootstrap Icons
* **Animations:** AOS Scroll Animation Library
* **Mathematical Rendering:** MathJax (LaTeX-formatted equations)
* **Mathematical Parsing:** Math.js (dynamic expression evaluator)
* **Visual Graphs:** Plotly.js (vector coordinate plotting & geometric shading)

---

## Key Features

1. **Detailed Scroll-Animated Theory:** Includes derivations of the general Newton-Cotes Quadrature formula using Newton's Forward Difference interpolation, comparative matrices, and advantages/disadvantages.
2. **Dynamic Shading Integrations:** Plotly plots are augmented with custom Lagrange quadratic/cubic interpolation coordinates to shade the precise geometric columns (linear trapezoids, Simpson's 1/3 parabolic arcs, and Simpson's 3/8 cubic segments).
3. **Double Input Format:** Switch seamlessly between typing direct mathematical functions (e.g. `exp(x^2)` or `4*x - 3*x^2`) or pasting discrete coordinate table data.
4. **Validation Systems:** Checks math syntax, division by zero, ascending and equal partition spacing, even subintervals (Simpson's 1/3), and multiples of 3 (Simpson's 3/8).
5. **Dark Mode Integration:** Full contrast toggle that propagates style variables and updates Plotly graph themes instantly.
6. **Persistence & Export:** Retains a local storage database of the last 5 calculations (click to reload), enables copying results, and triggers print-formatted print sheets to save as PDF.

---

## Directory Structure

```text
NumericalIntegration/
├── index.html            # Main Landing page & Educational Guide
├── trapezoidal.html      # Trapezoidal Rule Solver & Grapher
├── simpson13.html        # Simpson's 1/3 Rule Solver & Grapher
├── simpson38.html        # Simpson's 3/8 Rule Solver & Grapher
├── about.html            # Informative About Page
├── contact.html          # Contact FAQ & Feedback Form
├── css/
│   ├── style.css         # Custom tokens, theme parameters & print queries
│   └── responsive.css    # Spacing and font viewport adaptations
├── js/
│   ├── main.js           # Shared Theme, AOS, MathJax & History handlers
│   ├── graph.js          # Lagrange interpolation & Plotly integrations
│   ├── trapezoidal.js    # Trapezoidal algorithm & output step builders
│   ├── simpson13.js      # Simpson's 1/3 algorithm & output step builders
│   └── simpson38.js      # Simpson's 3/8 algorithm & output step builders
└── README.md             # Project guidelines and specifications
```

---

## Verification & Academic Examples

The platform includes loaders to execute the specific numerical problems detailed in `np1.docx`:

### 1. Trapezoidal Rule Example
* **Function:** $f(x) = 4x - 3x^2$
* **Interval:** $x \in [0, 1]$ with $n=10$ ($h=0.1$)
* **Exact Analytical Value:** $1.000000$
* **Approximation:** $0.995000$
* **Absolute Error:** $0.005000$

### 2. Simpson's 1/3 Rule Example
* **Function:** $f(x) = \frac{1}{1 + x^2}$
* **Interval:** $x \in [0, 1]$ with $n=6$ ($h = \frac{1}{6}$)
* **Exact Analytical Value:** $\frac{\pi}{4} \approx 0.785398$
* **Approximation:** $0.785398$ (highly accurate)
* **Bonus Feature:** Automatically displays a dynamic $\pi$ estimation card ($4 \times \text{Result} \approx 3.14159265$).

### 3. Simpson's 3/8 Rule Example
* **Function:** $f(x) = e^{x^2}$
* **Interval:** $x \in [0, 1.2]$ with $n=6$ ($h=0.2$)
* **Approximation:** $2.035987$ (matches $y$-coordinates $1.000000, 1.040811, 1.173511, 1.433329, 1.896481, 2.718282, 4.220696$ exactly).

### 4. Cross-Method Comparison Example
* **Integral:** $\int_0^6 \frac{dx}{1+x^2}$ with $h=1$ ($n=6$)
* **Exact Analytical Value:** $\arctan(6) \approx 1.405647$
* **Trapezoidal Rule Result:** $1.410798$
* **Simpson's 1/3 Rule Result:** $1.366173$
* **Simpson's 3/8 Rule Result:** $1.357081$

---

## Usage Instructions

Simply double-click `index.html` to open it in any modern browser (Chrome, Firefox, Safari, Edge). The files run entirely on the client-side using CDNs for math, graph, and style dependencies—no local server setup or `npm install` is required.
