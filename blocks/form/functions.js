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
      data[key] = data[key].join(",");
    }
  });
  globals.functions.submitForm(data, true, "application/json");
}

/**
 * Days diff
 */
function days(endDate, startDate) {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

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
  if (!mobileNumber) return "";
  const value = mobileNumber.toString();
  return `${"*".repeat(5)}${value.substring(5)}`;
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

  const bubble = element.querySelector(".range-bubble");
  const bubbleWidth = bubble.getBoundingClientRect().width || 31;

  const left = `${(current / total) * 100}% - ${(current / total) * bubbleWidth}px`;

  // IMPORTANT: raw value only
  bubble.innerText = `${value}`;

  const style = `
    --total-steps:${total};
    --current-steps:${current};
  `;

  bubble.style.left = `calc(${left})`;
  element.setAttribute("style", style);
}

/**
 * Decorate range slider
 */
async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector("input");

  input.type = "range";
  input.min = input.min || 1;
  input.max = input.max || 100;
  input.step = fieldJson?.properties?.stepValue || 1;

  const div = document.createElement("div");
  div.className = "range-widget-wrapper decorated";

  input.after(div);

  const hover = document.createElement("span");
  hover.className = "range-bubble";

  const rangeMinEl = document.createElement("span");
  rangeMinEl.className = "range-min";

  const rangeMaxEl = document.createElement("span");
  rangeMaxEl.className = "range-max";

  rangeMinEl.innerText = `${input.min}`;
  rangeMaxEl.innerText = `${input.max}`;

  div.appendChild(hover);
  div.appendChild(input);
  div.appendChild(rangeMinEl);
  div.appendChild(rangeMaxEl);

  input.addEventListener("input", (e) => {
    updateBubble(e.target, div);
  });

  updateBubble(input, div);

  return fieldDiv;
}

/**
 * Format INR
 */
function formatIndianCurrency(amount) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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

  const emi = (principal * monthlyRate * onePlusRPowerN) / (onePlusRPowerN - 1);

  return Math.round(emi);
}

/**
 * EMI Calculator INIT (FINAL)
 */
function initEMICalculator() {
  const loanAmountInput = document.querySelector("#numberinput-573a41b8b9");
  const tenureInput = document.querySelector("#numberinput-9a0e8002ff");

  const loanDisplay = document.querySelector("#textinput-3f693161b5");
  const emiDisplay = document.querySelector("#textinput-b0f0fe33c2");
  const roiDisplay = document.querySelector("#textinput-705f91a759");
  const taxDisplay = document.querySelector("#textinput-8adf25be5f");

  if (!loanAmountInput || !tenureInput) {
    console.log("❌ EMI elements not found");
    return;
  }

  const RATE = 10.97;
  const TAX = 18;

  function setFieldValue(field, value) {
    if (!field) return;

    field.value = value;
    field.setAttribute("value", value);

    // trigger UI refresh (IMPORTANT)
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function updateEMI() {
    const loan = parseFloat(loanAmountInput.value) || 50000;
    const months = parseFloat(tenureInput.value) || 12;

    const emi = calculateEMI(loan, RATE, months);
    const tax = Math.round((emi * TAX) / 100);

    // Schedule of Charges = Processing Fee (tax) + 18% of Processing Fee
    const scheduleOfCharges = Math.round(tax * 1.18);

    setFieldValue(loanDisplay, formatIndianCurrency(loan));
    setFieldValue(emiDisplay, formatIndianCurrency(emi));
    setFieldValue(roiDisplay, `${RATE}%`);
    setFieldValue(taxDisplay, formatIndianCurrency(tax));

    // Write Schedule of Charges to its dedicated field
    const scheduleField = document.getElementById('textinput-9edede6d0e');
    if (scheduleField) {
      scheduleField.value = formatIndianCurrency(scheduleOfCharges);
    }
  }

  // 🔥 REAL-TIME SYNC
  loanAmountInput.addEventListener("input", updateEMI);
  tenureInput.addEventListener("input", updateEMI);

  updateEMI();
}

/**
 * Wait for DOM (dynamic forms safe)
 */
function waitAndInit() {
  const loan = document.querySelector("#numberinput-573a41b8b9");
  const tenure = document.querySelector("#numberinput-9a0e8002ff");

  if (loan && tenure) {
    initEMICalculator();
  } else {
    setTimeout(waitAndInit, 300);
  }
}

waitAndInit();

/**
 * Fix tenure slider to snap only to multiples of 12 (12, 24, 36, 48, 60, 72, 84)
 */
function fixTenureSliderStep() {
  const tenureInput = document.getElementById("numberinput-9a0e8002ff");
  if (tenureInput) {
    tenureInput.step = 12;
    // Snap current value to nearest valid multiple of 12
    const snapped = Math.round(parseFloat(tenureInput.value) / 12) * 12;
    tenureInput.value = Math.min(84, Math.max(12, snapped));
    // Trigger UI update so bubble and EMI recalculate
    tenureInput.dispatchEvent(new Event("input", { bubbles: true }));
  } else {
    setTimeout(fixTenureSliderStep, 300);
  }
}

fixTenureSliderStep();

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
 */
function mapFormFieldsToReview() {
  // ─── Helpers ────────────────────────────────────────────────────────────────

  const getValById = (id) => {
    const el = document.getElementById(id);
    return el ? el.value || "" : "";
  };

  const setValById = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  const getRadioLabel = (name) => {
    const checked = document.querySelector(`[name="${name}"]:checked`);
    if (!checked) return "";
    const label = document.querySelector(`label[for="${checked.id}"]`);
    return label ? label.textContent.trim() : checked.value;
  };

  const getSelectLabel = (id) => {
    const el = document.getElementById(id);
    if (!el) return "";
    const selected = el.options[el.selectedIndex];
    return selected ? selected.text : "";
  };

  // ─── 1. Personal Details ────────────────────────────────────────────────────

  const firstName = getValById("textinput-77c9a87e6d");
  const middleName = getValById("textinput-b14cc135a0");
  const lastName = getValById("textinput-0f68496a69");
  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  setValById("textinput-13f2313da5", fullName);

  setValById("textinput-cf353230e9", getValById("textinput-b07476d9e3"));

  const dobSrc = document.getElementById("datepicker-11fedea8ba");
  const dobTarget = document.getElementById("datepicker-a406454738");
  if (dobSrc && dobTarget) {
    const dobDisplay =
      dobSrc.getAttribute("display-value") || dobSrc.value || "";
    const dobEdit = dobSrc.getAttribute("edit-value") || dobSrc.value || "";
    dobTarget.value = dobDisplay;
    dobTarget.setAttribute("display-value", dobDisplay);
    dobTarget.setAttribute("edit-value", dobEdit);
  }

  setValById("textinput-0372ede0ce", getValById("emailinput-f5348740aa"));
  setValById("textinput-c0931aa145", getValById("textinput-8dcd88dcec"));

  const residenceRadioLabel = getRadioLabel("is_customer_aadhaar_address");
  const validResidenceTypes = ["Owned", "Rented"];
  if (validResidenceTypes.includes(residenceRadioLabel)) {
    setValById("textinput-d9fb9e62b3", residenceRadioLabel);
  }

  // ─── 2. Loan Details ────────────────────────────────────────────────────────

  setValById("textinput-1f19cd4958", getValById("textinput-3f693161b5"));
  setValById("textinput-cd9068e016", getValById("textinput-3f693161b5"));
  setValById("textinput-27f73095a4", getValById("textinput-b0f0fe33c2"));

  const tenureRaw = getValById("numberinput-9a0e8002ff");
  const tenureNum = parseFloat(tenureRaw);
  const tenureLabel = !Number.isNaN(tenureNum)
    ? `${Math.round(tenureNum)} months`
    : tenureRaw;
  setValById("textinput-5bbeede9c1", tenureLabel);

  setValById("textinput-7a8f4288d0", getValById("textinput-8adf25be5f"));
  setValById("textinput-5932aacccc", getValById("textinput-705f91a759"));

  const employerOther = getValById("textinput-5fd2ae7fc3");
  const employerDropdown = getSelectLabel("dropdown-8e87f43526");
  const employerName =
    employerOther.trim() ||
    (employerDropdown && employerDropdown !== "Others" ? employerDropdown : "");
  setValById("textinput-dcfe7665b1", employerName);

  setValById("textinput-9edede6d0e", getValById("textinput-9edede6d0e"));
  setValById("textinput-355120dc42", getSelectLabel("dropdown-f187a59a23"));

  // ─── 3. Salary Account Details ──────────────────────────────────────────────

  const salaryAcVal = getValById("textinput-2dee9d4be0");
  if (salaryAcVal) setValById("textinput-df7ef859ce", salaryAcVal);

  const ifscVal = getValById("textinput-cbcb5be8d3");
  if (ifscVal) setValById("textinput-f618a535ac", ifscVal);

  const salaryBankLabel = getRadioLabel("salary_bank");
  const salaryBankOther = getValById("textinput-77fb8d4235");
  setValById("textinput-f33180d5e4", salaryBankLabel || salaryBankOther);

  // ─── 4. Verify Email ID ─────────────────────────────────────────────────────

  setValById("emailinput-9edd02a027", getValById("emailinput-61e7e4c155"));
  setValById("emailinput-1fdf3966f4", getValById("emailinput-38bfd754e8"));
}

/**
 * Initialize form field mapping.
 */
function initFormFieldMapping() {
  const namedFields = [
    "aadhaar_linked_mobile_number",
    "date_of_birth",
    "income_source",
    "first_name",
    "middle_name",
    "last_name",
    "gender",
    "enter_Pan_id1",
    "enter_email_id",
    "address_as_per_aadhaar_records",
    "is_customer_aadhaar_address",
    "employer_company_name",
    "employer_company_name_other",
    "industry_type",
    "monthly_net_income_salary",
    "ongoing_emis_if_any",
    "work_email_id",
    "loan_type",
    "salary_bank",
    "salary_bank_other",
    "salary_account",
    "ifsc",
  ];

  namedFields.forEach((fieldName) => {
    document.querySelectorAll(`[name="${fieldName}"]`).forEach((field) => {
      const eventType =
        field.type === "radio" || field.tagName === "SELECT"
          ? "change"
          : "input";
      field.addEventListener(eventType, () =>
        setTimeout(mapFormFieldsToReview, 100),
      );
    });
  });

  const idFields = [
    "numberinput-573a41b8b9",
    "numberinput-9a0e8002ff",
    "textinput-3f693161b5",
    "textinput-b0f0fe33c2",
    "textinput-705f91a759",
    "textinput-8adf25be5f",
  ];

  idFields.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () =>
        setTimeout(mapFormFieldsToReview, 100),
      );
    }
  });

  mapFormFieldsToReview();
}

/**
 * Wait for the Review Details accordion to be in the DOM, then start mapping.
 */
function waitAndInitMapping() {
  const reviewAccordion = document.getElementById("panelcontainer-6f0808bbe3");
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
    const panLabel = document.querySelector(
      'label[for="emailinput-f5348740aa"].field-label',
    );
    if (panLabel && panLabel.textContent.trim() === "Pan Card") {
      panLabel.textContent = "PAN Number";
    }

    const emailSuggestionsFieldset = document.querySelector(
      'fieldset[name="email_suggestions"]',
    );
    if (
      emailSuggestionsFieldset &&
      !emailSuggestionsFieldset.dataset.radioInit
    ) {
      emailSuggestionsFieldset.dataset.radioInit = "true";
      emailSuggestionsFieldset.addEventListener("change", (e) => {
        const clicked = e.target;
        if (clicked.type !== "checkbox" || clicked.name !== "email_suggestions")
          return;

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

  function waitForPanel() {
    const panel = document.querySelector(
      "fieldset.field-personal-details-pre-gender-panel",
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
 * Thank You Panel - Add copy button to Loan Application Number
 */
function initThankYouPanel() {
  function applyThankYouEnhancements() {
    const panel = document.getElementById("panelcontainer-66df6ce6e9");
    if (!panel) return;

    const loanAppInput = document.getElementById("textinput-baf76d084a");
    if (
      loanAppInput &&
      !loanAppInput.parentElement.querySelector(".copy-btn")
    ) {
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "copy-btn";
      copyBtn.setAttribute("aria-label", "Copy loan application number");
      copyBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

      const row = document.createElement("div");
      row.className = "number-input-row";
      loanAppInput.parentElement.insertBefore(row, loanAppInput);
      row.appendChild(loanAppInput);
      row.appendChild(copyBtn);

      copyBtn.addEventListener("click", () => {
        const value = loanAppInput.value;
        if (value) {
          navigator.clipboard
            .writeText(value)
            .then(() => {
              copyBtn.classList.add("copied");
              setTimeout(() => copyBtn.classList.remove("copied"), 1500);
            })
            .catch(() => {
              const ta = document.createElement("textarea");
              ta.value = value;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
              copyBtn.classList.add("copied");
              setTimeout(() => copyBtn.classList.remove("copied"), 1500);
            });
        }
      });
    }
  }

  function waitForThankYouPanel() {
    const panel = document.getElementById("panelcontainer-66df6ce6e9");
    if (panel) {
      applyThankYouEnhancements();
    } else {
      setTimeout(waitForThankYouPanel, 300);
    }
  }

  waitForThankYouPanel();
}

initThankYouPanel();

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM BUTTON — Generate Loan Application Number
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a random 9-digit loan application number and populate the field.
 */
function generateLoanApplicationNumber() {
  const appNoField = document.getElementById("textinput-baf76d084a");
  if (!appNoField) return;

  if (appNoField.dataset.appNoGenerated) return;
  appNoField.dataset.appNoGenerated = "true";

  const appNo = String(Math.floor(100000000 + Math.random() * 900000000));
  appNoField.value = appNo;
  appNoField.setAttribute("value", appNo);

  appNoField.setAttribute("readonly", "true");
  appNoField.closest(".field-wrapper")?.classList.add("field-readonly");

  appNoField.dispatchEvent(new Event("input", { bubbles: true }));
  appNoField.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Wire up the Confirm button to generate the loan application number.
 */
function initConfirmButton() {
  const confirmBtn = document.getElementById("button-5347d46ecb");
  if (!confirmBtn) {
    setTimeout(initConfirmButton, 300);
    return;
  }

  confirmBtn.addEventListener("click", () => {
    generateLoanApplicationNumber();
  });
}

initConfirmButton();

// ─────────────────────────────────────────────────────────────────────────────
// SALARY BANK AUTO-FILL
// ─────────────────────────────────────────────────────────────────────────────

const SALARY_BANK_DATA = {
  hdfc_bank:     { name: "HDFC Bank",       ifscPrefix: "HDFC0" },
  icici_bank:    { name: "ICICI Bank",      ifscPrefix: "ICIC0" },
  axis_bank:     { name: "Axis Bank",       ifscPrefix: "UTIB0" },
  kotak:         { name: "Kotak",           ifscPrefix: "KKBK0" },
  sbi:           { name: "SBI",             ifscPrefix: "SBIN0" },
  bank_of_baroda:{ name: "Bank of Baroda",  ifscPrefix: "BARB0" },
  idfc_first:    { name: "IDFC First",      ifscPrefix: "IDFB0" },
};

function randDigits(n) {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
}

function fillSalaryBankDetails(bankKey) {
  const data = SALARY_BANK_DATA[bankKey];
  if (!data) return;

  const generatedAc = randDigits(12);
  const generatedIfsc = data.ifscPrefix + randDigits(6);

  const acInput = document.getElementById("textinput-2dee9d4be0");
  if (acInput) {
    acInput.removeAttribute("readonly");
    acInput.value = generatedAc;
    acInput.setAttribute("value", generatedAc);
    acInput.dispatchEvent(new Event("input", { bubbles: true }));
    acInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const ifscInput = document.getElementById("textinput-cbcb5be8d3");
  if (ifscInput) {
    ifscInput.removeAttribute("readonly");
    ifscInput.value = generatedIfsc;
    ifscInput.setAttribute("value", generatedIfsc);
    ifscInput.dispatchEvent(new Event("input", { bubbles: true }));
    ifscInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const reviewAc = document.getElementById("textinput-df7ef859ce");
  if (reviewAc) {
    reviewAc.value = generatedAc;
    reviewAc.setAttribute("value", generatedAc);
  }

  const reviewIfsc = document.getElementById("textinput-f618a535ac");
  if (reviewIfsc) {
    reviewIfsc.value = generatedIfsc;
    reviewIfsc.setAttribute("value", generatedIfsc);
  }

  const reviewBank = document.getElementById("textinput-f33180d5e4");
  if (reviewBank) {
    reviewBank.value = data.name;
    reviewBank.setAttribute("value", data.name);
  }
}

function initSalaryBankAutoFill() {
  const radios = document.querySelectorAll('input[name="salary_bank"]');
  if (!radios.length) {
    setTimeout(initSalaryBankAutoFill, 300);
    return;
  }

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked) fillSalaryBankDetails(radio.value);
    });
    if (radio.checked) fillSalaryBankDetails(radio.value);
  });
}

initSalaryBankAutoFill();

/**
 * Remove placeholders from specific panel fields
 */
function removePanelPlaceholders() {
  const fieldIds = [
    "textinput-5fd2ae7fc3",
    "textinput-72cdaa5e64",
    "numberinput-4f93a1127c",
    "numberinput-fa64c35931",
    "emailinput-38bfd754e8",
  ];

  const dropdownIds = [
    "dropdown-8e87f43526",
    "dropdown-d634820a49",
  ];

  const allInputsFound = fieldIds.every((id) => document.getElementById(id));
  const allDropdownsFound = dropdownIds.every((id) =>
    document.getElementById(id),
  );

  if (allInputsFound && allDropdownsFound) {
    fieldIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.removeAttribute("placeholder");
    });

    dropdownIds.forEach((id) => {
      const select = document.getElementById(id);
      if (select) {
        const firstOption = select.querySelector("option[disabled]");
        if (firstOption) firstOption.textContent = "";
      }
    });
  } else {
    setTimeout(removePanelPlaceholders, 300);
  }
}

removePanelPlaceholders();

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER DATA — pre-populated mock profiles
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOMER_DATA = [
  {
    fullName: "Harsh Rai",
    currentAddress: "Mumbai, Maharashtra",
    residenceType: "Owned",
  },
  {
    fullName: "Priyanshu Raj",
    currentAddress: "Pune, Maharashtra",
    residenceType: "Rented",
  },
  {
    fullName: "Sarthak Khanna",
    currentAddress: "Delhi, India",
    residenceType: "Owned",
  },
  {
    fullName: "Sneha Reddy",
    currentAddress: "Hyderabad, Telangana",
    residenceType: "Rented",
  },
  {
    fullName: "Arjun Kapoor",
    currentAddress: "Bangalore, Karnataka",
    residenceType: "Owned",
  },
];

function populateCustomerData() {
  const mobile = (
    document.getElementById("textinput-b07476d9e3")?.value || ""
  ).trim();
  const lastDigit = parseInt(mobile.slice(-1), 10);
  const index = Number.isNaN(lastDigit)
    ? Math.floor(Math.random() * CUSTOMER_DATA.length)
    : lastDigit % CUSTOMER_DATA.length;
  const customer = CUSTOMER_DATA[index];

  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  setVal("textinput-c800c88a3e", customer.fullName);
  setVal("textinput-c0931aa145", customer.currentAddress);
  setVal("textinput-8dcd88dcec", customer.currentAddress);
  setVal("textinput-d9fb9e62b3", customer.residenceType);

  setTimeout(mapFormFieldsToReview, 150);
}

function waitAndPopulateCustomerData() {
  const fullNameField = document.getElementById("textinput-c800c88a3e");
  if (fullNameField) {
    populateCustomerData();
  } else {
    setTimeout(waitAndPopulateCustomerData, 300);
  }
}

waitAndPopulateCustomerData();

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY FIELDS
// ─────────────────────────────────────────────────────────────────────────────

function makeFieldsReadOnly() {
  const readOnlyIds = [
    "textinput-c800c88a3e",
    "textinput-8dcd88dcec",
  ];

  readOnlyIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.setAttribute("readonly", "true");
      el.closest(".field-wrapper")?.classList.add("field-readonly");
    }
  });

  const readOnlyPanelIds = [
    "panelcontainer-3111e2a38e",
    "panelcontainer-0e03b7979d",
    "panelcontainer-31220f6f43",
  ];

  readOnlyPanelIds.forEach((panelId) => {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add("panel-readonly");
      panel.querySelectorAll("input, textarea, select").forEach((el) => {
        el.setAttribute("readonly", "true");
        if (el.tagName === "SELECT") el.setAttribute("disabled", "true");
        el.closest(".field-wrapper")?.classList.add("field-readonly");
      });
    }
  });
}

function waitAndMakeReadOnly() {
  const allPresent = [
    "panelcontainer-3111e2a38e",
    "panelcontainer-0e03b7979d",
    "panelcontainer-31220f6f43",
    "textinput-c800c88a3e",
    "textinput-8dcd88dcec",
  ].every((id) => document.getElementById(id));

  if (allPresent) {
    makeFieldsReadOnly();
  } else {
    setTimeout(waitAndMakeReadOnly, 300);
  }
}

waitAndMakeReadOnly();

// ─────────────────────────────────────────────────────────────────────────────
// OTP FUNCTIONALITY
// ─────────────────────────────────────────────────────────────────────────────

const OTP_API_BASE = "https://wasting-kitten-consensus.ngrok-free.dev";

let otpTimerInterval = null;
let attemptsLeft = 3;

function startOtpTimer() {
  const timerInput = document.getElementById("textinput-447ef8b5b0");
  const resendBtn = document.getElementById("button-c578b87368");
  const resendWrapper = resendBtn ? resendBtn.closest(".field-wrapper") : null;

  let timeLeft = 30;

  if (otpTimerInterval) {
    clearInterval(otpTimerInterval);
  }

  if (resendWrapper) {
    resendWrapper.style.display = "none";
  } else if (resendBtn) {
    resendBtn.style.display = "none";
  }

  if (timerInput) {
    timerInput.value = `${timeLeft}s`;
  }

  otpTimerInterval = setInterval(() => {
    timeLeft -= 1;

    if (timerInput) {
      timerInput.value = `${timeLeft}s`;
    }

    if (timeLeft <= 0) {
      clearInterval(otpTimerInterval);
      otpTimerInterval = null;

      if (resendWrapper) {
        resendWrapper.style.display = "";
      } else if (resendBtn) {
        resendBtn.style.display = "";
      }

      if (timerInput) {
        timerInput.value = "0s";
      }
    }
  }, 1000);
}

function stopOtpTimer() {
  if (otpTimerInterval) {
    clearInterval(otpTimerInterval);
    otpTimerInterval = null;
  }
}

async function generateOtp(e) {
  if (e) e.preventDefault();

  try {
    const mobile = document.getElementById("textinput-b07476d9e3")?.value;
    const dobEl = document.getElementById("datepicker-11fedea8ba");
    const dob = dobEl?.getAttribute("edit-value") || dobEl?.value;
    const otpInput = document.getElementById("textinput-8c697feb65");
    const attemptsField = document.getElementById("textinput-b825c7d30f");
    const submitBtn = document.getElementById("submit-1a393311e1");

    const res = await fetch(`${OTP_API_BASE}/api/generate-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ mobile, dob }),
    });

    const data = await res.json();
    console.log("Generate OTP response:", data);

    if (res.ok) {
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      if (attemptsField) {
        attemptsField.style.color = "#000";
        attemptsField.value = `Attempts Left: ${attemptsLeft}/3`;
      }

      if (otpInput && data.otp) {
        const otpStr = String(data.otp);
        otpInput.maxLength = otpStr.length;
        otpInput.setAttribute("maxlength", otpStr.length);
        otpInput.value = otpStr;
      }

      startOtpTimer();
    } else {
      console.error("Generate OTP failed:", data);
    }
  } catch (err) {
    console.error("Generate OTP Error:", err);
  }
}

async function validateOtp(e) {
  if (e) e.preventDefault();

  try {
    const mobile = document.getElementById("textinput-b07476d9e3")?.value;
    const otp = document.getElementById("textinput-8c697feb65")?.value;
    const attemptsField = document.getElementById("textinput-b825c7d30f");
    const submitBtn = document.getElementById("submit-1a393311e1");
    const resendBtn = document.getElementById("button-c578b87368");
    const timerInput = document.getElementById("textinput-447ef8b5b0");

    const res = await fetch(`${OTP_API_BASE}/api/validate-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ mobile, otp }),
    });

    const data = await res.json();
    console.log("Validate OTP response:", data);

    const resendWrapper = resendBtn
      ? resendBtn.closest(".field-wrapper")
      : null;

    if (res.ok) {
      if (attemptsField) {
        attemptsField.value = "✔ OTP Verified Successfully";
        attemptsField.style.color = "green";
      }

      if (submitBtn) {
        submitBtn.disabled = false;
      }

      stopOtpTimer();

      if (timerInput) {
        timerInput.value = "";
      }

      if (resendWrapper) {
        resendWrapper.style.display = "none";
      } else if (resendBtn) {
        resendBtn.style.display = "none";
      }

      populateCustomerData();
    } else {
      attemptsLeft -= 1;
      if (attemptsLeft < 0) attemptsLeft = 0;

      stopOtpTimer();

      if (timerInput) {
        timerInput.value = "";
      }

      if (attemptsLeft > 0) {
        if (resendWrapper) {
          resendWrapper.style.display = "";
        } else if (resendBtn) {
          resendBtn.style.display = "";
        }

        if (attemptsField) {
          attemptsField.value = `❌ Incorrect OTP. Attempts Left: ${attemptsLeft}/3`;
          attemptsField.style.color = "red";
        }
      } else {
        if (resendWrapper) {
          resendWrapper.style.display = "none";
        } else if (resendBtn) {
          resendBtn.style.display = "none";
        }

        if (attemptsField) {
          attemptsField.value =
            "❌ Too many failed attempts. Try again after 24 hours";
          attemptsField.style.color = "red";
        }
      }

      if (submitBtn) {
        submitBtn.disabled = true;
      }

      if (data.message) {
        console.log(data.message);
      }
    }
  } catch (err) {
    console.error("Validate OTP Error:", err);
  }
}

function initOtpPanel() {
  const viewLoanBtn = document.getElementById("submit-3b37973aeb");
  const verifyOtpBtn = document.getElementById("button-71c0d88d0d");
  const resendOtpBtn = document.getElementById("button-c578b87368");

  if (!viewLoanBtn || !verifyOtpBtn) {
    setTimeout(initOtpPanel, 300);
    return;
  }

  if (resendOtpBtn) {
    const resendWrapper = resendOtpBtn.closest(".field-wrapper");
    if (resendWrapper) {
      resendWrapper.style.display = "none";
    } else {
      resendOtpBtn.style.display = "none";
    }
  }

  viewLoanBtn.addEventListener("click", (e) => {
    generateOtp(e);
  });

  verifyOtpBtn.addEventListener("click", (e) => {
    validateOtp(e);
  });

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", (e) => {
      generateOtp(e);
    });
  }
}

initOtpPanel();

// ─────────────────────────────────────────────────────────────────────────────
// VIEW LOAN ELIGIBILITY — PANEL VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function setFieldError(wrapper, show) {
  if (!wrapper) return;
  let errEl = wrapper.querySelector(".vle-required-error");
  if (show) {
    if (!errEl) {
      errEl = document.createElement("span");
      errEl.className = "vle-required-error";
      errEl.style.cssText =
        "color:red;font-size:0.78rem;display:block;margin-top:4px;";
      errEl.textContent = "This is a required field";
      wrapper.appendChild(errEl);
    }
    wrapper.classList.add("has-error");
  } else {
    if (errEl) errEl.remove();
    wrapper.classList.remove("has-error");
  }
}

function validateLoanOfferPanel(showErrors = false) {
  let allValid = true;

  const mobileInput = document.getElementById("textinput-b07476d9e3");
  const mobileWrapper = mobileInput?.closest(".field-wrapper");
  const mobilePattern = /^[6-9]\d{9}$/;
  const mobileOk =
    mobileInput && mobilePattern.test((mobileInput.value || "").trim());
  if (!mobileOk) allValid = false;
  if (showErrors) setFieldError(mobileWrapper, !mobileOk);

  const dobInput = document.getElementById("datepicker-11fedea8ba");
  const dobWrapper = dobInput?.closest(".field-wrapper");
  const dobRaw = (
    dobInput?.getAttribute("edit-value") ||
    dobInput?.value ||
    ""
  ).trim();
  let dobOk = false;
  if (dobRaw.length > 0) {
    const dobDate = new Date(dobRaw);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!Number.isNaN(dobDate.getTime()) && dobDate < today) {
      const age = getAge(dobRaw);
      dobOk = age >= 21 && age <= 60;
    }
  }
  if (!dobOk) allValid = false;
  if (showErrors) setFieldError(dobWrapper, !dobOk);

  const incomeChecked = document.querySelector(
    '[name="income_source"]:checked',
  );
  const incomeWrapper = document.getElementById("radiobutton-e7c53285fe");
  const incomeOk = incomeChecked !== null;
  if (!incomeOk) allValid = false;
  if (showErrors) setFieldError(incomeWrapper, !incomeOk);

  const consentLoanCb = document.getElementById("checkbox-35dc144430");
  const consentLoanWrapper = consentLoanCb?.closest(".field-wrapper");
  const consentLoanOk = consentLoanCb?.checked === true;
  if (!consentLoanOk) allValid = false;
  if (showErrors) setFieldError(consentLoanWrapper, !consentLoanOk);

  const consentMktCb = document.getElementById("checkbox-169f3aa4ef");
  const consentMktWrapper = consentMktCb?.closest(".field-wrapper");
  const consentMktOk = consentMktCb?.checked === true;
  if (!consentMktOk) allValid = false;
  if (showErrors) setFieldError(consentMktWrapper, !consentMktOk);

  return allValid;
}

function updateViewLoanBtnState() {
  const btn = document.getElementById("submit-3b37973aeb");
  if (!btn) return;

  const valid = validateLoanOfferPanel(false);
  if (valid) {
    btn.disabled = false;
    btn.style.opacity = "";
    btn.style.cursor = "";
  } else {
    btn.disabled = true;
    btn.style.opacity = "0.5";
    btn.style.cursor = "not-allowed";
  }
}

function initLoanOfferPanelValidation() {
  const btn = document.getElementById("submit-3b37973aeb");
  const panel = document.getElementById("panelcontainer-9f23d6d666");

  if (!btn || !panel) {
    setTimeout(initLoanOfferPanelValidation, 300);
    return;
  }

  updateViewLoanBtnState();

  btn.addEventListener(
    "click",
    (e) => {
      if (!validateLoanOfferPanel(false)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        validateLoanOfferPanel(true);
        return;
      }
      panel
        .querySelectorAll(".vle-required-error")
        .forEach((el) => el.remove());
      panel
        .querySelectorAll(".has-error")
        .forEach((el) => el.classList.remove("has-error"));
    },
    true,
  );

  panel.addEventListener("input", () => {
    updateViewLoanBtnState();
    const activeWrapper = document.activeElement?.closest?.(".field-wrapper");
    if (activeWrapper) setFieldError(activeWrapper, false);
  });

  panel.addEventListener("change", () => {
    updateViewLoanBtnState();
    const activeWrapper = document.activeElement?.closest?.(".field-wrapper");
    if (activeWrapper) setFieldError(activeWrapper, false);
  });

  const mobileInput = document.getElementById("textinput-b07476d9e3");
  if (mobileInput) {
    const mobilePattern = /^[6-9]\d{9}$/;
    const mobileWrap = mobileInput.closest(".field-wrapper");
    mobileInput.addEventListener("input", () => {
      const val = (mobileInput.value || "").trim();
      mobileWrap?.querySelector(".mobile-invalid-error")?.remove();
      if (val.length > 0 && !mobilePattern.test(val)) {
        mobileWrap?.classList.add("has-error");
        if (mobileWrap && !mobileWrap.querySelector(".vle-required-error")) {
          const errSpan = document.createElement("span");
          errSpan.className = "mobile-invalid-error";
          errSpan.textContent = "Please enter a valid Indian mobile number";
          mobileWrap.appendChild(errSpan);
        }
      } else {
        mobileWrap?.classList.remove("has-error");
        mobileWrap?.querySelector(".vle-required-error")?.remove();
      }
      updateViewLoanBtnState();
    });
  }

  const dobInput = document.getElementById("datepicker-11fedea8ba");
  if (dobInput) {
    new MutationObserver(() => {
      updateViewLoanBtnState();
      const dobWrap = dobInput.closest(".field-wrapper");
      if (dobWrap) {
        const dobRawVal = (
          dobInput.getAttribute("edit-value") ||
          dobInput.value ||
          ""
        ).trim();
        if (dobRawVal.length > 0) {
          const dobDate = new Date(dobRawVal);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const valid =
            !Number.isNaN(dobDate.getTime()) &&
            dobDate < today &&
            getAge(dobRawVal) >= 21 &&
            getAge(dobRawVal) <= 60;
          if (!valid) {
            dobWrap.classList.add("has-error");
          } else {
            dobWrap.classList.remove("has-error");
            dobWrap.querySelector(".vle-required-error")?.remove();
          }
        }
      }
    }).observe(dobInput, {
      attributes: true,
      attributeFilter: ["edit-value", "value"],
    });
  }
}

initLoanOfferPanelValidation();

// ─────────────────────────────────────────────────────────────────────────────
// PAN VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

const PAN_REGEX = /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/;

function validatePan(raw) {
  const v = (raw || "").trim().toUpperCase();
  if (v.length === 0) return null;
  if (v.length !== 10) return "PAN must be exactly 10 characters.";
  if (PAN_REGEX.test(v)) return null;
  if (!/^[A-Z]{5}/.test(v))
    return "First 5 characters of PAN must be alphabets.";
  if (v[3] !== "P") return 'Fourth character of PAN must be "P".';
  if (!/^[0-9]{4}$/.test(v.slice(5, 9)))
    return "Characters 6–9 of PAN must be numeric.";
  return "PAN could not be verified. Please enter a valid PAN.";
}

function updatePanError() {
  const panInput = document.getElementById("emailinput-f5348740aa");
  if (!panInput) return;

  const fieldWrapper = panInput.closest(".field-wrapper");
  if (!fieldWrapper) return;

  let errorEl = fieldWrapper.querySelector(".pan-error");
  const errorMsg = validatePan(panInput.value);

  if (errorMsg) {
    if (!errorEl) {
      errorEl = document.createElement("span");
      errorEl.className = "pan-error";
      fieldWrapper.append(errorEl);
    }
    errorEl.textContent = errorMsg;
    fieldWrapper.classList.add("has-error");
    panInput.setAttribute("aria-invalid", "true");
  } else {
    if (errorEl) errorEl.remove();
    fieldWrapper.classList.remove("has-error");
    panInput.removeAttribute("aria-invalid");
  }
}

function initPanValidation() {
  function attachPanListeners() {
    const panInput = document.getElementById("emailinput-f5348740aa");
    if (!panInput) {
      setTimeout(attachPanListeners, 300);
      return;
    }

    panInput.type = "text";
    panInput.removeAttribute("pattern");

    panInput.addEventListener("input", () => {
      const pos = panInput.selectionStart;
      panInput.value = panInput.value.toUpperCase();
      panInput.setSelectionRange(pos, pos);
      updatePanError();
    });

    panInput.addEventListener("blur", updatePanError);
    panInput.addEventListener("change", updatePanError);
  }

  attachPanListeners();
}

initPanValidation();

// ─────────────────────────────────────────────────────────────────────────────
// DOB VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function getAge(dobRaw) {
  const dob = new Date(dobRaw);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

function isValid() {
  const form = document.querySelector("form");
  if (!form) return false;

  const phone = form.querySelector(".field-mobile-number input");
  const dob = form.querySelector(".field-date-of-birth input");
  const checkboxes = [
    ...form.querySelectorAll(
      '.field-consent-communication input[type="checkbox"]',
    ),
    ...form.querySelectorAll('.field-consent-marketing input[type="checkbox"]'),
  ];

  const phoneOk = (phone?.value || "").replace(/\D/g, "").length >= 10;

  const dobRaw = (dob?.getAttribute("edit-value") || dob?.value || "").trim();
  const dobDate = new Date(dobRaw);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const age = getAge(dobRaw);
  const dobOk =
    dobRaw.length > 0 &&
    !Number.isNaN(dobDate.getTime()) &&
    dobDate < today &&
    age >= 21 &&
    age <= 60;

  const checkboxesOk =
    checkboxes.length > 0 && checkboxes.every((cb) => cb.checked);

  return phoneOk && dobOk && checkboxesOk;
}

function updateDobError() {
  const form = document.querySelector("form");
  if (!form) return;

  const dob = form.querySelector(".field-date-of-birth input");
  const dobField = form.querySelector(".field-date-of-birth");
  if (!dobField || !dob) return;

  let errorEl = dobField.querySelector(".dob-age-error");
  const dobRaw = (dob.getAttribute("edit-value") || dob.value || "").trim();

  let errorMsg = "";
  if (dobRaw.length > 0) {
    const dobDate = new Date(dobRaw);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(dobDate.getTime())) {
      errorMsg = "Please enter a valid date of birth.";
    } else if (dobDate >= today) {
      errorMsg = "Date of birth cannot be today or a future date.";
    } else {
      const age = getAge(dobRaw);
      if (age < 21) errorMsg = "Age must be 21 or above to apply for a loan.";
      else if (age > 60)
        errorMsg = "Age must be 60 or below to apply for a loan.";
    }
  }

  if (errorMsg) {
    if (!errorEl) {
      errorEl = document.createElement("span");
      errorEl.className = "dob-age-error";
      dobField.append(errorEl);
    }
    errorEl.textContent = errorMsg;
    dobField.classList.add("has-error");
  } else {
    if (errorEl) errorEl.remove();
    dobField.classList.remove("has-error");
  }
}

function initDobValidation() {
  function attachListeners() {
    const dobInput = document.getElementById("datepicker-11fedea8ba");
    if (!dobInput) {
      setTimeout(attachListeners, 300);
      return;
    }

    ["change", "input", "blur"].forEach((evt) => {
      dobInput.addEventListener(evt, () => {
        setTimeout(updateDobError, 50);
      });
    });

    const observer = new MutationObserver(() => {
      setTimeout(updateDobError, 50);
    });
    observer.observe(dobInput, {
      attributes: true,
      attributeFilter: ["edit-value", "value"],
    });
  }

  attachListeners();
}

initDobValidation();

// ─────────────────────────────────────────────────────────────────────────────
// INCOME-BASED LOAN ELIGIBILITY
// ─────────────────────────────────────────────────────────────────────────────

const INCOME_LOAN_CONFIG = {
  MIN_LOAN: 50000,
  MAX_LOAN: 1500000,
  STEP: 10000,
  RATE_TIERS: [
    { upTo: 200000, rate: 14.5 },
    { upTo: 400000, rate: 13.5 },
    { upTo: 600000, rate: 12.75 },
    { upTo: 900000, rate: 12.0 },
    { upTo: 1200000, rate: 11.25 },
    { upTo: 1500000, rate: 10.97 },
  ],
  PROCESSING_FEE_RATE: 0.015,
  GST_RATE: 0.18,
};

function calcMaxLoanFromIncome(monthlyIncome) {
  const { MIN_LOAN, MAX_LOAN, STEP } = INCOME_LOAN_CONFIG;
  const raw = Math.min(monthlyIncome * 10, MAX_LOAN);
  const rounded = Math.round(raw / STEP) * STEP;
  return Math.max(rounded, MIN_LOAN);
}

function getRateForLoanAmount(amount) {
  const { RATE_TIERS } = INCOME_LOAN_CONFIG;
  const tier = RATE_TIERS.find((t) => amount <= t.upTo);
  return tier ? tier.rate : RATE_TIERS[RATE_TIERS.length - 1].rate;
}

function formatIndianAmount(amount) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function updateLoanEligibilityMessage(maxLoan) {
  const msgEl = document.getElementById("text-55a6c5a0e4");
  if (!msgEl) return;
  const p = msgEl.querySelector("p");
  if (p) {
    p.textContent = `You can get a loan up to ${formatIndianAmount(maxLoan)}!`;
  }
}

function formatScaleLabel(value) {
  if (value >= 100000) {
    const l = value / 100000;
    return `${l % 1 === 0 ? l : l.toFixed(1)}L`;
  }
  return `${Math.round(value / 1000)}K`;
}

function rebuildLoanSliderScale(slider, minVal, maxVal) {
  const scaleEl = slider
    .closest(".range-widget-wrapper")
    ?.querySelector(".range-scale");
  if (!scaleEl) return;

  const MARKER_COUNT = 7;
  const markers = scaleEl.querySelectorAll(".range-scale-marker");

  if (markers.length === 0) {
    for (let i = 0; i < MARKER_COUNT; i += 1) {
      const span = document.createElement("span");
      span.className = "range-scale-marker";
      scaleEl.appendChild(span);
    }
  }

  const allMarkers = scaleEl.querySelectorAll(".range-scale-marker");
  allMarkers.forEach((marker, i) => {
    const pct = i / (MARKER_COUNT - 1);
    const val = Math.round((minVal + pct * (maxVal - minVal)) / 10000) * 10000;
    marker.textContent = formatScaleLabel(val);
    marker.style.left = `${pct * 100}%`;
  });
}

function updateLoanSliderMax(maxLoan) {
  const slider = document.getElementById("numberinput-573a41b8b9");
  if (!slider) return;

  const minVal = Number(slider.min) || 50000;
  slider.max = maxLoan;

  if (Number(slider.value) > maxLoan) {
    slider.value = maxLoan;
  }

  rebuildLoanSliderScale(slider, minVal, maxLoan);

  slider.dispatchEvent(new Event("input", { bubbles: true }));
  slider.dispatchEvent(new Event("change", { bubbles: true }));
}

function updateRateDisplay(loanAmount) {
  const rate = getRateForLoanAmount(loanAmount);
  const roiDisplay = document.getElementById("textinput-705f91a759");
  if (roiDisplay) {
    roiDisplay.value = `${rate}%`;
    roiDisplay.dispatchEvent(new Event("input", { bubbles: true }));
    roiDisplay.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function onIncomeChange() {
  const incomeEl = document.getElementById("numberinput-4f93a1127c");
  if (!incomeEl) return;

  const income = parseFloat(incomeEl.value) || 0;
  const maxLoan =
    income > 0 ? calcMaxLoanFromIncome(income) : INCOME_LOAN_CONFIG.MAX_LOAN;

  updateLoanEligibilityMessage(maxLoan);
  updateLoanSliderMax(maxLoan);

  const slider = document.getElementById("numberinput-573a41b8b9");
  if (slider) {
    updateRateDisplay(Number(slider.value));
  }
}

function initIncomeLoanEligibility() {
  const incomeEl = document.getElementById("numberinput-4f93a1127c");
  if (!incomeEl) {
    setTimeout(initIncomeLoanEligibility, 300);
    return;
  }

  incomeEl.addEventListener("input", onIncomeChange);
  incomeEl.addEventListener("change", onIncomeChange);

  const slider = document.getElementById("numberinput-573a41b8b9");
  if (slider) {
    slider.addEventListener("input", () => {
      updateRateDisplay(Number(slider.value));
    });
  }
}

initIncomeLoanEligibility();

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
  getAge,
  isValid,
  updateDobError,
};
