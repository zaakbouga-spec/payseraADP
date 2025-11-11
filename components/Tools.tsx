
import React, { useState, useMemo } from 'react';
import { COUNTRIES, CURRENCIES } from '@/constants';
import { Country, CountryStatus, TransferCheckResponse, CompanyValidationResponse, IntranetSearchResponse } from '@/types';
import { checkTransfer, validateCompany, searchIntranet } from '@/services/companyApiService';
import Spinner from '@/components/Spinner';
import { InfoIcon, SystemIcon, FeeIcon, RestrictionIcon, ConclusionIcon, CountryIcon, ActivityIcon } from '@/components/Icons';

// --- Reusable Result Display Components ---

// Fix: Refactored props into an interface to resolve a TypeScript error.
interface ResultCardProps {
    // FIX: Made children optional to resolve a TypeScript error where the compiler incorrectly reported the prop was missing.
    children?: React.ReactNode;
    title: string;
}

const ResultCard = ({ children, title }: ResultCardProps) => (
    <div className="mt-6 p-5 bg-white rounded-lg border-2 border-gray-100 shadow-sm space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 tracking-tight">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const ResultField = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | undefined }) => {
    if (!value) return null;
    return (
        <div className="flex items-start space-x-3">
            {icon}
            <div>
                <p className="text-sm font-semibold text-gray-600">{label}</p>
                <p className="text-base text-gray-800">{value}</p>
            </div>
        </div>
    );
};

// --- Tools ---

// Transfer Checker Tool
export const TransferChecker = () => {
  const [senderNationality, setSenderNationality] = useState<Country>(() => COUNTRIES.find(c => c.name === 'Austria')!);
  const [recipientCountry, setRecipientCountry] = useState<Country>(() => COUNTRIES.find(c => c.name === 'Albania')!);
  const [currency, setCurrency] = useState('EUR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferCheckResponse | null>(null);
  
  const selectedCountries = useMemo(() => [senderNationality, recipientCountry], [senderNationality, recipientCountry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkTransfer({ senderNationality: senderNationality.name, recipientCountry: recipientCountry.name, currency });
      setResult(response);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred.');
        }
    } finally {
      setLoading(false);
    }
  };
  
  const getCountryStatusIcon = (status: CountryStatus) => {
    switch (status) {
        case CountryStatus.ENHANCED_MONITORING: return '*';
        case CountryStatus.REGISTRATION_UNAVAILABLE: return '**';
        case CountryStatus.PROHIBITED: return '🚫';
        default: return '';
    }
  }

  const ResultDisplay = () => {
    if (!result) return null;
    const isPossible = result.status === 'Possible';
    const statusColor = isPossible ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
    const statusIcon = isPossible ? '✅' : '❌';

    return (
      <ResultCard title="Transfer Analysis">
        <div className={`p-3 rounded-lg font-bold text-lg text-center border ${statusColor}`}>
          {statusIcon} Status: {result.status}
        </div>
        <ResultField icon={<InfoIcon />} label="Reason" value={result.reason} />
        <ResultField icon={<SystemIcon />} label="System" value={result.system} />
        <ResultField icon={<FeeIcon />} label="Fee" value={result.fee} />
        <ResultField icon={<RestrictionIcon />} label="Restrictions" value={result.restrictions} />
        <div className="pt-2 border-t">
          <ResultField icon={<InfoIcon />} label="Explanation" value={result.explanation} />
        </div>
        <div className="pt-2 border-t">
          <ResultField icon={<ConclusionIcon />} label="Conclusion" value={result.conclusion} />
        </div>
      </ResultCard>
    );
  }
  
  const Legend = () => {
    const statusesToShow = new Set(selectedCountries.map(c => c.status));
    if (statusesToShow.size === 1 && statusesToShow.has(CountryStatus.NORMAL)) {
        return null;
    }
      
    return (
        <div className="mt-4 text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-md border">
            <h4 className="font-bold mb-1">Legend:</h4>
            {statusesToShow.has(CountryStatus.ENHANCED_MONITORING) && <p>* Requires enhanced client identification and monitoring.</p>}
            {statusesToShow.has(CountryStatus.REGISTRATION_UNAVAILABLE) && <p>** New client registration is currently unavailable.</p>}
            {statusesToShow.has(CountryStatus.PROHIBITED) && <p>🚫 Transfers are prohibited to/from this country.</p>}
        </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">Select the details of the transfer to verify its possibility, fees, and restrictions based on your company's internal policies.</p>
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div>
          <label htmlFor="senderNationality" className="block text-sm font-medium text-gray-700">Sender Country</label>
          <select 
            id="senderNationality" 
            value={senderNationality.name} 
            onChange={e => setSenderNationality(COUNTRIES.find(c => c.name === e.target.value)!)} 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name} {getCountryStatusIcon(c.status)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="recipientCountry" className="block text-sm font-medium text-gray-700">Recipient Country</label>
          <select 
            id="recipientCountry" 
            value={recipientCountry.name} 
            onChange={e => setRecipientCountry(COUNTRIES.find(c => c.name === e.target.value)!)} 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name} {getCountryStatusIcon(c.status)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
          <select id="currency" value={currency} onChange={e => setCurrency(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Legend />
        <div className="flex items-center justify-end pt-2">
          {loading ? <Spinner /> : 
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-gray-400"
            disabled={senderNationality.status === CountryStatus.PROHIBITED || recipientCountry.status === CountryStatus.PROHIBITED}
            >
              Check Transfer
            </button>
          }
        </div>
      </form>
      {error && <p className="text-red-600 text-center font-semibold pt-2" aria-live="assertive">{error}</p>}
      <ResultDisplay />
    </div>
  );
};

// Company Validator Tool
export const CompanyValidator = () => {
  const [companyCountry, setCompanyCountry] = useState<Country>(() => COUNTRIES.find(c => c.name === 'Austria')!);
  const [companyActivity, setCompanyActivity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyValidationResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyActivity.trim()) {
        setError("Please provide the company's activity.");
        return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await validateCompany({ companyCountry: companyCountry.name, companyActivity });
      setResult(response);
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred.');
        }
    } finally {
      setLoading(false);
    }
  };
  
  const ResultDisplay = () => {
    if (!result) return null;
    const isPossible = result.status.startsWith('Possible');
    const statusColor = isPossible ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
    const statusIcon = isPossible ? '✅' : '❌';

    return (
      <ResultCard title="Validation Analysis">
          <div className={`p-3 rounded-lg font-bold text-lg text-center border ${statusColor}`}>
              {statusIcon} Status: {result.status}
          </div>
          <ResultField icon={<InfoIcon />} label="Reason" value={result.reason} />
          <ResultField icon={<CountryIcon />} label="Country Status" value={result.countryStatus} />
          <ResultField icon={<ActivityIcon />} label="Activity Status" value={result.activityStatus} />
          <div className="pt-2 border-t">
              <ResultField icon={<InfoIcon />} label="Explanation" value={result.explanation} />
          </div>
          <div className="pt-2 border-t">
              <ResultField icon={<ConclusionIcon />} label="Conclusion" value={result.conclusion} />
          </div>
      </ResultCard>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">Enter company details to check if it's possible to open a Paysera account based on its country and business activities.</p>
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div>
          <label htmlFor="companyCountry" className="block text-sm font-medium text-gray-700">Company Registration Country</label>
          <select 
            id="companyCountry" 
            value={companyCountry.name} 
            onChange={e => setCompanyCountry(COUNTRIES.find(c => c.name === e.target.value)!)} 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="companyActivity" className="block text-sm font-medium text-gray-700">Company Activity</label>
          <textarea 
            id="companyActivity" 
            value={companyActivity} 
            onChange={e => setCompanyActivity(e.target.value)} 
            placeholder="e.g., E-commerce store selling clothing"
            rows={3}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center justify-end pt-2">
          {loading ? <Spinner /> : 
            <button type="submit" className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75">
              Validate Company
            </button>
          }
        </div>
      </form>
      {error && <p className="text-red-600 text-center font-semibold pt-2" aria-live="assertive">{error}</p>}
      <ResultDisplay />
    </div>
  );
};


// Intranet Search Tool
export const IntranetSearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IntranetSearchResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a search query.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await searchIntranet(query.trim());
      setResult(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const ResultDisplay = () => {
    if (!result) return null;
    
    return (
      <ResultCard title={`Search Results for "${result.query}"`}>
        <div className="text-sm text-gray-600 mb-4">
          Found {result.totalResults} result{result.totalResults !== 1 ? 's' : ''}
        </div>
        
        {result.results.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No results found. Try a different search term.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {result.results.map((item, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r-lg">
                <h4 className="font-bold text-lg text-gray-800 mb-2">{item.pageTitle}</h4>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <InfoIcon />
                  <span className="font-semibold">Page ID:</span>
                  <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">{item.pageId}</span>
                </div>
                
                <p className="text-sm text-gray-700 mb-3 italic">
                  {item.summary}
                </p>
                
                <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.relevantContent}
                  </p>
                </div>
                
                <a 
                  href={item.pageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm"
                >
                  🔗 View Full Page
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        )}
      </ResultCard>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Search the Paysera intranet for information on transfer rules, country restrictions, business activities, and compliance policies. 
        Results will show the page ID and link where you can find detailed information.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div>
          <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700">Search Query</label>
          <input
            id="searchQuery"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g., SEPA, Currency One, restricted countries, gambling..."
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Try searching for: transfers, SEPA, SWIFT, countries, activities, crypto, gambling, KYC, AML, etc.
          </p>
        </div>
        <div className="flex items-center justify-end pt-2">
          {loading ? <Spinner /> :
            <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75">
              Search Intranet
            </button>
          }
        </div>
      </form>
      {error && <p className="text-red-600 text-center font-semibold pt-2" aria-live="assertive">{error}</p>}
      <ResultDisplay />
    </div>
  );
};
