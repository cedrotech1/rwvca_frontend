import React from 'react';
import { 
  PageHeading, 
  ServiceManagementHeading, 
  CreateServiceHeading, 
  EditServiceHeading,
  CampusManagementHeading 
} from '../components/PageHeading';
import { Plus, Save, Settings, Download, Upload, Filter } from 'lucide-react';

/**
 * Example demonstrating different PageHeading configurations
 */
export const PageHeadingExamples = () => {
  // Example handlers
  const handleSave = () => {
    console.log('Save clicked');
  };

  const handleUpdate = () => {
    console.log('Update clicked');
  };

  const handleExport = () => {
    console.log('Export clicked');
  };

  const handleImport = () => {
    console.log('Import clicked');
  };

  const handleSettings = () => {
    console.log('Settings clicked');
  };

  return (
    <div className="space-y-12">
      {/* Example 1: Basic Service Management Heading */}
      <ServiceManagementHeading 
        actions={[
          {
            type: "primary",
            label: "Add Service",
            icon: <Plus className="h-4 w-4" />,
            onClick: () => console.log('Add service clicked')
          }
        ]}
      />

      {/* Example 2: Create Service Heading */}
      <CreateServiceHeading 
        onSave={handleSave}
        actions={[
          {
            type: "secondary",
            label: "Cancel",
            onClick: () => console.log('Cancel clicked')
          },
          {
            type: "primary",
            label: "Create Service",
            icon: <Save className="h-4 w-4" />,
            onClick: handleSave
          }
        ]}
      />

      {/* Example 3: Edit Service Heading */}
      <EditServiceHeading 
        serviceName="Student Accommodation"
        onUpdate={handleUpdate}
        actions={[
          {
            type: "outline",
            label: "Cancel",
            onClick: () => console.log('Cancel clicked')
          },
          {
            type: "success",
            label: "Update Service",
            icon: <Save className="h-4 w-4" />,
            onClick: handleUpdate
          }
        ]}
      />

      {/* Example 4: Campus Management Heading */}
      <CampusManagementHeading 
        campusName="Main Campus"
        actions={[
          {
            type: "secondary",
            label: "Export Data",
            icon: <Download className="h-4 w-4" />,
            onClick: handleExport
          },
          {
            type: "secondary",
            label: "Import Data",
            icon: <Upload className="h-4 w-4" />,
            onClick: handleImport
          },
          {
            type: "primary",
            label: "Settings",
            icon: <Settings className="h-4 w-4" />,
            onClick: handleSettings
          }
        ]}
      />

      {/* Example 5: Custom Page Heading with Multiple Actions */}
      <PageHeading
        variant="management"
        icon="📊"
        title="Analytics Dashboard"
        subtitle="View detailed analytics and reports for all campus services"
        showBack={true}
        backTo="/dashboard"
        backText="Back to Dashboard"
        actions={[
          {
            type: "context",
            label: "Last updated: 2 hours ago",
            icon: <Filter className="h-4 w-4" />
          },
          {
            type: "secondary",
            label: "Export Report",
            icon: <Download className="h-4 w-4" />,
            onClick: handleExport
          },
          {
            type: "primary",
            label: "Generate Report",
            icon: <Save className="h-4 w-4" />,
            onClick: handleSave
          }
        ]}
      />

      {/* Example 6: Minimal Heading */}
      <PageHeading
        title="Simple Page"
        subtitle="Just a basic heading with minimal configuration"
      />

      {/* Example 7: Heading with Custom Styling */}
      <PageHeading
        variant="service"
        icon="🎯"
        title="Service Configuration"
        subtitle="Advanced configuration options for service management"
        showBack={true}
        backTo="/services"
        actions={[
          {
            type: "danger",
            label: "Reset to Default",
            onClick: () => console.log('Reset clicked')
          },
          {
            type: "primary",
            label: "Save Changes",
            icon: <Save className="h-4 w-4" />,
            onClick: handleSave
          }
        ]}
        className="shadow-lg"
      />
    </div>
  );
};

/**
 * Usage guide for the PageHeading component
 */
export const PageHeadingUsageGuide = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">PageHeading Component Usage Guide</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Basic Props</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`<PageHeading
  title="Page Title"           // Required: Main title
  subtitle="Description"      // Optional: Subtitle/description
  showBack={true}             // Optional: Show back button
  backTo="/path"              // Optional: Back navigation path
  backText="Back"             // Optional: Back button text
  variant="default"           // Optional: Visual variant
  icon="🎯"                   // Optional: Page icon
  className="custom-class"    // Optional: Additional CSS classes
/>`}
            </pre>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Action Buttons</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`actions={[
  {
    type: "primary",           // Button style: primary, secondary, success, danger, outline
    label: "Button Text",      // Button text
    icon: <Icon />,           // Optional: Icon component
    onClick: handler,         // Click handler
    disabled: false,          // Optional: Disabled state
    title: "Tooltip"          // Optional: Tooltip text
  }
]}`}
            </pre>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Variants</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li><code>default</code> - Standard white background</li>
            <li><code>service</code> - Blue gradient background for service pages</li>
            <li><code>management</code> - Clean white with shadow for management pages</li>
            <li><code>campus</code> - Green gradient background for campus pages</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Pre-configured Components</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`// Import pre-configured headings
import { 
  ServiceManagementHeading,
  CreateServiceHeading,
  EditServiceHeading,
  CampusManagementHeading 
} from './components/PageHeading';

// Use them directly
<ServiceManagementHeading />
<CreateServiceHeading onSave={handleSave} />
<EditServiceHeading serviceName="Service Name" onUpdate={handleUpdate} />
<CampusManagementHeading campusName="Main Campus" />`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
