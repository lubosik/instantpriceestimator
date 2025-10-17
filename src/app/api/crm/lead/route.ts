import { NextRequest, NextResponse } from 'next/server';
import { upsertLead } from '@/lib/airtable';

export const runtime = 'nodejs'; // ensure Node (not edge) so we can call Airtable easily

type ReqBody = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  assetName?: string;     // optional override (default "Instant Pricing Estimator")
};

function isEmail(v: string){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function sanitizePhone(v = ''){ return v.replace(/[^\d+()\-.\s]/g, '').trim(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ReqBody;
    const firstName = (body.firstName || '').trim();
    const lastName  = (body.lastName  || '').trim();
    const email     = (body.email     || '').trim().toLowerCase();
    const phone     = sanitizePhone(body.phone);
    const assetName = (body.assetName || 'Instant Pricing Estimator').trim();

    if (!firstName || !lastName || !isEmail(email)) {
      return NextResponse.json({ ok:false, error:'INVALID_INPUT' }, { status: 400 });
    }

    const result = await upsertLead({
      firstName, lastName, email, phone, assetName,
      consultationStatus: 'Not Booked'
    });

    return NextResponse.json({ ok:true, result }, { status: 200 });

  } catch (err: any) {
    const msg = err?.message || 'UNKNOWN';
    const code = /429|rate limit/i.test(msg) ? 429 : 500;
    return NextResponse.json({ ok:false, error: msg }, { status: code });
  }
}
