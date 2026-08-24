import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageBanner from '../../components/public/PageBanner';
import EventCards from './EventCards';
import { publicApi } from '../../services/api';
import { fileUrl } from '../../services/api/config';
import { formatEventDate, startOfToday } from '../../components/public/publicUi';

export default function EventDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [allEvents, setAllEvents] = useState([]);

  useEffect(() => {
    publicApi.event(id).then((res) => setItem(res.data)).catch(() => setItem(null));
    publicApi.events().then((res) => setAllEvents(res.data || [])).catch(() => {});
  }, [id]);

  const today = startOfToday();
  const recent = allEvents
    .filter((event) => String(event.id) !== String(id) && new Date(event.date) < today)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);
  const extraImages = item?.event_images_eid || item?.images || [];
  const date = formatEventDate(item?.date);

  return (
    <div className="bg-[#f8f9fa]">
      <PageBanner title="Event Details" align="left">
        <Link to="/events" className="inline-flex items-center gap-1 text-white mt-3 hover:text-[#a4371b]">
          <i className="fas fa-arrow-left" /> Back
        </Link>
      </PageBanner>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {!item ? (
          <p className="text-center">Loading...</p>
        ) : (
          <article className="bg-white rounded-xl p-6 md:p-10 shadow">
            <h1 className="text-[#6b4423] font-bold text-3xl mb-3">{item.title}</h1>
            <p className="text-sm text-[#555] mb-6">
              <i className="far fa-calendar-alt text-[#6b4423] mr-2" />
              {date.full}
            </p>
            {item.image ? <img src={fileUrl(item.image)} alt="" className="w-full rounded-lg mb-6" /> : null}
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-justify">{item.description}</div>
            {extraImages.length ? (
              <div className="grid sm:grid-cols-2 gap-4 mt-8">
                {extraImages.map((image) => (
                  <img key={image.id || image.url} src={fileUrl(image.url || image.image)} alt="" className="w-full rounded-lg object-cover" />
                ))}
              </div>
            ) : null}
          </article>
        )}
      </div>
      <EventCards title="Recent Events" events={recent} />
    </div>
  );
}
