import { useEffect } from 'react';

export function useTawkTo() {
  useEffect(() => {
    // Avoid injecting the script more than once
    if (document.getElementById('tawk-script')) return;

    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    s1.id = 'tawk-script';
    s1.async = true;
    s1.src = 'https://embed.tawk.to/6a19010560ef501c32a473bc/1jpoqnvo5';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');

    const s0 = document.getElementsByTagName('script')[0];
    s0.parentNode?.insertBefore(s1, s0);

    return () => {
      const existing = document.getElementById('tawk-script');
      if (existing) existing.remove();
    };
  }, []);
}
