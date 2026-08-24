import { useEffect, useState } from 'react';
import PageBanner from '../../components/public/PageBanner';
import { publicApi } from '../../services/api';
import { fileUrl } from '../../services/api/config';

export default function GalleryPage() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(null);

  useEffect(() => {
    publicApi.gallery().then((res) => setItems(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (index === null) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setIndex(null);
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % items.length);
      if (event.key === 'ArrowLeft') setIndex((current) => (current - 1 + items.length) % items.length);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [index, items.length]);

  const current = index !== null ? items[index] : null;

  return (
    <div className="bg-[#f8f9fa]">
      <PageBanner title="Value Chain Highlights" />
      <main className="py-4 px-6">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
          {items.map((item, itemIndex) => (
            <figure
              key={item.id}
              className="break-inside-avoid mb-6 rounded-[14px] overflow-hidden cursor-pointer shadow bg-white hover:-translate-y-1.5"
              onClick={() => setIndex(itemIndex)}
            >
              <img src={fileUrl(item.url)} alt={item.title} className="w-full h-auto block" loading="lazy" />
            </figure>
          ))}
        </div>
        {!items.length ? <p className="text-center text-gray-500 py-16">No gallery items yet.</p> : null}
      </main>

      {current ? (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-5" onClick={() => setIndex(null)}>
          <button type="button" className="absolute top-5 right-8 text-white text-5xl" onClick={() => setIndex(null)}>&times;</button>
          <button type="button" className="absolute left-8 text-white text-5xl" onClick={(event) => { event.stopPropagation(); setIndex((currentIndex) => (currentIndex - 1 + items.length) % items.length); }}>&#10094;</button>
          <div className="text-center max-w-[95%] max-h-[95%]" onClick={(event) => event.stopPropagation()}>
            <img src={fileUrl(current.url)} alt={current.title} className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="text-white mt-4 font-semibold">{current.title}</div>
            <div className="text-gray-300 text-sm mt-1">{index + 1} / {items.length}</div>
            {current.album_link ? (
              <a href={current.album_link} target="_blank" rel="noreferrer" className="inline-block mt-4 px-5 py-2 bg-[#8B4513] text-white rounded-full text-sm">
                View Album
              </a>
            ) : null}
          </div>
          <button type="button" className="absolute right-8 text-white text-5xl" onClick={(event) => { event.stopPropagation(); setIndex((currentIndex) => (currentIndex + 1) % items.length); }}>&#10095;</button>
        </div>
      ) : null}
    </div>
  );
}
