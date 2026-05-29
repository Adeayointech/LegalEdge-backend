import { useEffect } from 'react';

// Replace these two values with your actual IDs from:
// Tawk.to Dashboard → Administration → Property Settings → Chat Widget
const TAWK_PROPERTY_ID = 'YOUR_PROPERTY_ID'; // e.g. "64abc123def456"
const TAWK_WIDGET_ID = 'YOUR_WIDGET_ID';     // e.g. "1h2abc3de"

export function useTawkTo() {
  useEffect(() => {
    if (!TAWK_PROPERTY_ID || TAWK_PROPERTY_ID === 'YOUR_PROPERTY_ID') return;

    // Avoid injecting the script more than once
    if (document.getElementById('tawk-script')) return;

    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.id = 'tawk-script';
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);

    return () => {
      // Clean up on unmount (only relevant in dev hot-reload)
      const existing = document.getElementById('tawk-script');
      if (existing) existing.remove();
    };
  }, []);
}
