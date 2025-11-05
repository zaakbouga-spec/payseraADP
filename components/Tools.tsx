
import React, { useState, useMemo } from 'react';
import { COUNTRIES, CURRENCIES } from '@/constants';
import { Country, CountryStatus, TransferCheckResponse, CompanyValidationResponse, IdentifierValidationResponse } from '@/types';
import { checkTransfer, validateCompany, validateIdentifier } from '@/services/companyApiService';
import Spinner from '@/components/Spinner';
import { isValidIBAN } from '@/utils/iban';
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


// IBAN & SWIFT Validator Tool
export const IbanSwiftValidator = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifierValidationResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please enter an IBAN or SWIFT code.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    // Basic client-side check for IBAN format before sending to the API
    const isPotentiallyIban = /^[A-Z]{2}/.test(identifier.trim().toUpperCase());
    if (isPotentiallyIban && !isValidIBAN(identifier)) {
        setError("The IBAN has an invalid format. Please check the length and characters.");
        setLoading(false);
        return;
    }

    try {
      const response = await validateIdentifier(identifier.trim());
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
    
    const statusColor = result.isValid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200';
    const statusIcon = result.isValid ? '✅' : '❌';

    return (
      <ResultCard title="Identifier Analysis">
          <div className={`p-3 rounded-lg font-bold text-lg text-center border ${statusColor}`}>
            {statusIcon} {result.isValid ? `Valid ${result.type}` : 'Invalid Identifier'}
          </div>
          {!result.isValid ? (
              <ResultField icon={<InfoIcon />} label="Reason" value={result.message} />
          ) : (
              <>
                  <ResultField icon={<InfoIcon />} label="Bank Name" value={result.details.bankName} />
                  <ResultField icon={<CountryIcon />} label="Country" value={result.details.country} />
                  <ResultField icon={<SystemIcon />} label="Branch" value={result.details.branch} />
                  {result.supportedTransfers && result.supportedTransfers.length > 0 && (
                      <div className="flex items-start space-x-3">
                          <InfoIcon />
                          <div>
                              <p className="text-sm font-semibold text-gray-600">Supported Transfers</p>
                              <ul className="list-disc list-inside text-base text-gray-800">
                                  {result.supportedTransfers.map(t => <li key={t}>{t}</li>)}
                              </ul>
                          </div>
                      </div>
                  )}
                  <div className="pt-2 border-t">
                      <ResultField icon={<ConclusionIcon />} label="Message" value={result.message} />
                  </div>
              </>
          )}
      </ResultCard>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600">Enter an IBAN or SWIFT/BIC code to validate its format and get information about supported transfer types from your company's system.</p>
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
        <div>
          <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">IBAN / SWIFT Code</label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder="e.g., GB29 NWBK 6016... or DEUTDEFF"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 uppercase tracking-wider"
            required
          />
        </div>
        <div className="flex items-center justify-end pt-2">
          {loading ? <Spinner /> :
            <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75">
              Validate & Analyze
            </button>
          }
        </div>
      </form>
      {error && <p className="text-red-600 text-center font-semibold pt-2" aria-live="assertive">{error}</p>}
      <ResultDisplay />
    </div>
  );
};
