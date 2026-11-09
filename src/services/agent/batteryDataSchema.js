/**
 * Battery Data Telemetry Schema & Types
 * Represents single reading and time-series history
 */

/**
 * Validates and normalizes raw telemetry reading without injecting fake values
 * @param {Object} raw
 * @returns {Object} normalized battery reading
 */
export function normalizeBatteryReading(raw = {}) {
  const now = new Date();
  const timestamp = raw.timestamp || raw.lastUpdated || now.toISOString();

  const v = typeof raw.voltage === 'number' ? raw.voltage : (typeof raw.packVoltage === 'number' ? raw.packVoltage : null);
  const c = typeof raw.current === 'number' ? raw.current : null;
  const t = typeof raw.temperature === 'number' ? raw.temperature : (typeof raw.temp === 'number' ? raw.temp : null);

  return {
    voltage: v,
    current: c,
    temperature: t,
    soc: typeof raw.soc === 'number' ? raw.soc : null,
    soh: typeof raw.soh === 'number' ? raw.soh : null,
    cycleCount: typeof raw.cycleCount === 'number' ? raw.cycleCount : null,
    timestamp: typeof timestamp === 'string' ? timestamp : new Date(timestamp).toISOString(),
    minCellVoltage: raw.minCellVoltage ?? null,
    maxCellVoltage: raw.maxCellVoltage ?? null,
  };
}

/**
 * Normalizes an array of historical telemetry points
 * @param {Array} history
 * @returns {Array} normalized historical readings
 */
export function normalizeBatteryHistory(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }
  return history.map(normalizeBatteryReading);
}
