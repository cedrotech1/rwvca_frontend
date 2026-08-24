import { useEffect, useState } from 'react';
import PageBanner from '../../components/public/PageBanner';
import SectionTitle from '../../components/public/SectionTitle';
import { publicApi } from '../../services/api';
import { ABOUT_COPY } from '../../components/public/publicUi';

function IconBadge({ src, alt, className }) {
  return (
    <div className={`w-[76px] h-[76px] bg-white border-4 border-[#8b5a33] rounded-[18px] flex items-center justify-center shadow-md rotate-45 z-10 ${className || ''}`}>
      <img src={src} alt={alt} className="w-[34px] h-[34px] -rotate-45" />
    </div>
  );
}

export default function AboutPage() {
  const [org, setOrg] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    publicApi.organization().then((res) => setOrg(res.data || [])).catch(() => {});
  }, []);

  const byLevel = {
    top: org.filter((item) => item.level === 'top'),
    middle: org.filter((item) => item.level === 'middle'),
    bottom: org.filter((item) => item.level === 'bottom'),
  };

  return (
    <div className="bg-white">
      <PageBanner title="About Us" />

      <section className="px-5 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <SectionTitle title="WHO WE ARE" />
          <p className="max-w-[700px] mx-auto mb-10 text-black leading-relaxed">{ABOUT_COPY.intro}</p>
          <div className="flex flex-wrap gap-8 items-stretch justify-center text-left">
            <div className="flex-1 min-w-[280px] basis-[45%] flex">
              <article className="group relative bg-white rounded-[18px] shadow-[0_13px_20px_rgba(16,24,40,0.12)] -translate-y-1.5 p-[72px_56px_48px] w-full flex flex-col justify-center hover:bg-[#214d14]">
                <IconBadge src="/about-icon3.png" alt="Objectives" className="absolute -top-10 left-14" />
                <h3 className="text-[22px] font-bold text-[#6b4423] m-0 group-hover:text-white">{ABOUT_COPY.objectiveTitle}</h3>
                <p className="mt-3 text-sm text-[#4a4a4a] leading-[1.7] group-hover:text-white">{ABOUT_COPY.objective}</p>
              </article>
            </div>
            <div className="flex-1 min-w-[280px] basis-[45%] flex flex-col gap-6">
              <article className="group relative bg-white rounded-[18px] shadow-[0_13px_20px_rgba(16,24,40,0.12)] p-[36px_96px_36px_48px] flex items-center gap-8 hover:bg-[#214d14]">
                <div>
                  <h3 className="text-[22px] font-bold text-[#6b4423] m-0 group-hover:text-white">{ABOUT_COPY.missionTitle}</h3>
                  <p className="mt-3 text-sm text-[#4a4a4a] leading-[1.7] group-hover:text-white">{ABOUT_COPY.mission}</p>
                </div>
                <IconBadge src="/about-icon1.png" alt="Mission" className="absolute -right-10 top-1/2 -translate-y-1/2" />
              </article>
              <article className="group relative bg-white rounded-[18px] shadow-[0_13px_20px_rgba(16,24,40,0.12)] p-[36px_96px_36px_48px] flex items-center gap-8 hover:bg-[#214d14]">
                <div>
                  <h3 className="text-[22px] font-bold text-[#6b4423] m-0 group-hover:text-white">{ABOUT_COPY.visionTitle}</h3>
                  <p className="mt-3 text-sm text-[#4a4a4a] leading-[1.7] group-hover:text-white">{ABOUT_COPY.vision}</p>
                </div>
                <IconBadge src="/about-icon2.png" alt="Vision" className="absolute -right-10 top-1/2 -translate-y-1/2" />
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#6b4423] text-white py-16 px-5 text-center">
        <h2 className="text-[2rem] font-semibold mb-4">Our Organization Structure</h2>
        <p className="max-w-[800px] mx-auto mb-10 text-sm leading-relaxed">
          RWVCA operates through the General Assembly, Executive Committee, Permanent Secretariat, and specialized support organs, ensuring effective governance and accountability.
        </p>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-[900px] py-8">
            {['top', 'middle', 'bottom'].map((level) => (
              <div key={level} className={`flex justify-center flex-wrap gap-6 ${level !== 'bottom' ? 'mb-20' : ''}`}>
                {(byLevel[level] || []).map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setSelected(unit)}
                    className="bg-white text-[#2c3e50] min-w-[180px] px-8 py-5 font-semibold border-2 border-[#333] rounded shadow hover:-translate-y-1"
                  >
                    {unit.unit_name || unit.title}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        {!org.length ? <p className="text-white/80">Organization units will appear here.</p> : null}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-8 max-w-[600px] w-full max-h-[80vh] overflow-y-auto relative" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="absolute top-3 right-4 text-3xl text-gray-400" onClick={() => setSelected(null)}>&times;</button>
            <h3 className="text-[#6b4423] text-2xl mb-4 pb-3 border-b-2 border-black text-justify">{selected.title}</h3>
            <div className="text-[#333] leading-relaxed text-justify whitespace-pre-wrap">{selected.content}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
