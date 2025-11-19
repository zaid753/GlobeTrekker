
import React, { useState, useEffect } from 'react';
import { PiggyBankIcon, UndoIcon } from './icons';

interface CurrencyConverterProps {
    amountINR: number;
}

const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', rate: 0.0119 },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', rate: 0.0110 },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', rate: 0.0094 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', rate: 1.78 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', rate: 0.018 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', rate: 0.016 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'DH', flag: '🇦🇪', rate: 0.044 },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', rate: 0.43 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', rate: 0.016 },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', rate: 0.0105 },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', rate: 0.086 },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', rate: 0.056 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', rate: 0.045 },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', rate: 15.8 },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', rate: 1.08 },
];

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ amountINR }) => {
    const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
    const [amount, setAmount] = useState<number | ''>(amountINR);
    const [isInverted, setIsInverted] = useState(false);

    useEffect(() => {
        // Auto-fill amount only when resetting or initializing with INR source
        if (!isInverted && amountINR > 0) {
            setAmount(amountINR);
        }
    }, [amountINR, isInverted]);

    const handleSwap = () => {
        setIsInverted(!isInverted);
        setAmount(''); // Clear amount on swap to avoid confusion
    };

    const getRate = () => isInverted ? (1 / selectedCurrency.rate) : selectedCurrency.rate;
    
    const result = typeof amount === 'number' ? amount * getRate() : 0;
    
    const sourceCurrency = isInverted ? selectedCurrency : { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' };
    const targetCurrency = isInverted ? { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' } : selectedCurrency;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:border dark:border-gray-700 p-6 border border-gray-100 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl text-cyan-600 dark:text-cyan-400 shadow-sm">
                         <PiggyBankIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Currency Converter</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Live Exchange Estimates</p>
                    </div>
                </div>
                <button 
                    onClick={() => { setIsInverted(false); setAmount(amountINR); }}
                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:shadow-sm font-semibold"
                    title="Reset to Trip Total"
                >
                    <UndoIcon className="h-3 w-3" /> Reset
                </button>
            </div>
            
            <div className="flex flex-col gap-5 relative">
                {/* FROM SECTION */}
                <div className="relative group">
                    <label className="block text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1.5 tracking-wider ml-1">
                        From ({sourceCurrency.code})
                    </label>
                    <div className="relative flex items-center">
                        <span className="absolute left-4 text-gray-400 text-lg font-medium group-focus-within:text-cyan-500 transition-colors z-10">
                            {sourceCurrency.symbol}
                        </span>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            className="w-full pl-10 pr-24 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 font-bold text-gray-800 dark:text-gray-100 text-xl transition-all"
                            placeholder="0"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-100 dark:border-gray-600 shadow-sm flex items-center">
                            {isInverted ? (
                                <select 
                                    value={selectedCurrency.code} 
                                    onChange={(e) => setSelectedCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                                    className="bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer py-1 pr-6 pl-2 appearance-none outline-none"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.code}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="px-3 text-sm font-bold text-gray-700 dark:text-gray-200">INR</span>
                            )}
                            <div className="pointer-events-none absolute right-2 flex items-center text-lg">
                                {isInverted && <svg className="w-4 h-4 text-gray-500 absolute right-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>}
                                <span className={`text-lg ${isInverted ? 'mr-4' : ''}`}>{sourceCurrency.flag}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Swap Button */}
                 <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 mt-3 md:mt-3">
                    <button 
                        onClick={handleSwap}
                        className="p-2.5 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 text-cyan-500 dark:text-cyan-400 shadow-lg hover:shadow-xl hover:scale-110 hover:rotate-180 transition-all duration-300 focus:outline-none group"
                        title="Swap Currencies"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </button>
                </div>

                {/* TO SECTION */}
                 <div className="relative group">
                    <label className="block text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1.5 tracking-wider ml-1 text-right">
                        To ({targetCurrency.code})
                    </label>
                    <div className="relative flex items-center">
                        <div className="absolute left-0 inset-y-0 flex items-center pl-4 pointer-events-none z-10">
                             <span className="text-gray-400 text-lg font-medium">{targetCurrency.symbol}</span>
                        </div>
                        <input 
                            type="text" 
                            readOnly 
                            value={new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(result)}
                            className="w-full pl-10 pr-24 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-800 dark:text-gray-100 text-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                            placeholder="0.00"
                        />
                        
                         <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1 border border-gray-100 dark:border-gray-600 shadow-sm flex items-center">
                            {!isInverted ? (
                                <select 
                                    value={selectedCurrency.code} 
                                    onChange={(e) => setSelectedCurrency(CURRENCIES.find(c => c.code === e.target.value) || CURRENCIES[0])}
                                    className="bg-transparent border-none text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer py-1 pr-6 pl-2 appearance-none outline-none"
                                >
                                    {CURRENCIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.code}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="px-3 text-sm font-bold text-gray-700 dark:text-gray-200">INR</span>
                            )}
                            <div className="pointer-events-none absolute right-2 flex items-center text-lg">
                                {!isInverted && <svg className="w-4 h-4 text-gray-500 absolute right-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>}
                                <span className={`text-lg ${!isInverted ? 'mr-4' : ''}`}>{targetCurrency.flag}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                 <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Rates are approximate.
                </p>
                <div className="text-sm font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-900/20 px-4 py-1.5 rounded-full border border-cyan-100 dark:border-cyan-800">
                    1 {sourceCurrency.code} ≈ {new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(getRate())} {targetCurrency.code}
                </div>
            </div>
        </div>
    );
};

export default CurrencyConverter;
