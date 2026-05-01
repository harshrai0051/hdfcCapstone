/**
 * Get Full Name
 * @name getFullName Concats first name and last name
 * @param {string} firstname in Stringformat
 * @param {string} lastname in Stringformat
 * @return {string}
 */
function getFullName(firstname, lastname) {
  return `${firstname} ${lastname}`.trim();
}

/**
 * Custom submit function
 * @param {scope} globals
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
 * Calculate the number of days between two dates.
 * @param {*} endDate
 * @param {*} startDate
 * @returns {number} returns the number of days between two dates
 */
function days(endDate, startDate) {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  // return zero if dates are valid
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffInMs = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}

/**
* Masks the first 5 digits of the mobile number with *
* @param {*} mobileNumber
* @returns {string} returns the mobile number with first 5 digits masked
*/
function maskMobileNumber(mobileNumber) {
  if (!mobileNumber) {
    return '';
  }
  const value = mobileNumber.toString();
  // Mask first 5 digits and keep the rest
  return ` ${'*'.repeat(5)}${value.substring(5)}`;
}

/**
 * Updates the range bubble position and value
 * @param {HTMLInputElement} input
 * @param {HTMLElement} element
 */
function updateBubble(input, element) {
  const step = input.step || 1;
  const max = input.max || 0;
  const min = input.min || 1;
  const value = input.value || 1;
  const current = Math.ceil((value - min) / step);
  const total = Math.ceil((max - min) / step);
  const bubble = element.querySelector('.range-bubble');
  // during initial render the width is 0. Hence using a default here.
  const bubbleWidth = bubble.getBoundingClientRect().width || 31;
  const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;
  bubble.innerText = `${value}`;
  const steps = {
    '--total-steps': Math.ceil((max - min) / step),
    '--current-steps': Math.ceil((value - min) / step),
  };
  const style = Object.entries(steps).map(([varName, varValue]) => `${varName}:${varValue}`).join(';');
  bubble.style.left = `calc(${left})`;
  element.setAttribute('style', style);
}

/**
 * Decorate a range field with bubble, min/max labels
 * @param {HTMLElement} fieldDiv
 * @param {object} fieldJson
 * @returns {HTMLElement}
 */
async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  // modify the type in case it is not range.
  input.type = 'range';
  input.min = input.min || 1;
  input.max = input.max || 100;
  input.step = fieldJson?.properties?.stepValue || 1;
  // create a wrapper div to provide the min/max and current value
  const div = document.createElement('div');
  div.className = 'range-widget-wrapper decorated';
  input.after(div);
  const hover = document.createElement('span');
  hover.className = 'range-bubble';
  const rangeMinEl = document.createElement('span');
  rangeMinEl.className = 'range-min';
  const rangeMaxEl = document.createElement('span');
  rangeMaxEl.className = 'range-max';
  rangeMinEl.innerText = `${input.min || 1}`;
  rangeMaxEl.innerText = `${input.max}`;
  div.appendChild(hover);
  // move the input element within the wrapper div
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
 * Format a number as Indian currency string (e.g. ₹1,50,000)
 * @param {number} amount
 * @returns {string}
 */
function formatIndianCurrency(amount) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Calculate EMI using standard reducing-balance formula
 * @param {number} principal - Loan amount
 * @param {number} annualRate - Annual interest rate (%)
 * @param {number} tenureMonths - Loan tenure in months
 * @returns {number} Monthly EMI (rounded)
 */
function calculateEMI(principal, annualRate, tenureMonths) {
  const monthlyRate = annualRate / (12 * 100);

  if (monthlyRate === 0) {
    return Math.round(principal / tenureMonths);
  }

  const onePlusR = 1 + monthlyRate;
  const onePlusRPowerN = onePlusR ** tenureMonths;

  const emi = (principal * monthlyRate * onePlusRPowerN) / (onePlusRPowerN - 1);

  return Math.round(emi);
}

/**
 * Initialise the EMI calculator — wires the loan amount & tenure range sliders
 * to the EMI display panel fields.
 *
 * Loan range panel inputs:
 *   #numberinput-573a41b8b9  — Loan Amount
 *   #numberinput-9a0e8002ff  — Loan Tenure
 *
 * EMI display panel inputs (panel_8663004081777438825805):
 *   #textinput-3f693161b5    — Avail XPRESS Personal Loan of
 *   #textinput-b0f0fe33c2    — EMI Amount
 *   #textinput-705f91a759    — Rate of Interest
 *   #textinput-8adf25be5f    — Taxes
 */
function initEMICalculator() {
  const loanAmountInput = document.querySelector('#numberinput-573a41b8b9');
  const loanTenureInput = document.querySelector('#numberinput-9a0e8002ff');

  const xpressField = document.querySelector('#textinput-3f693161b5');
  const emiAmountField = document.querySelector('#textinput-b0f0fe33c2');
  const roiField = document.querySelector('#textinput-705f91a759');
  const taxField = document.querySelector('#textinput-8adf25be5f');

  const loanAmountBubble = loanAmountInput
    ?.closest('.range-widget-wrapper')
    ?.querySelector('.range-bubble');

  const tenureBubble = loanTenureInput
    ?.closest('.range-widget-wrapper')
    ?.querySelector('.range-bubble');

  if (!loanAmountInput || !loanTenureInput || !xpressField || !emiAmountField) {
    console.log('Required elements missing ❌');
    return;
  }

  const annualRate = 10.97;
  const taxPercent = 18; // GST example

  function updateEMICalculation() {
    const loanAmount = parseFloat(loanAmountInput.value) || 50000;
    const tenure = parseFloat(loanTenureInput.value) || 12;

    // Loan display
    xpressField.value = formatIndianCurrency(loanAmount);

    // EMI calculation
    const emi = calculateEMI(loanAmount, annualRate, tenure);
    emiAmountField.value = formatIndianCurrency(emi);

    // ROI display
    if (roiField) {
      roiField.value = `${annualRate}% p.a.`;
    }

    // TAX calculation
    if (taxField) {
      const tax = Math.round((emi * taxPercent) / 100);
      taxField.value = formatIndianCurrency(tax);
    }

    // Update bubbles
    if (loanAmountBubble) {
      loanAmountBubble.textContent = formatIndianCurrency(loanAmount);
    }

    if (tenureBubble) {
      tenureBubble.textContent = `${Math.round(tenure)} months`;
    }
  }

  // Events
  loanAmountInput.addEventListener('input', updateEMICalculation);
  loanTenureInput.addEventListener('input', updateEMICalculation);

  // Initial run
  updateEMICalculation();
}

// eslint-disable-next-line import/prefer-default-export
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
