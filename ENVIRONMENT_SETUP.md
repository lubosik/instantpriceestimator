# Airtable Integration Environment Variables
# Add these to your Vercel project settings: Settings → Environment Variables

# Required: Your Airtable Personal Access Token
AIRTABLE_TOKEN=your_airtable_personal_access_token_here

# Required: Base ID from your Airtable base
AIRTABLE_BASE_ID=appziwgv7YcLuhMgb

# Required: Table IDs from your Airtable base
AIRTABLE_LEADS_TABLE_ID=tbl1L5sCfOWAJGj9O
AIRTABLE_ASSETS_TABLE_ID=tblldgp7cfF4WtRvL

# Optional: Asset ID for "Cost Calculator / Instant Pricing Estimator" 
# If not provided, the system will look it up by name and create it if missing
AIRTABLE_ASSET_ID_COST_CALCULATOR=

# Instructions:
# 1. Go to your Vercel project dashboard
# 2. Navigate to Settings → Environment Variables
# 3. Add each variable above with the correct values
# 4. Redeploy your project
# 5. Test the calculator to ensure leads are captured in Airtable
