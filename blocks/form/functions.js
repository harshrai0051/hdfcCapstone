/**
 * Get Full Name
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Submit helper
 */
function submitFormArrayToString(globals) {
  const data = globals.functions.exportData();
  Object.keys(data).forEach((key) => {
    if (Array.isArray(data[key])) {
      data[key] = data[key].join(',');
    }
  });
  globals.functions.submitForm(data, true, 'application/json');
}

/**
 * Days diff
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
 * Mask mobile
 */
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) return '';
  const value = mobileNumber.toString();
  return `${'*'.repeat(5)}${value.substring(5)}`;
}

/**
 * Update range bubble UI (DO NOT FORMAT ₹ HERE)
 */
function updateBubble(input, element) {
  const step = input.step || 1;
  const max = input.max || 0;
  const min = input.min || 1;
  const value = input.value || 1;

  const current = Math.ceil((value - min) / step);
  const total = Math.ceil((max - min) / step);

  const bubble = element.querySelector('.range-bubble');
  const bubbleWidth = bubble.getBoundingClientRect().width || 31;

  const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;

  // IMPORTANT: raw value only
  bubble.innerText = `${value}`;

  const style = `
    --total-steps:${total};
    --current-steps:${current};
  `;

  bubble.style.left = `calc(${left})`;
  element.setAttribute('style', style);
}

/**
 * Decorate range slider
 */
async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');

  input.type = 'range';
  input.min = input.min || 1;
  input.max = input.max || 100;
  input.step = fieldJson?.properties?.stepValue || 1;

  const div = document.createElement('div');
  div.className = 'range-widget-wrapper decorated';

  input.after(div);

  const hover = document.createElement('span');
  hover.className = 'range-bubble';

  const rangeMinEl = document.createElement('span');
  rangeMinEl.className = 'range-min';

  const rangeMaxEl = document.createElement('span');
  rangeMaxEl.className = 'range-max';

  rangeMinEl.innerText = `${input.min}`;
  rangeMaxEl.innerText = `${input.max}`;

  div.appendChild(hover);
  div.appendChild(input);
  div.appendChild(rangeMinEl);
  div.appendChild(rangeMaxEl);

  input.addEventListener('input', (e) => {
    updateBubble(e.target, div);
  });

  updateBubble(input, div);

  return fieldDiv;
}

/**
 * Format INR
 */
function formatIndianCurrency(amount) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * EMI calculation
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  const monthlyRate = annualRate / (12 * 100);

  if (monthlyRate === 0) {
    return Math.round(principal / tenureMonths);
  }

  const onePlusR = 1 + monthlyRate;
  const onePlusRPowerN = onePlusR ** tenureMonths;

  const emi =
    (principal * monthlyRate * onePlusRPowerN) /
    (onePlusRPowerN - 1);

  return Math.round(emi);
}

/**
 * EMI Calculator INIT (FINAL)
 */
function initEMICalculator() {
  const loanAmountInput = document.querySelector('#numberinput-573a41b8b9');
  const tenureInput = document.querySelector('#numberinput-9a0e8002ff');

  const loanDisplay = document.querySelector('#textinput-3f693161b5');
  const emiDisplay = document.querySelector('#textinput-b0f0fe33c2');
  const roiDisplay = document.querySelector('#textinput-705f91a759');
  const taxDisplay = document.querySelector('#textinput-8adf25be5f');

  if (!loanAmountInput || !tenureInput) {
    console.log('❌ EMI elements not found');
    return;
  }

  const RATE = 10.97;
  const TAX = 18;

  function setFieldValue(field, value) {
    if (!field) return;

    field.value = value;
    field.setAttribute('value', value);

    // trigger UI refresh (IMPORTANT)
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function updateEMI() {
    const loan = parseFloat(loanAmountInput.value) || 50000;
    const months = parseFloat(tenureInput.value) || 12;

    const emi = calculateEMI(loan, RATE, months);
    const tax = Math.round((emi * TAX) / 100);

    setFieldValue(loanDisplay, formatIndianCurrency(loan));
    setFieldValue(emiDisplay, formatIndianCurrency(emi));
    setFieldValue(roiDisplay, `${RATE}%`);
    setFieldValue(taxDisplay, formatIndianCurrency(tax));
  }

  // 🔥 REAL-TIME SYNC
  loanAmountInput.addEventListener('input', updateEMI);
  tenureInput.addEventListener('input', updateEMI);

  updateEMI();
}

/**
 * Wait for DOM (dynamic forms safe)
 */
function waitAndInit() {
  const loan = document.querySelector('#numberinput-573a41b8b9');
  const tenure = document.querySelector('#numberinput-9a0e8002ff');

  if (loan && tenure) {
    initEMICalculator();
  } else {
    setTimeout(waitAndInit, 300);
  }
}

waitAndInit();

/**
 * EXPORTS
 */
export {
  getFullName,
  days,
  submitFormArrayToString,
  maskMobileNumber,
  updateBubble,
  decorate,
  formatIndianCurrency,
  calculateEMI,
  initEMICalculator,
};
