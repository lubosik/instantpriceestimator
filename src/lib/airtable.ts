// SIC: Airtable helpers (idempotent)
const AIRTABLE_BASE = process.env.AIRTABLE_BASE_ID!;
const LEADS_TBL = process.env.AIRTABLE_LEADS_TABLE_ID!;
const ASSETS_TBL = process.env.AIRTABLE_ASSETS_TABLE_ID!;
const TOKEN = process.env.AIRTABLE_TOKEN!;

const API = `https://api.airtable.com/v0/${AIRTABLE_BASE}`;
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
};

type LeadPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  assetName?: string;   // e.g. "Instant Pricing Estimator" (fallback if asset ID not provided)
  assetId?: string;     // direct record ID preferred (from env)
  consultationStatus?: 'Booked' | 'Not Booked';
};

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// Basic fetch with 429/5xx retry (expo backoff)
async function afetch(url: string, init: RequestInit, tries = 5): Promise<Response> {
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
export async function resolveAssetId(costAssetIdFromEnv?: string, assetName = 'Instant Pricing Estimator'): Promise<string | null> {
  if (costAssetIdFromEnv) return costAssetIdFromEnv;

  // 1) Try lookup by name
  const formula = `({Asset Name} = '${assetName.replace(/'/g, "\\'")}')`;
  const url = `${API}/${ASSETS_TBL}?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;
  const r = await afetch(url, { headers: HEADERS });
  if (!r.ok) {
    console.error('Assets lookup failed', await r.text());
    return null;
  }
  const data = await r.json() as { records?: Array<{ id: string }> };
  if (data.records?.length) return data.records[0].id;

  // 2) Create it if missing
  const createRes = await afetch(`${API}/${ASSETS_TBL}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      records: [{
        fields: {
          // safer to use field names on Asset create (names less likely to change; OK here)
          'Asset Name': assetName,
          'Type': 'Form', // or 'Guide'/'Other' — choose best fit
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
  const created = await createRes.json() as { records: Array<{ id: string }> };
  return created.records[0].id;
}

// Upsert a Lead by Email and link the Asset
export async function upsertLead(payload: LeadPayload) {
  if (!TOKEN) throw new Error('Missing AIRTABLE_TOKEN');
  const {
    firstName, lastName, email, phone,
    assetId: assetIdMaybe,
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
          // Use field IDs for resilience
          'fldzqrzegFC2pHIKy': firstName,          // First Name
          'fldyNmcGU8COY2gyO': lastName,           // Last Name
          'fldFiL8aVLy0T9dIf': email,              // Email
          'fldKQ1oaoF2KJbJgu': phone || '',        // Phone
          'fldwn42WCMRaJvfDx': consultationStatus, // Consultation Status
          ...(assetId ? { 'fldhitKKfghXviFpc': [ assetId ] } : {}), // Assets Interacted (array of record IDs)
          // Leave "Consultation Booked" unchecked on create; Airtable omits empty fields on return.
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
