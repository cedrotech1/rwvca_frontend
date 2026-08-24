import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { publicApi } from '../../services/api';

const ABOUT_PATHS = ['/about', '/gallery', '/programs'];
const MEMBER_PATHS = ['/membership', '/members'];

const NAV = [
  { to: '/', label: 'Home' },
  {
    label: 'About',
    children: [
      { to: '/about', label: 'Who we are' },
      { to: '/gallery', label: 'Gallery' },
      { to: '/programs', label: 'Programs' },
    ],
  },
  {
    label: 'Members',
    children: [
      { to: '/membership', label: 'Membership' },
      { to: '/members', label: 'Members Products' },
    ],
  },
  { to: '/events', label: 'Events' },
  { to: '/contact', label: 'Contact Us' },
];

function isGroupActive(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function PublicLayout() {
  const location = useLocation();
  const [company, setCompany] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState('');
  const [email, setEmail] = useState('');
  const [subscribeMsg, setSubscribeMsg] = useState('');

  useEffect(() => {
    publicApi.company().then((res) => setCompany(res.data)).catch(() => {});
    publicApi.platforms().then((res) => setPlatforms((res.data || []).slice(0, 5))).catch(() => {});
  }, []);

  useEffect(() => {
    setOpen(false);
    setOpenGroup('');
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const info = {
    email: company?.email || 'info@rwvca.org.rw',
    phone: company?.phone || '+250 791 226 612',
    address: company?.address || 'NR5, Kicukiro, Gahanga KK 15 Rd',
    website: company?.website || 'rwvca.org.rw',
    twitter: company?.twitter || 'https://twitter.com/woodrwanda',
    linkedin: company?.linkedin || 'https://www.linkedin.com',
    facebook: company?.facebook,
    instagram: company?.instagram,
    youtube: company?.youtube,
  };
  const phoneHref = String(info.phone).replace(/[^\d+]/g, '');
  const mapLink = `https://www.google.com/maps?q=${encodeURIComponent(info.address)}`;
  const year = new Date().getFullYear();
  const websiteHref = info.website.startsWith('http') ? info.website : `https://${info.website}`;

  const submitSubscribe = async (event) => {
    event.preventDefault();
    try {
      const res = await publicApi.subscribe({ email, source: 'footer' });
      setSubscribeMsg(res.message || 'Thank you! You have been subscribed successfully.');
      setEmail('');
    } catch (error) {
      setSubscribeMsg(error.response?.data?.message || 'Could not subscribe');
    }
  };

  const socials = [
    ['facebook', 'fab fa-facebook-f', info.facebook],
    ['twitter', 'fab fa-twitter', info.twitter],
    ['instagram', 'fab fa-instagram', info.instagram],
    ['youtube', 'fab fa-youtube', info.youtube],
    ['linkedin', 'fab fa-linkedin-in', info.linkedin],
  ].filter(([, , href]) => href);

  return (
    <div className="public-site">
      <nav className="public-nav">
        <div className="public-topbar">
          <a className="public-contact-item" href={`mailto:${info.email}`}>
            <i className="fa-solid fa-envelope" />
            <span>{info.email}</span>
          </a>
          <a className="public-contact-item" href={`tel:${phoneHref}`}>
            <i className="fa-solid fa-phone" />
            <span>{info.phone}</span>
          </a>
          <a className="public-contact-item" href={mapLink} target="_blank" rel="noreferrer">
            <i className="fa-solid fa-location-dot" />
            <span>{info.address}</span>
          </a>
          {info.twitter ? (
            <a className="public-contact-item" href={info.twitter} target="_blank" rel="noreferrer">
              <i className="fa-brands fa-twitter" />
              <span>@woodrwanda</span>
            </a>
          ) : null}
          {info.linkedin ? (
            <a className="public-contact-item" href={info.linkedin} target="_blank" rel="noreferrer">
              <i className="fa-brands fa-linkedin-in" />
              <span>rwanda wood value chain association</span>
            </a>
          ) : null}
        </div>

        <div className="public-nav-container">
          <Link to="/" className="public-nav-logo">
            <img src="/RWVCA_LOGO.png" alt="RWVCA Logo" />
          </Link>
          <button
            type="button"
            className={`public-hamburger ${open ? 'active' : ''}`}
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
          <div className={`public-menu-overlay ${open ? 'active' : ''}`} onClick={() => setOpen(false)} />
          <ul className={`public-menu ${open ? 'active' : ''}`}>
            {NAV.map((item) =>
              item.children ? (
                <li
                  key={item.label}
                  className={openGroup === item.label ? 'open' : ''}
                >
                  <a
                    className={isGroupActive(location.pathname, item.label === 'About' ? ABOUT_PATHS : MEMBER_PATHS) ? 'active' : ''}
                    onClick={() => setOpenGroup((current) => (current === item.label ? '' : item.label))}
                  >
                    {item.label}
                  </a>
                  <ul className="public-submenu">
                    {item.children.map((child) => (
                      <li key={child.to}>
                        <NavLink to={child.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
                    {item.label}
                  </NavLink>
                </li>
              )
            )}
            <li>
              <Link to="/membership" className="public-join-btn">
                Join Us
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="public-page-content">
        <Outlet />
      </div>

      <footer className="public-footer">
        <div className="public-footer-grid">
          <div className="public-footer-col">
            <img src="/footer-logo.png" alt="RWVCA Logo" className="h-[52px] mb-3" />
            <ul className="text-sm space-y-2 list-none p-0 m-0">
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/programs">Programs</Link></li>
              <li><Link to="/membership">Membership</Link></li>
              <li><Link to="/events">Blog</Link></li>
            </ul>
            <p className="italic mt-3 text-sm">"Tree is life"</p>
          </div>
          <div className="public-footer-col">
            <h3 className="font-semibold mb-3">Need help?</h3>
            <p className="text-sm mb-2"><i className="fas fa-map-marker-alt me-2 mr-2" />{info.address}</p>
            <p className="text-sm mb-2"><i className="fas fa-phone mr-2" /><a href={`tel:${phoneHref}`}>{info.phone}</a></p>
            <p className="text-sm mb-2"><i className="fas fa-envelope mr-2" /><a href={`mailto:${info.email}`}>{info.email}</a></p>
            <p className="text-sm mb-2"><i className="fas fa-globe mr-2" /><a href={websiteHref} target="_blank" rel="noreferrer">{info.website}</a></p>
          </div>
          <div className="public-footer-col">
            <h3 className="font-semibold mb-3">Platforms</h3>
            {platforms.length ? (
              <ul className="text-sm space-y-2 list-none p-0 m-0">
                {platforms.map((platform) => (
                  <li key={platform.id}>
                    <Link to={`/platforms/${platform.id}`}>{platform.name || platform.title}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/70">No platforms available yet.</p>
            )}
          </div>
          <div className="public-footer-col">
            <h3 className="font-semibold mb-3">Newsletter</h3>
            <p className="text-sm mb-3">Get the latest news and updates.</p>
            <form onSubmit={submitSubscribe} className="public-newsletter-form">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                placeholder="your.email@example.com"
                className="public-newsletter-input"
                autoComplete="email"
              />
              <button type="submit" className="public-btn-brown text-sm">
                <i className="fas fa-paper-plane mr-2" />
                Subscribe
              </button>
            </form>
            {subscribeMsg ? <p className="text-xs mt-2 text-green-200">{subscribeMsg}</p> : null}
            <p className="public-newsletter-note">We respect your privacy. Unsubscribe anytime.</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-10 pt-4 border-t border-white/20 text-center">
          <div className="flex justify-center gap-5 mb-3 text-xl">
            {socials.map(([key, icon, href]) => (
              <a key={key} href={href} target="_blank" rel="noreferrer" aria-label={key}>
                <i className={icon} />
              </a>
            ))}
            {info.website ? (
              <a href={websiteHref} target="_blank" rel="noreferrer" aria-label="Website">
                <i className="fas fa-globe" />
              </a>
            ) : null}
          </div>
          <p className="text-xs text-white/80">© {year} Rwanda Wood Value Chain Association - RWVCA. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
