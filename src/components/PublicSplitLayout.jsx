import { Globe, TriangleAlert, BookOpen, LineChart, GraduationCap, Shield } from 'lucide-react';
import { publicAssetUrl, resolveHostelPublicUrl, routerBasename } from '../utils/appPaths';

/**
 * Same colored top tabs as hostelms public pages.
 * active: website | notices | manual | swars | student | staff
 */
export function PublicAuthTopNav({ active = 'swars' }) {
  const swarsLogin = `${routerBasename()}/login`;

  const items = [
    {
      id: 'website',
      href: 'https://ur.ac.rw/',
      icon: Globe,
      label: 'UR Website',
      short: 'Website',
      className: 'bg-gradient-to-b from-[#2a5298] to-[#1e3c72] border-[#1a3366]',
      external: true,
    },
    {
      id: 'notices',
      href: resolveHostelPublicUrl('notices.php'),
      icon: TriangleAlert,
      label: 'Urgent Notice',
      short: 'Notice',
      className: 'bg-gradient-to-b from-[#e04555] to-[#c82333] border-[#a71d2a]',
    },
    {
      id: 'manual',
      href: resolveHostelPublicUrl('student_manual.php'),
      icon: BookOpen,
      label: 'User Manual',
      short: 'Manual',
      className: 'bg-gradient-to-b from-[#ff922b] to-[#e8590c] border-[#d9480f]',
    },
    {
      id: 'swars',
      href: swarsLogin,
      icon: LineChart,
      label: 'Reporting System',
      short: 'SWARS',
      className: 'bg-gradient-to-b from-[#7048e8] to-[#5f3dc4] border-[#4c2f9e]',
    },
    {
      id: 'student',
      href: resolveHostelPublicUrl('index.php'),
      icon: GraduationCap,
      label: 'Student Login',
      short: 'Student',
      className: 'bg-gradient-to-b from-[#339af0] to-[#1c7ed6] border-[#1864ab]',
    },
    {
      id: 'staff',
      href: resolveHostelPublicUrl('login.php'),
      icon: Shield,
      label: 'Staff Login',
      short: 'Staff',
      className: 'bg-gradient-to-b from-[#495057] to-[#343a40] border-[#212529]',
    },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-[1100] bg-white/95 backdrop-blur border-b border-[#e8ecf1] shadow-sm">
      <div className="max-w-[1100px] mx-auto px-2 sm:px-3 py-1.5">
        <nav
          className="grid grid-cols-3 gap-1 sm:flex sm:flex-nowrap sm:items-center sm:justify-center sm:gap-1.5"
          aria-label="Public navigation"
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex items-center justify-center gap-1 rounded-[5px] border px-1.5 py-1 sm:px-2 sm:py-1.5 text-[0.58rem] sm:text-[0.68rem] font-semibold text-white no-underline whitespace-nowrap transition hover:brightness-105 ${item.className} ${
                  isActive ? 'ring-2 ring-white/90 brightness-90 pointer-events-none' : ''
                }`}
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.short}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function PublicSplitLayout({
  activeNav = 'swars',
  title = 'SWARS Sign in',
  visualTitle = 'Welcome back!',
  visualText = 'Sign in to the Student Welfare Activity Reporting System.',
  ctaHref,
  ctaLabel,
  children,
}) {
  const buildingUrl = publicAssetUrl('ur_building.jpeg');
  const defaultCtaHref = ctaHref ?? resolveHostelPublicUrl('login.php');
  const defaultCtaLabel = ctaLabel ?? 'Hostel staff? Sign in here';

  return (
    <div className="min-h-screen bg-[#eef1f6] pt-[72px] sm:pt-[42px] overflow-x-hidden font-[Segoe_UI,Tahoma,Geneva,Verdana,sans-serif]">
      <PublicAuthTopNav active={activeNav} />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-72px)] sm:min-h-[calc(100vh-42px)]">
        {/* Form panel */}
        <section className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-5 py-8 sm:px-8 lg:px-10 order-2 lg:order-1">
          <div className="w-full max-w-[380px] mx-auto">{children}</div>
        </section>

        {/* Building visual */}
        <aside
          className="relative w-full lg:w-1/2 min-h-[180px] sm:min-h-[220px] lg:min-h-[calc(100vh-42px)] flex items-center justify-center px-4 py-8 sm:px-8 order-1 lg:order-2 bg-[#1e3c72] bg-cover bg-center"
          style={{ backgroundImage: `url(${buildingUrl})` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(160deg, rgba(30,60,114,0.35) 0%, rgba(42,82,152,0.5) 50%, rgba(22,45,90,0.65) 100%)',
            }}
            aria-hidden="true"
          />
          <div className="relative z-[1] text-center text-white max-w-[420px]">
            <h2 className="text-2xl sm:text-3xl lg:text-[2.25rem] font-bold mb-3 sm:mb-5 drop-shadow">
              {visualTitle}
            </h2>
            <p className="hidden sm:block text-sm sm:text-base leading-relaxed opacity-95 mb-6">
              {visualText}
            </p>
            {defaultCtaHref && defaultCtaLabel ? (
              <a
                href={defaultCtaHref}
                className="inline-block px-5 py-2.5 rounded-full border-2 border-white/85 text-white font-semibold text-sm bg-white/10 hover:bg-white/20 no-underline transition"
              >
                {defaultCtaLabel}
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
