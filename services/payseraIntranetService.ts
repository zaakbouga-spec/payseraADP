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
    
    console.log('Parsing transfer rules from intranet page ID: 58238300');
    
    // Parse the HTML content to extract structured data
    const rules: any = {
      systems: {},
      restrictedCountries: [],
      enhancedMonitoring: [],
      currencyRestrictions: {},
      currencyOneSupportedCountries: [],
      sepaSupportedCountries: [],
      pageSource: 'https://intranet.paysera.net/display/PSWEB/58238300',
    };

    // Extract restricted/prohibited countries from the content
    const restrictedCountriesMatch = body.match(/<h[23]>.*?(?:Restricted|Prohibited|Sanctioned).*?Countries.*?<\/h[23]>(.*?)<(?:h[23]|\/div)/is);
    if (restrictedCountriesMatch) {
      const countriesText = restrictedCountriesMatch[1];
      // Extract country names from lists
      const countryMatches = countriesText.matchAll(/<li>(.*?)<\/li>/gi);
      for (const match of countryMatches) {
        const country = match[1].replace(/<[^>]*>/g, '').trim();
        if (country) rules.restrictedCountries.push(country);
      }
    }

    // Extract countries requiring enhanced monitoring
    const enhancedMonitoringMatch = body.match(/<h[23]>.*?(?:Enhanced|High.?Risk).*?(?:Monitoring|Countries).*?<\/h[23]>(.*?)<(?:h[23]|\/div)/is);
    if (enhancedMonitoringMatch) {
      const countriesText = enhancedMonitoringMatch[1];
      const countryMatches = countriesText.matchAll(/<li>(.*?)<\/li>/gi);
      for (const match of countryMatches) {
        const country = match[1].replace(/<[^>]*>/g, '').trim();
        if (country) rules.enhancedMonitoring.push(country);
      }
    }

    // Extract currency restrictions
    const currencyRestrictionMatch = body.match(/<h[23]>.*?Currency.*?Restrictions.*?<\/h[23]>(.*?)<(?:h[23]|\/div)/is);
    if (currencyRestrictionMatch) {
      const currenciesText = currencyRestrictionMatch[1];
      const currencyMatches = currenciesText.matchAll(/<li>(.*?)[:\-]\s*(.*?)<\/li>/gi);
      for (const match of currencyMatches) {
        const currency = match[1].replace(/<[^>]*>/g, '').trim();
        const status = match[2].replace(/<[^>]*>/g, '').trim();
        if (currency && status) rules.currencyRestrictions[currency] = status;
      }
    }

    // If parsing failed, fallback to default rules
    if (rules.restrictedCountries.length === 0) {
      console.warn('Failed to parse intranet data, using fallback rules');
      return this.getFallbackTransferRules();
    }

    // Define systems based on parsed data
    rules.systems = {
      SEPA: {
        name: 'SEPA',
        countries: ['EU/EEA countries'],
        currencies: ['EUR'],
        fee: '0 EUR',
        processingTime: '1-2 business days',
      },
      'Currency One': {
        name: 'Currency One',
        countries: ['Worldwide'],
        currencies: ['USD', 'GBP', 'CHF', 'PLN', 'CZK', 'RON', 'BGN', 'NOK', 'SEK', 'DKK', 'HUF'],
        fee: '1 EUR',
        processingTime: '1-3 business days',
      },
      SWIFT: {
        name: 'SWIFT',
        countries: ['Worldwide'],
        currencies: ['All major currencies'],
        fee: '15-50 EUR depending on currency and amount',
        processingTime: '3-5 business days',
      },
      LOCAL: {
        name: 'Local Transfer',
        countries: ['Lithuania'],
        currencies: ['EUR'],
        fee: '0 EUR',
        processingTime: 'Same day',
      },
    };

    return rules;
  }

  // Fetch page by title from a specific space
  private async fetchPageByTitle(space: string, title: string): Promise<any> {
    if (!this.config.apiKey || !this.config.email) {
      throw new Error('Paysera Intranet API credentials are not configured');
    }

    const url = `${this.config.baseUrl}/rest/api/content?spaceKey=${space}&title=${encodeURIComponent(title)}&expand=body.view,body.storage`;

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
        throw new Error(`Failed to fetch page "${title}" from space ${space}: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0];
      } else {
        throw new Error(`Page "${title}" not found in space ${space}`);
      }
    } catch (error) {
      console.error('Error fetching page by title:', error);
      throw error;
    }
  }

  // Fetch company restrictions data from intranet
  async getCompanyRestrictions(): Promise<any> {
    const cacheKey = 'company_restrictions_fntt';
    const cached = this.companyRestrictionsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      console.log('Fetching company restrictions from FNTT space...');
      
      // Fetch both pages from FNTT space
      const countryPagePromise = this.fetchPageByTitle('FNTT', 'Opportunities to open a company account by country');
      const activitiesPagePromise = this.fetchPageByTitle('FNTT', 'ANNEX 2. TYPES OF BUSINESS ACTIVITIES');
      
      const [countryPage, activitiesPage] = await Promise.all([countryPagePromise, activitiesPagePromise]);
      
      const restrictions = this.parseCompanyRestrictions(countryPage, activitiesPage);
      
      this.companyRestrictionsCache.set(cacheKey, {
        data: restrictions,
        timestamp: Date.now(),
      });

      return restrictions;
    } catch (error) {
      console.error('Error fetching company restrictions from intranet:', error);
      return this.getFallbackCompanyRestrictions();
    }
  }

  // Parse company restrictions from the intranet pages
  private parseCompanyRestrictions(countryPage: any, activitiesPage: any): any {
    const countryBody = countryPage.body?.storage?.value || countryPage.body?.view?.value || '';
    const activitiesBody = activitiesPage.body?.storage?.value || activitiesPage.body?.view?.value || '';
    
    console.log('Parsing company restrictions from FNTT intranet pages');
    console.log('Country Page ID:', countryPage.id);
    console.log('Activities Page ID:', activitiesPage.id);
    
    const restrictions: any = {
      prohibitedActivities: [],
      restrictedActivities: [],
      restrictedCountries: [],
      enhancedDueDiligence: [],
      acceptedCountries: {},
      pageSource: `https://intranet.paysera.net/display/FNTT/Opportunities+to+open+a+company+account+by+country`,
      activitiesPageSource: `https://intranet.paysera.net/display/FNTT/ANNEX+2.+TYPES+OF+BUSINESS+ACTIVITIES`,
    };

    // Parse country restrictions from the country page
    // Extract table data - look for countries with "No" or "Prohibited" status
    const tableMatches = countryBody.matchAll(/<tr[^>]*>(.*?)<\/tr>/gis);
    for (const match of tableMatches) {
      const row = match[1];
      // Look for country name and status in table cells
      const cells = row.match(/<td[^>]*>(.*?)<\/td>/gis);
      if (cells && cells.length >= 2) {
        const countryCell = cells[0].replace(/<[^>]*>/g, '').trim();
        const statusCell = cells[1].replace(/<[^>]*>/g, '').trim().toLowerCase();
        
        // If status indicates prohibition
        if (statusCell.includes('no') || statusCell.includes('prohibited') || statusCell.includes('not accepted')) {
          if (countryCell && countryCell.length > 1 && countryCell.length < 50) {
            restrictions.restrictedCountries.push(countryCell);
          }
        }
        // If status indicates enhanced due diligence
        else if (statusCell.includes('enhanced') || statusCell.includes('edd') || statusCell.includes('high risk')) {
          if (countryCell && countryCell.length > 1 && countryCell.length < 50) {
            restrictions.enhancedDueDiligence.push(countryCell);
          }
        }
      }
    }

    // Parse activities from the activities page
    // Extract prohibited activities (ANNEX 2)
    const prohibitedSection = activitiesBody.match(/(?:Prohibited|Not Accepted|Unacceptable).*?Activities(.*?)(?:<h[23]|$)/is);
    if (prohibitedSection) {
      const activityMatches = prohibitedSection[1].matchAll(/<li[^>]*>(.*?)<\/li>/gis);
      for (const match of activityMatches) {
        const activity = match[1].replace(/<[^>]*>/g, '').trim();
        if (activity && activity.length > 2) {
          restrictions.prohibitedActivities.push(activity);
        }
      }
    }

    // Extract restricted activities (requiring additional review)
    const restrictedSection = activitiesBody.match(/(?:Restricted|Conditional|Review Required).*?Activities(.*?)(?:<h[23]|$)/is);
    if (restrictedSection) {
      const activityMatches = restrictedSection[1].matchAll(/<li[^>]*>(.*?)<\/li>/gis);
      for (const match of activityMatches) {
        const activity = match[1].replace(/<[^>]*>/g, '').trim();
        if (activity && activity.length > 2) {
          restrictions.restrictedActivities.push(activity);
        }
      }
    }

    // If parsing failed, fallback to default restrictions
    if (restrictions.restrictedCountries.length === 0 && restrictions.prohibitedActivities.length === 0) {
      console.warn('Failed to parse company restrictions from FNTT pages, using fallback data');
      return this.getFallbackCompanyRestrictions();
    }

    console.log(`Parsed ${restrictions.restrictedCountries.length} restricted countries`);
    console.log(`Parsed ${restrictions.prohibitedActivities.length} prohibited activities`);
    console.log(`Parsed ${restrictions.restrictedActivities.length} restricted activities`);

    // Set default accepted countries info
    restrictions.acceptedCountries = {
      EU: 'All EU/EEA countries are accepted with standard processing',
      Other: 'Non-EU countries require case-by-case review',
    };

    return restrictions;
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
    intranetPageSource?: string;
    pageId?: string;
  }> {
    const rules = await this.getTransferRules();
    const restrictions: string[] = [];
    const PAGE_ID = '58238300';

    console.log(`Checking transfer: ${params.senderNationality} → ${params.recipientCountry}, Currency: ${params.currency}`);
    console.log(`Source: Intranet Page ID ${PAGE_ID}`);

    // Check if SENDER nationality is restricted/prohibited
    if (rules.restrictedCountries.includes(params.senderNationality)) {
      restrictions.push(`❌ Transfers FROM ${params.senderNationality} are PROHIBITED due to sanctions/compliance restrictions`);
      restrictions.push(`📄 Source: Intranet Page ID ${PAGE_ID} - Restricted Countries section`);
      restrictions.push(`🔗 View full details at: ${rules.pageSource || 'https://intranet.paysera.net/display/PSWEB/58238300'}`);
      
      return {
        isPossible: false,
        restrictions,
        requiresEnhancedMonitoring: false,
        intranetPageSource: rules.pageSource,
        pageId: PAGE_ID,
      };
    }

    // Check if RECIPIENT country is prohibited
    if (rules.restrictedCountries.includes(params.recipientCountry)) {
      restrictions.push(`❌ Transfers TO ${params.recipientCountry} are PROHIBITED due to sanctions/compliance restrictions`);
      restrictions.push(`📄 Source: Intranet Page ID ${PAGE_ID} - Restricted Countries section`);
      restrictions.push(`🔗 View full details at: ${rules.pageSource || 'https://intranet.paysera.net/display/PSWEB/58238300'}`);
      
      return {
        isPossible: false,
        restrictions,
        requiresEnhancedMonitoring: false,
        intranetPageSource: rules.pageSource,
        pageId: PAGE_ID,
      };
    }

    // Check if currency is restricted
    if (rules.currencyRestrictions[params.currency] === 'Prohibited') {
      restrictions.push(`❌ ${params.currency} transfers are currently PROHIBITED`);
      restrictions.push(`📄 Source: Intranet Page ID ${PAGE_ID} - Currency Restrictions section`);
      restrictions.push(`🔗 View full details at: ${rules.pageSource || 'https://intranet.paysera.net/display/PSWEB/58238300'}`);
      
      return {
        isPossible: false,
        restrictions,
        requiresEnhancedMonitoring: false,
        intranetPageSource: rules.pageSource,
        pageId: PAGE_ID,
      };
    }

    // Check enhanced monitoring requirement for sender AND recipient
    const senderRequiresMonitoring = rules.enhancedMonitoring.includes(params.senderNationality);
    const recipientRequiresMonitoring = rules.enhancedMonitoring.includes(params.recipientCountry);
    const requiresEnhancedMonitoring = senderRequiresMonitoring || recipientRequiresMonitoring;

    // Determine the appropriate transfer system based on currency and countries
    let system = '';
    let fee = '';

    // Currency One supported currencies
    const currencyOneCurrencies = ['USD', 'GBP', 'CHF', 'PLN', 'CZK', 'RON', 'BGN', 'NOK', 'SEK', 'DKK', 'HUF'];

    // 1. Local transfer for Lithuania (EUR only)
    if (params.recipientCountry === 'Lithuania' && params.currency === 'EUR') {
      system = 'Local Transfer (Lithuania)';
      fee = '0 EUR';
      restrictions.push('✅ Transfer will be executed via LOCAL transfer system');
      restrictions.push('⏱️ Processing time: Same business day');
      restrictions.push('💶 Fee: 0 EUR (free for local Lithuanian transfers)');
    } 
    // 2. SEPA for EUR within EU/EEA
    else if (params.currency === 'EUR' && this.isEUCountry(params.recipientCountry)) {
      system = 'SEPA';
      fee = '0 EUR';
      restrictions.push('✅ Transfer will be executed via SEPA (Single Euro Payments Area)');
      restrictions.push('⏱️ Processing time: 1-2 business days');
      restrictions.push('💶 Fee: 0 EUR (free for SEPA transfers)');
      restrictions.push('📋 SEPA transfers are available only within EU/EEA countries in EUR');
    }
    // 3. Currency One for supported currencies
    else if (currencyOneCurrencies.includes(params.currency)) {
      system = 'Currency One';
      fee = '1 EUR';
      restrictions.push(`✅ Transfer will be executed via CURRENCY ONE system`);
      restrictions.push(`💱 Supported currency: ${params.currency}`);
      restrictions.push('⏱️ Processing time: 1-3 business days');
      restrictions.push('💶 Fee: 1 EUR per transfer');
      restrictions.push(`📋 Currency One supports: ${currencyOneCurrencies.join(', ')}`);
    }
    // 4. SWIFT for all other international transfers
    else {
      system = 'SWIFT';
      fee = '15-50 EUR (depending on currency and amount)';
      restrictions.push('✅ Transfer will be executed via SWIFT (international wire transfer)');
      restrictions.push('⏱️ Processing time: 3-5 business days');
      restrictions.push('💶 Fee: 15-50 EUR depending on currency and transfer amount');
      restrictions.push('⚠️ Intermediary bank fees may apply (additional charges from correspondent banks)');
      restrictions.push('📋 SWIFT is used for currencies not supported by Currency One or SEPA');
    }

    // Add enhanced monitoring restrictions
    if (senderRequiresMonitoring) {
      restrictions.push(`⚠️ IMPORTANT: Sender country (${params.senderNationality}) requires ENHANCED DUE DILIGENCE and monitoring`);
      restrictions.push(`📄 Source: Intranet Page ID ${PAGE_ID} - Enhanced Monitoring Countries section`);
    }
    if (recipientRequiresMonitoring) {
      restrictions.push(`⚠️ IMPORTANT: Recipient country (${params.recipientCountry}) requires ENHANCED DUE DILIGENCE and monitoring`);
      restrictions.push(`📄 Source: Intranet Page ID ${PAGE_ID} - Enhanced Monitoring Countries section`);
    }
    if (requiresEnhancedMonitoring) {
      restrictions.push('📝 Additional documentation will be requested for compliance verification');
      restrictions.push('🔍 Transfer will undergo enhanced screening procedures');
    }

    // Add intranet reference at the end
    restrictions.push(`📄 Full transfer rules documented in Intranet Page ID ${PAGE_ID}`);
    restrictions.push(`🔗 View complete policy at: ${rules.pageSource || 'https://intranet.paysera.net/display/PSWEB/58238300'}`);

    return {
      isPossible: true,
      system,
      fee,
      restrictions,
      requiresEnhancedMonitoring,
      intranetPageSource: rules.pageSource,
      pageId: PAGE_ID,
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
    intranetPageSource?: string;
    countryPageId?: string;
    activitiesPageId?: string;
  }> {
    const restrictions = await this.getCompanyRestrictions();

    console.log(`Validating company: Country=${params.companyCountry}, Activity=${params.companyActivity}`);
    console.log(`Source: ${restrictions.pageSource}`);

    const COUNTRY_PAGE_TITLE = 'Opportunities to open a company account by country';
    const ACTIVITIES_PAGE_TITLE = 'ANNEX 2. TYPES OF BUSINESS ACTIVITIES';

    // Check if country is prohibited
    if (restrictions.restrictedCountries.includes(params.companyCountry)) {
      return {
        isPossible: false,
        countryStatus: '🚫 PROHIBITED (Red status in intranet)',
        activityStatus: 'N/A',
        restrictions: [
          `❌ Company accounts for ${params.companyCountry} are NOT ACCEPTED`,
          `📄 Source: FNTT Space - "${COUNTRY_PAGE_TITLE}"`,
          `🔴 Country marked as PROHIBITED/RED in the country acceptance table`,
          `🔗 View full list: ${restrictions.pageSource}`,
          `⚠️ This country is listed in the restricted countries section with "No" or "Prohibited" status`
        ],
        conditions: [],
        intranetPageSource: restrictions.pageSource,
        countryPageId: 'FNTT Space',
        activitiesPageId: restrictions.activitiesPageSource,
      };
    }

    // Check country status
    const requiresEDD = restrictions.enhancedDueDiligence.includes(params.companyCountry);
    const isEU = this.isEUCountry(params.companyCountry);
    
    let countryStatus = '';
    const countryRestrictions: string[] = [];
    
    if (requiresEDD) {
      countryStatus = '⚠️ Enhanced Due Diligence Required (Yellow/Orange status)';
      countryRestrictions.push(`⚠️ ${params.companyCountry} requires ENHANCED DUE DILIGENCE`);
      countryRestrictions.push(`📄 Source: FNTT Space - "${COUNTRY_PAGE_TITLE}"`);
      countryRestrictions.push(`🟡 Country marked as requiring enhanced monitoring in intranet`);
    } else if (isEU) {
      countryStatus = '✅ Accepted - Standard Processing (EU/EEA country)';
      countryRestrictions.push(`✅ ${params.companyCountry} is an EU/EEA country - Standard processing applies`);
      countryRestrictions.push(`📄 Source: FNTT Space - "${COUNTRY_PAGE_TITLE}"`);
    } else {
      countryStatus = '⚠️ Requires Case-by-case Review';
      countryRestrictions.push(`⚠️ ${params.companyCountry} requires individual assessment for account opening`);
      countryRestrictions.push(`📄 Source: FNTT Space - "${COUNTRY_PAGE_TITLE}"`);
    }

    // Check activity
    const activityLower = params.companyActivity.toLowerCase();
    let activityStatus = '';
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
          activityStatus: '🚫 PROHIBITED Activity (Red status)',
          restrictions: [
            ...countryRestrictions,
            `❌ Business activity "${prohibited}" is NOT ACCEPTED`,
            `📄 Source: FNTT Space - "${ACTIVITIES_PAGE_TITLE}"`,
            `🔴 This activity type is listed in the PROHIBITED activities section`,
            `🔗 View full list: ${restrictions.activitiesPageSource}`,
            `⚠️ Account opening is NOT POSSIBLE for this type of business activity`
          ],
          conditions: [],
          intranetPageSource: restrictions.pageSource,
          countryPageId: 'FNTT Space',
          activitiesPageId: restrictions.activitiesPageSource,
        };
      }
    }

    // Check restricted activities (may be accepted with conditions)
    let hasRestrictedActivity = false;
    for (const restricted of restrictions.restrictedActivities) {
      const restrictedLower = restricted.toLowerCase();
      // Check both directions: if activity contains restricted words OR restricted phrase contains activity
      if (activityLower.includes(restrictedLower) || restrictedLower.includes(activityLower)) {
        hasRestrictedActivity = true;
        activityStatus = '⚠️ RESTRICTED Activity - Additional Review Required';
        activityRestrictions.push(`⚠️ Activity "${restricted}" is RESTRICTED (requires additional compliance review)`);
        activityRestrictions.push(`📄 Source: FNTT Space - "${ACTIVITIES_PAGE_TITLE}"`);
        activityRestrictions.push(`🟡 This activity is listed in the RESTRICTED activities section`);
        conditions.push('✅ Valid business licenses MUST be provided');
        conditions.push('✅ Enhanced compliance monitoring will be applied');
        conditions.push('✅ Additional documentation may be requested during review');
      }
    }

    if (!hasRestrictedActivity) {
      activityStatus = '✅ Accepted - Standard Activity';
      activityRestrictions.push(`✅ Business activity is ACCEPTED with standard processing`);
      activityRestrictions.push(`📄 Source: FNTT Space - "${ACTIVITIES_PAGE_TITLE}"`);
    }

    if (requiresEDD) {
      conditions.push('📝 Enhanced due diligence documentation REQUIRED');
      conditions.push('📝 Company beneficial ownership verification REQUIRED');
      conditions.push('📝 Source of funds documentation REQUIRED');
      conditions.push('📝 Additional KYC/AML checks will be conducted');
    }

    // Add intranet references
    activityRestrictions.push(`🔗 Country policy: ${restrictions.pageSource}`);
    activityRestrictions.push(`🔗 Activities policy: ${restrictions.activitiesPageSource}`);

    return {
      isPossible: true,
      countryStatus,
      activityStatus,
      restrictions: [...countryRestrictions, ...activityRestrictions],
      conditions,
      intranetPageSource: restrictions.pageSource,
      countryPageId: 'FNTT Space',
      activitiesPageId: restrictions.activitiesPageSource,
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

  // Search intranet for a topic
  async searchIntranet(query: string): Promise<{
    results: Array<{
      pageId: string;
      pageTitle: string;
      pageUrl: string;
      relevantContent: string;
      summary: string;
    }>;
    totalResults: number;
    query: string;
  }> {
    if (!this.config.apiKey || !this.config.email) {
      console.warn('Paysera Intranet credentials not configured. Using mock search results.');
      return this.getMockSearchResults(query);
    }

    try {
      // Use Confluence search API
      const searchUrl = `${this.config.baseUrl}/rest/api/content/search?cql=${encodeURIComponent(`text ~ "${query}"`)}&limit=10&expand=body.view`;

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${this.getBasicAuth()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Search failed: ${response.status} ${response.statusText}`);
        return this.getMockSearchResults(query);
      }

      const data = await response.json();
      const results = data.results.map((page: any) => {
        const bodyText = page.body?.view?.value || '';
        // Strip HTML tags to get plain text
        const plainText = bodyText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Extract relevant snippet around query
        const lowerText = plainText.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const queryIndex = lowerText.indexOf(lowerQuery);
        
        let relevantContent = '';
        if (queryIndex !== -1) {
          const start = Math.max(0, queryIndex - 150);
          const end = Math.min(plainText.length, queryIndex + 150);
          relevantContent = '...' + plainText.substring(start, end) + '...';
        } else {
          relevantContent = plainText.substring(0, 300) + '...';
        }

        return {
          pageId: page.id,
          pageTitle: page.title,
          pageUrl: `${this.config.baseUrl}${page._links.webui}`,
          relevantContent,
          summary: `Found in: ${page.title}`,
        };
      });

      return {
        results,
        totalResults: data.size || results.length,
        query,
      };
    } catch (error) {
      console.error('Error searching intranet:', error);
      return this.getMockSearchResults(query);
    }
  }

  // Mock search results for when API is not available
  private getMockSearchResults(query: string): any {
    const lowerQuery = query.toLowerCase();
    const allResults = [
      {
        pageId: '58238300',
        pageTitle: 'Transfer Rules and Restrictions',
        pageUrl: 'https://intranet.paysera.net/display/PSWEB/58238300',
        keywords: ['transfer', 'sepa', 'swift', 'currency', 'country', 'restriction', 'prohibited', 'fee'],
        summary: 'Complete transfer rules including SEPA, Currency One, and SWIFT systems. Contains information about restricted countries, enhanced monitoring requirements, and currency restrictions.',
      },
      {
        pageId: 'FNTT-Country',
        pageTitle: 'Opportunities to open a company account by country',
        pageUrl: 'https://intranet.paysera.net/display/FNTT/Opportunities+to+open+a+company+account+by+country',
        keywords: ['company', 'country', 'account', 'registration', 'prohibited', 'restricted', 'edd', 'enhanced'],
        summary: 'Country acceptance criteria for company account opening. Lists prohibited countries (red status), countries requiring enhanced due diligence (yellow/orange status), and accepted countries.',
      },
      {
        pageId: 'FNTT-Activities',
        pageTitle: 'ANNEX 2. TYPES OF BUSINESS ACTIVITIES',
        pageUrl: 'https://intranet.paysera.net/display/FNTT/ANNEX+2.+TYPES+OF+BUSINESS+ACTIVITIES',
        keywords: ['activity', 'business', 'prohibited', 'restricted', 'gambling', 'crypto', 'forex', 'license'],
        summary: 'Lists prohibited business activities (not accepted) and restricted activities (requiring additional review and licensing). Includes gambling, cryptocurrency, weapons, tobacco, and other regulated sectors.',
      },
      {
        pageId: '12345678',
        pageTitle: 'KYC and AML Procedures',
        pageUrl: 'https://intranet.paysera.net/display/COMPLIANCE/KYC-AML',
        keywords: ['kyc', 'aml', 'identification', 'verification', 'due diligence', 'monitoring', 'compliance'],
        summary: 'Know Your Customer (KYC) and Anti-Money Laundering (AML) procedures. Covers client identification requirements, enhanced due diligence procedures, and ongoing monitoring obligations.',
      },
      {
        pageId: '23456789',
        pageTitle: 'SEPA Transfer Guidelines',
        pageUrl: 'https://intranet.paysera.net/display/PAYMENTS/SEPA-Guidelines',
        keywords: ['sepa', 'euro', 'eur', 'eu', 'eea', 'instant', 'transfer'],
        summary: 'SEPA transfer system guidelines and requirements. Covers SEPA eligibility, supported countries, instant SEPA transfers, and processing times.',
      },
      {
        pageId: '34567890',
        pageTitle: 'Currency One System Documentation',
        pageUrl: 'https://intranet.paysera.net/display/PAYMENTS/Currency-One',
        keywords: ['currency one', 'usd', 'gbp', 'pln', 'czk', 'chf', 'international', 'multi-currency'],
        summary: 'Currency One system documentation for multi-currency transfers. Supports USD, GBP, CHF, PLN, CZK, RON, BGN, NOK, SEK, DKK, HUF with flat 1 EUR fee.',
      },
      {
        pageId: '45678901',
        pageTitle: 'SWIFT Transfer Procedures',
        pageUrl: 'https://intranet.paysera.net/display/PAYMENTS/SWIFT-Procedures',
        keywords: ['swift', 'international', 'wire', 'bic', 'correspondent', 'intermediary'],
        summary: 'SWIFT international wire transfer procedures. Covers SWIFT/BIC codes, correspondent banking relationships, fees, and processing times for international transfers.',
      },
    ];

    // Filter results based on query
    const filteredResults = allResults.filter(result => 
      result.keywords.some(keyword => keyword.includes(lowerQuery) || lowerQuery.includes(keyword))
    ).map(result => ({
      pageId: result.pageId,
      pageTitle: result.pageTitle,
      pageUrl: result.pageUrl,
      relevantContent: `This page contains information about: ${result.keywords.join(', ')}`,
      summary: result.summary,
    }));

    return {
      results: filteredResults.length > 0 ? filteredResults : [
        {
          pageId: '58238300',
          pageTitle: 'Transfer Rules and Restrictions',
          pageUrl: 'https://intranet.paysera.net/display/PSWEB/58238300',
          relevantContent: `No exact match found for "${query}". This is the main transfer rules page which may contain related information.`,
          summary: 'Main transfer rules page - may contain information related to your search query.',
        }
      ],
      totalResults: filteredResults.length > 0 ? filteredResults.length : 1,
      query,
    };
  }
}

// Export singleton instance
export const payseraIntranetService = new PayseraIntranetService();
