/**
 * Frontend Battery AI Model Service Client
 * Connects the web application to the AI Battery Health Analysis service.
 * Supports primary connection via Node backend proxy (port 5000) with direct
 * fallback to FastAPI service (port 8000).
 */

const DIRECT_HOSTS = ['http://127.0.0.1:8000', 'http://localhost:8000'];

async function ragFetch(endpoint, options = {}) {
  const cleanEp = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // 1. First attempt via Vite proxy (/api/rag)
  try {
    const res = await fetch(`/api/rag${cleanEp}`, {
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
    // Continue to direct port 8000 if proxy failed
  }

  // 2. Direct fallback to Python FastAPI server on port 8000
  for (const host of DIRECT_HOSTS) {
    try {
      const directRes = await fetch(`${host}/api/rag${cleanEp}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        signal: AbortSignal.timeout(25000),
      });

      if (directRes.ok) {
        return await directRes.json();
      }
    } catch (err) {
      // Try next host
    }
  }

  throw new Error('AI Model Prediction Error: Unable to connect to prediction service on port 8000.');
}

/**
 * Fetch health status of RAG service & FAISS index
 */
export async function getRagHealth() {
  try {
    return await ragFetch('/health');
  } catch (err) {
    return { status: 'OFFLINE', error: err.message };
  }
}

/**
 * Get active and available battery specifications
 */
export async function getBatterySpecs() {
  return await ragFetch('/battery-specs');
}

/**
 * Switch active battery profile (e.g. 'unverified_12v', 'verified_3s_nmc', 'verified_4s_lifepo4')
 */
export async function selectBatterySpecProfile(profileId) {
  return await ragFetch('/battery-specs/select', {
    method: 'POST',
    body: JSON.stringify({ profile_id: profileId }),
  });
}

/**
 * Trigger fresh on-demand AI model prediction with current telemetry & history
 */
export async function triggerRagAnalysis(telemetry = null, history = []) {
  return await ragFetch('/analyze', {
    method: 'POST',
    body: JSON.stringify({ telemetry, history }),
  });
}

/**
 * Get latest cached analysis
 */
export async function getLatestRagAnalysis() {
  return await ragFetch('/latest');
}

/**
 * Query technical documentation knowledge base
 */
export async function queryRagKnowledgeBase(question, telemetry = null) {
  return await ragFetch('/query', {
    method: 'POST',
    body: JSON.stringify({ question, telemetry }),
  });
}

/**
 * Browse indexed technical document chunks
 */
export async function browseKnowledgeBase(query = '') {
  const qStr = query ? `?query=${encodeURIComponent(query)}` : '';
  return await ragFetch(`/knowledge-base${qStr}`);
}
