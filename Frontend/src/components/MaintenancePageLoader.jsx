import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getStatus, clearSession } from '../services/statusService';

const SpinnerIcon = () => (
  <svg
    className='animate-spin'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2.5'
    strokeLinecap='round'
    width='14'
    height='14'
  >
    <path d='M21 12a9 9 0 1 1-6.219-8.56' />
  </svg>
);

export default function MaintenancePageLoader({
  onBackOnline = null,
  intervalSeconds = 15,
}) {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const runCheck = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const data = await getStatus();
      if (!isMounted.current) return;
      if (data.status === 'up' && data.uri) {
        try { await clearSession(); } catch { /* swallow */ }
        if (onBackOnline) {
          onBackOnline(data.uri);
        } else {
          window.location.href = data.uri;
        }
        return;
      }
    } catch { /* swallow */ }
    if (isMounted.current) setChecking(false);
  }, [checking, onBackOnline]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (!isMounted.current) return;
      runCheck();
    }, intervalSeconds * 1000);
    return () => clearInterval(tick);
  }, [runCheck, intervalSeconds]);

  return (
    <div className='flex items-center justify-center mt-6'>
      <button
        onClick={runCheck}
        disabled={checking}
        className='inline-flex items-center justify-center gap-2 min-w-[160px] rounded-full border border-[#373684] px-6 py-2.5 text-sm font-semibold text-[#373684] transition hover:bg-[#373684] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#373684] disabled:opacity-60 disabled:cursor-not-allowed'
      >
        {checking ? (
          <>
            <SpinnerIcon />
            {t('maintenance.checking')}
          </>
        ) : (
          t('maintenance.checkAgain')
        )}
      </button>
    </div>
  );
}
