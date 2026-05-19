import { ethers } from 'ethers';

/**
 * Formats a EURT amount (6 decimals) to a human readable string.
 * Example: 1000000 -> "1.0"
 */
export const formatEURT = (amount: bigint | string | number): string => {
  try {
    return ethers.formatUnits(amount, 6);
  } catch (error) {
    console.error('Error formatting EURT:', error);
    return '0.00';
  }
};

/**
 * Formats a EURT amount for display with currency symbol.
 * Example: 1000000 -> "1,00 EURT"
 */
export const formatEURTDisplay = (amount: bigint | string | number): string => {
  const formatted = formatEURT(amount);
  return `${parseFloat(formatted).toLocaleString('de-DE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 6 
  })} EURT`;
};
