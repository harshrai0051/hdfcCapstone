/**
 * Format number to Indian currency format (with K for thousands, L for lakhs)
 * @param {number} value - The number to format
 * @returns {string} - Formatted string (e.g., "15L", "50K")
 */
function formatIndianCurrency(value) {
  if (value >= 100000) {
    const lakhs = value / 100000;
    return lakhs % 1 === 0 ? `${lakhs}L` : `${lakhs.toFixed(1)}L`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return thousands % 1 === 0 ? `${thousands}K` : `${thousands.toFixed(1)}K`;
  }
  return value.toString();
}
 
/**
 * Format number to Indian rupee format with comma separators
 * @param {number} value - The number to format
 * @returns {string} - Formatted string (e.g., "₹15,00,000")
 */
function formatINR(value) {
  const numStr = value.toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);
  const formatted = otherNumbers !== ''
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    : lastThree;
  return `₹${formatted}`;
}
 
/**
 * Format number as months for scale markers
 * @param {number} value - The number to format
 * @returns {string} - Formatted string (e.g., "84m")
 */
function formatMonths(value) {
  return `${value}m`;
}
 
/**
 * Format number with "months" suffix for bubble display
 * @param {number} value - The number to format
 * @returns {string} - Formatted string (e.g., "84 months")
 */
function formatMonthsBubble(value) {
  return `${value} months`;
}
 
/**
 * Detect the range type based on field properties or label
 * @param {HTMLElement} fieldDiv - The field div element
 * @param {Object} fieldJson - The field JSON configuration
 * @returns {string} - Either 'currency' or 'months'
 */
function detectRangeType(fieldDiv, fieldJson) {
  // Check if there's a format type specified in fieldJson
  if (fieldJson?.properties?.formatType) {
    return fieldJson.properties.formatType;
  }
 
  // Check label for keywords
  const label = fieldDiv.querySelector('label');
  if (label) {
    const labelText = label.textContent.toLowerCase();
    if (labelText.includes('month') || labelText.includes('tenure') || labelText.includes('duration')) {
      return 'months';
    }
    if (labelText.includes('amount') || labelText.includes('inr') || labelText.includes('rupee') || labelText.includes('₹')) {
      return 'currency';
    }
  }
 
  // Check field name as fallback
  const input = fieldDiv.querySelector('input');
  if (input?.name) {
    const fieldName = input.name.toLowerCase();
    if (fieldName.includes('month') || fieldName.includes('tenure') || fieldName.includes('duration')) {
      return 'months';
    }
  }
 
  // Default to currency
  return 'currency';
}
 
/**
 * Generate scale markers for the range slider
 * @param {HTMLElement} container - The container element to add markers to
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} formatType - Either 'currency' or 'months'
 * @param {number} steps - Number of scale markers to display
 */
function createScaleMarkers(container, min, max, formatType = 'currency', steps = 7) {
  const scaleContainer = document.createElement('div');
  scaleContainer.className = 'range-scale';
 
  // Generate evenly distributed scale values
  const interval = (max - min) / (steps - 1);
 
  for (let i = 0; i < steps; i++) {
    const scaleValue = min + (interval * i);
    const marker = document.createElement('span');
    marker.className = 'range-scale-marker';
   
    // Format based on type
    if (formatType === 'months') {
      marker.innerText = formatMonths(scaleValue);
    } else {
      marker.innerText = formatIndianCurrency(scaleValue);
    }
   
    marker.style.left = `${(i / (steps - 1)) * 100}%`;
    scaleContainer.appendChild(marker);
  }
 
  container.appendChild(scaleContainer);
}
 
/**
 * Update the bubble position and value display
 * @param {HTMLInputElement} input - The range input element
 * @param {HTMLElement} element - The wrapper element
 * @param {string} formatType - Either 'currency' or 'months'
 */
function updateBubble(input, element, formatType = 'currency') {
  const step = parseFloat(input.step) || 1;
  const max = parseFloat(input.max) || 100;
  const min = parseFloat(input.min) || 0;
  const value = parseFloat(input.value) || min;
 
  // Calculate current position
  const current = Math.round((value - min) / step);
  const total = Math.round((max - min) / step);
  const percentage = total > 0 ? (current / total) * 100 : 0;
 
  const bubble = element.querySelector('.range-bubble');
  if (!bubble) return;
 
  // Format the bubble value based on type
  if (formatType === 'months') {
    bubble.textContent = formatMonthsBubble(Math.round(value));
  } else {
    bubble.textContent = formatINR(Math.round(value));
  }
 
  // Calculate bubble position
  const bubbleWidth = bubble.offsetWidth || 100;
  const offset = (percentage / 100) * bubbleWidth;
  bubble.style.left = `calc(${percentage}% - ${offset}px)`;
 
  // Update CSS custom properties for progress bar
  element.style.setProperty('--total-steps', total);
  element.style.setProperty('--current-steps', current);
}
/**
 * Main decorator function for range input
 * @param {HTMLElement} fieldDiv - The field div element
 * @param {Object} fieldJson - The field JSON configuration
 * @returns {HTMLElement} - The decorated field div
 */
export default async function decorate(fieldDiv, fieldJson) {
  const input = fieldDiv.querySelector('input');
  if (!input) return fieldDiv;
 
  // Set up range input properties
  input.type = 'range';
  input.min = input.min || fieldJson?.minimum || 1;
  input.max = input.max || fieldJson?.maximum || 100;
  input.step = fieldJson?.properties?.stepValue || input.step || 1;
 
  // Set default value if not already set
  if (!input.value) {
    input.value = input.max; // Default to max value as shown in image
  }
 
  // Detect the range type (currency or months)
  const formatType = detectRangeType(fieldDiv, fieldJson);
 
  // Create wrapper div
  const wrapper = document.createElement('div');
  wrapper.className = 'range-widget-wrapper decorated';
  input.after(wrapper);
 
  // Create bubble for value display
  const bubble = document.createElement('span');
  bubble.className = 'range-bubble';
  wrapper.appendChild(bubble);
 
  // Move input into wrapper
  wrapper.appendChild(input);
 
  // Create scale markers
  createScaleMarkers(wrapper, parseInt(input.min), parseInt(input.max), formatType);
 
  // Add event listeners
  input.addEventListener('input', (e) => {
    updateBubble(e.target, wrapper, formatType);
  });
 
  // Also update on change (for keyboard navigation)
  input.addEventListener('change', (e) => {
    updateBubble(e.target, wrapper, formatType);
  });
 
  // Initialize bubble position and value
  updateBubble(input, wrapper, formatType);
 
  // Update bubble on window resize to recalculate positioning
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateBubble(input, wrapper, formatType);
    }, 100);
  });
 
  return fieldDiv;
}
