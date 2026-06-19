/* Numerical Integration Solver - Trapezoidal Rule Script */

document.addEventListener('DOMContentLoaded', () => {
  SolverUI.init({
    method: 'trapezoidal',
    onCalculate: calculateTrapezoidal,
    loadPresetTable: populateDefaultTable
  });
  SolverUI.loadHistoryList();
  
  document.getElementById('btnLoadExample')?.addEventListener('click', loadDefaultExample);
  document.getElementById('btnQuickSolve')?.addEventListener('click', () => {
    loadDefaultExample();
    calculateTrapezoidal();
  });
});

function populateDefaultTable() {
  const tbody = document.getElementById('tableBody');
  const xVals = [0, 1, 2, 3];
  const yVals = [1, 0.5, 0.2, 0.1];
  
  for (let i = 0; i < 4; i++) {
    const inputs = tbody.querySelectorAll(`tr[data-index="${i}"] input`);
    if (inputs.length >= 2) {
      inputs[0].value = xVals[i];
      inputs[1].value = yVals[i];
    }
  }
}

function loadDefaultExample() {
  const isFunction = document.getElementById('typeFunction').checked;
  if (isFunction) {
    document.getElementById('inputFunction').value = "4*x - 3*x^2";
    document.getElementById('inputA').value = "0";
    document.getElementById('inputB').value = "1";
    document.getElementById('inputN').value = "10";
  } else {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    SolverUI.tableRowCount = 0;
    
    const xVals = [0, 1, 2, 3, 4, 5, 6];
    const yVals = [1, 0.5, 0.2, 0.1, (1/17), (1/26), (1/37)];
    
    xVals.forEach((x, i) => {
      SolverUI.addTableRow();
      const inputs = tbody.querySelectorAll(`tr[data-index="${i}"] input`);
      if (inputs.length >= 2) {
        inputs[0].value = x;
        inputs[1].value = Number(yVals[i]).toFixed(6);
      }
    });
  }
  SolverUI.hideError();
}

// Main Trapezoidal Calculation Core
function calculateTrapezoidal() {
  SolverUI.hideError();
  const tStart = performance.now();
  
  const isFunction = document.getElementById('typeFunction').checked;
  let exprStr = "";
  let aVal = 0, bVal = 0, nVal = 0, hVal = 0;
  let x_vals = [];
  let y_vals = [];
  let exactValue = null;
  
  if (isFunction) {
    exprStr = document.getElementById('inputFunction').value.trim();
    aVal = parseFloat(document.getElementById('inputA').value);
    bVal = parseFloat(document.getElementById('inputB').value);
    nVal = parseInt(document.getElementById('inputN').value);
    
    // Validations
    if (!exprStr) {
      SolverUI.showError("Please enter a valid mathematical expression for f(x).");
      return;
    }
    if (isNaN(aVal) || isNaN(bVal) || isNaN(nVal)) {
      SolverUI.showError("Please enter valid numerical bounds and divisions.");
      return;
    }
    if (nVal < 1) {
      SolverUI.showError("The number of subintervals (n) must be 1 or greater.");
      return;
    }
    if (aVal >= bVal) {
      SolverUI.showError("The upper limit (b) must be strictly greater than the lower limit (a).");
      return;
    }
    
    // Evaluate function compiling using Math.js
    try {
      const compiled = math.compile(exprStr);
      hVal = (bVal - aVal) / nVal;
      
      // Calculate coordinates
      for (let i = 0; i <= nVal; i++) {
        const x = aVal + i * hVal;
        const y = compiled.evaluate({ x: x });
        if (typeof y !== 'number' || isNaN(y) || !isFinite(y)) {
          SolverUI.showError(`Mathematical error: function is undefined or infinite at point x = ${x.toFixed(4)}. Check for division by zero.`);
          return;
        }
        x_vals.push(x);
        y_vals.push(y);
      }
      
      // Evaluate exact reference integral using high-resolution Romberg/Simpson integration
      exactValue = evaluateExactIntegral(exprStr, aVal, bVal);
    } catch (err) {
      SolverUI.showError(`Parsing Error in f(x): ${err.message}`);
      return;
    }
  } else {
    // Read Table data
    const rows = document.querySelectorAll('#tableBody tr');
    nVal = rows.length - 1;
    
    for (let i = 0; i <= nVal; i++) {
      const inputs = rows[i].querySelectorAll('input');
      const x = parseFloat(inputs[0].value);
      const y = parseFloat(inputs[1].value);
      
      if (isNaN(x) || isNaN(y)) {
        SolverUI.showError(`Coordinate row i = ${i} contains invalid numbers.`);
        return;
      }
      x_vals.push(x);
      y_vals.push(y);
    }
    
    // Validate table equal spacing
    aVal = x_vals[0];
    bVal = x_vals[nVal];
    hVal = x_vals[1] - x_vals[0];
    
    if (hVal <= 0) {
      SolverUI.showError("The x coordinates must be sorted in strictly ascending order.");
      return;
    }
    
    const spacingTolerance = 1e-5;
    for (let i = 1; i < nVal; i++) {
      const currentH = x_vals[i+1] - x_vals[i];
      if (Math.abs(currentH - hVal) > spacingTolerance) {
        SolverUI.showError(`Coordinates are not equally spaced. Difference detected between interval ${i-1} and ${i}. Newton-Cotes methods require equal subintervals.`);
        return;
      }
    }
  }
  
  // Calculate Trapezoidal Rule Sum
  // Formula: I = (h/2) * [ y_0 + y_n + 2 * sum(y_1 ... y_n-1) ]
  let boundarySum = y_vals[0] + y_vals[nVal];
  let interiorSum = 0;
  for (let i = 1; i < nVal; i++) {
    interiorSum += y_vals[i];
  }
  
  const approxValue = (hVal / 2) * (boundarySum + 2 * interiorSum);
  
  // End execution timer
  const tEnd = performance.now();
  const execTime = tEnd - tStart;
  
  // Render step-by-step solutions
  renderSteps({
    isFunction,
    exprStr,
    a: aVal,
    b: bVal,
    n: nVal,
    h: hVal,
    x_vals,
    y_vals,
    boundarySum,
    interiorSum,
    approxValue,
    exactValue,
    execTime
  });
  
  // Save calculation history key
  const historyDetails = {
    type: isFunction ? 'function' : 'table',
    expr: exprStr,
    a: aVal,
    b: bVal,
    n: nVal,
    h: hVal.toFixed(4),
    result: approxValue,
    points: x_vals.map((x, idx) => ({ x: x.toFixed(4), y: y_vals[idx].toFixed(6) }))
  };
  CalcHistory.save('trapezoidal', historyDetails);
  SolverUI.loadHistoryList();
}

function renderSteps(results) {
  const {
    isFunction, exprStr, a, b, n, h, x_vals, y_vals,
    boundarySum, interiorSum, approxValue, exactValue, execTime
  } = results;
  
  // Populate metric values
  document.getElementById('valApprox').innerText = approxValue.toFixed(6);
  if (exactValue !== null) {
    const absErr = Math.abs(exactValue - approxValue);
    document.getElementById('valTrue').innerText = exactValue.toFixed(6);
    document.getElementById('valError').innerText = absErr.toFixed(6);
  } else {
    document.getElementById('valTrue').innerText = 'N/A';
    document.getElementById('valError').innerText = 'N/A';
  }
  
  // Set execution timer text
  document.getElementById('textExecTime').innerHTML = `<i class="bi bi-clock me-1"></i>Execution: ${execTime.toFixed(1)} ms`;
  
  // Set problem statement details
  if (isFunction) {
    let exprLatex = exprStr;
    try {
      exprLatex = math.parse(exprStr).toTex();
    } catch (e) {}
    document.getElementById('textProblemStatement').innerHTML = `
      Evaluate the definite integral approximately by using the <strong>Composite Trapezoidal Rule</strong>:
      $$\\int_{${a}}^{${b}} ${exprLatex} \\, dx$$
    `;
    document.getElementById('textKnownValues').innerHTML = `
      <strong>Known Parameters:</strong> Limits: $a = ${a}, b = ${b}$ | Intervals: $n = ${n}$
    `;
  } else {
    document.getElementById('textProblemStatement').innerHTML = `
      Evaluate the integration of discrete coordinates $(x_i, y_i)$ from $x_0 = ${a}$ to $x_n = ${b}$ using the <strong>Composite Trapezoidal Rule</strong>.
    `;
    document.getElementById('textKnownValues').innerHTML = `
      <strong>Known Parameters:</strong> Data Points: $N = ${x_vals.length}$ | Step size: $h = ${h.toFixed(6)}$
    `;
  }
  
  // Step 1: Step Size Calculation text
  if (isFunction) {
    document.getElementById('step1Formula').innerHTML = `
      $$h = \\frac{b - a}{n} = \\frac{${b} - ${a}}{${n}} = ${h.toFixed(6)}$$
    `;
  } else {
    document.getElementById('step1Formula').innerHTML = `
      Step size $h$ is given directly from the coordinate spacing:
      $$h = x_1 - x_0 = ${x_vals[1]} - ${x_vals[0]} = ${h.toFixed(6)}$$
    `;
  }
  
  // Step 2 & 3 Table rendering
  const stepsBody = document.getElementById('stepsTableBody');
  let tableHtml = '';
  for (let i = 0; i <= n; i++) {
    let weight = 2;
    let typeName = 'Interior';
    let rowClass = 'row-even';
    if (i === 0 || i === n) {
      weight = 1;
      typeName = 'Boundary';
      rowClass = 'row-boundary';
    }
    
    tableHtml += `
      <tr class="${rowClass}">
        <td>${i}</td>
        <td>${x_vals[i].toFixed(4)}</td>
        <td>${y_vals[i].toFixed(6)}</td>
        <td><span class="badge ${i === 0 || i === n ? 'badge-step-boundary' : 'badge-step-even'}">${typeName}</span></td>
      </tr>
    `;
  }
  stepsBody.innerHTML = tableHtml;
  
  // Step 4 substitution text
  document.getElementById('step4Formula').innerHTML = `
    Sum of Boundary Terms ($y_0 + y_n$) <span class="badge badge-step-boundary">Boundary</span>:
    $$y_0 + y_n = ${y_vals[0].toFixed(6)} + ${y_vals[n].toFixed(6)} = ${boundarySum.toFixed(6)}$$
    Sum of Interior Terms <span class="badge badge-step-even">Interior</span>:
    $$\\sum_{i=1}^{n-1} y_i = ${interiorSum.toFixed(6)}$$
    Substituting values into rule formula:
    $$I \\approx \\frac{h}{2} \\left[ (y_0 + y_n) + 2 \\sum_{i=1}^{n-1} y_i \\right]$$
    $$I \\approx \\frac{${h.toFixed(6)}}{2} \\left[ (${boundarySum.toFixed(6)}) + 2(${interiorSum.toFixed(6)}) \\right]$$
  `;
  
  // Step 5 final answer text
  document.getElementById('step5Formula').innerHTML = `
    $$I \\approx ${h/2} \\left[ ${boundarySum.toFixed(6)} + ${(2 * interiorSum).toFixed(6)} \\right] = ${approxValue.toFixed(6)}$$
    The approximate area under the curve is <strong>${approxValue.toFixed(6)}</strong> square units.
  `;
  
  // Trigger MathJax typesetting
  triggerMathJax();
  
  // Render Plotly graph
  const graphData = {
    type: isFunction ? 'function' : 'table',
    expr: exprStr,
    a,
    b,
    x_vals,
    y_vals
  };
  plotNumericalIntegration('plotlyGraph', 'trapezoidal', graphData);
  
  // Toggle visible panels
  document.getElementById('welcomeOutput').classList.add('d-none');
  document.getElementById('solutionOutput').classList.remove('d-none');
  
  // Scroll to solutions top
  document.getElementById('solutionOutput').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
