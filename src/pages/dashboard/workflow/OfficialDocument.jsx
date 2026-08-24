import { useEffect } from 'react';
import { fileUrl } from '../../../services/api/config';

const FOOTER = 'TIN: 119038217 | Tel: 0791226612 | Email: info@rwvca.org.rw | rwvca2018@gmail.com';

export function formatDocDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

export function moneyWords(amount) {
  const number = Math.floor(Number(amount) || 0);
  if (number === 0) return 'ZERO';
  const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const chunk = (n) => {
    if (n < 20) return units[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]} ${units[n % 10]}`.trim();
    if (n < 1000) return `${units[Math.floor(n / 100)]} HUNDRED ${chunk(n % 100)}`.trim();
    if (n < 1000000) return `${chunk(Math.floor(n / 1000))} THOUSAND ${chunk(n % 1000)}`.trim();
    return `${chunk(Math.floor(n / 1000000))} MILLION ${chunk(n % 1000000)}`.trim();
  };
  return `${chunk(number)} RWANDA FRANCS`.replace(/\s+/g, ' ').trim();
}

export function SignedImage({ src, alt, tall = false }) {
  if (!src) return null;
  return (
    <img
      src={fileUrl(src, { auth: true })}
      alt={alt}
      className={tall ? 'h-[150px] max-w-[250px] object-contain align-middle ml-2' : 'h-[65px] max-w-[150px] object-contain align-middle ml-2'}
    />
  );
}

export function edStampSrc(choice, settings, fallback) {
  if (choice === 'signature_only') return settings?.signature_only || fallback;
  if (choice === 'stamp_with_signature' || choice === 'yes') return settings?.stamp_with_signature || fallback;
  return fallback;
}

export default function OfficialDocument({
  title,
  loading,
  error,
  children,
  banner,
  autoPrint = true,
}) {
  useEffect(() => {
    if (!autoPrint || loading || error) return undefined;
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [autoPrint, loading, error]);

  if (loading) return <p className="p-10 text-center text-gray-500">Loading document...</p>;
  if (error) return <p className="p-10 text-center text-red-600">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="no-print sticky top-0 z-10 flex justify-end gap-2 bg-white/95 px-4 py-3 shadow-sm print:hidden">
        <button type="button" onClick={() => window.print()} className="rounded-lg bg-[#2c3e50] px-4 py-2 text-sm font-semibold text-white">
          Print / Save as PDF
        </button>
        <button type="button" onClick={() => window.history.back()} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
          Back
        </button>
      </div>
      <div className="mx-auto my-6 w-[210mm] min-h-[297mm] bg-white px-[20mm] py-[15mm] text-[12pt] leading-relaxed text-[#333] shadow print:my-0 print:shadow-none">
        <header className="mb-10 pt-5 text-center">
          <div className="mb-[15pt] flex items-center justify-between gap-3">
            <div className="flex-1 text-left">
              <img
                src="/rwvca-doc-logo.png"
                alt="RWVCA"
                className="h-[25mm] max-w-[60mm] object-contain object-left mix-blend-multiply print:mix-blend-multiply"
              />
            </div>
            <div className="flex-[2] px-2 text-center text-[16pt] font-bold uppercase leading-tight tracking-[1pt] text-[#2c3e50]">
              Rwanda Wood Value Chain Association
            </div>
            <div className="flex-1 text-right">
              <img
                src="/psf-logo.png"
                alt="PSF"
                className="ml-auto h-[25mm] max-w-[60mm] object-contain object-right"
              />
            </div>
          </div>
          <div className="relative mt-4 inline-block px-6 pb-3 text-[16pt] font-bold uppercase tracking-[3pt] text-[#2c3e50]">
            {title}
            <span className="absolute bottom-0 left-1/2 h-[2pt] w-[100pt] -translate-x-1/2 bg-[#2c3e50]" />
          </div>
          {banner && <p className="mt-4 text-sm font-semibold tracking-wide text-[#2f5d31]">{banner}</p>}
        </header>
        {children}
        <footer className="mt-16 border-t border-gray-300 pt-3 text-center text-[9pt] text-gray-500">
          {FOOTER}
        </footer>
      </div>
    </div>
  );
}

export function FormRow({ label, children }) {
  return (
    <div className="mb-4 flex min-h-[25pt] flex-wrap items-center">
      <div className="min-w-[220pt] pr-4 font-bold text-[#333]">{label}</div>
      <div className="min-h-[20pt] flex-1 border-b border-dotted border-gray-400 py-0.5">{children || '\u00a0'}</div>
    </div>
  );
}

export function SignatureLine({ label, name, src, tall }) {
  return (
    <p className="mb-5 flex flex-wrap items-center">
      <strong className="min-w-[180px]">{label}</strong>
      <span className="mx-3 inline-block min-w-[250pt] border-b border-dashed border-[#333]">{name}</span>
      <SignedImage src={src} alt={label} tall={tall} />
    </p>
  );
}
