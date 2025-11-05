# Algeria → USA Transfer in USD - Analysis

## Transfer Check Response

When a client from **Algeria** wants to make a transfer to **USA** in **USD**, the system would return:

### Response Structure

```json
{
  "status": "Not Possible",
  "reason": "Transfers from Algeria are currently restricted",
  "system": "N/A",
  "fee": "N/A",
  "restrictions": "Algeria is listed in the restricted sender countries for USD transfers as per Paysera compliance policy",
  "explanation": "This transfer cannot be processed. Transfers from Algeria in USD to USA are restricted due to compliance and regulatory requirements.",
  "conclusion": "This transfer is not available through Paysera at this time."
}
```

### Detailed Breakdown

#### 1. **Status**: `Not Possible` ❌
- The transfer is **NOT allowed** because:
  - **Algeria is listed in the restricted countries** (footnote 5 in official Paysera fee documentation)
  - Algeria appears in the restricted sender list for non-EUR currency transfers
  - Compliance restrictions apply to Algerian senders for USD transfers

#### 2. **System**: `N/A`
- No transfer system is available because:
  - According to [Paysera's official fee page](https://www.paysera.lt/v2/en-LT/fees/transfers-in-other-currencies), Algeria is excluded
  - Neither Currency One nor Instarem (internal transfer partners) can process this route
  - Standard SWIFT is also unavailable due to sender country restrictions

#### 3. **Fee**: `N/A`
- No fee applies as the transfer cannot be processed

#### 4. **Restrictions**: Algeria is in the restricted countries list
- Per official Paysera documentation (footnote 5):
  > "Except for payment service providers and senders in these countries: Afghanistan, **Algeria**, American Samoa, Belarus, Belize, Bosnia and Herzegovina..."
- This restriction applies to most non-EUR currency transfers including USD
- The restriction is for compliance and regulatory purposes

#### 5. **Processing Time**: `N/A`
- Transfer cannot be processed

---

## How to Get This Information

The information is retrieved through a multi-step process:

### Step 1: Data Flow

```
User Input (Frontend)
    ↓
checkTransfer() in companyApiService.ts
    ↓
payseraIntranetService.checkTransfer()
    ↓
getTransferRules() - Fetches from Official Paysera Fee Pages
    ↓
Logic Checks (Sender Country/Recipient Country/Currency Restrictions)
    ↓
Response Formation
    ↓
Return to Frontend
```

### Step 2: Data Sources

The system should retrieve transfer rules from official Paysera sources:

#### **Official Source: Paysera Public Fee Pages**
For USD transfers, the official reference is:
- **URL**: https://www.paysera.lt/v2/en-LT/fees/transfers-in-other-currencies
- **Section**: US dollar (USD)
- **Applicable Footnotes**: 
  - Footnote 4: Lists prohibited sender countries for standard transfers
  - Footnote 5: Lists restricted sender countries including **Algeria**
  - Footnote 7: Additional restrictions

#### **Internal Source: Paysera Intranet (for employees)**
- **URL**: `https://intranet.paysera.net/rest/api/content/58238300`
- **Method**: Confluence REST API
- **Authentication**: Basic Auth (email + API key)
- **Page ID**: `58238300` (Transfer Rules Page)
- **Cache**: 1 hour expiry

### Step 3: Logic Checks Performed

For Algeria → USA USD transfer:

```typescript
// 1. Check if sender country is in restricted list (footnote 5)
const restrictedSenders = [
  'Afghanistan', 'Algeria', 'American Samoa', 'Belarus', 'Belize',
  'Bosnia and Herzegovina', 'Botswana', 'Burundi', 'Cambodia',
  // ... (full list per footnote 5)
];

if (restrictedSenders.includes('Algeria') && currency === 'USD') {
  return {
    isPossible: false,
    restrictions: ['Algeria is in the restricted sender countries list for USD transfers'],
    // ...
  }
}

// 2. Check if recipient country is prohibited
if (rules.prohibitedCountries.includes('USA')) // false
  return { isPossible: false, ... }

// 3. For Algeria, the check fails at step 1
// Transfer is NOT POSSIBLE
```

### Step 4: Response Formatting

The raw data should be transformed in `companyApiService.ts`:

```typescript
const status = result.isPossible ? 'Possible' : 'Not Possible';
const reason = result.isPossible 
    ? `Transfer via ${result.system} is available`
    : 'Transfers from Algeria are currently restricted';
    
const explanation = result.isPossible
    ? `This transfer can be processed using the ${result.system} system.`
    : `This transfer cannot be processed. ${result.restrictions.join(' ')}`;

return {
  status,
  reason,
  system: result.system || 'N/A',
  fee: result.fee || 'N/A',
  restrictions: result.restrictions.join('; ') || 'None',
  explanation,
  conclusion
};
```

---

## Key Files Involved

1. **`components/Tools.tsx`**
   - Frontend UI component for transfer check
   - Handles user input and displays results

2. **`services/companyApiService.ts`**
   - Main API service layer
   - `checkTransfer()` function formats requests/responses

3. **`services/payseraIntranetService.ts`**
   - Core business logic
   - `checkTransfer()` and `getTransferRules()` functions
   - Fetches from Paysera Intranet API or uses fallback data

4. **`types.ts`**
   - Type definitions for requests and responses

---

## Environment Configuration

Required environment variables (in `.env` file):

```env
VITE_PAYSERA_API_KEY=your_api_key_here
VITE_PAYSERA_EMAIL=your_email@paysera.com
VITE_PAYSERA_INTRANET_URL=https://intranet.paysera.net
```

If these are not configured, the system automatically falls back to hardcoded rules.

---

## Testing the Algeria → USA USD Transfer

### Via UI:
1. Navigate to the Transfer Check tool
2. Select **Sender Country**: Algeria
3. Select **Recipient Country**: USA
4. Select **Currency**: USD
5. Click "Check Transfer"
6. View the response showing transfer is **NOT POSSIBLE** due to sender country restrictions

### Via API:
```typescript
const response = await checkTransfer({
  senderNationality: 'Algeria',
  recipientCountry: 'USA',
  currency: 'USD'
});
// Should return: { status: 'Not Possible', reason: 'Transfers from Algeria are currently restricted', ... }
```

### Expected Result:
The system should recognize Algeria in the restricted sender countries list and return a negative response indicating the transfer cannot be processed.

---

## Country and Currency Lists (Per Official Paysera Documentation)

### Prohibited Recipient Countries (footnote 4):
- Afghanistan, Bahamas, Barbados, Botswana, Cambodia, DR Congo, Cuba
- Ghana, Guinea-Bissau, Haiti, Iraq, Jamaica, Lebanon, Libya, Mauritius
- Mongolia, Myanmar, Nicaragua, North Korea, Pakistan, Panama
- Somalia, South Sudan, Sudan, Syria, Trinidad and Tobago, Uganda
- Vanuatu, Venezuela, Yemen, Zimbabwe

### Restricted Sender Countries for USD (footnote 5):
**Algeria is included in this list**, along with:
- Afghanistan, Algeria, American Samoa, Belarus, Belize, Bosnia and Herzegovina
- Botswana, Burundi, Cambodia, Central African Republic, Chad, Comoros, Cuba
- Dominican Republic, DR Congo, Ecuador, Egypt, Eritrea, Ethiopia, Equatorial Guinea
- Ghana, Guam, Guatemala, Guernsey, Guinea, Guinea-Bissau, Guyana, Haiti
- Iran, Iraq, Côte d'Ivoire, Kazakhstan, Kenya, Laos, Lebanon, Liberia, Libya
- Mali, Moldova, Myanmar, Niger, Nigeria, North Korea, Palestine, Panama
- Russia, Rwanda, Samoa, Saudi Arabia, Serbia, Somalia, South Korea, South Sudan
- Sudan, Syria, Trinidad and Tobago, Tunisia, Turkey, Uganda, Ukraine (specific regions)
- Vanuatu, Venezuela, U.S. Virgin Islands, Western Sahara, Yemen, Zimbabwe

### Enhanced Monitoring Countries:
- Albania, Barbados, Burkina Faso, Cambodia, Cayman Islands
- Haiti, Jamaica, Jordan, Mali, Morocco, Nicaragua
- Pakistan, Panama, Philippines, Senegal, South Africa
- Turkey, Uganda, United Arab Emirates, Vanuatu

### Available Transfer Systems for USD (when allowed):
According to official documentation:
- **Standard transfers to Poland**: 10 EUR fee, 1h to 1 BD
- **Standard transfers to EEA + GB**: 10 EUR fee, 1 to 3 BD
- **Urgent transfers to EU**: 15 EUR fee, up to 1 BD

---

## Summary

For an **Algeria → USA transfer in USD**:
- ❌ **Transfer is NOT POSSIBLE**
- 🚫 **System**: N/A (Transfer restricted)
- 💰 **Fee**: N/A
- ⏱️ **Processing**: N/A
- 📋 **Restrictions**: **Algeria is listed in restricted sender countries for USD transfers** (per footnote 5)
- 🔍 **Compliance**: Sender country restriction applies

**⚠️ Important**: The client **CANNOT** proceed with this transfer through Paysera due to compliance restrictions on transfers from Algeria in USD currency.

### Reference Documentation:
- **Official Fee Page**: https://www.paysera.lt/v2/en-LT/fees/transfers-in-other-currencies
- **Section**: US dollar (USD)
- **Applicable Restriction**: Footnote 5 - Restricted sender countries

*Note: This analysis is based on official Paysera public documentation and is intended for internal use by Paysera employees to assist customers with transfer inquiries.*
