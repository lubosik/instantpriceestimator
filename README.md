# SMP Instant Price Estimator

A beautiful, interactive pricing calculator for Scalp Micropigmentation (SMP) services by Stella's Ink Chamber, integrated with Airtable CRM.

## 🎯 Features

- **7-Step Interactive Quiz** - Gender, age, hair concern, coverage area, finish preference, timing, and add-ons
- **Real-Time Pricing** - Instant calculations based on Stella's exact pricing rules
- **Responsive Design** - Mobile-first design that works on all devices
- **Brand Consistency** - Uses Stella's Ink Chamber brand tokens and design system
- **Gift Card Integration** - $100 consultation gift card promotion
- **Calendly Integration** - Direct booking link to Stella's consultation scheduler
- **Airtable CRM Integration** - Automatic lead capture and management

## 💰 Pricing Structure

- **Scars Only**: $150 - $300 per session
- **Full Scalp**: $850 - $1000 per session
- **Other Areas**: $850 base with coverage-specific adjustments
- **Session Recommendations**: 3-4 sessions based on complexity
- **Add-ons**: Scar camouflage (+$400), Women's density focus (+$200)

## 🚀 Deployment

This project is deployed on Vercel and can be accessed at:
**https://instantpriceestimator.vercel.app**

### Environment Variables Setup

Before deployment, configure these environment variables in your Vercel project:

1. **AIRTABLE_TOKEN** - Your Airtable Personal Access Token
2. **AIRTABLE_BASE_ID** - `appziwgv7YcLuhMgb`
3. **AIRTABLE_LEADS_TABLE_ID** - `tbl1L5sCfOWAJGj9O`
4. **AIRTABLE_ASSETS_TABLE_ID** - `tblldgp7cfF4WtRvL`
5. **AIRTABLE_ASSET_ID_COST_CALCULATOR** - (Optional) Asset record ID

See `ENVIRONMENT_SETUP.md` for detailed instructions.

### Local Development

```bash
# Clone the repository
git clone https://github.com/lubosik/instantpriceestimator.git

# Install Vercel CLI (if not already installed)
npm i -g vercel

# Set up environment variables locally
cp ENVIRONMENT_SETUP.md .env.local
# Edit .env.local with your actual values

# Run locally
vercel dev
```

## 🔗 Airtable Integration

The calculator automatically captures leads in your Airtable CRM when users complete the quiz:

- **Lead Data**: First name, last name, email, phone
- **Asset Tracking**: Links to "Instant Pricing Estimator" asset
- **Duplicate Prevention**: Upserts by email to prevent duplicates
- **Status Tracking**: Consultation status set to "Not Booked"
- **Rate Limiting**: Built-in retry logic with exponential backoff

### Airtable Schema

**Leads Table Fields:**
- First Name → `fldzqrzegFC2pHIKy`
- Last Name → `fldyNmcGU8COY2gyO`
- Email → `fldFiL8aVLy0T9dIf`
- Phone → `fldKQ1oaoF2KJbJgu`
- Consultation Booked (checkbox) → `fldZUH5fCzmhxVpeE`
- Assets Interacted (link to Assets) → `fldhitKKfghXviFpc`
- Consultation Status (single select) → `fldwn42WCMRaJvfDx`

## 🎨 Design System

Built using Stella's Ink Chamber brand tokens:
- **Primary Color**: #293919 (Forest Green)
- **Typography**: Libre Baskerville (headings), Source Sans Pro (body)
- **Spacing**: Consistent 8px grid system
- **Shadows**: Subtle elevation with brand-consistent colors

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🧪 Testing

1. Complete the calculator quiz
2. Check browser console for "Lead captured successfully in Airtable"
3. Verify the lead appears in your Airtable Leads table
4. Confirm the "Instant Pricing Estimator" asset is linked

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

This is a client project for Stella's Ink Chamber. For updates or modifications, please contact the development team.

---

**Built for Stella's Ink Chamber** - Edmonton's premier SMP specialist