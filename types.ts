
export enum ToolType {
  TRANSFER_CHECK = 'Transfer Check',
  COMPANY_VALIDATION = 'Company Validation',
  IBAN_SWIFT_VALIDATOR = 'IBAN & SWIFT Validator',
}

export enum CountryStatus {
  NORMAL = 'Normal',
  ENHANCED_MONITORING = 'Enhanced Monitoring',
  REGISTRATION_UNAVAILABLE = 'Registration Unavailable',
  PROHIBITED = 'Prohibited',
}

export interface Country {
  name: string;
  status: CountryStatus;
}


export interface TransferCheckRequest {
  senderNationality: string;
  recipientCountry: string;
  currency: string;
}

export interface CompanyValidationRequest {
  companyCountry: string;
  companyActivity: string;
}

export interface TransferCheckResponse {
    status: 'Possible' | 'Not Possible';
    reason?: string;
    system?: string;
    explanation: string;
    fee: string;
    restrictions: string;
    conclusion: string;
    intranetPageSource?: string;
}

export interface CompanyValidationResponse {
    status: 'Possible' | 'Possible (with conditions)' | 'Not Possible';
    reason?: string;
    countryStatus: string;
    activityStatus: string;
    explanation: string;
    conclusion: string;
    intranetPageSource?: string;
}

export interface IdentifierValidationResponse {
  isValid: boolean;
  type: 'IBAN' | 'SWIFT' | 'Unknown';
  details: {
      bankName?: string;
      country?: string;
      branch?: string;
  };
  supportedTransfers?: string[];
  message: string;
}
