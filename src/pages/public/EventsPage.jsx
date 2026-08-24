import { useEffect, useState } from 'react';
import PageBanner from '../../components/public/PageBanner';
import EventCards from './EventCards';
import { publicApi } from '../../services/api';
import { startOfToday } from '../../components/public/publicUi';

export default function EventsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    publicApi.events().then((res) => setItems(res.data || [])).catch(() => {});
  }, []);

  const today = startOfToday();
  const upcoming = items
    .filter((item) => new Date(item.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);
  const recent = items
    .filter((item) => new Date(item.date) < today)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div className="bg-[#f9f9f9]">
      <PageBanner
        title="RWVCA Events"
        subtitle="Event page, where you can find all the events that are happeng and details"
        align="left"
      />
      <EventCards title="Recent Events" events={recent} />
      <EventCards title="Upcoming Events" events={upcoming} />
      {!items.length ? <p className="text-center text-gray-500 py-16">No published events yet.</p> : null}
    </div>
  );
}
