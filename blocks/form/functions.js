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
 *   Panel 1 – Personal Loan Offer Panel   (panelcontainer-9f23d6d666)
 *   Panel 2 – Fragment / Customer Details (fragment-526baedd2a)
 *   Panel 3 – Income Verification Panel   (panelcontainer-7e12f5980e)
 *   Panel 4 – EMI Calculator Panel        (panelcontainer-3304e5a55d)
 *
 * Target: Review Details accordion (panelcontainer-6f0808bbe3)
 *
 * Source → Target ID mapping
 * ─────────────────────────────────────────────────────────────────────────────
 * PERSONAL DETAILS section
 *   first_name (textinput-77c9a87e6d)
 *   + middle_name (textinput-b14cc135a0)
 *   + last_name  (textinput-0f68496a69)          → full_name      (textinput-13f2313da5)
 *
 *   aadhaar_linked_mobile_number (textinput-b07476d9e3) → mobile_number (textinput-cf353230e9)
 *
 *   date_of_birth (datepicker-11fedea8ba)          → date_of_birth  (datepicker-a406454738)
 *
 *   enter_Pan_id1 (emailinput-f5348740aa)          → pan            (textinput-0372ede0ce)
 *
 *   address_as_per_aadhaar_records (textinput-8dcd88dcec) → current_address (textinput-c0931aa145)
 *
 *   is_customer_aadhaar_address radio label        → residence_type (textinput-d9fb9e62b3)
 *
 * LOAN DETAILS section
 *   EMI calc loan display (textinput-3f693161b5)   → loan_amount    (textinput-1f19cd4958)
 *   EMI calc EMI  display (textinput-b0f0fe33c2)   → emi_amount     (textinput-27f73095a4)
 *   tenure range  (numberinput-9a0e8002ff)          → tenure         (textinput-5bbeede9c1)
 *   taxes display (textinput-8adf25be5f)            → processing_fee (textinput-7a8f4288d0)
 *   ROI   display (textinput-705f91a759)            → rate_of_interest (textinput-5932aacccc)
 *   employer_company_name_other (textinput-cec5a6b8b7)
 *     / employer_company_name dropdown (dropdown-5708e2571a) → employer_name (textinput-dcfe7665b1)
 *   schedule_of_charges                             → (no source – left blank)
 *   loan_type dropdown (dropdown-f187a59a23)        → type_of_loan  (textinput-355120dc42)
 *
 * SALARY ACCOUNT DETAILS section
 *   salary_account (textinput-2dee9d4be0)           → salary_account_number (textinput-df7ef859ce)
 *   ifsc           (textinput-cbcb5be8d3)            → ifsc                  (textinput-f618a535ac)
 *   salary_bank radio label / salary_bank_other (textinput-77fb8d4235) → bank_name (textinput-f33180d5e4)
 *
 * VERIFY EMAIL ID section
 *   enter_email_id (emailinput-61e7e4c155)          → personal_email_id (emailinput-9edd02a027)
 *   work_email_id  (emailinput-1d0f54c4f4)          → work_email_id     (emailinput-1fdf3966f4)
 */
function mapFormFieldsToReview() {
  // ─── Helpers ────────────────────────────────────────────────────────────────

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
   * Return the visible label text for the checked radio in a named group.
   */
  const getRadioLabel = (name) => {
    const checked = document.querySelector(`[name="${name}"]:checked`);
    if (!checked) return '';
    const label = document.querySelector(`label[for="${checked.id}"]`);
    return label ? label.textContent.trim() : checked.value;
  };

  /**
   * Return the display text of the currently selected <option> in a <select>.
   */
  const getSelectLabel = (id) => {
    const el = document.getElementById(id);
    if (!el) return '';
    const selected = el.options[el.selectedIndex];
    return selected ? selected.text : '';
  };

  // ─── 1. Personal Details ────────────────────────────────────────────────────

  // Full Name: first + middle + last (PAN name panel)
  const firstName = getValById('textinput-77c9a87e6d');
  const middleName = getValById('textinput-b14cc135a0');
  const lastName = getValById('textinput-0f68496a69');
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
  setValById('textinput-13f2313da5', fullName);

  // Mobile Number (Aadhaar linked, Panel 1)
  setValById('textinput-cf353230e9', getValById('textinput-b07476d9e3'));

  // Date of Birth — copy both display-value and edit-value attributes
  const dobSrc = document.getElementById('datepicker-11fedea8ba');
  const dobTarget = document.getElementById('datepicker-a406454738');
  if (dobSrc && dobTarget) {
    const dobDisplay = dobSrc.getAttribute('display-value') || dobSrc.value || '';
    const dobEdit = dobSrc.getAttribute('edit-value') || dobSrc.value || '';
    dobTarget.value = dobDisplay;
    dobTarget.setAttribute('display-value', dobDisplay);
    dobTarget.setAttribute('edit-value', dobEdit);
  }

  // PAN (stored as email-type input, name="enter_Pan_id1")
  setValById('textinput-0372ede0ce', getValById('emailinput-f5348740aa'));

  // Current Address (from Aadhaar records)
  setValById('textinput-c0931aa145', getValById('textinput-8dcd88dcec'));

  // Residence Type — human-readable label of selected radio
  setValById('textinput-d9fb9e62b3', getRadioLabel('is_customer_aadhaar_address'));

  // ─── 2. Loan Details ────────────────────────────────────────────────────────

  // Loan Amount (from EMI calculator display field)
  setValById('textinput-1f19cd4958', getValById('textinput-3f693161b5'));

  // EMI Amount (from EMI calculator display field)
  setValById('textinput-27f73095a4', getValById('textinput-b0f0fe33c2'));

  // Tenure — format raw range value as "X months"
  const tenureRaw = getValById('numberinput-9a0e8002ff');
  const tenureNum = parseFloat(tenureRaw);
  const tenureLabel = !Number.isNaN(tenureNum) ? `${Math.round(tenureNum)} months` : tenureRaw;
  setValById('textinput-5bbeede9c1', tenureLabel);

  // Processing Fee (mapped from Taxes display field in EMI calculator)
  setValById('textinput-7a8f4288d0', getValById('textinput-8adf25be5f'));

  // Rate of Interest
  setValById('textinput-5932aacccc', getValById('textinput-705f91a759'));

  // Employer Name: prefer free-text "Other" input; fall back to dropdown label
  const employerOther = getValById('textinput-cec5a6b8b7');
  const employerDropdown = getSelectLabel('dropdown-5708e2571a');
  const employerName = employerOther.trim()
    || (employerDropdown && employerDropdown !== 'Others' ? employerDropdown : '');
  setValById('textinput-dcfe7665b1', employerName);

  // Schedule of Charges — no source field; leave unchanged
  // setValById('textinput-9edede6d0e', '');

  // Type of Loan (dropdown label)
  setValById('textinput-355120dc42', getSelectLabel('dropdown-f187a59a23'));

  // ─── 3. Salary Account Details ──────────────────────────────────────────────

  // Salary Account Number (textinput-2dee9d4be0, name="salary_account")
  setValById('textinput-df7ef859ce', getValById('textinput-2dee9d4be0'));

  // IFSC (textinput-cbcb5be8d3, name="ifsc")
  setValById('textinput-f618a535ac', getValById('textinput-cbcb5be8d3'));

  // Bank Name: salary_bank radio label; fallback to Other text input
  const salaryBankLabel = getRadioLabel('salary_bank');
  const salaryBankOther = getValById('textinput-77fb8d4235');
  setValById('textinput-f33180d5e4', salaryBankLabel || salaryBankOther);

  // ─── 4. Verify Email ID ─────────────────────────────────────────────────────

  // Personal Email (name="enter_email_id" inside personal details panel)
  setValById('emailinput-9edd02a027', getValById('emailinput-61e7e4c155'));

  // Work Email (name="work_email_id" inside work_email_id_panel)
  setValById('emailinput-1fdf3966f4', getValById('emailinput-1d0f54c4f4'));
}

/**
 * Initialize form field mapping.
 * Attaches input/change listeners to all source fields so the review section
 * stays in sync as the user fills in the form.
 */
function initFormFieldMapping() {
  // ── Named-field listeners (by name attribute) ─────────────────────────────
  const namedFields = [
    // Panel 1 – Personal Loan Offer
    'aadhaar_linked_mobile_number',
    'date_of_birth',
    'income_source',
    // Panel 2 – Full Name
    'first_name',
    'middle_name',
    'last_name',
    // Panel 2 – Personal Details
    'gender',
    'enter_Pan_id1',
    'enter_email_id',
    // Panel 2 – Address Details
    'address_as_per_aadhaar_records',
    'is_customer_aadhaar_address',
    // Panel 2 – Employer Details
    'employer_company_name',
    'employer_company_name_other',
    'industry_type',
    // Panel 2 – Income Details
    'monthly_net_income_salary',
    'ongoing_emis_if_any',
    // Panel 2 – Work Email
    'work_email_id',
    // Panel 2 – Type of Loan
    'loan_type',
    // Panel 3 – Salary Bank
    'salary_bank',
    'salary_bank_other',
    'salary_account',
    'ifsc',
  ];

  namedFields.forEach((fieldName) => {
    document.querySelectorAll(`[name="${fieldName}"]`).forEach((field) => {
      const eventType = (field.type === 'radio' || field.tagName === 'SELECT') ? 'change' : 'input';
      field.addEventListener(eventType, () => setTimeout(mapFormFieldsToReview, 100));
    });
  });

  // ── ID-based listeners (EMI calculator display fields & range sliders) ─────
  const idFields = [
    'numberinput-573a41b8b9',  // Loan Amount range slider (EMI calc)
    'numberinput-9a0e8002ff',  // Tenure range slider (EMI calc)
    'textinput-3f693161b5',    // Loan Amount display (EMI calc)
    'textinput-b0f0fe33c2',    // EMI Amount display
    'textinput-705f91a759',    // Rate of Interest display
    'textinput-8adf25be5f',    // Taxes display
  ];

  idFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => setTimeout(mapFormFieldsToReview, 100));
    }
  });

  // Run an initial mapping pass in case fields are pre-populated
  mapFormFieldsToReview();
}

/**
 * Wait for the Review Details accordion to be in the DOM, then start mapping.
 * Uses polling (safe for AEM dynamic form rendering).
 */
function waitAndInitMapping() {
  const reviewAccordion = document.getElementById('panelcontainer-6f0808bbe3');
  if (reviewAccordion) {
    initFormFieldMapping();
  } else {
    setTimeout(waitAndInitMapping, 300);
  }
}

/**
 * Fix "Pan Card" label → "PAN Number" and
 * make email-suggestion checkboxes behave like radio buttons (single-select).
 */
function initPersonalDetailsPreGenderPanel() {
  function applyFixes() {
    // 1. Rename "Pan Card" label to "PAN Number"
    const panLabel = document.querySelector(
      'label[for="emailinput-f5348740aa"].field-label',
    );
    if (panLabel && panLabel.textContent.trim() === 'Pan Card') {
      panLabel.textContent = 'PAN Number';
    }

    // 2. Radio-like behaviour for email-suggestion checkboxes
    const emailSuggestionsFieldset = document.querySelector(
      'fieldset[name="email_suggestions"]',
    );
    if (emailSuggestionsFieldset && !emailSuggestionsFieldset.dataset.radioInit) {
      emailSuggestionsFieldset.dataset.radioInit = 'true';
      emailSuggestionsFieldset.addEventListener('change', (e) => {
        const clicked = e.target;
        if (clicked.type !== 'checkbox' || clicked.name !== 'email_suggestions') return;

        // Uncheck every sibling checkbox except the one just clicked
        emailSuggestionsFieldset
          .querySelectorAll('input[type="checkbox"][name="email_suggestions"]')
          .forEach((cb) => {
            if (cb !== clicked) {
              cb.checked = false;
            }
          });
      });
    }
  }

  // Poll until the panel is in the DOM
  function waitForPanel() {
    const panel = document.querySelector(
      'fieldset.field-personal-details-pre-gender-panel',
    );
    if (panel) {
      applyFixes();
    } else {
      setTimeout(waitForPanel, 300);
    }
  }

  waitForPanel();
}

initPersonalDetailsPreGenderPanel();

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
