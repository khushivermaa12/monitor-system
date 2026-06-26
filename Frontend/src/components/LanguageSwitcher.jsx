import React from 'react';
import { useTranslation } from 'react-i18next';
import { setLangAndReload } from '../utils/langQuery';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const buttonClasses = (lang) => `rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#373684] ${currentLang === lang
    ? 'border-[#373684] bg-[#373684] text-white shadow-sm'
    : 'border-slate-300 bg-white text-black hover:border-[#373684] hover:bg-[#373684]/10 hover:text-[#373684]'
    }`;

  return (
    <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-sm font-medium text-slate-700">Language</span>
      <button className={buttonClasses('en')} onClick={() => setLangAndReload('en')}>
        EN
      </button>
      <button className={buttonClasses('th')} onClick={() => setLangAndReload('th')}>
        TH
      </button>
    </div>
  );
};

export default LanguageSwitcher;
