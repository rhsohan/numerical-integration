/* Numerical Integration Solver & Learning Platform - Main Script */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavbarScroll();
  initBackToTop();
  initAOS();
  triggerMathJax();
});

// Theme Management (Light / Dark Mode)
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    updateThemeIcon(themeToggle, savedTheme);
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(themeToggle, newTheme);
      
      // Notify Plotly graphs to update theme if any exists on the page
      window.dispatchEvent(new CustomEvent('themechanged', { detail: { theme: newTheme } }));
    });
  }
}

function updateThemeIcon(btn, theme) {
  const icon = btn.querySelector('i');
  if (icon) {
    if (theme === 'dark') {
      icon.className = 'bi bi-sun-fill';
    } else {
      icon.className = 'bi bi-moon-fill';
    }
  }
}

// Navbar Scroll Effect
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar-custom');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }
}

// Back to Top Button
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        backToTopBtn.style.display = 'flex';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });
    
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

// AOS Animation Library Initialization
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
}

// MathJax helper for dynamic content
function triggerMathJax() {
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise().catch((err) => console.log('MathJax typeset error:', err));
  }
}

// Calculation History Manager
const CalcHistory = {
  getHistoryKey(method) {
    return `num_int_history_${method}`;
  },
  
  save(method, details) {
    try {
      const key = this.getHistoryKey(method);
      let history = this.get(method);
      
      // Remove duplicate of the same entry if it exists (by comparing parameters)
      history = history.filter(item => {
        if (details.type === 'function') {
          return !(item.type === 'function' && 
                   item.expr === details.expr && 
                   item.a === details.a && 
                   item.b === details.b && 
                   item.n === details.n);
        } else {
          return !(item.type === 'table' && 
                   JSON.stringify(item.points) === JSON.stringify(details.points));
        }
      });
      
      // Add to front of history
      history.unshift({
        ...details,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      
      // Limit to 5 entries
      if (history.length > 5) {
        history.pop();
      }
      
      localStorage.setItem(key, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('Failed to save calculation history:', e);
      return false;
    }
  },
  
  get(method) {
    const key = this.getHistoryKey(method);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },
  
  clear(method) {
    const key = this.getHistoryKey(method);
    localStorage.removeItem(key);
  },
  
  render(method, containerId, onLoadItem) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const history = this.get(method);
    if (history.length === 0) {
      container.innerHTML = `<div class="text-center text-muted py-3">No recent calculations yet.</div>`;
      return;
    }
    
    let html = '';
    history.forEach((item, index) => {
      let label = '';
      let subtext = '';
      if (item.type === 'function') {
        let exprLatex = item.expr;
        try {
          exprLatex = math.parse(item.expr).toTex();
        } catch (e) {}
        label = `$$\\int_{${item.a}}^{${item.b}} ${exprLatex} \\, dx$$`;
        subtext = `n = ${item.n}`;
      } else {
        label = `Tabulated Data (${item.points.length} points)`;
        subtext = `h = ${item.h}`;
      }
      
      html += `
        <div class="history-item" data-index="${index}">
          <div class="history-item-header">
            <span>${item.timestamp}</span>
            <span class="badge bg-secondary">${item.type}</span>
          </div>
          <div class="history-item-body">
            ${label}
          </div>
          <div class="history-item-footer d-flex justify-content-between align-items-center">
            <span>Result: ${Number(item.result).toFixed(6)}</span>
            <small class="text-muted">${subtext}</small>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    triggerMathJax();
    
    // Bind click events
    container.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.getAttribute('data-index');
        const item = history[idx];
        
        // Hide offcanvas if open (Bootstrap 5 API helper)
        const offcanvasEl = document.getElementById('offcanvasHistory');
        if (offcanvasEl) {
          const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
          if (bsOffcanvas) bsOffcanvas.hide();
        }
        
        if (onLoadItem) onLoadItem(item);
      });
    });
  }
};

// Unified Solver Form Controller for code deduplication & fast rendering
const SolverUI = {
  tableRowCount: 0,
  method: '',
  onCalculate: null,
  loadPresetTable: null,
  
  init({ method, onCalculate, loadPresetTable }) {
    this.method = method;
    this.onCalculate = onCalculate;
    this.loadPresetTable = loadPresetTable;
    this.tableRowCount = 0;
    
    const form = document.getElementById('solverForm');
    if (!form) return;
    
    const typeFunction = document.getElementById('typeFunction');
    const typeTable = document.getElementById('typeTable');
    const functionFields = document.getElementById('functionFields');
    const tableFields = document.getElementById('tableFields');
    
    typeFunction.addEventListener('change', () => {
      functionFields.classList.remove('d-none');
      tableFields.classList.add('d-none');
      this.hideError();
    });
    
    typeTable.addEventListener('change', () => {
      functionFields.classList.add('d-none');
      tableFields.classList.remove('d-none');
      this.hideError();
      if (this.tableRowCount === 0) {
        const initialRows = this.method === 'simpson38' ? 7 : (this.method === 'simpson13' ? 7 : 7);
        // Note: use 7 rows as default (index 0 to 6) which serves n=6 (divisible by 2 and 3)
        for (let i = 0; i < initialRows; i++) {
          this.addTableRow();
        }
        if (this.loadPresetTable) this.loadPresetTable();
      }
    });

    document.getElementById('btnAddRow')?.addEventListener('click', () => this.addTableRow());
    document.getElementById('btnDeleteRow')?.addEventListener('click', () => this.deleteTableRow());
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.onCalculate();
    });
    
    document.getElementById('btnReset')?.addEventListener('click', () => this.resetSolver());
    document.getElementById('btnClearHistory')?.addEventListener('click', () => {
      CalcHistory.clear(this.method);
      this.loadHistoryList();
    });
    
    document.getElementById('btnCopyAnswer')?.addEventListener('click', () => this.copyResultToClipboard());
    document.getElementById('btnPrint')?.addEventListener('click', () => window.print());
  },
  
  addTableRow() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.setAttribute('data-index', this.tableRowCount);
    tr.innerHTML = `
      <td>${this.tableRowCount}</td>
      <td><input type="number" step="any" class="form-control form-control-sm text-center val-x" placeholder="x" required></td>
      <td><input type="number" step="any" class="form-control form-control-sm text-center val-y" placeholder="y" required></td>
    `;
    tbody.appendChild(tr);
    this.tableRowCount++;
  },
  
  deleteTableRow() {
    const minRows = this.method === 'simpson38' ? 4 : (this.method === 'simpson13' ? 3 : 2);
    if (this.tableRowCount > minRows) {
      const tbody = document.getElementById('tableBody');
      tbody.removeChild(tbody.lastChild);
      this.tableRowCount--;
    } else {
      this.showError(`A coordinate table must have at least ${minRows} rows to compute integration.`);
    }
  },
  
  showError(msg) {
    const alertBox = document.getElementById('validationAlert');
    if (alertBox) {
      alertBox.innerText = msg;
      alertBox.classList.remove('d-none');
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },
  
  hideError() {
    document.getElementById('validationAlert')?.classList.add('d-none');
  },
  
  resetSolver() {
    document.getElementById('solverForm')?.reset();
    const typeFunction = document.getElementById('typeFunction');
    if (typeFunction) {
      typeFunction.checked = true;
      typeFunction.dispatchEvent(new Event('change'));
    }
    document.getElementById('welcomeOutput')?.classList.remove('d-none');
    document.getElementById('solutionOutput')?.classList.add('d-none');
    document.getElementById('piAlertCard')?.classList.add('d-none');
    this.hideError();
  },
  
  loadHistoryList() {
    CalcHistory.render(this.method, 'historyList', (item) => {
      const typeFunction = document.getElementById('typeFunction');
      const typeTable = document.getElementById('typeTable');
      
      if (item.type === 'function') {
        typeFunction.checked = true;
        typeFunction.dispatchEvent(new Event('change'));
        document.getElementById('inputFunction').value = item.expr;
        document.getElementById('inputA').value = item.a;
        document.getElementById('inputB').value = item.b;
        document.getElementById('inputN').value = item.n;
      } else {
        typeTable.checked = true;
        typeTable.dispatchEvent(new Event('change'));
        
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        this.tableRowCount = 0;
        
        item.points.forEach((pt, idx) => {
          this.addTableRow();
          const inputs = tbody.querySelectorAll(`tr[data-index="${idx}"] input`);
          if (inputs.length >= 2) {
            inputs[0].value = pt.x;
            inputs[1].value = pt.y;
          }
        });
      }
      this.onCalculate();
    });
  },
  
  copyResultToClipboard() {
    const approxText = document.getElementById('valApprox')?.innerText;
    let label = 'Result';
    if (this.method === 'trapezoidal') label = 'Trapezoidal Rule Result';
    if (this.method === 'simpson13') label = 'Simpson\'s 1/3 Rule Result';
    if (this.method === 'simpson38') label = 'Simpson\'s 3/8 Rule Result';
    
    const textToCopy = `${label}: ${approxText}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const copyBtn = document.getElementById('btnCopyAnswer');
      if (copyBtn) {
        const oldHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `<i class="bi bi-check-lg me-1"></i>Copied!`;
        copyBtn.classList.remove('btn-outline-primary');
        copyBtn.classList.add('btn-primary');
        setTimeout(() => {
          copyBtn.innerHTML = oldHtml;
          copyBtn.classList.remove('btn-primary');
          copyBtn.classList.add('btn-outline-primary');
        }, 2000);
      }
    });
  }
};

// Global exports for module loading
window.SolverUI = SolverUI;
window.CalcHistory = CalcHistory;
window.triggerMathJax = triggerMathJax;
