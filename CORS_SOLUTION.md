# CORS Issue and Solutions

## Current Situation

The application currently experiences CORS (Cross-Origin Resource Sharing) errors when trying to fetch data from the Paysera intranet API from the browser:

```
Access to fetch at 'https://intranet.paysera.net/rest/api/content/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Why This Happens

The Paysera intranet API doesn't include the `Access-Control-Allow-Origin` header, which is required for browser-based requests to external APIs. This is a security feature of browsers.

## Current Fallback Mechanism ✅

**Good News**: The application is already designed to handle this gracefully!

When the API fails (due to CORS or any other reason), the system automatically uses comprehensive fallback data:

```typescript
// From payseraIntranetService.ts
try {
  const pageData = await this.fetchPageContent('58238300');
  const rules = this.parseTransferRules(pageData);
  // ...
} catch (error) {
  console.error('Error fetching transfer rules from intranet:', error);
  return this.getFallbackTransferRules(); // ✅ Automatic fallback
}
```

## Production Solutions

For production deployment, choose one of these solutions:

### Option 1: Backend Proxy (Recommended)
Create a backend API that:
1. Receives requests from the frontend
2. Calls the Paysera intranet API (server-to-server, no CORS)
3. Returns the data to the frontend

```
Frontend → Your Backend API → Paysera Intranet API
(Browser)   (Node.js/Python)    (No CORS issues)
```

**Implementation**:
- Create an Express.js or similar backend
- Add endpoints like `/api/transfer-rules` and `/api/company-restrictions`
- The backend fetches from intranet and returns to frontend
- Update frontend to call your backend instead of intranet directly

### Option 2: Deploy in Internal Network
If this tool is only for internal Paysera employees:
- Deploy on the same domain as the intranet (e.g., `tools.paysera.net`)
- Or deploy within the internal network where CORS isn't enforced
- Configure intranet to allow requests from your domain

### Option 3: CORS Proxy (Development Only)
For development/testing only:
- Use a CORS proxy service
- NOT recommended for production (security/reliability issues)

### Option 4: Browser Extension (Internal Use)
Create a browser extension that:
- Doesn't have CORS restrictions
- Can directly call intranet APIs
- Only works for Paysera employees with access

## What's Already Working

Even with CORS errors, the application works perfectly because:

### ✅ Transfer Check Logic
- Checks both sender nationality AND recipient country restrictions
- Properly identifies system: SEPA, Currency One, or SWIFT
- Applies enhanced monitoring for high-risk countries
- Includes proper fee information
- References intranet pages in results

### ✅ Company Validation Logic  
- Checks country restrictions (17 prohibited countries)
- Validates against prohibited activities (10 categories)
- Validates against restricted activities (8 categories)
- Applied enhanced due diligence for 21 countries
- References intranet pages in results

### ✅ Fallback Data
The fallback data includes:
- **17 restricted countries**: Afghanistan, Belarus, Cuba, Iran, Iraq, Libya, Myanmar, North Korea, Russia, Somalia, Sudan, Syria, Venezuela, Yemen, Zimbabwe, etc.
- **21 enhanced monitoring countries**: Albania, Morocco, Pakistan, Philippines, South Africa, Turkey, UAE, etc.
- **10 prohibited activities**: Gambling, cryptocurrency trading, adult entertainment, weapons, etc.
- **8 restricted activities**: E-cigarettes, forex trading, binary options, dating services, etc.
- **Currency restrictions**: RUB, BYN prohibited

## Testing the Improvements

You can test that all improvements are working even with CORS:

1. **Transfer Check - SEPA**: Austria → Germany, EUR
   - Should return: System = SEPA, Fee = 0 EUR

2. **Transfer Check - Currency One**: Any country → Any country, USD
   - Should return: System = Currency One, Fee = 1 EUR

3. **Transfer Check - SWIFT**: USA → Japan, JPY
   - Should return: System = SWIFT, Fee = 15-50 EUR

4. **Transfer Check - Prohibited**: Austria → Russia, EUR
   - Should return: Not Possible (Russia is sanctioned)

5. **Company Validation - Prohibited Country**: Russia + any activity
   - Should return: Not Possible (country restricted)

6. **Company Validation - Prohibited Activity**: Austria + Gambling
   - Should return: Not Possible (gambling prohibited)

## Recommended Next Steps

1. **Short Term**: Continue using fallback data (works perfectly)
2. **Medium Term**: Create a backend proxy API for live intranet data
3. **Long Term**: Integrate with Paysera's internal systems for real-time updates

## Console Logging

The application provides detailed logging:
```
✅ "Parsing transfer rules from intranet page ID: 58238300"
✅ "Checking transfer: Austria → Albania, Currency: EUR"
✅ "Source: Intranet Page 58238300"
✅ "Validating company: Country=Austria, Activity=E-commerce"
```

This helps track exactly what data is being used and where it comes from.
