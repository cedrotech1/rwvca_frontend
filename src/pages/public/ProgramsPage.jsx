import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageBanner from '../../components/public/PageBanner';
import { publicApi } from '../../services/api';
import { fileUrl } from '../../services/api/config';

function AdCarousel({ ads }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (ads.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % ads.length), 3000);
    return () => clearInterval(timer);
  }, [ads.length]);
  const current = ads[index];
  if (!current) return <p className="text-sm text-gray-500">No ads at the moment.</p>;
  return (
    <div className="relative overflow-hidden rounded-md">
      <img src={fileUrl(current.url)} alt={current.title} className="w-full block rounded-md" />
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[90%] text-center z-10">
        <div className="text-white text-[10px] font-bold mb-1">{current.title}</div>
        <div className="flex justify-center">
          {ads.map((_, dot) => (
            <button
              key={dot}
              type="button"
              onClick={() => setIndex(dot)}
              className={`h-2.5 w-2.5 mx-1 rounded-full ${dot === index ? 'bg-[#6b4423]' : 'bg-white'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProgramsPage() {
  const { id } = useParams();
  const [programs, setPrograms] = useState([]);
  const [ads, setAds] = useState([]);

  useEffect(() => {
    publicApi.programs().then((res) => setPrograms(res.data || [])).catch(() => {});
    publicApi.ads().then((res) => setAds((res.data || []).slice(0, 3))).catch(() => {});
  }, []);

  const selectedId = Number(id) || 0;
  const selected =
    programs.find((item) => Number(item.id) === selectedId)
    || programs.find((item) => item.category === 'main')
    || programs[0]
    || null;
  const mainPrograms = programs.filter((item) => item.category === 'main');

  return (
    <div className="bg-white">
      <PageBanner title="Programs" />
      <div className="py-10">
        <div className="max-w-[1200px] mx-auto px-5 flex flex-wrap gap-10">
          <aside className="flex-1 min-w-[280px] max-w-[300px] flex flex-col gap-8 bg-[#f8f8f8] rounded-[10px] p-5">
            <div className="bg-white rounded-[10px] p-3 shadow-sm">
              <AdCarousel ads={ads} />
            </div>
            <div className="bg-white rounded-[10px] p-3 shadow-sm">
              <h5 className="font-semibold mb-2">Main Programs</h5>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {mainPrograms.length ? mainPrograms.map((program) => (
                  <li key={program.id}>
                    <Link to={`/programs/${program.id}`} className="text-[#6b4423] hover:underline">
                      {program.title}
                    </Link>
                  </li>
                )) : <li>No main programs</li>}
              </ul>
            </div>
          </aside>
          <main className="flex-[2] min-w-[300px]">
            {selected ? (
              <>
                <h1 className="text-3xl font-semibold mb-4">{selected.title}</h1>
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-6">{selected.description}</p>
                {selected.images?.[0] ? (
                  <img src={fileUrl(selected.images[0].url)} alt="" className="w-full rounded-lg mb-6" />
                ) : null}
                {selected.application_link ? (
                  <a href={selected.application_link} className="public-btn-apply" target="_blank" rel="noreferrer">
                    Apply Now
                  </a>
                ) : null}
              </>
            ) : (
              <>
                <h1 className="text-3xl font-semibold mb-4">RWVCA RPL Program</h1>
                <p>No active programs available at the moment. Please check back later.</p>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
