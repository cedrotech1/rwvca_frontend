import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageBanner from '../../components/public/PageBanner';
import { publicApi } from '../../services/api';
import { fileUrl } from '../../services/api/config';

function groupDetails(details = []) {
  const grouped = {};
  details.forEach((detail) => {
    const title = detail.title || 'Details';
    const subtitle = detail.subtitle || 'General';
    if (!grouped[title]) grouped[title] = {};
    if (!grouped[title][subtitle]) grouped[title][subtitle] = [];
    if (detail.value) grouped[title][subtitle].push(detail.value);
  });
  return grouped;
}

function AccordionSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`mb-4 bg-white rounded-lg shadow-sm overflow-hidden ${open ? 'expanded' : ''}`}>
      <button type="button" className="w-full flex items-center px-5 py-3 bg-[#f8f9fa] border border-[#e9ecef] rounded text-left" onClick={() => setOpen((value) => !value)}>
        <span className={`inline-flex items-center justify-center w-6 h-6 mr-3 rounded ${open ? 'bg-[#6b4226] text-white' : 'bg-[#e9ecef] text-[#6b4226] -rotate-90'}`}>-</span>
        <h3 className="m-0 text-[1.1rem] font-semibold text-[#2c3e50]">{title}</h3>
      </button>
      {open ? <div className="px-5 py-3 border-l-2 border-[#6b4226]">{children}</div> : null}
    </div>
  );
}

export default function PlatformDetailPage() {
  const { id } = useParams();
  const [platforms, setPlatforms] = useState([]);
  const [item, setItem] = useState(null);

  useEffect(() => {
    publicApi.platforms().then((res) => setPlatforms(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    publicApi.platform(id).then((res) => setItem(res.data)).catch(() => setItem(null));
  }, [id]);

  const grouped = useMemo(() => groupDetails(item?.details || []), [item]);

  return (
    <div className="bg-white">
      <PageBanner title="Our Platform" />
      <div className="max-w-[1400px] mx-auto px-5 py-8 flex flex-col lg:flex-row gap-8 items-start">
        <aside className="w-full lg:w-[320px] bg-white rounded-lg shadow sticky top-[160px] overflow-hidden">
          <div className="bg-[#6b4226] text-white p-4 text-center font-semibold text-lg">Key Platforms</div>
          <div className="p-4 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
            {platforms.map((platform) => (
              <Link
                key={platform.id}
                to={`/platforms/${platform.id}`}
                className={`block px-4 py-3 rounded-md text-sm font-medium ${String(platform.id) === String(id) ? 'bg-[#28a745] text-black font-semibold' : 'bg-[#f8f9fa] text-[#333] hover:bg-[#8f5424] hover:text-white'}`}
              >
                {platform.name}
              </Link>
            ))}
            {!platforms.length ? <div className="px-4 py-3 bg-[#f8f9fa] rounded">No platforms found</div> : null}
          </div>
        </aside>
        <div className="flex-1 bg-white rounded-lg p-8 shadow-sm">
          {item ? (
            <>
              <h1 className="text-[#6b4226] font-bold text-[32px] mb-5">{item.name}</h1>
              {item.description ? <div className="text-base leading-relaxed text-[#444] mb-8 pb-5 border-b border-[#eee] whitespace-pre-wrap">{item.description}</div> : null}
              {Object.entries(grouped).map(([title, subsections]) => (
                <AccordionSection key={title} title={title}>
                  {Object.entries(subsections).map(([subtitle, values]) => (
                    <div key={subtitle} className="mb-3">
                      {subtitle !== 'General' ? <h4 className="text-[#3d5166] font-medium mb-2">{subtitle}</h4> : null}
                      <ul className="list-disc pl-5 text-[#4a5568]">
                        {values.map((value) => (
                          <li key={value} className="mb-1 whitespace-pre-wrap">{value}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </AccordionSection>
              ))}
              {item.image ? (
                <div className="mt-8 p-5 bg-[#f8f9fa] rounded-lg text-center">
                  <img src={fileUrl(item.image)} alt={item.name} className="max-w-full max-h-[600px] rounded-md mx-auto" />
                </div>
              ) : null}
            </>
          ) : (
            <div className="bg-blue-50 text-blue-800 p-4 rounded">Please select a platform from the menu.</div>
          )}
        </div>
      </div>
    </div>
  );
}
