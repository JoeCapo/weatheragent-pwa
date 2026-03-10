// Helper to sum NWS raw grid data over a period of time
export function sumGridValuesForPeriod(
  periodStart: Date,
  periodEnd: Date,
  gridValues: { validTime: string; value: number | null }[]
): number {
  if (!gridValues || !gridValues.length) return 0;
  let total = 0;

  for (const item of gridValues) {
    if (item.value == null || item.value === 0) continue;

    const [isoTime, duration] = item.validTime.split('/');
    const itemStart = new Date(isoTime);
    
    // Parse ISO8601 duration (e.g. PT1H, PT6H, P1DT2H)
    let hours = 0;
    const daysMatch = duration.match(/P(\d+)D/);
    if (daysMatch) hours += parseInt(daysMatch[1]) * 24;
    const hoursMatch = duration.match(/T(\d+)H/);
    if (hoursMatch) hours += parseInt(hoursMatch[1]);
    
    // Default to 1 hour if poorly formatted
    if (hours === 0) hours = 1;

    const itemEnd = new Date(itemStart.getTime() + hours * 60 * 60 * 1000);

    // Calculate overlap mathematically
    const overlapStart = new Date(Math.max(periodStart.getTime(), itemStart.getTime()));
    const overlapEnd = new Date(Math.min(periodEnd.getTime(), itemEnd.getTime()));

    if (overlapStart < overlapEnd) {
      // It overlaps. Prorate the amount based on how much of the grid block time intersects the period.
      const overlapHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
      const proratedValue = item.value * (overlapHours / hours);
      total += proratedValue;
    }
  }

  return total;
}

// Convert millimeters to inches
export function mmToInches(mm: number): number {
  return mm / 25.4;
}

// Extract primary precipitation type from text forecast
export function extractPrecipType(forecastText: string): string | null {
  const lower = forecastText.toLowerCase();
  
  if (lower.includes('snow')) return 'Snow';
  if (lower.includes('ice') || lower.includes('freezing rain') || lower.includes('sleet')) return 'Ice';
  if (lower.includes('thunderstorm') || lower.includes('tstm')) return 'Thunderstorms';
  if (lower.includes('rain') || lower.includes('showers') || lower.includes('drizzle')) return 'Rain';
  
  return null;
}
