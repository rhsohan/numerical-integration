/* Numerical Integration Solver - Simpson's 3/8 Rule Script */

document.addEventListener('DOMContentLoaded', () => {
  SolverUI.init({
    method: 'simpson38',
    onCalculate: calculateSimpson38,
    loadPresetTable: populateDefaultTable
  });
  SolverUI.loadHistoryList();
  
  document.getElementById('btnLoadExample')?.addEventListener('click', loadDefaultExample);
  document.getElementById('btnQuickSolve')?.addEventListener('click', () => {
    loadDefaultExample();
    calculateSimpson38();
  });
});

function populateDefaultTable() {
  const tbody = document.getElementById('tableBody');
  const xVals = [0, 1, 2, 3, 4, 5, 6];
  const yVals = [1, 0.5, 0.2, 0.1, 1/17, 1/26, 1/37];
  
  for (let i = 0; i < 7; i++) {
    const inputs = tbody.querySelectorAll(`tr[data-index="${i}"] input`);
    if (inputs.length >= 2) {
      inputs[0].value = xVals[i];
      inputs[1].value = Number(yVals[i]).toFixed(6);
    }
  }
}

function loadDefaultExample() {
  const isFunction = document.getElementById('typeFunction').checked;
  if (isFunction) {
    document.getElementById('inputFunction').value = "exp(x^2)";
    document.getElementById('inputA').value = "0";
    document.getElementById('inputB').value = "1.2";
    document.getElementById('inputN').value = "6";
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

// Simpson's 3/8 rule calculation
function calculateSimpson38() {
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
    
    if (!exprStr) {
      SolverUI.showError("Please enter a valid mathematical expression for f(x).");
      return;
    }
    if (isNaN(aVal) || isNaN(bVal) || isNaN(nVal)) {
      SolverUI.showError("Please enter valid numerical bounds and divisions.");
      return;
    }
    if (nVal < 3) {
      SolverUI.showError("The number of subintervals (n) must be 3 or greater.");
      return;
    }
    if (nVal % 3 !== 0) {
      SolverUI.showError("Validation Failed: Simpson's 3/8 Rule requires the number of subintervals (n) to be a MULTIPLE of 3. Please enter a value divisible by 3 (e.g. 3, 6, 9, 12...).");
      return;
    }
    if (aVal >= bVal) {
      SolverUI.showError("The upper limit (b) must be strictly greater than the lower limit (a).");
      return;
    }
    
    try {
      const compiled = math.compile(exprStr);
      hVal = (bVal - aVal) / nVal;
      
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
      
      exactValue = evaluateExactIntegral(exprStr, aVal, bVal);
    } catch (err) {
      SolverUI.showError(`Parsing Error in f(x): ${err.message}`);
      return;
    }
  } else {
    // Read Table data
    const rows = document.querySelectorAll('#tableBody tr');
    nVal = rows.length - 1;
    
    if (nVal % 3 !== 0) {
      SolverUI.showError("Validation Failed: Simpson's 3/8 Rule requires subintervals (n) to be a multiple of 3 (which means the coordinate table rows - 1 must be divisible by 3). Add or delete rows.");
      return;
    }
    
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
        SolverUI.showError("Coordinates are not equally spaced. Newton-Cotes methods require equal subintervals.");
        return;
      }
    }
  }
  
  // Calculate Simpson's 3/8 Rule Sum
  // Formula: I = (3h/8) * [ y_0 + y_n + 3 * sum(y_i where i != 3k) + 2 * sum(y_i where i == 3k) ]
  let boundarySum = y_vals[0] + y_vals[nVal];
  let midSum3 = 0; // coefficients = 3 (not multiples of 3)
  let midSum2 = 0; // coefficients = 2 (multiples of 3)
  
  for (let i = 1; i < nVal; i++) {
    if (i % 3 === 0) {
      midSum2 += y_vals[i];
    } else {
      midSum3 += y_vals[i];
    }
  }
  
  const approxValue = ((3 * hVal) / 8) * (boundarySum + 3 * midSum3 + 2 * midSum2);
  
  const tEnd = performance.now();
  const execTime = tEnd - tStart;
  
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
    midSum3,
    midSum2,
    approxValue,
    exactValue,
    execTime
  });
  
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
  CalcHistory.save('simpson38', historyDetails);
  SolverUI.loadHistoryList();
}

function renderSteps(results) {
  const {
    isFunction, exprStr, a, b, n, h, x_vals, y_vals,
    boundarySum, midSum3, midSum2, approxValue, exactValue, execTime
  } = results;
  
  document.getElementById('valApprox').innerText = approxValue.toFixed(6);
  if (exactValue !== null) {
    const absErr = Math.abs(exactValue - approxValue);
    document.getElementById('valTrue').innerText = exactValue.toFixed(6);
    document.getElementById('valError').innerText = absErr.toFixed(6);
  } else {
    document.getElementById('valTrue').innerText = 'N/A';
    document.getElementById('valError').innerText = 'N/A';
  }
  
  document.getElementById('textExecTime').innerHTML = `<i class="bi bi-clock me-1"></i>Execution: ${execTime.toFixed(1)} ms`;
  
  if (isFunction) {
    let exprLatex = exprStr;
    try {
      exprLatex = math.parse(exprStr).toTex();
    } catch (e) {}
    document.getElementById('textProblemStatement').innerHTML = `
      Evaluate the definite integral approximately by using the <strong>Composite Simpson's 3/8 Rule</strong>:
      $$\\int_{${a}}^{${b}} ${exprLatex} \\, dx$$
    `;
    document.getElementById('textKnownValues').innerHTML = `
      <strong>Known Parameters:</strong> Limits: $a = ${a}, b = ${b}$ | Intervals: $n = ${n}$ (Multiple of 3)
    `;
  } else {
    document.getElementById('textProblemStatement').innerHTML = `
      Evaluate the integration of discrete coordinates $(x_i, y_i)$ from $x_0 = ${a}$ to $x_n = ${b}$ using the <strong>Composite Simpson's 3/8 Rule</strong>.
    `;
    document.getElementById('textKnownValues').innerHTML = `
      <strong>Known Parameters:</strong> Data Points: $N = ${x_vals.length}$ | Step size: $h = ${h.toFixed(6)}$
    `;
  }
  
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
  
  const stepsBody = document.getElementById('stepsTableBody');
  let tableHtml = '';
  for (let i = 0; i <= n; i++) {
    let weight = 3;
    let typeName = 'Non-multiple of 3';
    let rowClass = 'row-ndiv3';
    let badgeClass = 'badge-step-ndiv3';
    
    if (i === 0 || i === n) {
      weight = 1;
      typeName = 'Boundary';
      rowClass = 'row-boundary';
      badgeClass = 'badge-step-boundary';
    } else if (i % 3 === 0) {
      weight = 2;
      typeName = 'Multiple of 3';
      rowClass = 'row-div3';
      badgeClass = 'badge-step-div3';
    }
    
    tableHtml += `
      <tr class="${rowClass}">
        <td>${i}</td>
        <td>${x_vals[i].toFixed(4)}</td>
        <td>${y_vals[i].toFixed(6)}</td>
        <td><span class="badge ${badgeClass}">${typeName}</span></td>
      </tr>
    `;
  }
  stepsBody.innerHTML = tableHtml;
  
  document.getElementById('step4Formula').innerHTML = `
    Sum of Boundary Terms ($y_0 + y_n$) <span class="badge badge-step-boundary">Boundary</span>:
    $$y_0 + y_n = ${y_vals[0].toFixed(6)} + ${y_vals[n].toFixed(6)} = ${boundarySum.toFixed(6)}$$
    Sum of terms NOT divisible by 3 (Weight = 3) <span class="badge badge-step-ndiv3">Non-multiple of 3</span>:
    $$\\sum y_{i \\neq 3k} = ${midSum3.toFixed(6)}$$
    Sum of interior terms divisible by 3 (Weight = 2) <span class="badge badge-step-div3">Multiple of 3</span>:
    $$\\sum y_{i = 3k} = ${midSum2.toFixed(6)}$$
    Substituting values into Simpson's 3/8 Rule:
    $$I \\approx \\frac{3h}{8} \\left[ (y_0 + y_n) + 3 \\sum y_{i \\neq 3k} + 2 \\sum y_{i = 3k} \\right]$$
    $$I \\approx \\frac{3(${h.toFixed(6)})}{8} \\left[ (${boundarySum.toFixed(6)}) + 3(${midSum3.toFixed(6)}) + 2(${midSum2.toFixed(6)}) \\right]$$
  `;
  
  document.getElementById('step5Formula').innerHTML = `
    $$I \\approx \\frac{${(3 * h).toFixed(6)}}{8} \\left[ ${boundarySum.toFixed(6)} + ${(3 * midSum3).toFixed(6)} + ${(2 * midSum2).toFixed(6)} \\right]$$
    $$I \\approx ${((3 * h) / 8).toFixed(6)} \\left[ ${(boundarySum + 3 * midSum3 + 2 * midSum2).toFixed(6)} \\right] = ${approxValue.toFixed(6)}$$
    The approximate area under the curve is <strong>${approxValue.toFixed(6)}</strong> square units.
  `;
  
  triggerMathJax();
  
  const graphData = {
    type: isFunction ? 'function' : 'table',
    expr: exprStr,
    a,
    b,
    x_vals,
    y_vals
  };
  plotNumericalIntegration('plotlyGraph', 'simpson38', graphData);
  
  document.getElementById('welcomeOutput').classList.add('d-none');
  document.getElementById('solutionOutput').classList.remove('d-none');
  document.getElementById('solutionOutput').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
