import { Link } from 'react-router-dom';
import SectionTitle from '../../components/public/SectionTitle';
import { fileUrl } from '../../services/api/config';
import { formatEventDate, truncate } from '../../components/public/publicUi';

export default function EventCards({ title, events }) {
  if (!events.length) return null;
  return (
    <section className="max-w-[1200px] mx-auto px-5 py-16">
      <SectionTitle title={title} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {events.map((event) => {
          const date = formatEventDate(event.date);
          return (
            <article key={event.id} className="bg-white rounded-xl shadow overflow-hidden hover:-translate-y-1">
              <Link to={`/events/${event.id}`}>
                <img src={fileUrl(event.image)} alt={event.title} className="w-full h-[220px] object-cover" />
              </Link>
              <div className="flex gap-4 p-5">
                <div className="text-[12px] uppercase text-[#999] text-center min-w-10">
                  {date.month} <span className="block text-lg font-bold text-[#1f1f1f]">{date.day}</span>
                </div>
                <div>
                  <div className="font-bold text-base mb-1">{event.title}</div>
                  <div className="text-[13px] text-[#989A98] leading-relaxed font-[Poppins,sans-serif]">{truncate(event.description, 100)}</div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
