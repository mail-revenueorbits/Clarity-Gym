/**
 * Formats a Nepali BS date string (YYYY/MM/DD) into a human-readable format.
 * Example: "2083/01/11" -> "11 Baisakh, 2083"
 */
export const formatNepaliDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  
  const nepaliMonths = [
    'Baisakh', 'Jestha', 'Ashad', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
  ];

  // Handle both / and - separators
  const parts = dateStr.includes('/') ? dateStr.split('/') : dateStr.split('-');
  
  if (parts.length !== 3) return dateStr;

  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (monthIndex < 0 || monthIndex > 11) return dateStr;

  return `${day} ${nepaliMonths[monthIndex]}, ${year}`;
};

/**
 * Helper to get the BS date string from an AD date and format it.
 */
import { makeDualDateValueFromAd } from '@etpl/nepali-datepicker';

export const getFormattedBsDate = (adDate: Date | string | number | null | undefined): string => {
  if (!adDate) return '—';
  try {
    const dateObj = (typeof adDate === 'string' || typeof adDate === 'number') ? new Date(adDate) : adDate;
    const bsDate = makeDualDateValueFromAd(dateObj).formatted.bs;
    return formatNepaliDate(bsDate);
  } catch (e) {
    return '—';
  }
};
