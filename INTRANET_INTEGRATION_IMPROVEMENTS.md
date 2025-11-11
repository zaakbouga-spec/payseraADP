# Intranet Integration Improvements

## Overview
This document describes the improvements made to the Transfer Check and Company Validation features to ensure they properly extract and use data from the Paysera Intranet API.

## Date
November 7, 2025

## Issues Identified

### 1. Transfer Check Issues
- **Not checking sender nationality restrictions**: Only checked recipient country but not sender country
- **Incorrect system determination**: Didn't properly differentiate between SEPA, Currency One, and SWIFT
- **Missing Currency One support**: Currency One system was not being identified
- **No intranet reference**: Results didn't include references to the intranet page source

### 2. Company Validation Issues
- **Showing restricted countries as accepted**: The validation was not properly checking restricted countries from the intranet
- **No intranet reference**: Results didn't show where the data was coming from
- **Generic responses**: Not extracting specific restrictions from intranet data

## Improvements Made

### 1. Enhanced Transfer Check (`payseraIntranetService.ts`)

#### A. Comprehensive Country Restrictions Check
```typescript
// Now checks BOTH sender and recipient countries
if (rules.restrictedCountries.includes(params.senderNationality)) {
  return {
    isPossible: false,
    restrictions: [
      `Transfers from ${params.senderNationality} are prohibited...`,
      `Reference: Intranet Page 58238300 - Restricted Countries List`
    ],
    ...
  };
}
```

#### B. Proper System Determination
The system now correctly identifies:
1. **Local Transfer**: For Lithuania domestic transfers in EUR
2. **SEPA**: For EUR transfers within EU/EEA countries
3. **Currency One**: For supported currencies (USD, GBP, CHF, PLN, CZK, RON, BGN, NOK, SEK, DKK, HUF)
4. **SWIFT**: For all other international transfers

```typescript
// Currency One supported currencies
const currencyOneCurrencies = ['USD', 'GBP', 'CHF', 'PLN', 'CZK', 'RON', 'BGN', 'NOK', 'SEK', 'DKK', 'HUF'];

if (params.recipientCountry === 'Lithuania' && params.currency === 'EUR') {
  system = 'Local Transfer';
  fee = '0 EUR';
} else if (params.currency === 'EUR' && this.isEUCountry(params.recipientCountry)) {
  system = 'SEPA';
  fee = '0 EUR';
} else if (currencyOneCurrencies.includes(params.currency)) {
  system = 'Currency One';
  fee = '1 EUR';
} else {
  system = 'SWIFT';
  fee = '15-50 EUR depending on currency and amount';
}
```

#### C. Enhanced Monitoring for Both Sender and Recipient
```typescript
const senderRequiresMonitoring = rules.enhancedMonitoring.includes(params.senderNationality);
const recipientRequiresMonitoring = rules.enhancedMonitoring.includes(params.recipientCountry);

if (senderRequiresMonitoring) {
  restrictions.push(`Sender country (${params.senderNationality}) requires enhanced due diligence...`);
}
if (recipientRequiresMonitoring) {
  restrictions.push(`Recipient country (${params.recipientCountry}) requires enhanced due diligence...`);
}
```

#### D. Intranet Page References
All responses now include:
- `intranetPageSource`: URL to the intranet page (e.g., `https://intranet.paysera.net/display/PSWEB/58238300`)
- References in restrictions detailing which list was used

### 2. Enhanced Company Validation (`payseraIntranetService.ts`)

#### A. Improved Intranet Data Parsing
```typescript
private parseCompanyRestrictions(pageData: any): any {
  // Extracts prohibited activities
  // Extracts restricted activities
  // Extracts restricted countries
  // Extracts enhanced due diligence countries
  // All from the actual intranet HTML content
}
```

#### B. Proper Country Restriction Checking
```typescript
// Check if country is prohibited (from intranet data)
if (restrictions.restrictedCountries.includes(params.companyCountry)) {
  return {
    isPossible: false,
    countryStatus: 'Prohibited',
    restrictions: [
      `Company accounts for ${params.companyCountry} are not accepted...`,
      `Reference: ${restrictions.pageSource} - Restricted Countries List`
    ],
    ...
  };
}
```

#### C. Activity-Based Validation
- **Prohibited Activities**: Immediately reject (e.g., gambling, cryptocurrency trading)
- **Restricted Activities**: Accept with conditions (e.g., forex trading, dating services)
- **Enhanced Due Diligence**: Additional documentation requirements

#### D. Intranet References
All validation results include:
- Direct references to the intranet page
- Specific section references (e.g., "Prohibited Activities List", "Restricted Countries List")

### 3. Enhanced Intranet Data Fetching

#### A. Improved HTML Parsing
The service now uses regex patterns to extract structured data from Confluence pages:

```typescript
// Extract restricted countries
const restrictedCountriesMatch = body.match(/<h[23]>.*?(?:Restricted|Prohibited|Sanctioned).*?Countries.*?<\/h[23]>(.*?)<(?:h[23]|\/div)/is);

// Extract prohibited activities
const prohibitedActivitiesMatch = body.match(/<h[23]>.*?Prohibited.*?Activities.*?<\/h[23]>(.*?)<(?:h[23]|\/div)/is);
```

#### B. Fallback Mechanism
If API fetching or parsing fails, the service falls back to hardcoded data to ensure the application continues to work.

#### C. Caching
- **Cache Duration**: 1 hour (3,600,000 ms)
- **Reduces API Calls**: Improves performance and reduces load on intranet
- **Separate Caches**: Transfer rules and company restrictions cached independently

### 4. Updated TypeScript Types

Added `intranetPageSource` field to response interfaces:

```typescript
export interface TransferCheckResponse {
    // ... existing fields
    intranetPageSource?: string;
}

export interface CompanyValidationResponse {
    // ... existing fields
    intranetPageSource?: string;
}
```

## Data Sources

### Primary Intranet Page
- **Page ID**: 58238300
- **URL**: https://intranet.paysera.net/display/PSWEB/58238300
- **Contains**:
  - Transfer restrictions by country
  - Currency restrictions
  - Enhanced monitoring countries
  - Company registration restrictions
  - Prohibited business activities
  - Restricted business activities

### Fallback Data
When the intranet API is unavailable, the system uses comprehensive fallback data including:
- 17 restricted countries
- 21 enhanced monitoring countries
- 10 prohibited business activities
- 8 restricted business activities
- Currency restrictions (RUB, BYN)

## Benefits

1. **Accurate Compliance**: All answers are based on official intranet data
2. **Proper System Identification**: Correctly identifies SEPA, Currency One, or SWIFT
3. **Complete Restriction Checking**: Checks both sender and recipient countries
4. **Transparency**: All responses include intranet page references
5. **Enhanced Monitoring**: Properly identifies countries requiring enhanced due diligence
6. **Currency-Specific Logic**: Different rules for different currencies
7. **Detailed Logging**: Console logs show data source and parsing status

## Testing Scenarios

### Transfer Check
1. **EUR to EU country** → Should return SEPA
2. **USD to any country** → Should return Currency One
3. **EUR to non-EU country** → Should return SWIFT
4. **From restricted country** → Should be rejected with intranet reference
5. **To restricted country** → Should be rejected with intranet reference
6. **Enhanced monitoring country** → Should show additional requirements

### Company Validation
1. **EU country + normal activity** → Should be accepted
2. **Restricted country** → Should be rejected with intranet reference
3. **Prohibited activity** → Should be rejected
4. **Restricted activity** → Should be accepted with conditions
5. **Enhanced due diligence country** → Should show additional documentation requirements

## Files Modified

1. **services/payseraIntranetService.ts**
   - Enhanced `parseTransferRules()` method
   - Added `parseCompanyRestrictions()` method
   - Improved `checkTransfer()` logic
   - Improved `validateCompany()` logic
   - Added intranet page source tracking

2. **services/companyApiService.ts**
   - Updated to pass through `intranetPageSource`

3. **types.ts**
   - Added `intranetPageSource?: string` to response types

## Console Logging

The service now logs:
- Which intranet page is being parsed
- Transfer check parameters and source
- Company validation parameters and source
- Fallback data usage warnings

## Future Improvements

1. **Real-time Sync**: Set up webhooks for intranet page updates
2. **Multiple Page Sources**: Different pages for different types of restrictions
3. **Better HTML Parsing**: Use a proper HTML parser library (e.g., cheerio, jsdom)
4. **Cache Invalidation**: Allow manual cache clearing
5. **Error Reporting**: Better error messages when intranet is unavailable
6. **Unit Tests**: Add comprehensive tests for all validation scenarios
