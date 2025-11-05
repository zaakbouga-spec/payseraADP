
import { 
    TransferCheckRequest, 
    CompanyValidationRequest, 
    TransferCheckResponse, 
    CompanyValidationResponse,
    IdentifierValidationResponse
} from '../types';
import { payseraIntranetService } from './payseraIntranetService';

// --- Paysera API Service ---
// This service integrates with Paysera's Intranet API for transfer checking and company validation

// IBAN/SWIFT validation databases (for the third tool)
const IBAN_COUNTRY_CODES: Record<string, { name: string; length: number }> = {
  AL: { name: 'Albania', length: 28 },
  AD: { name: 'Andorra', length: 24 },
  AT: { name: 'Austria', length: 20 },
  AZ: { name: 'Azerbaijan', length: 28 },
  BH: { name: 'Bahrain', length: 22 },
  BE: { name: 'Belgium', length: 16 },
  BA: { name: 'Bosnia and Herzegovina', length: 20 },
  BR: { name: 'Brazil', length: 29 },
  BG: { name: 'Bulgaria', length: 22 },
  CR: { name: 'Costa Rica', length: 22 },
  HR: { name: 'Croatia', length: 21 },
  CY: { name: 'Cyprus', length: 28 },
  CZ: { name: 'Czech Republic', length: 24 },
  DK: { name: 'Denmark', length: 18 },
  DO: { name: 'Dominican Republic', length: 28 },
  EE: { name: 'Estonia', length: 20 },
  FO: { name: 'Faroe Islands', length: 18 },
  FI: { name: 'Finland', length: 18 },
  FR: { name: 'France', length: 27 },
  GE: { name: 'Georgia', length: 22 },
  DE: { name: 'Germany', length: 22 },
  GI: { name: 'Gibraltar', length: 23 },
  GR: { name: 'Greece', length: 27 },
  GL: { name: 'Greenland', length: 18 },
  GT: { name: 'Guatemala', length: 28 },
  HU: { name: 'Hungary', length: 28 },
  IS: { name: 'Iceland', length: 26 },
  IE: { name: 'Ireland', length: 22 },
  IL: { name: 'Israel', length: 23 },
  IT: { name: 'Italy', length: 27 },
  JO: { name: 'Jordan', length: 30 },
  KZ: { name: 'Kazakhstan', length: 20 },
  XK: { name: 'Kosovo', length: 20 },
  KW: { name: 'Kuwait', length: 30 },
  LV: { name: 'Latvia', length: 21 },
  LB: { name: 'Lebanon', length: 28 },
  LI: { name: 'Liechtenstein', length: 21 },
  LT: { name: 'Lithuania', length: 20 },
  LU: { name: 'Luxembourg', length: 20 },
  MK: { name: 'North Macedonia', length: 19 },
  MT: { name: 'Malta', length: 31 },
  MR: { name: 'Mauritania', length: 27 },
  MU: { name: 'Mauritius', length: 30 },
  MC: { name: 'Monaco', length: 27 },
  MD: { name: 'Moldova', length: 24 },
  ME: { name: 'Montenegro', length: 22 },
  NL: { name: 'Netherlands', length: 18 },
  NO: { name: 'Norway', length: 15 },
  PK: { name: 'Pakistan', length: 24 },
  PS: { name: 'Palestine', length: 29 },
  PL: { name: 'Poland', length: 28 },
  PT: { name: 'Portugal', length: 25 },
  QA: { name: 'Qatar', length: 29 },
  RO: { name: 'Romania', length: 24 },
  SM: { name: 'San Marino', length: 27 },
  SA: { name: 'Saudi Arabia', length: 24 },
  RS: { name: 'Serbia', length: 22 },
  SK: { name: 'Slovakia', length: 24 },
  SI: { name: 'Slovenia', length: 19 },
  ES: { name: 'Spain', length: 24 },
  SE: { name: 'Sweden', length: 24 },
  CH: { name: 'Switzerland', length: 21 },
  TN: { name: 'Tunisia', length: 24 },
  TR: { name: 'Turkey', length: 26 },
  AE: { name: 'United Arab Emirates', length: 23 },
  GB: { name: 'United Kingdom', length: 22 },
  VG: { name: 'Virgin Islands, British', length: 24 },
};

// --- Exported Service Functions ---

export const checkTransfer = async (data: TransferCheckRequest): Promise<TransferCheckResponse> => {
    try {
        const result = await payseraIntranetService.checkTransfer({
            senderNationality: data.senderNationality,
            recipientCountry: data.recipientCountry,
            currency: data.currency,
        });

        const status = result.isPossible ? 'Possible' : 'Not Possible';
        const reason = result.isPossible 
            ? `Transfer via ${result.system} is available`
            : result.restrictions[0] || 'Transfer not available';

        const explanation = result.isPossible
            ? `This transfer can be processed using the ${result.system} system. ${
                result.requiresEnhancedMonitoring 
                    ? 'Due to regulatory requirements, enhanced monitoring procedures will apply.' 
                    : 'Standard processing applies.'
              }`
            : `This transfer cannot be processed. ${result.restrictions.join(' ')}`;

        const conclusion = result.isPossible
            ? `You can proceed with this ${result.system} transfer. ${
                result.restrictions.length > 0 
                    ? 'Please note the additional requirements listed above.' 
                    : ''
              }`
            : 'This transfer is not available through Paysera at this time.';

        return {
            status,
            reason,
            system: result.system || 'N/A',
            fee: result.fee || 'N/A',
            restrictions: result.restrictions.join('; ') || 'None',
            explanation,
            conclusion,
        };
    } catch (error) {
        console.error('Transfer check error:', error);
        throw new Error('Failed to check transfer. Please verify your input and try again.');
    }
};

export const validateCompany = async (data: CompanyValidationRequest): Promise<CompanyValidationResponse> => {
    try {
        const result = await payseraIntranetService.validateCompany({
            companyCountry: data.companyCountry,
            companyActivity: data.companyActivity,
        });

        const status = result.isPossible 
            ? (result.conditions.length > 0 ? 'Possible (with conditions)' : 'Possible')
            : 'Not Possible';

        const reason = result.isPossible
            ? result.conditions.length > 0
                ? 'Account opening is possible subject to additional requirements'
                : 'Account opening is possible with standard processing'
            : result.restrictions[0] || 'Account opening not available';

        const explanation = result.isPossible
            ? `Based on the company registration country (${data.companyCountry}) and business activity, a Paysera account can be opened. ${
                result.countryStatus !== 'Standard Processing' 
                    ? `Country status: ${result.countryStatus}.` 
                    : ''
              } ${
                result.activityStatus !== 'Accepted' 
                    ? `Activity status: ${result.activityStatus}.` 
                    : ''
              }`
            : `Account opening is not possible for companies from ${data.companyCountry} ${
                result.activityStatus === 'Prohibited' 
                    ? 'engaged in this type of business activity' 
                    : ''
              }.`;

        const conclusion = result.isPossible
            ? result.conditions.length > 0
                ? `Account opening is approved subject to the conditions listed above. Please prepare the required documentation for the verification process.`
                : `The company meets Paysera's acceptance criteria. You may proceed with the account opening application.`
            : `Unfortunately, we cannot open an account for this company at this time. ${result.restrictions.join(' ')}`;

        return {
            status,
            reason,
            countryStatus: result.countryStatus,
            activityStatus: result.activityStatus,
            explanation,
            conclusion,
        };
    } catch (error) {
        console.error('Company validation error:', error);
        throw new Error('Failed to validate company. Please verify your input and try again.');
    }
};

export const validateIdentifier = async (identifier: string): Promise<IdentifierValidationResponse> => {
    const cleanIdentifier = identifier.replace(/\s/g, '').toUpperCase();
    
    // Check if it's an IBAN (starts with 2 letters)
    if (/^[A-Z]{2}/.test(cleanIdentifier)) {
        const countryCode = cleanIdentifier.substring(0, 2);
        const countryInfo = IBAN_COUNTRY_CODES[countryCode];
        
        if (!countryInfo) {
            return {
                isValid: false,
                type: 'Unknown',
                details: {},
                message: `Unknown country code: ${countryCode}`,
            };
        }
        
        if (cleanIdentifier.length !== countryInfo.length) {
            return {
                isValid: false,
                type: 'IBAN',
                details: {},
                message: `Invalid IBAN length for ${countryInfo.name}. Expected ${countryInfo.length} characters, got ${cleanIdentifier.length}.`,
            };
        }
        
        return {
            isValid: true,
            type: 'IBAN',
            details: {
                country: countryInfo.name,
                bankName: 'Bank information available upon account verification',
                branch: 'N/A',
            },
            supportedTransfers: ['SEPA', 'SWIFT'],
            message: `Valid IBAN for ${countryInfo.name}. This account can receive SEPA and international transfers.`,
        };
    }
    
    // Check if it's a SWIFT/BIC code (8 or 11 characters)
    if (/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleanIdentifier)) {
        const countryCode = cleanIdentifier.substring(4, 6);
        const countryInfo = IBAN_COUNTRY_CODES[countryCode];
        
        return {
            isValid: true,
            type: 'SWIFT',
            details: {
                country: countryInfo?.name || 'Unknown',
                bankName: 'Bank information available upon verification',
                branch: cleanIdentifier.length === 11 ? cleanIdentifier.substring(8) : 'Head Office',
            },
            supportedTransfers: ['SWIFT', 'International Wire'],
            message: `Valid SWIFT/BIC code. This identifier can be used for international wire transfers.`,
        };
    }
    
    return {
        isValid: false,
        type: 'Unknown',
        details: {},
        message: 'Invalid format. Please enter a valid IBAN or SWIFT/BIC code.',
    };
};
