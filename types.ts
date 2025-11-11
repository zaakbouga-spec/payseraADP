
export enum ToolType {
  TRANSFER_CHECK = 'Transfer Check',
  COMPANY_VALIDATION = 'Company Validation',
  INTRANET_SEARCH = 'Intranet Search',
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

export interface IntranetSearchRequest {
  query: string;
}

export interface IntranetSearchResult {
  pageId: string;
  pageTitle: string;
  pageUrl: string;
  relevantContent: string;
  summary: string;
}

export interface IntranetSearchResponse {
  results: IntranetSearchResult[];
  totalResults: number;
  query: string;
}
