// Paysera Intranet API Service
// This service interacts with Paysera's Confluence-based intranet to fetch transfer rules and company validation data

interface IntranetConfig {
  apiKey: string;
  email: string;
  baseUrl: string;
}

interface TransferRule {
  recipientCountry: string;
  currency: string;
  system: string;
  fee: string;
  restrictions: string[];
  isPossible: boolean;
}

interface CompanyRestriction {
  country: string;
  activities: string[];
  restrictions: string[];
  isPossible: boolean;
  conditions?: string[];
}

class PayseraIntranetService {
  private config: IntranetConfig;
  private transferRulesCache: Map<string, any> = new Map();
  private companyRestrictionsCache: Map<string, any> = new Map();
  private cacheExpiry: number = 3600000; // 1 hour

  constructor() {
    this.config = {
      apiKey: process.env.VITE_PAYSERA_API_KEY || '',
      email: process.env.VITE_PAYSERA_EMAIL || '',
      baseUrl: process.env.VITE_PAYSERA_INTRANET_URL || 'https://intranet.paysera.net',
    };

    if (!this.config.apiKey || !this.config.email) {
      console.warn('Paysera Intranet credentials not configured. Using fallback data.');
    }
  }

  private getBasicAuth(): string {
    return btoa(`${this.config.email}:${this.config.apiKey}`);
  }

  private async fetchPageContent(pageId: string): Promise<any> {
    if (!this.config.apiKey || !this.config.email) {
      throw new Error('Paysera Intranet API credentials are not configured');
    }

    const url = `${this.config.baseUrl}/rest/api/content/${pageId}?expand=body.view,body.storage`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.getBasicAuth()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch page ${pageId}: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching intranet page:', error);
      throw error;
    }
  }

  // Fetch transfer rules from the specific intranet page
  async getTransferRules(): Promise<any> {
    const cacheKey = 'transfer_rules_58238300';
    const cached = this.transferRulesCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // Page ID for transfer rules: 58238300
      const pageData = await this.fetchPageContent('58238300');
      const rules = this.parseTransferRules(pageData);
      
      this.transferRulesCache.set(cacheKey, {
        data: rules,
        timestamp: Date.now(),
      });

      return rules;
    } catch (error) {
      console.error('Error fetching transfer rules from intranet:', error);
      // Return fallback data if API fails
      return this.getFallbackTransferRules();
    }
  }

  // Parse the HTML/Confluence content to extract transfer rules
  private parseTransferRules(pageData: any): any {
    // Extract the body content
    const body = pageData.body?.storage?.value || pageData.body?.view?.value || '';
    
    // This is a simplified parser - in production, you'd want more robust parsing
    // The actual implementation would parse tables, lists, and structured data from the Confluence page
    
    const rules = {
      systems: {
        SEPA: {
          name: 'SEPA',
          countries: ['EU/EEA countries'],
          currencies: ['EUR'],
          fee: '0 EUR',
          processingTime: '1-2 business days',
        },
        SWIFT: {
          name: 'SWIFT',
          countries: ['Worldwide'],
          currencies: ['Multiple currencies'],
          fee: 'Based on currency and amount',
          processingTime: '2-5 business days',
        },
        LOCAL: {
          name: 'Local Transfers',
          countries: ['Lithuania'],
          currencies: ['EUR'],
          fee: '0 EUR',
          processingTime: 'Same day',
        },
      },
      restrictedCountries: [
        'Afghanistan', 'Belarus', 'Central African Republic', 'Congo', 'Cuba',
        'Iran', 'Iraq', 'Libya', 'Myanmar', 'North Korea', 'Russia',
        'Somalia', 'South Sudan', 'Sudan', 'Syria', 'Venezuela', 'Yemen', 'Zimbabwe'
      ],
      enhancedMonitoring: [
        'Albania', 'Barbados', 'Burkina Faso', 'Cambodia', 'Cayman Islands',
        'Haiti', 'Jamaica', 'Jordan', 'Mali', 'Morocco', 'Nicaragua',
        'Pakistan', 'Panama', 'Philippines', 'Senegal', 'South Africa',
        'Turkey', 'Uganda', 'United Arab Emirates', 'Vanuatu'
      ],
      currencyRestrictions: {
        'RUB': 'Prohibited',
        'BYN': 'Prohibited',
      },
    };

    return rules;
  }

  // Fetch company restrictions data
  async getCompanyRestrictions(): Promise<any> {
    const cacheKey = 'company_restrictions';
    const cached = this.companyRestrictionsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      // You would fetch from a specific page ID for company restrictions
      // For now, using structured fallback data
      const restrictions = this.getFallbackCompanyRestrictions();
      
      this.companyRestrictionsCache.set(cacheKey, {
        data: restrictions,
        timestamp: Date.now(),
      });

      return restrictions;
    } catch (error) {
      console.error('Error fetching company restrictions:', error);
      return this.getFallbackCompanyRestrictions();
    }
  }

  // Fallback transfer rules if API fails
  private getFallbackTransferRules(): any {
    return {
      systems: {
        SEPA: {
          name: 'SEPA',
          countries: ['EU/EEA countries'],
          currencies: ['EUR'],
          fee: '0 EUR',
          processingTime: '1-2 business days',
        },
        SWIFT: {
          name: 'SWIFT',
          countries: ['Worldwide'],
          currencies: ['USD', 'GBP', 'EUR', 'CHF', 'PLN', 'CZK', 'RON', 'BGN', 'NOK', 'SEK', 'DKK', 'HUF'],
          fee: '1-5 EUR depending on currency',
          processingTime: '2-5 business days',
        },
        LOCAL: {
          name: 'Local Transfers',
          countries: ['Lithuania'],
          currencies: ['EUR'],
          fee: '0 EUR',
          processingTime: 'Same day',
        },
      },
      restrictedCountries: [
        'Afghanistan', 'Belarus', 'Central African Republic', 'Congo', 'Cuba',
        'Iran', 'Iraq', 'Libya', 'Myanmar', 'North Korea', 'Russia',
        'Somalia', 'South Sudan', 'Sudan', 'Syria', 'Venezuela', 'Yemen', 'Zimbabwe'
      ],
      enhancedMonitoring: [
        'Albania', 'Barbados', 'Burkina Faso', 'Cambodia', 'Cayman Islands',
        'Haiti', 'Jamaica', 'Jordan', 'Mali', 'Morocco', 'Nicaragua',
        'Pakistan', 'Panama', 'Philippines', 'Senegal', 'South Africa',
        'Turkey', 'Uganda', 'United Arab Emirates', 'Vanuatu'
      ],
      currencyRestrictions: {
        'RUB': 'Prohibited',
        'BYN': 'Prohibited',
      },
    };
  }

  // Fallback company restrictions
  private getFallbackCompanyRestrictions(): any {
    return {
      prohibitedActivities: [
        'Gambling and betting',
        'Cryptocurrency exchanges and trading',
        'Adult entertainment',
        'Weapons and ammunition',
        'Tobacco products',
        'Pharmaceuticals without proper licensing',
        'Illegal substances',
        'Money laundering services',
        'Ponzi schemes or pyramid schemes',
        'High-risk financial services',
      ],
      restrictedActivities: [
        'E-cigarettes and vaping products',
        'Forex trading',
        'Binary options',
        'Dating services',
        'Debt collection',
        'Precious metals trading',
        'Loan services',
        'Investment services without proper licensing',
      ],
      restrictedCountries: [
        'Afghanistan', 'Belarus', 'Central African Republic', 'Congo', 'Cuba',
        'Iran', 'Iraq', 'Libya', 'Myanmar', 'North Korea', 'Russia',
        'Somalia', 'South Sudan', 'Sudan', 'Syria', 'Venezuela', 'Yemen', 'Zimbabwe'
      ],
      enhancedDueDiligence: [
        'Albania', 'Barbados', 'Burkina Faso', 'Cambodia', 'Cayman Islands',
        'Haiti', 'Jamaica', 'Jordan', 'Mali', 'Morocco', 'Nicaragua',
        'Pakistan', 'Panama', 'Philippines', 'Senegal', 'South Africa',
        'Turkey', 'Uganda', 'United Arab Emirates', 'Vanuatu'
      ],
      acceptedCountries: {
        EU: 'All EU/EEA countries are accepted',
        Other: 'Case-by-case review for other countries',
      },
    };
  }

  // Check if transfer is possible
  async checkTransfer(params: {
    senderNationality: string;
    recipientCountry: string;
    currency: string;
  }): Promise<{
    isPossible: boolean;
    system?: string;
    fee?: string;
    restrictions: string[];
    requiresEnhancedMonitoring: boolean;
  }> {
    const rules = await this.getTransferRules();

    // Check if recipient country is prohibited
    if (rules.restrictedCountries.includes(params.recipientCountry)) {
      return {
        isPossible: false,
        restrictions: [`Transfers to ${params.recipientCountry} are prohibited due to sanctions/compliance restrictions`],
        requiresEnhancedMonitoring: false,
      };
    }

    // Check if currency is restricted
    if (rules.currencyRestrictions[params.currency] === 'Prohibited') {
      return {
        isPossible: false,
        restrictions: [`${params.currency} transfers are currently prohibited`],
        requiresEnhancedMonitoring: false,
      };
    }

    // Check enhanced monitoring requirement
    const requiresEnhancedMonitoring = rules.enhancedMonitoring.includes(params.recipientCountry) ||
                                        rules.enhancedMonitoring.includes(params.senderNationality);

    // Determine the appropriate transfer system
    let system = '';
    let fee = '';
    const restrictions: string[] = [];

    // SEPA for EUR within EU/EEA
    if (params.currency === 'EUR' && this.isEUCountry(params.recipientCountry)) {
      system = 'SEPA';
      fee = rules.systems.SEPA.fee;
    } 
    // Local transfer for Lithuania
    else if (params.recipientCountry === 'Lithuania' && params.currency === 'EUR') {
      system = 'Local Transfer';
      fee = rules.systems.LOCAL.fee;
    }
    // SWIFT for international transfers
    else {
      system = 'SWIFT';
      fee = rules.systems.SWIFT.fee;
    }

    if (requiresEnhancedMonitoring) {
      restrictions.push('Enhanced due diligence and monitoring required');
      restrictions.push('Additional documentation may be requested');
    }

    return {
      isPossible: true,
      system,
      fee,
      restrictions,
      requiresEnhancedMonitoring,
    };
  }

  // Check company validation
  async validateCompany(params: {
    companyCountry: string;
    companyActivity: string;
  }): Promise<{
    isPossible: boolean;
    countryStatus: string;
    activityStatus: string;
    restrictions: string[];
    conditions: string[];
  }> {
    const restrictions = await this.getCompanyRestrictions();

    // Check if country is prohibited
    if (restrictions.restrictedCountries.includes(params.companyCountry)) {
      return {
        isPossible: false,
        countryStatus: 'Prohibited',
        activityStatus: 'N/A',
        restrictions: [`Company accounts for ${params.companyCountry} are not accepted due to compliance restrictions`],
        conditions: [],
      };
    }

    // Check country status
    const requiresEDD = restrictions.enhancedDueDiligence.includes(params.companyCountry);
    const isEU = this.isEUCountry(params.companyCountry);
    
    let countryStatus = 'Accepted';
    if (requiresEDD) {
      countryStatus = 'Enhanced Due Diligence Required';
    } else if (isEU) {
      countryStatus = 'Standard Processing';
    } else {
      countryStatus = 'Case-by-case Review';
    }

    // Check activity
    const activityLower = params.companyActivity.toLowerCase();
    let activityStatus = 'Accepted';
    const activityRestrictions: string[] = [];
    const conditions: string[] = [];

    // Check prohibited activities
    for (const prohibited of restrictions.prohibitedActivities) {
      const prohibitedLower = prohibited.toLowerCase();
      // Check both directions: if activity contains prohibited words OR prohibited phrase contains activity
      if (activityLower.includes(prohibitedLower) || prohibitedLower.includes(activityLower)) {
        return {
          isPossible: false,
          countryStatus,
          activityStatus: 'Prohibited',
          restrictions: [`Business activity "${prohibited}" is not accepted`],
          conditions: [],
        };
      }
    }

    // Check restricted activities (may be accepted with conditions)
    for (const restricted of restrictions.restrictedActivities) {
      const restrictedLower = restricted.toLowerCase();
      // Check both directions: if activity contains restricted words OR restricted phrase contains activity
      if (activityLower.includes(restrictedLower) || restrictedLower.includes(activityLower)) {
        activityStatus = 'Restricted - Requires Additional Review';
        activityRestrictions.push(`Activity "${restricted}" requires additional compliance review`);
        conditions.push('Valid business licenses must be provided');
        conditions.push('Enhanced monitoring will be applied');
      }
    }

    if (requiresEDD) {
      conditions.push('Enhanced due diligence documentation required');
      conditions.push('Company beneficial ownership verification required');
      conditions.push('Source of funds documentation required');
    }

    return {
      isPossible: true,
      countryStatus,
      activityStatus: activityStatus === 'Accepted' ? 'Accepted' : activityStatus,
      restrictions: activityRestrictions,
      conditions,
    };
  }

  // Helper to check if country is in EU/EEA
  private isEUCountry(country: string): boolean {
    const euCountries = [
      'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
      'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
      'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta',
      'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia',
      'Spain', 'Sweden', 'Iceland', 'Liechtenstein', 'Norway'
    ];
    return euCountries.includes(country);
  }
}

// Export singleton instance
export const payseraIntranetService = new PayseraIntranetService();
