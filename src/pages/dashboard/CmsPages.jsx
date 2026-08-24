import ResourceListPage from './ResourceListPage';

const ACTIVE_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
const PUBLISH_STATUS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];
const FLAG_STATUS = [
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
];

export const GalleryCmsPage = () => (
  <ResourceListPage
    title="Gallery Images"
    subtitle="Add, edit, and publish website gallery photos."
    path="/gallery"
    fileField="image"
    fileLabel="Image"
    imageField
    defaults={{ status: 'active' }}
    columns={[
      { key: 'url', label: 'Image', image: true },
      { key: 'title', label: 'Image Title' },
      { key: 'album_link', label: 'Album Link' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
    ]}
    createFields={[
      { name: 'title', label: 'Image Title', required: true },
      { name: 'album_link', label: 'Album Link (Optional)' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: ACTIVE_STATUS },
    ]}
  />
);

export const PartnersCmsPage = () => (
  <ResourceListPage
    title="Manage Partners"
    subtitle="Partner logos shown on the public website."
    path="/partners"
    fileField="image"
    fileLabel="Partner logo"
    imageField
    columns={[
      { key: 'logo_url', label: 'Logo', image: true },
    ]}
  />
);

export const ProgramsCmsPage = () => (
  <ResourceListPage
    title="Manage Programs"
    subtitle="Public programs with cover image, deadline, and application details."
    path="/programs"
    fileField="image"
    fileLabel="Cover image"
    extraFilePath="/programs/:id/images"
    extraFileLabel="Additional image"
    fileRequired={false}
    imageField
    defaults={{ status: 'active', category: 'upcoming' }}
    columns={[
      { key: 'title', label: 'Program Title' },
      { key: 'description', label: 'Description' },
      { key: 'application_deadline', label: 'Application Deadline', format: 'date' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
    ]}
    createFields={[
      { name: 'title', label: 'Program Title', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'application_deadline', label: 'Application Deadline', type: 'date', required: true },
      { name: 'category', label: 'Category', type: 'select', required: true, options: [
        { value: 'upcoming', label: 'Upcoming' },
        { value: 'recent', label: 'Recent' },
        { value: 'main', label: 'Main' },
      ] },
      { name: 'requirements', label: 'Requirements', type: 'textarea', required: true },
      { name: 'why_apply', label: 'Why Apply?', type: 'textarea' },
      { name: 'application_link', label: 'Application Form Link (Optional)' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: ACTIVE_STATUS },
    ]}
  />
);

export const EventsCmsPage = () => (
  <ResourceListPage
    title="Events Manager"
    subtitle="Create published or draft events with a cover photo and extra gallery images."
    path="/events"
    fileField="image"
    fileLabel="Cover image"
    extraFilePath="/events/:id/images"
    extraFileLabel="Additional event image"
    imageField
    defaults={{ status: 'published' }}
    columns={[
      { key: 'image', label: 'Image', image: true },
      { key: 'title', label: 'Title' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'description', label: 'Description' },
      { key: 'status', label: 'Status' },
    ]}
    createFields={[
      { name: 'title', label: 'Title', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: PUBLISH_STATUS },
    ]}
  />
);

export const PlatformsCmsPage = () => (
  <ResourceListPage
    title="Platforms"
    subtitle="Website platforms with image, description, and publish status."
    path="/platforms"
    fileField="image"
    fileLabel="Platform image"
    fileRequired={false}
    imageField
    defaults={{ status: 'published', display_order: 0 }}
    columns={[
      { key: 'image', label: 'Image', image: true },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'display_order', label: 'Order' },
    ]}
    createFields={[
      { name: 'name', label: 'Name', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'display_order', label: 'Display order', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', required: true, options: PUBLISH_STATUS },
    ]}
  />
);

export const TeamCmsPage = () => (
  <ResourceListPage
    title="Team"
    subtitle="Public team members shown on the website."
    path="/team"
    fileField="image"
    fileLabel="Photo"
    fileRequired={false}
    imageField
    columns={[
      { key: 'image', label: 'Photo', image: true },
      { key: 'names', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
    ]}
    createFields={[
      { name: 'names', label: 'Name', required: true },
      { name: 'role', label: 'Role', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', required: true },
      { name: 'bio', label: 'Bio', type: 'textarea' },
    ]}
  />
);

export const MemberProductsCmsPage = () => (
  <ResourceListPage
    title="Member Products"
    subtitle="Products displayed on the public members page."
    path="/member-products"
    idKey="product_id"
    fileField="image1"
    fileLabel="Image 1"
    fileRequired={false}
    imageField
    moreFiles={[
      { name: 'image2', label: 'Image 2' },
      { name: 'image3', label: 'Image 3' },
    ]}
    defaults={{ is_active: '1' }}
    columns={[
      { key: 'image1_url', label: 'Image', image: true },
      { key: 'product_name', label: 'Product' },
      { key: 'company_name', label: 'Company' },
      { key: 'phone', label: 'Phone' },
      { key: 'is_active', label: 'Active', format: 'active' },
    ]}
    createFields={[
      { name: 'product_name', label: 'Product name', required: true },
      { name: 'company_name', label: 'Company name', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'phone', label: 'Phone' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'address', label: 'Address' },
      { name: 'website_url', label: 'Website URL' },
      { name: 'is_active', label: 'Status', type: 'select', required: true, options: FLAG_STATUS },
    ]}
  />
);

export const AboutCmsPage = () => (
  <ResourceListPage
    title="Organization Structure"
    subtitle="About-page units shown on the public website."
    path="/organization"
    defaults={{ level: 'middle', is_active: '1', display_order: 0 }}
    columns={[
      { key: 'title', label: 'Title' },
      { key: 'unit_name', label: 'Unit' },
      { key: 'level', label: 'Level' },
      { key: 'is_active', label: 'Active', format: 'active' },
    ]}
    createFields={[
      { name: 'unit_name', label: 'Unit name', required: true },
      { name: 'unit_key', label: 'Unit key', required: true },
      { name: 'level', label: 'Level', type: 'select', required: true, options: [
        { value: 'top', label: 'Top' },
        { value: 'middle', label: 'Middle' },
        { value: 'bottom', label: 'Bottom' },
      ] },
      { name: 'title', label: 'Title', required: true },
      { name: 'content', label: 'Content', type: 'textarea', required: true },
      { name: 'display_order', label: 'Display order', type: 'number' },
      { name: 'is_active', label: 'Status', type: 'select', options: FLAG_STATUS },
    ]}
  />
);

export const MembershipSetupCmsPage = () => (
  <ResourceListPage
    title="Membership Categories"
    subtitle="Categories used on membership applications and reports."
    path="/membership-categories"
    idKey="category_id"
    columns={[
      { key: 'category_name', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'display_order', label: 'Order' },
    ]}
    createFields={[
      { name: 'category_name', label: 'Category name', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'display_order', label: 'Display order', type: 'number' },
    ]}
  />
);

export const MessagesCmsPage = () => (
  <ResourceListPage
    title="Contact Messages"
    subtitle="Messages submitted from the public contact form."
    path="/contact-messages"
    allowCreate={false}
    columns={[
      { key: 'name', label: 'From' },
      { key: 'email', label: 'Email' },
      { key: 'subject', label: 'Subject' },
      { key: 'message', label: 'Message' },
      { key: 'created_at', label: 'Date', format: 'datetime' },
      { key: 'status', label: 'Status' },
    ]}
    createFields={[
      { name: 'status', label: 'Status', type: 'select', required: true, options: [
        { value: 'unread', label: 'Unread' },
        { value: 'read', label: 'Read' },
        { value: 'replied', label: 'Replied' },
      ] },
    ]}
  />
);

export const SubscribersCmsPage = () => (
  <ResourceListPage
    title="Subscriptions"
    subtitle="Newsletter emails collected on the website."
    path="/subscribers"
    allowCreate={false}
    columns={[
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
      { key: 'subscribed_at', label: 'Subscribed', format: 'datetime' },
    ]}
    createFields={[
      { name: 'status', label: 'Status', type: 'select', required: true, options: [
        { value: 'active', label: 'Active' },
        { value: 'unsubscribed', label: 'Unsubscribed' },
      ] },
    ]}
  />
);

export const UsersPage = () => (
  <ResourceListPage
    title="Users / Staff"
    path="/users"
    columns={[
      { key: 'image', label: 'Photo', image: true, private: true },
      { key: 'names', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'active', label: 'Status', format: 'active' },
    ]}
  />
);

export const GenericModulePage = (props) => <ResourceListPage {...props} />;
