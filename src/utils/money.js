// Format number as currency
// Example: formatMoney(1500, "Rs") => "Rs 1,500.00"
export const formatMoney = (amount, currency = "Rs") => {
  if (amount === null || amount === undefined || isNaN(amount)) return `${currency} 0.00`;

  return `${currency} ${Number(amount).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Calculate tax amount
// Example: calcTax(1000, 16) => 160
export const calcTax = (subtotal, taxPercent = 0) => {
  return (subtotal * taxPercent) / 100;
};

// Calculate discount (flat amount)
// Example: applyDiscount(1000, 100) => 900
export const applyDiscount = (subtotal, discount = 0) => {
  const result = subtotal - discount;
  return result < 0 ? 0 : result;
};

// Calculate final total
// Example: calcTotal(1000, 100, 16) => 1044
export const calcTotal = (subtotal, discount = 0, taxPercent = 0) => {
  const afterDiscount = applyDiscount(subtotal, discount);
  const tax = calcTax(afterDiscount, taxPercent);
  return afterDiscount + tax;
};

// Calculate change to return to customer
// Example: calcChange(5000, 3200) => 1800
export const calcChange = (amountPaid, total) => {
  const change = amountPaid - total;
  return change < 0 ? 0 : change;
};