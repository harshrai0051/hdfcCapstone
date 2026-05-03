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

/**
 * Helper: set a form field value and dispatch events so AEM form model syncs
 */
function setReviewFieldValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = value;
  el.setAttribute('value', value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Helper: get value of a named radio-group (first checked input)
 */
function getRadioValue(name) {
  const checked = document.querySelector(`input[type="radio"][name="${name}"]:checked`);
  return checked ? checked.value : '';
}

/**
 * Helper: get value of a select/dropdown by id
 */
function getSelectValue(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

/**
 * Helper: get display label for a selected radio value
 */
function getRadioLabel(name) {
  const checked = document.querySelector(`input[type="radio"][name="${name}"]:checked`);
  if (!checked) return '';
  const label = checked.closest('.radio-wrapper')?.querySelector('label');
  return label ? label.textContent.trim() : checked.value;
}

/**
 * Helper: get display text for a selected option in a <select>
 */
function getSelectLabel(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  const selected = el.options[el.selectedIndex];
  return selected ? selected.text : '';
}

/**
 * Populate Review Details Accordion
 *
 * Maps values from:
 *   - Personal Loan Offer Panel (Step 1)
 *   - Fragment / Customer Details (Step 2)
 *   - Income Verification Panel (Step 3)
 *   - EMI Calculator Panel (Step 4)
 *
 * into the Review Details accordion fields.
 */
function populateReviewDetails() {
  /* ── Personal Details ──────────────────────────────────────────── */

  // Full Name: first + middle + last
  const firstName = document.querySelector('input[name="first_name"]')?.value?.trim() || '';
  const middleName = document.querySelector('input[name="middle_name"]')?.value?.trim() || '';
  const lastName = document.querySelector('input[name="last_name"]')?.value?.trim() || '';
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  setReviewFieldValue('textinput-13f2313da5', fullName);

  // Mobile Number (Aadhaar linked)
  const mobileVal = document.querySelector('input[name="aadhaar_linked_mobile_number"]')?.value || '';
  setReviewFieldValue('textinput-cf353230e9', mobileVal);

  // Date of Birth – copy edit-value attribute (raw date) or displayed value
  const dobSrc = document.getElementById('datepicker-11fedea8ba');
  const dobValue = dobSrc?.getAttribute('edit-value') || dobSrc?.value || '';
  const dobTarget = document.getElementById('datepicker-a406454738');
  if (dobTarget) {
    dobTarget.value = dobValue;
    dobTarget.setAttribute('edit-value', dobValue);
    dobTarget.setAttribute('display-value', dobSrc?.getAttribute('display-value') || dobValue);
    dobTarget.dispatchEvent(new Event('input', { bubbles: true }));
    dobTarget.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // PAN (stored in the email-type input for PAN)
  const panVal = document.querySelector('input[name="enter_Pan_id1"]')?.value || '';
  setReviewFieldValue('textinput-0372ede0ce', panVal);

  // Current Address (from Aadhaar records)
  const addressVal = document.querySelector('input[name="address_as_per_aadhaar_records"]')?.value || '';
  setReviewFieldValue('textinput-c0931aa145', addressVal);

  // Residence Type (radio: permanent / current / both / none)
  const residenceLabel = getRadioLabel('is_customer_aadhaar_address');
  setReviewFieldValue('textinput-d9fb9e62b3', residenceLabel);

  /* ── Loan Details ──────────────────────────────────────────────── */

  // Loan Amount (from EMI calculator display field)
  const loanAmtVal = document.getElementById('textinput-3f693161b5')?.value || '';
  setReviewFieldValue('textinput-1f19cd4958', loanAmtVal);

  // EMI Amount
  const emiVal = document.getElementById('textinput-b0f0fe33c2')?.value || '';
  setReviewFieldValue('textinput-27f73095a4', emiVal);

  // Tenure (from range slider, formatted as "X months")
  const tenureRaw = document.getElementById('numberinput-9a0e8002ff')?.value || '';
  const tenureLabel = tenureRaw ? `${tenureRaw} months` : '';
  setReviewFieldValue('textinput-5bbeede9c1', tenureLabel);

  // Processing Fee (mapped from Taxes field in calculator)
  const taxVal = document.getElementById('textinput-8adf25be5f')?.value || '';
  setReviewFieldValue('textinput-7a8f4288d0', taxVal);

  // Rate of Interest
  const roiVal = document.getElementById('textinput-705f91a759')?.value || '';
  setReviewFieldValue('textinput-5932aacccc', roiVal);

  // Employer Name: prefer dropdown label, fallback to "Other" text input
  const employerDropdownVal = getSelectValue('dropdown-5708e2571a');
  let employerName = '';
  if (employerDropdownVal && employerDropdownVal !== 'Others') {
    employerName = getSelectLabel('dropdown-5708e2571a');
  } else {
    employerName = document.querySelector('input[name="employer_company_name_other"]')?.value || '';
  }
  setReviewFieldValue('textinput-dcfe7665b1', employerName);

  // Schedule of Charges – no direct source field; leave blank or set placeholder
  setReviewFieldValue('textinput-9edede6d0e', '');

  // Type of Loan
  const loanTypeLabel = getSelectLabel('dropdown-f187a59a23');
  setReviewFieldValue('textinput-355120dc42', loanTypeLabel);

  /* ── Salary Account Details ────────────────────────────────────── */

  // Salary A/c Number – no source field in the provided HTML; clear/leave blank
  setReviewFieldValue('textinput-df7ef859ce', '');

  // IFSC – no source field in the provided HTML; clear/leave blank
  setReviewFieldValue('textinput-f618a535ac', '');

  // Bank Name: from salary bank radio label, fallback to Other text input
  const salaryBankLabel = getRadioLabel('salary_bank');
  const salaryBankOther = document.querySelector('input[name="salary_bank_other"]')?.value || '';
  setReviewFieldValue('textinput-f33180d5e4', salaryBankLabel || salaryBankOther);

  /* ── Verify Email ID ───────────────────────────────────────────── */

  // Personal Email ID
  const personalEmail = document.querySelector('input[name="enter_email_id"]')?.value || '';
  setReviewFieldValue('emailinput-9edd02a027', personalEmail);

  // Work Email ID
  const workEmail = document.getElementById('emailinput-1d0f54c4f4')?.value || '';
  setReviewFieldValue('emailinput-1fdf3966f4', workEmail);

  console.log('✅ Review Details accordion populated');
}

/**
 * Auto-wire: populate review details whenever the Review Details accordion
 * panel becomes visible (legend click or programmatic show).
 */
function initReviewDetailsAutoPopulate() {
  const reviewAccordion = document.getElementById('panelcontainer-6f0808bbe3');
  if (!reviewAccordion) {
    setTimeout(initReviewDetailsAutoPopulate, 300);
    return;
  }

  // Populate once on init (accordion may already be visible)
  populateReviewDetails();

  // Re-populate whenever any accordion legend inside is clicked
  reviewAccordion.querySelectorAll('.accordion-legend').forEach((legend) => {
    legend.addEventListener('click', () => {
      // Small delay to let the accordion open animation complete
      setTimeout(populateReviewDetails, 50);
    });
  });

  // Also observe attribute/class changes (AEM forms may toggle visibility)
  const observer = new MutationObserver(() => {
    populateReviewDetails();
  });
  observer.observe(reviewAccordion, { attributes: true, attributeFilter: ['data-visible', 'class'] });
}

initReviewDetailsAutoPopulate();

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
  populateReviewDetails,
  initReviewDetailsAutoPopulate,
};
