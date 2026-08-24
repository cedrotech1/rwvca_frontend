# PageHeading Component

A comprehensive and reusable page heading component designed for the WARS frontend application. It provides consistent styling and functionality across different page types while maintaining flexibility for various use cases.

## Features

- **Multiple Visual Variants**: Different styling options for service, management, campus, and default pages
- **Flexible Action Buttons**: Support for primary, secondary, success, danger, and outline button styles
- **Back Navigation**: Built-in back button functionality with customizable routes
- **Icon Support**: Emoji or icon components for visual enhancement
- **Breadcrumb Integration**: Optional breadcrumb support
- **Responsive Design**: Mobile-friendly layout with proper spacing
- **Pre-configured Components**: Ready-to-use variants for common page types

## Installation

The component is already available in your project at `src/components/PageHeading.jsx`.

## Basic Usage

```jsx
import { PageHeading } from '../components/PageHeading';

function MyPage() {
  return (
    <PageHeading
      title="Page Title"
      subtitle="Optional description text"
      showBack={true}
      backTo="/dashboard"
      actions={[
        {
          type: "primary",
          label: "Save",
          onClick: handleSave
        }
      ]}
    />
  );
}
```

## Props Reference

### Core Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | Yes | - | Main page title |
| `subtitle` | string | No | - | Page description or subtitle |
| `showBack` | boolean | No | false | Whether to show back button |
| `backTo` | string | No | - | Navigation path for back button |
| `backText` | string | No | "Back" | Text for back button |
| `variant` | string | No | "default" | Visual style variant |
| `icon` | ReactNode | No | - | Page icon (emoji or component) |
| `className` | string | No | "" | Additional CSS classes |
| `breadcrumb` | ReactNode | No | null | Breadcrumb component |

### Actions Array

Each action object supports the following properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | string | No | Button style: "primary", "secondary", "success", "danger", "outline", "context" |
| `label` | string | Yes | Button text |
| `icon` | ReactNode | No | Icon component |
| `onClick` | function | Yes | Click handler |
| `disabled` | boolean | No | Disabled state |
| `title` | string | No | Tooltip text |

## Visual Variants

### Default
- Clean white background
- Standard gray borders
- Suitable for general pages

### Service
- Blue gradient background (`from-blue-50 to-indigo-50`)
- Blue accent colors
- Ideal for service-related pages

### Management
- White background with subtle shadow
- Professional appearance
- Perfect for admin/management pages

### Campus
- Green gradient background (`from-green-50 to-emerald-50`)
- Green accent colors
- Designed for campus-related pages

## Pre-configured Components

For convenience, several pre-configured components are available:

### ServiceManagementHeading
```jsx
import { ServiceManagementHeading } from '../components/PageHeading';

<ServiceManagementHeading 
  actions={[
    {
      type: "primary",
      label: "Add Service",
      onClick: handleAddService
    }
  ]}
/>
```

### CreateServiceHeading
```jsx
import { CreateServiceHeading } from '../components/PageHeading';

<CreateServiceHeading 
  onSave={handleSave}
  actions={[
    {
      type: "outline",
      label: "Cancel",
      onClick: handleCancel
    }
  ]}
/>
```

### EditServiceHeading
```jsx
import { EditServiceHeading } from '../components/PageHeading';

<EditServiceHeading 
  serviceName="Student Accommodation"
  onUpdate={handleUpdate}
/>
```

### CampusManagementHeading
```jsx
import { CampusManagementHeading } from '../components/PageHeading';

<CampusManagementHeading 
  campusName="Main Campus"
  actions={/* actions array */}
/>
```

## Examples

### Basic Page with Back Button
```jsx
<PageHeading
  title="User Profile"
  subtitle="Manage your account settings and preferences"
  showBack={true}
  backTo="/dashboard"
/>
```

### Complex Page with Multiple Actions
```jsx
<PageHeading
  variant="service"
  icon="📊"
  title="Analytics Dashboard"
  subtitle="View detailed analytics and reports"
  actions={[
    {
      type: "secondary",
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      onClick: handleExport
    },
    {
      type: "primary",
      label: "Generate Report",
      icon: <Save className="h-4 w-4" />,
      onClick: handleGenerate
    }
  ]}
/>
```

### Page with Context Information
```jsx
<PageHeading
  title="Service Details"
  subtitle="View and manage service configuration"
  actions={[
    {
      type: "context",
      label: "Last updated: 2 hours ago",
      icon: <Clock className="h-4 w-4" />
    },
    {
      type: "primary",
      label: "Edit",
      onClick: handleEdit
    }
  ]}
/>
```

## Integration with Existing Pages

The component has been integrated with the following pages:
- `ServiceManagementPage.jsx` - Uses `ServiceManagementHeading`
- `CreateServicePage.jsx` - Uses `CreateServiceHeading`
- `EditServicePage.jsx` - Uses `EditServiceHeading`

## Styling Guidelines

- The component uses Tailwind CSS classes for styling
- Colors follow the established design system
- Responsive design ensures proper display on all screen sizes
- Hover states and transitions provide smooth interactions

## Best Practices

1. **Use appropriate variants** - Match the variant to the page context
2. **Keep actions minimal** - Only include essential actions to avoid clutter
3. **Use descriptive labels** - Clear, concise button text improves usability
4. **Consistent icons** - Use icons that clearly represent the action
5. **Proper spacing** - The component handles internal spacing automatically

## Troubleshooting

### Common Issues

1. **Actions not showing**: Ensure the actions array is properly formatted
2. **Back button not working**: Check that `backTo` or `navigate(-1)` is available
3. **Styling issues**: Verify Tailwind CSS is properly configured
4. **Icon not displaying**: Ensure icon components are properly imported

### Debug Tips

- Check browser console for JavaScript errors
- Verify all required props are provided
- Ensure proper import statements
- Test with different screen sizes for responsive issues

## Future Enhancements

Potential improvements to consider:
- Animated transitions between variants
- Additional button styles (link, ghost)
- Built-in loading states for actions
- Keyboard navigation support
- Accessibility improvements (ARIA labels)

## Support

For questions or issues related to the PageHeading component, please refer to the examples in `src/examples/PageHeadingExamples.jsx` or contact the development team.
