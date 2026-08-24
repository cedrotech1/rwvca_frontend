import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { PageHeading } from '../../components/PageHeading';

const CARDS = [
  { to: '/dashboard/ads', title: 'Ads', text: 'Homepage slides and advertisements' },
  { to: '/dashboard/partners', title: 'Partners', text: 'Manage partners' },
  { to: '/dashboard/platforms', title: 'Platforms', text: 'Manage platform settings' },
  { to: '/dashboard/team', title: 'Team', text: 'Public team members' },
  { to: '/dashboard/membership-setup', title: 'Membership', text: 'Manage membership information' },
  { to: '/dashboard/member-products', title: 'Member Products', text: 'Manage member products' },
  { to: '/dashboard/programs', title: 'Programs', text: 'Manage programs' },
  { to: '/dashboard/gallery', title: 'Gallery', text: 'Manage gallery images' },
  { to: '/dashboard/messages', title: 'Messages', text: 'View and manage messages' },
  { to: '/dashboard/about', title: 'About Page', text: 'Organization structure and team' },
  { to: '/dashboard/events', title: 'Events', text: 'Manage events' },
  { to: '/dashboard/company', title: 'Company Info', text: 'Public contact details and logo' },
  { to: '/dashboard/users', title: 'Users', text: 'Staff accounts' },
  { to: '/dashboard/logs', title: 'System Logs', text: 'Activity logs and charts' },
  { to: '/dashboard/settings', title: 'Email & Settings', text: 'Notifications, SMTP, leave days' },
];

export default function WebsiteSettingsPage() {
  return (
    <div>
      <PageHeading title="Website Settings" subtitle="Manage public website content and settings" icon={<Globe className="h-6 w-6" />} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CARDS.map((card) => (
          <Link key={card.to} to={card.to} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-[#2f5d31]/40">
            <h3 className="font-semibold text-gray-900">{card.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
