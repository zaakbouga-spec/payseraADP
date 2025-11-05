# P-Advisor Features Documentation

## Overview

P-Advisor is an AI-powered assistant for navigating Paysera's financial services. It provides three main features:

1. **Transfer Check** - Verifies if a transfer is possible between countries and currencies
2. **Company Validation** - Checks if a company can open a Paysera account
3. **IBAN & SWIFT Validator** - Validates and analyzes IBAN and SWIFT/BIC codes

---

## Feature 1: Transfer Check

### Purpose
Validates whether a money transfer is possible considering sender nationality, recipient country, and currency, based on Paysera's internal compliance and operational rules.

### Workflow

#### Step 1: User Input
The user provides:
- **Sender Nationality**: The nationality of the person sending the money (default: Austria)
- **Recipient Country**: The country where the money is being sent (default: Albania)
- **Currency**: The currency of the transfer (default: EUR)

#### Step 2: Data Processing
1. The application calls `payseraIntranetService.checkTransfer()` with the user's input
2. The service fetches transfer rules from the Paysera Intranet API (Confluence page ID: 58238300)
3. If the API call fails, it falls back to cached/hardcoded compliance data

#### Step 3: Validation Logic

The system checks the following in order:

**A. Prohibited Countries**
- Checks if the recipient country is in the sanctions list
- Countries like Russia, Belarus, North Korea, Iran, etc. are prohibited
- **Result**: If prohibited → Status: "Not Possible"

**B. Currency Restrictions**
- Checks if the currency is restricted (e.g., RUB, BYN)
- **Result**: If restricted → Status: "Not Possible"

**C. Enhanced Monitoring Requirements**
- Checks if sender nationality or recipient country requires enhanced due diligence
- Countries like Albania, Morocco, Turkey, UAE, etc. require enhanced monitoring
- **Result**: Additional requirements are flagged

**D. Transfer System Selection**
Based on the currency and countries involved:

| Scenario | System | Fee | Processing Time |
|----------|--------|-----|-----------------|
| EUR to EU/EEA country | SEPA | 0 EUR | 1-2 business days |
| EUR to Lithuania | Local Transfer | 0 EUR | Same day |
| Other currencies/countries | SWIFT | 1-5 EUR | 2-5 business days |

#### Step 4: Response Format

```json
{
  "status": "Possible" | "Not Possible",
  "reason": "Transfer via SEPA is available",
  "system": "SEPA" | "SWIFT" | "Local Transfer",
  "fee": "0 EUR",
  "restrictions": "Enhanced due diligence required; Additional docs needed",
  "explanation": "Detailed explanation of the transfer processing",
  "conclusion": "Final recommendation"
}
```

#### Step 5: UI Display
The result is displayed with:
- ✅ Green for "Possible" or ❌ Red for "Not Possible"
- System type and fee information
- Any restrictions or special requirements
- Detailed explanation and conclusion

### Data Sources

**Primary Source**: Paysera Intranet Confluence API
- Page ID: 58238300
- URL: https://intranet.paysera.net/pages/viewpage.action?pageId=58238300
- Contains official transfer rules and restrictions

**Fallback Data**: Embedded in `payseraIntranetService.ts`
- Used when API is unavailable
- Based on known compliance requirements

### Key Assumptions

1. **Sender Country**: Always Lithuania (Paysera is based in Lithuania)
2. **Sender Nationality**: Taken into consideration for enhanced monitoring
3. **Recipient Country**: Primary factor in determining transfer possibility
4. **Currency**: Determines the transfer system and fees

---

## Feature 2: Company Validation

### Purpose
Determines if a company can open a Paysera account based on its registration country and business activity, considering compliance and risk policies.

### Workflow

#### Step 1: User Input
The user provides:
- **Company Registration Country**: Where the company is legally registered
- **Company Activity**: Description of the business operations (e.g., "E-commerce store selling clothing")

#### Step 2: Data Processing
1. The application calls `payseraIntranetService.validateCompany()` with the user's input
2. The service fetches company restrictions from the compliance database
3. Falls back to hardcoded restrictions if API is unavailable

#### Step 3: Validation Logic

**A. Country Validation**

Check if the country is in one of these categories:

| Category | Countries | Status | Requirements |
|----------|-----------|--------|--------------|
| Prohibited | Afghanistan, Belarus, Russia, etc. | ❌ Not Possible | Cannot open account |
| Enhanced Due Diligence | Albania, Morocco, Turkey, UAE, etc. | ⚠️ Possible with conditions | Extra documentation |
| EU/EEA | All EU countries | ✅ Standard Processing | Normal requirements |
| Other | Rest of the world | 🔍 Case-by-case | Manual review |

**B. Activity Validation**

The system checks if the business activity matches:

**Prohibited Activities** (Account cannot be opened):
- Gambling and betting
- Cryptocurrency exchanges
- Adult entertainment
- Weapons and ammunition
- Illegal substances
- Money laundering services
- Ponzi/pyramid schemes

**Restricted Activities** (May be accepted with conditions):
- E-cigarettes/vaping
- Forex trading
- Binary options
- Dating services
- Loan services
- Investment services without licensing

**Accepted Activities**:
- E-commerce
- Software development
- Consulting
- Manufacturing
- Import/export
- Professional services

#### Step 4: Conditions Assignment

Based on country and activity status, conditions may include:

For Enhanced Due Diligence Countries:
- ✓ Enhanced due diligence documentation required
- ✓ Company beneficial ownership verification required
- ✓ Source of funds documentation required

For Restricted Activities:
- ✓ Valid business licenses must be provided
- ✓ Enhanced monitoring will be applied
- ✓ Additional compliance review required

#### Step 5: Response Format

```json
{
  "status": "Possible" | "Possible (with conditions)" | "Not Possible",
  "reason": "Account opening status explanation",
  "countryStatus": "Standard Processing" | "Enhanced Due Diligence Required" | "Prohibited",
  "activityStatus": "Accepted" | "Restricted" | "Prohibited",
  "explanation": "Detailed analysis of country and activity",
  "conclusion": "Final decision and next steps"
}
```

#### Step 6: UI Display
The result shows:
- ✅ Green for "Possible" / ⚠️ Yellow for "Possible (with conditions)" / ❌ Red for "Not Possible"
- Country status assessment
- Activity status assessment
- List of conditions (if any)
- Detailed explanation and actionable conclusion

### Data Sources

**Primary Source**: Compliance database via Paysera Intranet
- Contains prohibited/restricted activities list
- Country risk classifications
- Regulatory requirements

**Fallback Data**: Embedded in `payseraIntranetService.ts`
- Comprehensive lists of prohibited/restricted activities
- Country classifications
- Standard conditions

### Activity Matching Logic

The system performs **case-insensitive substring matching**:
```typescript
activityLower.includes(prohibited.toLowerCase())
```

Examples:
- "crypto exchange" → matches "Cryptocurrency exchanges"
- "betting platform" → matches "Gambling and betting"
- "forex broker" → matches "Forex trading"

---

## Feature 3: IBAN & SWIFT Validator

### Purpose
Validates IBAN and SWIFT/BIC codes, providing information about supported transfer types.

### Workflow

#### Step 1: User Input
The user enters:
- An IBAN code (e.g., "GB29 NWBK 6016 1331 9268 19")
- OR a SWIFT/BIC code (e.g., "DEUTDEFF" or "DEUTDEFF500")

#### Step 2: Input Normalization
```typescript
cleanIdentifier = identifier.replace(/\s/g, '').toUpperCase()
// "GB29 NWBK 6016..." → "GB29NWBK6016..."
```

#### Step 3: Type Detection

**IBAN Detection**:
- Starts with 2 letters (country code)
- Pattern: `/^[A-Z]{2}/`

**SWIFT/BIC Detection**:
- 8 or 11 alphanumeric characters
- Pattern: `/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/`
- Format: AAAABBCCXXX
  - AAAA = Bank code (4 letters)
  - BB = Country code (2 letters)
  - CC = Location code (2 letters/digits)
  - XXX = Branch code (3 letters/digits, optional)

#### Step 4: Validation

**For IBAN**:
1. Extract country code (first 2 characters)
2. Look up expected length in database (70+ countries supported)
3. Verify actual length matches expected length
4. Check IBAN structure validity

**For SWIFT/BIC**:
1. Validate format structure
2. Extract country code (characters 5-6)
3. Identify branch (if 11 characters)

#### Step 5: Response Format

**Valid IBAN Example**:
```json
{
  "isValid": true,
  "type": "IBAN",
  "details": {
    "country": "United Kingdom",
    "bankName": "Bank information available upon account verification",
    "branch": "N/A"
  },
  "supportedTransfers": ["SEPA", "SWIFT"],
  "message": "Valid IBAN for United Kingdom. Can receive SEPA and international transfers."
}
```

**Valid SWIFT Example**:
```json
{
  "isValid": true,
  "type": "SWIFT",
  "details": {
    "country": "Germany",
    "bankName": "Bank information available upon verification",
    "branch": "Head Office" | "500"
  },
  "supportedTransfers": ["SWIFT", "International Wire"],
  "message": "Valid SWIFT/BIC code. Can be used for international wire transfers."
}
```

**Invalid Example**:
```json
{
  "isValid": false,
  "type": "Unknown",
  "details": {},
  "message": "Invalid format. Please enter a valid IBAN or SWIFT/BIC code."
}
```

#### Step 6: UI Display
Shows:
- ✅ Green for valid / ❌ Red for invalid
- Identifier type (IBAN/SWIFT)
- Country information
- Bank name (if available)
- Supported transfer types
- Helpful message

### Supported Countries

The validator supports **70+ countries** including:
- All EU/EEA countries
- United Kingdom
- Switzerland
- United Arab Emirates
- Saudi Arabia
- Qatar
- Turkey
- Brazil
- Pakistan
- And many more...

### Client-Side vs Server-Side

This feature runs **entirely client-side**:
- No API calls to external services
- Fast validation
- Works offline
- Privacy-friendly (no data sent to servers)

### IBAN Structure Reference

| Country | Code | Length | Example |
|---------|------|--------|---------|
| Germany | DE | 22 | DE89370400440532013000 |
| United Kingdom | GB | 22 | GB29NWBK60161331926819 |
| France | FR | 27 | FR1420041010050500013M02606 |
| Lithuania | LT | 20 | LT121000011101001000 |
| Netherlands | NL | 18 | NL91ABNA0417164300 |

---

## API Integration Details

### Paysera Intranet API

**Authentication**: Basic Auth
```
Authorization: Basic base64(email:apiKey)
```

**Endpoints Used**:
- `/rest/api/content/{pageId}?expand=body.view,body.storage`

**Caching Strategy**:
- Cache TTL: 1 hour (3600000 ms)
- Reduces API calls
- Improves performance
- Fallback to embedded data if API fails

### Error Handling

All features implement graceful error handling:
1. Try to fetch from API
2. If API fails → Use cached data
3. If cache expired → Use fallback data
4. Display user-friendly error messages

### Rate Limiting

The application implements client-side caching to minimize API calls and respect rate limits.

---

## Security Considerations

### API Key Exposure
- The Paysera API key is exposed in frontend (environment variable)
- **Mitigation**: Key should have read-only access to specific pages
- **Best Practice**: Implement backend proxy for production

### Data Privacy
- No personal data is stored
- All validations are performed on-demand
- IBAN/SWIFT validation is fully client-side

### CORS Configuration
- Paysera Intranet must allow requests from your domain
- Coordinate with IT team for production deployment

---

## Future Enhancements

### Transfer Check
- Real-time fee calculation based on amount
- Processing time estimates
- Currency exchange rates integration
- Historical transfer tracking

### Company Validation
- Automated license verification
- Document upload and verification
- Risk scoring system
- Email notifications for status updates

### IBAN & SWIFT Validator
- Real-time bank name lookup via external API
- Account verification status check
- Transfer cost estimation
- Bank contact information

---

## Support & Troubleshooting

### Common Issues

**"API credentials not configured"**
- Ensure environment variables are set correctly
- Check `.env` file has proper values
- Restart dev server after changes

**"Transfer not possible" for valid countries**
- Check if country is in sanctions list
- Verify currency is supported
- Review enhanced monitoring requirements

**"Company validation failed"**
- Check for prohibited keywords in activity description
- Verify country is not in restricted list
- Be specific about business activity

**"Invalid IBAN format"**
- Ensure all characters are included
- Check country code is correct
- Verify length matches country standard

### Getting Help

For issues or questions:
1. Check the error message in browser console
2. Verify environment variables are set
3. Review the relevant feature documentation above
4. Contact the development team with:
   - Error message
   - Input values used
   - Browser console logs
   - Screenshots if applicable

---

## Technical Architecture

```
User Input
    ↓
Components (Tools.tsx)
    ↓
Service Layer (companyApiService.ts)
    ↓
Intranet Service (payseraIntranetService.ts)
    ↓
Paysera Intranet API / Fallback Data
    ↓
Response Processing
    ↓
UI Display (React Components)
```

### File Structure
```
services/
├── payseraIntranetService.ts    # Intranet API integration
├── companyApiService.ts         # Business logic layer
components/
├── Tools.tsx                    # Feature implementations
├── ToolCard.tsx                 # UI card component
├── Modal.tsx                    # Modal wrapper
constants.ts                     # Countries & currencies
types.ts                         # TypeScript definitions
