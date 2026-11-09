/**
 * Frontend Client Service for BMS Professional Reports & Email Notifications
 * Interfaces with Python ReportLab backend (via Node.js proxy /api/rag/* or direct port 8000).
 */

const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/rag` 
  : '/api/rag';

const DIRECT_HOSTS = ['http://127.0.0.1:8000', 'http://localhost:8000'];

async function fetchWithFallback(path, options = {}) {
  const fastApiPath = path.startsWith('/reports') 
    ? `/api${path}` 
    : path.startsWith('/alerts') 
      ? `/api${path}` 
      : `/api/rag${path}`;

  // 1. First attempt via Vite proxy
  try {
    const res = await fetch(fastApiPath, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(25000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Continue to direct FastAPI port 8000 if proxy failed
  }

  // 2. Direct fallback to Python FastAPI server
  for (const host of DIRECT_HOSTS) {
    try {
      const resDirect = await fetch(`${host}${fastApiPath}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        signal: AbortSignal.timeout(25000),
      });

      if (resDirect.ok) {
        return await resDirect.json();
      }
    } catch (err) {
      // Try next host
    }
  }

  throw new Error(`Report Service Error: Unable to communicate with BMS reporting backend on port 8000.`);
}

/**
 * Generate a new ReportLab PDF battery condition report
 */
export async function generateBmsReport({ period = '24h', customStart = null, customEnd = null, recipientEmail = null, telemetry = null, history = [] } = {}) {
  return await fetchWithFallback('/reports/generate', {
    method: 'POST',
    body: JSON.stringify({
      period,
      custom_start: customStart,
      custom_end: customEnd,
      recipient_email: recipientEmail,
      telemetry,
      history,
    }),
  });
}

/**
 * Retrieve list of generated PDF reports
 */
export async function fetchReportsHistory(limit = 50) {
  return await fetchWithFallback('/reports/history');
}

/**
 * Get direct download URL for a report PDF
 */
export function getReportDownloadUrl(reportId) {
  return `/api/reports/${encodeURIComponent(reportId)}/download`;
}

/**
 * Get inline preview URL for a report PDF (for browser iframe viewing)
 */
export function getReportPreviewUrl(reportId) {
  return `/api/reports/${encodeURIComponent(reportId)}/preview`;
}

/**
 * Dispatch generated PDF report to recipient email
 */
export async function sendReportEmail(reportId, { recipient, subject = '', message = '' }) {
  return await fetchWithFallback(`/reports/${encodeURIComponent(reportId)}/email`, {
    method: 'POST',
    body: JSON.stringify({
      recipient,
      subject: subject || null,
      message: message || null,
    }),
  });
}

/**
 * Fetch automatic temperature alert daemon settings
 */
export async function fetchAlertSettings() {
  return await fetchWithFallback('/alerts/settings');
}

/**
 * Update automatic temperature alert daemon settings
 */
export async function updateAlertSettings(settings) {
  return await fetchWithFallback('/alerts/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
}

/**
 * Fetch history of triggered temperature alerts
 */
export async function fetchAlertsHistory(limit = 50) {
  return await fetchWithFallback('/alerts/history');
}

/**
 * Dispatch a manual test alert email
 */
export async function sendTestAlert(customTemp = 48.0) {
  return await fetchWithFallback('/alerts/test', {
    method: 'POST',
    body: JSON.stringify({ custom_temp: customTemp }),
  });
}
