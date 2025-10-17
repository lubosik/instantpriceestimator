// SIC: Airtable helpers (idempotent)
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID;
const LEADS_TBL = process.env.AIRTABLE_LEADS_TABLE_ID;
const ASSETS_TBL = process.env.AIRTABLE_ASSETS_TABLE_ID;
const TOKEN = process.env.AIRTABLE_TOKEN;

const API = `https://api.airtable.com/v0/${AIRTABLE_BASE}`;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Basic fetch with 429/5xx retry (expo backoff)
async function afetch(url, init, tries = 5) {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, init);
    if (res.status !== 429 && res.status < 500) return res;
    attempt++;
    if (attempt >= tries) return res;
    await sleep(Math.min(30000, 500 * 2 ** attempt));
  }
}

// Resolve (or create) the Asset record ID for "Instant Pricing Estimator"
async function resolveAssetId(costAssetIdFromEnv, assetName = 'Instant Pricing Estimator') {
  if (costAssetIdFromEnv) return costAssetIdFromEnv;

  // 1) Try lookup by name
  const formula = `({Asset Name} = '${assetName.replace(/'/g, "\\'")}')`;
  const url = `${API}/${ASSETS_TBL}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const r = await afetch(url, { headers: HEADERS });
  if (!r.ok) {
    console.error('Assets lookup failed', await r.text());
    return null;
  }
  const data = await r.json();
  if (data.records?.length) return data.records[0].id;

  // 2) Create it if missing
  const createRes = await afetch(`${API}/${ASSETS_TBL}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      records: [{
        fields: {
          'Asset Name': assetName,
          'Type': 'Form',
          'Description': 'Interactive cost calculator / instant pricing estimator.',
        }
      }],
      typecast: true
    }),
  });
  if (!createRes.ok) {
    console.error('Asset create failed', await createRes.text());
    return null;
  }
  const created = await createRes.json();
  return created.records[0].id;
}

// Upsert a Lead by Email and link the Asset
async function upsertLead(payload) {
  if (!TOKEN) throw new Error('Missing AIRTABLE_TOKEN');
  const {
    firstName, lastName, email, phone,
    assetName = 'Instant Pricing Estimator',
    consultationStatus = 'Not Booked'
  } = payload;

  const assetId = await resolveAssetId(process.env.AIRTABLE_ASSET_ID_COST_CALCULATOR, assetName);

  // Airtable upsert by email (field id for Email)
  const res = await afetch(`${API}/${LEADS_TBL}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({
      performUpsert: { fieldsToMergeOn: [ 'fldFiL8aVLy0T9dIf' ] }, // Email field id
      records: [{
        fields: {
          'fldzqrzegFC2pHIKy': firstName,          // First Name
          'fldyNmcGU8COY2gyO': lastName,           // Last Name
          'fldFiL8aVLy0T9dIf': email,              // Email
          'fldKQ1oaoF2KJbJgu': phone || '',        // Phone
          'fldwn42WCMRaJvfDx': consultationStatus, // Consultation Status
          ...(assetId ? { 'fldhitKKfghXviFpc': [ assetId ] } : {}), // Assets Interacted
        }
      }],
      typecast: true
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Airtable upsert failed: ${res.status} ${t}`);
  }
  const json = await res.json();
  return json;
}

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function sanitizePhone(v = '') { return v.replace(/[^\d+()\-.\s]/g, '').trim(); }

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { firstName, lastName, email, phone, assetName } = req.body;
    const firstNameClean = (firstName || '').trim();
    const lastNameClean = (lastName || '').trim();
    const emailClean = (email || '').trim().toLowerCase();
    const phoneClean = sanitizePhone(phone);
    const assetNameClean = (assetName || 'Instant Pricing Estimator').trim();

    if (!firstNameClean || !lastNameClean || !isEmail(emailClean)) {
      return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
    }

    const result = await upsertLead({
      firstName: firstNameClean,
      lastName: lastNameClean,
      email: emailClean,
      phone: phoneClean,
      assetName: assetNameClean,
      consultationStatus: 'Not Booked'
    });

    return res.status(200).json({ ok: true, result });

  } catch (err) {
    const msg = err?.message || 'UNKNOWN';
    const code = /429|rate limit/i.test(msg) ? 429 : 500;
    return res.status(code).json({ ok: false, error: msg });
  }
}
