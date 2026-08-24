import ResourceListPage from './ResourceListPage';

export default function AdsPage() {
  return (
    <ResourceListPage
      title="Ads"
      subtitle="Homepage slides and advertisements."
      path="/ads"
      fileField="image"
      fileLabel="Ad image"
      imageField
      defaults={{ status: 'active' }}
      columns={[
        { key: 'url', label: 'Image', image: true },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'status', label: 'Status' },
      ]}
      createFields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'status', label: 'Status', type: 'select', required: true, options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ] },
      ]}
    />
  );
}
