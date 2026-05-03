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
 * Map all source form fields into the Review Details accordion.
 *
 * Source panels:
 *   - Personal Loan Offer Panel (Step 1)
 *   - Fragment / Customer Details (Step 2)
 *   - Income Verification Panel (Step 3)
 *   - EMI Calculator Panel (Step 4)
 *
 * Target: Review Details accordion (panelcontainer-6f0808bbe3)
 */
function mapFormFieldsToReview() {
  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Get value from the FIRST matching element with this name.
   * For radio groups returns the value of the checked option.
   */
  const getVal = (name) => {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) return '';
    if (el.type === 'radio') {
      const checked = document.querySelector(`[name="${name}"]:checked`);
      return checked ? checked.value : '';
    }
    return el.value || '';
  };

  /**
   * Get value from a specific element by its unique id.
   */
  const getValById = (id) => {
    const el = document.getElementById(id);
    return el ? (el.value || '') : '';
  };

  /**
   * Set value on a specific element by its unique id.
   */
  const setValById = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  /**
   * Return the visible label text for the checked radio in a group.
   */
  const getRadioLabel = (name) => {
    const checked = document.querySelector(`[name="${name}"]:checked`);
    if (!checked) return '';
    const label = document.querySelector(`label[for="${checked.id}"]`);
    return label ? label.textContent.trim() : checked.value;
  };

  // ─── 1. Loan Details ────────────────────────────────────────────────────────
  // Loan amount comes from the range slider (numberinput-b5966ec03e)
  const rawLoanAmount = getValById('numberinput-b5966ec03e');
  // Tenure comes from the tenure range slider (numberinput-0340fd7e24)
  const rawTenure = getValById('numberinput-0340fd7e24');
  // EMI Amount display field (textinput-b5b7374de8 — label "EMI Amount")
  const emiAmountDisplay = getValById('textinput-b5b7374de8');
  // Rate of Interest display field (textinput-1c459dc1b4)
  const roiDisplay = getValById('textinput-1c459dc1b4');
  // Taxes display field (textinput-ec3ebad510)
  const taxesDisplay = getValById('textinput-ec3ebad510');
  // Employer name: prefer free-text entry; fall back to dropdown label
  const enterEmployerName = getVal('enter_employer_company_name');
  const employerDropdownVal = getVal('employer_company_name');
  const resolvedEmployerName = enterEmployerName || (employerDropdownVal !== 'others' ? employerDropdownVal : '');
  // Loan type dropdown
  const selectLoanType = getVal('select_loan_type');

  // Format loan amount for display if it is a raw number
  let loanAmountForDisplay = rawLoanAmount;
  if (rawLoanAmount && !rawLoanAmount.includes('₹')) {
    const num = parseFloat(rawLoanAmount);
    if (!Number.isNaN(num)) loanAmountForDisplay = formatIndianCurrency(num);
  }

  // Format tenure for display if it is a raw number
  let tenureForDisplay = rawTenure;
  if (rawTenure && !/months/.test(rawTenure)) {
    const num = parseFloat(rawTenure);
    if (!Number.isNaN(num)) tenureForDisplay = `${Math.round(num)} months`;
  }

  setValById('textinput-9aabe41171', loanAmountForDisplay);   // loan_amount
  setValById('textinput-bf78c6e7d2', emiAmountDisplay);       // emi_amount
  setValById('textinput-5f4d136d28', tenureForDisplay);       // tenure
  setValById('textinput-22b1e701b9', taxesDisplay);           // processing_fee (Taxes)
  setValById('textinput-721bf835c1', roiDisplay);             // rate_of_interest
  setValById('textinput-db68d340ff', resolvedEmployerName);   // employer_name
  // schedule_of_charges (textinput-0295f6b473) — no direct source field; leave unchanged
  setValById('textinput-41298e8cd6', selectLoanType);         // type_of_loan

  // ─── 2. Personal Details ────────────────────────────────────────────────────
  // Full name: concatenate first + middle + last from the PAN name panel
  const firstName = getVal('first_name');
  const middleName = getVal('middle_name');
  const lastName = getVal('last_name');
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();

  // Mobile number from the welcome panel (textinput-ab0417d81c)
  const mobileNumber = getValById('textinput-ab0417d81c');

  // Date of birth from the welcome panel (datepicker-2e2ea3b883)
  const dobSource = document.getElementById('datepicker-2e2ea3b883');
  const dobDisplayValue = dobSource ? (dobSource.getAttribute('display-value') || dobSource.value || '') : '';
  const dobEditValue = dobSource ? (dobSource.getAttribute('edit-value') || dobSource.value || '') : '';

  // PAN number
  const panNumber = getVal('pan_number');

  // Address from Aadhaar records
  const aadhaarAddress = getVal('address_as_per_aadhaar_records');

  // Residence type: label of the selected "is_customers_aadhaar_address" radio
  const residenceType = getRadioLabel('is_customers_aadhaar_address');

  setValById('textinput-338c537319', fullName);              // full_name
  setValById('textinput-48f479429a', mobileNumber);          // mobile_number

  // Date of birth target (datepicker-a8de48027a)
  const dobTarget = document.getElementById('datepicker-a8de48027a');
  if (dobTarget) {
    dobTarget.value = dobDisplayValue;
    dobTarget.setAttribute('display-value', dobDisplayValue);
    dobTarget.setAttribute('edit-value', dobEditValue);
  }

  setValById('textinput-f7cb1ba930', panNumber);             // pan
  setValById('textinput-0f232dc804', aadhaarAddress);        // current_address
  setValById('textinput-322734dd37', residenceType);         // residence_type

  // ─── 3. Salary Account Details ──────────────────────────────────────────────
  // Salary account number (textinput-6cd7d23dbf → name="salary_account")
  const salaryAccountNumber = getVal('salary_account');
  // IFSC (textinput-31c9044207 → name="ifsc") — source panel has one ifsc field
  const ifscSource = getValById('textinput-31c9044207');
  // Bank name: prefer "Other" text; otherwise use the radio button label
  const salaryBankOther = getVal('salary_bank_other');
  const salaryBankLabel = getRadioLabel('salary_bank');
  const bankName = salaryBankOther.trim() || salaryBankLabel;

  setValById('textinput-c06ffc5b00', salaryAccountNumber);   // salary_account_number
  setValById('textinput-321a9f6344', ifscSource);            // ifsc
  setValById('textinput-e294a4225e', bankName);              // bank_name

  // ─── 4. Office Address ──────────────────────────────────────────────────────
  // No explicit "office address" source field in the provided HTML.
  // The employer name is already mapped above; industry type is available if needed.
  // current_employer_address (textinput-76f014ea9b) — leave unchanged unless a source
  // field is added later; map employer name as a fallback label.
  // (no-op — placeholder for future source field)

  // ─── 5. Verify Email ID ─────────────────────────────────────────────────────
  // Personal email: emailinput-d61e9efa6c (name="enter_email_id" inside personal_details panel)
  const personalEmail = getValById('emailinput-d61e9efa6c');
  // Work email: emailinput-20d267620a (name="enter_email_id" inside work_email_id_panel)
  const workEmail = getValById('emailinput-20d267620a');

  setValById('emailinput-a406431806', personalEmail);        // personal_email_id
  setValById('emailinput-eecc41b376', workEmail);            // work_email_id
}

/**
 * Initialize form field mapping.
 * Attaches input/change listeners to all source fields so the review section
 * stays in sync as the user fills in the form.
 * Also wires the "Proceed >" button (button-5e47e6952d) to trigger a final sync.
 */
function initFormFieldMapping() {
  // Source field names to monitor (radio groups use 'change'; others use 'input')
  const fieldsToMonitor = [
    // Welcome panel
    'mobile_number',
    'date_of_birth',
    'income_source',
    // Full Name panel
    'first_name',
    'middle_name',
    'last_name',
    // Personal Details panel
    'gender',
    'pan_number',
    // Address Details panel
    'address_as_per_aadhaar_records',
    'is_customers_aadhaar_address',
    // Employer Details
    'employer_company_name',
    'enter_employer_company_name',
    'industry_type',
    // Income Details
    'monthly_net_income_salary',
    'ongoing_emis_if_any',
    // Type of Loan
    'select_loan_type',
    // Salary Bank panel
    'salary_bank',
    'salary_bank_other',
    'salary_account',
    'ifsc',
    // EMI panel sliders & display fields are handled via their IDs below
  ];

  // Named-field listeners
  fieldsToMonitor.forEach((fieldName) => {
    const fields = document.querySelectorAll(`[name="${fieldName}"]`);
    fields.forEach((field) => {
      const eventType = (field.type === 'radio' || field.tagName === 'SELECT') ? 'change' : 'input';
      field.addEventListener(eventType, () => {
        setTimeout(mapFormFieldsToReview, 100);
      });
    });
  });

  // ID-based listeners for the EMI panel display fields and range sliders
  const idsToMonitor = [
    'numberinput-b5966ec03e',   // Loan Amount range slider
    'numberinput-0340fd7e24',   // Tenure range slider
    'textinput-b5b7374de8',     // EMI Amount display
    'textinput-1c459dc1b4',     // Rate of Interest display
    'textinput-ec3ebad510',     // Taxes display
    'emailinput-d61e9efa6c',    // Personal email
    'emailinput-20d267620a',    // Work email
  ];

  idsToMonitor.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        setTimeout(mapFormFieldsToReview, 100);
      });
    }
  });

  // Wire the "Proceed >" button (button-5e47e6952d) to trigger a final sync
  const proceedButton = document.getElementById('button-5e47e6952d');
  if (proceedButton) {
    proceedButton.addEventListener('click', mapFormFieldsToReview);
  }

  // Run an initial mapping pass in case fields are pre-populated
  mapFormFieldsToReview();
}

/**
 * Wait for Review accordion DOM then start mapping
 */
function waitAndInitMapping() {
  const reviewAccordion = document.getElementById('panelcontainer-6f0808bbe3');
  if (reviewAccordion) {
    initFormFieldMapping();
  } else {
    setTimeout(waitAndInitMapping, 300);
  }
}

waitAndInitMapping();

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
  mapFormFieldsToReview,
  initFormFieldMapping,
};
