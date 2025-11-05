export const isValidIBAN = (iban: string): boolean => {
  const cleanedIban = iban.replace(/ /g, '').toUpperCase();
  
  // Basic format check - country code, checksum, and body. Length can vary.
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/.test(cleanedIban)) {
    return false;
  }

  // Move first 4 chars to the end
  const rearrangedIban = cleanedIban.substring(4) + cleanedIban.substring(0, 4);

  // Replace letters with numbers (A=10, B=11, ...)
  const numericIban = rearrangedIban
    .split('')
    .map(char => {
      const charCode = char.charCodeAt(0);
      if (charCode >= 65 && charCode <= 90) { // A-Z
        return (charCode - 55).toString();
      }
      return char;
    })
    .join('');

  // Use BigInt for the modulo operation to handle large numbers safely
  try {
    const num = BigInt(numericIban);
    return num % 97n === 1n;
  } catch (e) {
    // This might happen if the numeric string is malformed, though regex should prevent it.
    return false;
  }
};
