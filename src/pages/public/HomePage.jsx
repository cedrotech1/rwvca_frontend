import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../services/api';
import { fileUrl } from '../../services/api/config';
import SectionTitle from '../../components/public/SectionTitle';
import ContactForm from '../../components/public/ContactForm';
import { breakName, MAP_EMBED } from '../../components/public/publicUi';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [ads, setAds] = useState([]);
  const [partners, setPartners] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [adIndex, setAdIndex] = useState(0);
  const [partnerIndex, setPartnerIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [adPaused, setAdPaused] = useState(false);

  useEffect(() => {
    publicApi.events().then((res) => setEvents(res.data || [])).catch(() => {});
    publicApi.ads().then((res) => setAds((res.data || []).slice(0, 3))).catch(() => {});
    publicApi.partners().then((res) => setPartners(res.data || [])).catch(() => {});
    publicApi.platforms().then((res) => setPlatforms(res.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (events.length < 2 || heroPaused) return undefined;
    const timer = setInterval(() => setHeroIndex((i) => (i + 1) % events.length), 60000);
    return () => clearInterval(timer);
  }, [events.length, heroPaused]);

  useEffect(() => {
    if (ads.length < 2 || adPaused) return undefined;
    const timer = setInterval(() => setAdIndex((i) => (i + 1) % ads.length), 5000);
    return () => clearInterval(timer);
  }, [ads.length, adPaused]);

  const visiblePartners = partners.length > 3 ? 3 : Math.max(partners.length, 1);
  useEffect(() => {
    if (partners.length < 2) return undefined;
    const timer = setInterval(() => setPartnerIndex((i) => (i + 1) % partners.length), 3000);
    return () => clearInterval(timer);
  }, [partners.length]);

  const currentEvent = events[heroIndex];
  const currentAd = ads[adIndex];
  const half = Math.ceil(platforms.length / 2);
  const leftPlatforms = platforms.slice(0, half);
  const rightPlatforms = platforms.slice(half);
  const heroTitle = currentEvent?.title
    ? currentEvent.title.length > 50
      ? `${currentEvent.title.slice(0, 47)}...`
      : currentEvent.title
    : 'Rwanda Wood Value Chain Association';

  return (
    <div className="bg-white">
      <section
        className="relative h-[60vh] min-h-[400px] overflow-hidden"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        {(events.length ? events : [{ id: 'fallback' }]).map((event, index) => (
          <div
            key={event.id}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
            style={{
              backgroundImage: `url(${event.image ? fileUrl(event.image) : '/slide1.jpg'})`,
              opacity: index === heroIndex || (!events.length && index === 0) ? 1 : 0,
              zIndex: index === heroIndex ? 1 : 0,
            }}
          >
            <div className="public-hero-gradient h-full flex items-center pl-[5%]">
              <div className="text-white max-w-[600px] py-5 flex flex-col gap-5">
                <h1 className="text-[2rem] font-bold leading-tight m-0">{index === heroIndex ? heroTitle : event.title}</h1>
                <div className="flex items-center">
                  <Link
                    to={currentEvent ? `/events/${currentEvent.id}` : '/events'}
                    className="inline-block text-white uppercase tracking-wide font-semibold px-6 py-3 rounded-l hover:bg-[#6b4423]"
                  >
                    Explore More
                  </Link>
                  {events.length > 1 ? (
                    <div className="flex items-center gap-1.5 ml-10">
                      {events.map((_, dot) => (
                        <button
                          key={dot}
                          type="button"
                          aria-label={`Go to slide ${dot + 1}`}
                          onClick={() => setHeroIndex(dot)}
                          className={`w-2.5 h-2.5 rounded-full border ${dot === heroIndex ? 'bg-[#6b4423] scale-110 border-white' : 'bg-white/50 border-transparent'}`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="max-w-[1200px] mx-auto px-5 py-5">
        <SectionTitle title="OUR PLATFORMS" />
        <p className="max-w-[700px] mx-auto mb-8 text-center text-[#333] leading-relaxed">
          Obviously we can't run all of these programs alone so we have joined hands with different partners
          to make that possible and help people the best out of our programs
        </p>
        <div
          className="flex flex-wrap justify-between items-center relative min-h-[500px] bg-center bg-no-repeat bg-contain max-md:bg-none max-md:min-h-0"
          style={{ backgroundImage: 'url(/tree.jpg)' }}
        >
          <div className="flex flex-col justify-between p-2.5 m-2.5 flex-1">
            {leftPlatforms.map((platform) => {
              const [first, rest] = breakName(platform.name);
              return (
                <Link key={platform.id} to={`/platforms/${platform.id}`} className="no-underline">
                  <div className="group flex items-center gap-2.5 bg-[rgba(247,247,247,0.85)] p-2 rounded-md m-2.5 hover:bg-[#6b4423] hover:-translate-y-0.5">
                    <img src={fileUrl(platform.image) || '/tree2.png'} alt="" className="w-[100px] h-[100px] rounded-md object-cover" />
                    <span className="text-[0.95rem] font-bold text-[#333] leading-tight group-hover:text-white">
                      {first}{rest ? <><br />{rest}</> : null}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-col justify-between p-2.5 m-2.5 flex-1">
            {rightPlatforms.map((platform) => {
              const [first, rest] = breakName(platform.name);
              return (
                <Link key={platform.id} to={`/platforms/${platform.id}`} className="no-underline">
                  <div className="group flex items-center justify-end gap-2.5 bg-[rgba(247,247,247,0.85)] p-2 rounded-md m-2.5 text-right hover:bg-[#6b4423] hover:-translate-y-0.5">
                    <span className="text-[0.95rem] font-bold text-[#333] leading-tight order-[-1] max-md:order-0 group-hover:text-white">
                      {first}{rest ? <><br />{rest}</> : null}
                    </span>
                    <img src={fileUrl(platform.image) || '/tree2.png'} alt="" className="w-[100px] h-[100px] rounded-md object-cover" />
                  </div>
                </Link>
              );
            })}
          </div>
          {!platforms.length ? <p className="w-full text-center text-gray-500">Platforms will appear here.</p> : null}
        </div>
      </section>

      <section
        className="relative h-[300px] overflow-hidden"
        onMouseEnter={() => setAdPaused(true)}
        onMouseLeave={() => setAdPaused(false)}
      >
        {(ads.length ? ads : [{ id: 'fallback', title: 'Welcome to RWCA', description: 'No active advertisements at the moment. Check back soon!', url: '' }]).map((ad, index) => (
          <div
            key={ad.id}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
            style={{
              backgroundImage: `url(${ad.url ? fileUrl(ad.url) : '/slide1.jpg'})`,
              opacity: index === adIndex ? 1 : 0,
              zIndex: index === adIndex ? 2 : 1,
            }}
          >
            <div className="public-ad-gradient w-1/2 max-md:w-full h-full flex items-center px-5 text-white">
              <div className="max-w-[90%]">
                <h2 className="text-[26px] font-bold mb-2.5">{currentAd?.title || ad.title}</h2>
                <p className="text-sm">{currentAd?.description || ad.description || 'RWCA Advertisement'}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white text-center py-6 px-5">
        <SectionTitle title="OUR PARTNERS" />
        <p className="max-w-[700px] mx-auto mb-10 text-[#333] leading-relaxed">
          Obviously we can't run all of these programs alone so we have joined hands with different partners
          to make that possible and help people the best out of our programs.
        </p>
        {partners.length ? (
          <>
            <div className="max-w-[980px] mx-auto overflow-hidden">
              <div className="flex items-center transition-transform duration-500" style={{ transform: `translateX(-${partnerIndex * (100 / visiblePartners)}%)` }}>
                {[...partners, ...partners.slice(0, visiblePartners)].map((partner, index) => (
                  <div key={`${partner.id}-${index}`} className="shrink-0 flex justify-center px-1" style={{ flexBasis: `${100 / visiblePartners}%` }}>
                    <img src={fileUrl(partner.logo_url)} alt="Partner" className="w-[85%] max-w-[120px] object-contain bg-white rounded" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {partners.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPartnerIndex(index)}
                  className={`w-3 h-3 rounded-full ${index === partnerIndex % partners.length ? 'bg-[#2f5d31] scale-110' : 'bg-[#ddd]'}`}
                  aria-label={`Partner ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-500">Partners will appear here.</p>
        )}
      </section>

      <div className="public-oblique-line" />

      <section className="max-w-[1100px] mx-auto px-4 py-10">
        <SectionTitle title="CONTACT US" />
        <p className="text-center text-[#555] mb-8 max-w-[700px] mx-auto">
          Please fill out the form below to get in touch with us. We will get back to you as soon as possible.
        </p>
        <div className="flex flex-wrap gap-8">
          <div className="flex-1 min-w-[280px]">
            <iframe src={MAP_EMBED} title="RWVCA location" width="100%" height="350" style={{ border: 0, minHeight: 350 }} allowFullScreen loading="lazy" />
          </div>
          <div className="flex-1 min-w-[280px]">
            <ContactForm withSubject />
          </div>
        </div>
      </section>
    </div>
  );
}
