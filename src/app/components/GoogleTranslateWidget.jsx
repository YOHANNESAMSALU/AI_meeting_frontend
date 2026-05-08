'use client';
import { useEffect, useState } from 'react';
import { Languages } from 'lucide-react';

export default function GoogleTranslateWidget() {
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    if (!showWidget) return;
    // Only add the script if it doesn't already exist
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }

    // Define the callback ONCE globally
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = function () {
        if (
          window.google &&
          window.google.translate &&
          window.google.translate.TranslateElement &&
          document.getElementById('google_translate_element') &&
          !document.getElementById('google_translate_element').hasChildNodes()
        ) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              includedLanguages: 'en,am,es,fr,de,it,pt,ru,ja,ko,zh-CN',
              layout: window.google.translate.TranslateElement.InlineLayout
                ? window.google.translate.TranslateElement.InlineLayout.SIMPLE
                : 0,
            },
            'google_translate_element'
          );
        }
      };
    }

    // Cleanup: do NOT remove the script or callback, as Google expects it to persist
    // Only remove the widget content if unmounting
    return () => {
      const el = document.getElementById('google_translate_element');
      if (el) el.innerHTML = '';
    };
  }, [showWidget]);

  return (
    <div style={{ position: 'relative', zIndex: 100 }}>
      <button
        aria-label="Translate"
        className="flex items-center gap-1 rounded px-2 py-1 text-xs border border-gray-300 bg-white hover:bg-gray-100 shadow"
        onClick={() => setShowWidget((v) => !v)}
        style={{ minWidth: 32 }}
      >
        <Languages size={16} />
        <span className="hidden sm:inline">Translate</span>
      </button>
      {showWidget && (
        <div
          id="google_translate_element"
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            minWidth: 180,
            minHeight: 40,
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 6,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            padding: 8,
            zIndex: 1000,
          }}
        />
      )}
    </div>
  );
}