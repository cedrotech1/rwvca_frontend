import { useEffect, useState } from 'react';
import PageBanner from '../../components/public/PageBanner';
import ContactForm from '../../components/public/ContactForm';
import { publicApi } from '../../services/api';
import { MAP_EMBED } from '../../components/public/publicUi';

export default function ContactPage() {
  const [company, setCompany] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    publicApi.company().then((res) => setCompany(res.data)).catch(() => {});
  }, []);

  const email = company?.email || 'info@rwvca.org.rw';
  const phone = company?.phone || '+250 791 226 612';
  const address = company?.address || 'NR5, Kicukiro, Gahanga KK 15 Rd';
  const qrUrl = typeof window !== 'undefined'
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/contact`)}`
    : '';

  return (
    <div className="bg-[#f8f9fa]">
      <PageBanner title="Contact Us" />
      <section className="px-5 py-16 text-center">
        <h2 className="text-[#2f5d31] text-[2.2em] font-bold inline-block relative pb-2 after:content-[''] after:block after:w-20 after:h-[3px] after:bg-[#2f5d31] after:mx-auto after:mt-1.5">
          Get in touch
        </h2>
        <p className="max-w-[700px] mx-auto mt-4 mb-10 text-[#333] leading-relaxed">
          We have several programs that helps people with different experiences getting started
          <br />
          and strengthening their careers in tech as talents and enterpreneurs
        </p>
        <div className="flex justify-center gap-8 flex-wrap">
          <div className="w-[27%] min-w-[240px] min-h-[120px] bg-[#6b4423] rounded-lg p-6 text-white flex flex-col items-center justify-center hover:-translate-y-1">
            <i className="fas fa-map-marker-alt text-[32px] mb-4" />
            <h5 className="text-base font-semibold mb-2 uppercase tracking-wide">VISIT OUR OFFICE</h5>
            <p className="text-[13px] m-0">{address}</p>
          </div>
          <div className="w-[27%] min-w-[240px] min-h-[120px] bg-[#6b4423] rounded-lg p-6 text-white flex flex-col items-center justify-center hover:-translate-y-1">
            <i className="fas fa-envelope text-[32px] mb-4" />
            <h5 className="text-base font-semibold mb-2 uppercase tracking-wide">EMAIL US</h5>
            <p className="text-[13px] m-0"><a href={`mailto:${email}`} className="text-white no-underline">{email}</a></p>
          </div>
          <div className="w-[27%] min-w-[240px] min-h-[120px] bg-[#6b4423] rounded-lg p-6 text-white flex flex-col items-center justify-center hover:-translate-y-1">
            <i className="fas fa-phone text-[32px] mb-4" />
            <h5 className="text-base font-semibold mb-2 uppercase tracking-wide">CALL US</h5>
            <p className="text-[13px] m-0"><a href={`tel:${phone}`} className="text-white no-underline">{phone}</a></p>
            <button type="button" className="mt-2.5 underline text-xs" onClick={() => setQrOpen(true)}>View QR Code</button>
          </div>
        </div>
      </section>

      <div className="max-w-[1000px] mx-auto px-5 pb-16">
        <div className="flex flex-wrap gap-5 justify-center">
          <div className="flex-1 min-w-[300px] basis-[45%]">
            <iframe src={MAP_EMBED} title="RWVCA location" width="100%" height="350" style={{ border: 0, minHeight: 350 }} allowFullScreen loading="lazy" />
          </div>
          <div className="flex-1 min-w-[300px] basis-[45%] p-5">
            <ContactForm withPhone />
          </div>
        </div>
      </div>

      {qrOpen ? (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex items-center justify-center p-4" onClick={() => setQrOpen(false)}>
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2"><i className="fas fa-qrcode mr-2" />Digital Business Card</h3>
            <p className="text-sm text-gray-500 mb-4">Scan to view our contact page</p>
            {qrUrl ? <img src={qrUrl} alt="QR code" className="mx-auto w-[200px] h-[200px]" /> : null}
            <button type="button" className="public-btn-brown mt-4 w-full" onClick={() => setQrOpen(false)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
