import React from 'react';
import { ArrowLeft, Building2, FileBarChart, FilePenLine, FilePlus, FileSearch, ScrollText, School, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PageHeading = ({
  title,
  subtitle,
  showBack = false,
  backTo,
  backText = "Back",
  actions = [],
  icon = null,
  className = "",
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  const allActions = [
    ...(showBack
      ? [{ label: backText, onClick: handleBack, variant: 'ghost', icon: <ArrowLeft className="h-4 w-4" /> }]
      : []),
    ...actions,
  ];

  const hasActions = allActions.length > 0;

  return (
    <div className={`relative mb-6 flex overflow-hidden rounded-2xl shadow-lg ${className}`}>
      {/* Left section — green with title (65%) */}
      <div className={`relative bg-gradient-to-r from-[#1e3a1e] via-[#2f5d31] to-[#2f5d31] px-6 py-6 text-white sm:px-8 sm:py-7 ${!hasActions ? 'w-full rounded-2xl' : 'w-[65%]'}`}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-6 left-10 h-28 w-28 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute left-1/3 top-0 h-24 w-56 -translate-x-1/2 rounded-full bg-white/[0.03] blur-2xl" />

        <div className="relative flex items-center gap-4 min-w-0">
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <span className="text-xl">{icon}</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl lg:text-3xl">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-white/70 max-w-2xl">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Right section — brown bg (35%), with oblique divider */}
      {hasActions && (
        <div className="relative flex items-center justify-center bg-[#6b4423] w-[35%]">
          <div className="absolute -left-8 top-0 bottom-0 w-10 bg-[#6b4423]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
          <div className="flex flex-wrap items-center justify-center gap-2 px-6 py-4 relative z-10">
            {allActions.map((action, index) => {
              const base = 'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition whitespace-nowrap';
              let style;
              switch (action.variant) {
                case 'primary':
                  style = `${base} bg-white text-[#2f5d31] shadow-sm hover:bg-gray-100`;
                  break;
                case 'danger':
                  style = `${base} bg-red-500 text-white shadow-sm hover:bg-red-600`;
                  break;
                case 'ghost':
                  style = `${base} border border-white/30 text-white hover:bg-white/10`;
                  break;
                case 'secondary':
                default:
                  style = `${base} border border-white/30 text-white hover:bg-white/10`;
                  break;
              }
              return (
                <button
                  key={index}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={style}
                  title={action.title}
                >
                  {action.icon && <span>{action.icon}</span>}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ServiceManagementHeading = ({ showBack = true, ...props }) => (
  <PageHeading title="Campus Management" subtitle="Manage university campuses and their configurations" icon={<Building2 className="h-6 w-6" />} showBack={showBack} backTo="/management/campuses" backText="Back to Campuses" {...props} />
);

export const CreateServiceHeading = ({ showBack = true, ...props }) => (
  <PageHeading title="Create New Service" subtitle="Define a new service with custom fields for data collection" icon={<FilePlus className="h-6 w-6" />} showBack={showBack} backTo="/management/services" backText="Back to Services" actions={[{ variant: 'primary', label: 'Save Service', onClick: props.onSave }]} {...props} />
);

export const EditServiceHeading = ({ showBack = true, serviceName, ...props }) => (
  <PageHeading title={`Edit Service${serviceName ? `: ${serviceName}` : ''}`} subtitle="Modify service details and field configuration" icon={<FilePenLine className="h-6 w-6" />} showBack={showBack} backTo="/management/services" backText="Back to Services" actions={[{ variant: 'primary', label: 'Update Service', onClick: props.onUpdate }]} {...props} />
);

export const CampusManagementHeading = ({ campusName, ...props }) => (
  <PageHeading title={campusName ? `${campusName} Campus` : 'Campus Management'} subtitle="Manage campus settings, services, and configurations" icon={<School className="h-6 w-6" />} showBack backTo="/management/campuses" backText="Back to Campuses" {...props} />
);

export const ReportsManagementHeading = ({ showBack = true, ...props }) => (
  <PageHeading title="Reports Management" subtitle="View, create, and manage all reports across campuses" icon={<FileBarChart className="h-6 w-6" />} showBack={showBack} backTo="/dashboard" backText="Back to Dashboard" {...props} />
);

export const CreateReportHeading = ({ showBack = true, ...props }) => (
  <PageHeading title="Create New Report" subtitle="Generate a new report with data or file upload" icon={<FilePlus className="h-6 w-6" />} showBack={showBack} backTo="/reports" backText="Back to Reports" {...props} />
);

export const EditReportHeading = ({ reportTitle, showBack = true, ...props }) => (
  <PageHeading title={`Edit Report${reportTitle ? `: ${reportTitle}` : ''}`} subtitle="Modify report details and content" icon={<FilePenLine className="h-6 w-6" />} showBack={showBack} backTo="/reports" backText="Back to Reports" {...props} />
);

export const ViewReportHeading = ({ reportTitle, showBack = true, ...props }) => (
  <PageHeading title={`Report Details${reportTitle ? `: ${reportTitle}` : ''}`} subtitle="View report information" icon={<FileSearch className="h-6 w-6" />} showBack={showBack} backTo="/reports" backText="Back to Reports" {...props} />
);

export const LogsManagementHeading = ({ showBack = true, ...props }) => (
  <PageHeading title="System Logs" subtitle="View and monitor system activity and logs" icon={<ScrollText className="h-6 w-6" />} showBack={showBack} backTo="/dashboard" backText="Back to Dashboard" {...props} />
);

export const UsersManagementHeading = ({ showBack = true, ...props }) => (
  <PageHeading title="Users Management" subtitle="Manage user accounts, roles, and permissions" icon={<Users className="h-6 w-6" />} showBack={showBack} backTo="/dashboard" backText="Back to Dashboard" {...props} />
);

export default PageHeading;
