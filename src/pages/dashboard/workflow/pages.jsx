import CreateFormPage from './CreateFormPage';
import ListPage from './ListPage';
import DetailPage from './DetailPage';
import CreateRequisitionPage from './CreateRequisitionPage';
import CreateDocumentPage from './CreateDocumentPage';
import DocumentsListPage from './DocumentsListPage';
import DocumentDetailPage from './DocumentDetailPage';
import CreateStaffReportPage from './CreateStaffReportPage';
import ReportsListPage from './ReportsListPage';
import ReportDetailPage from './ReportDetailPage';
import api from '../../../services/api';
import { fileUrl } from '../../../services/api/config';
import { formatDateTime } from './helpers';
import {
  LeaveBalanceSummary,
  LeaveDirectWorkflowAlert,
  LeaveRequestDistribution,
} from './leaveShared';
import LeaveReportsListPage from './LeaveReportsListPage';

export { CreateRequisitionPage, CreateDocumentPage, CreateStaffReportPage, ReportsListPage, ReportDetailPage, DocumentsListPage, DocumentDetailPage };
export { EdNotesListPage, EdNotesCreatePage, EdNoteDetailPage } from './EdNotesPages';
export { default as CreateLeavePage } from './CreateLeaveRequestPage';
export { LeaveReportsListPage };
export { default as CreateLeaveRequestPage } from './CreateLeaveRequestPage';
export { default as CreateMembershipReportPage } from './CreateMembershipReportPage';
export { default as MembershipReportDetailPage } from './MembershipReportDetailPage';
export { default as MembershipReportsListPage } from './MembershipReportsListPage';

export const CreateReportPage = CreateStaffReportPage;

export const CreateMissionPage = () => (
  <CreateFormPage
    title="Mission / Travel Request"
    subtitle="Create mission request on behalf of an employee"
    apiPath="/mission-requests"
    successTo="/dashboard/missions"
    submitLabel="Submit Request"
    fields={[
      { name: 'employee', label: 'Employee Name', type: 'readonly-user' },
      { name: 'email', label: 'Email', type: 'readonly-email' },
      { name: 'purpose', label: 'Purpose of travel', type: 'textarea', required: true, placeholder: 'Objectives, expected outcomes, activities...', width: 'full' },
      { name: 'destination', label: 'Destination', required: true },
      { name: 'departure_date', label: 'Travel period (from)', type: 'date', required: true },
      { name: 'return_date', label: 'Travel period (to)', type: 'date', required: true },
      { name: 'days_manual', label: 'Number of Days (Manual Entry)', type: 'number', min: 1, required: true, placeholder: 'Enter number of days' },
    ]}
  />
);

export const CreateVehiclePage = () => (
  <CreateFormPage
    title="Create Vehicle Utilization"
    subtitle="Submit a new vehicle usage request"
    apiPath="/special-requisitions"
    successTo="/dashboard/special-requisitions"
    submitLabel="Submit Request"
    fields={[
      { name: 'employee', label: 'Employee Name', type: 'readonly-user' },
      { name: 'department', label: 'Department', type: 'readonly-department' },
      { name: 'title', label: 'Title', required: true },
      { name: 'type', label: 'Type', type: 'select', required: true, options: [
        { value: 'Car Wash', label: 'Car Wash' },
        { value: 'Fueling', label: 'Fueling' },
        { value: 'Repair', label: 'Repair' },
        { value: 'Official Duty', label: 'Official Duty' },
        { value: 'Other', label: 'Other' },
      ] },
      { name: 'type_other', label: 'Please specify', required: true, showIf: { name: 'type', value: 'Other' }, width: 'full' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the vehicle utilization request here...', width: 'full' },
      { name: 'date', label: 'Date', type: 'date', required: true, default: new Date().toISOString().slice(0, 10) },
      { name: 'start_time', label: 'Start Time', type: 'datetime-local' },
      { name: 'end_time', label: 'End Time', type: 'datetime-local' },
    ]}
  />
);

export const CreateLeaveSchedulePage = () => (
  <CreateFormPage
    title="Leave Schedule Management"
    subtitle="Plan your leave schedule for the year"
    apiPath="/leave-schedule"
    successTo="/dashboard/leave-schedule"
    submitLabel="Submit Request"
    fields={[
      { name: 'from_date', label: 'From Date', type: 'date', required: true },
      { name: 'return_date', label: 'Return Date', type: 'date', required: true },
    ]}
  />
);

export const CreateCommunicationPage = () => (
  <CreateFormPage
    title="Create Communication"
    subtitle="Send a new internal communication"
    apiPath="/communications"
    successTo="/dashboard/communications"
    submitLabel="Submit Request"
    useMultipart
    fields={[
      { name: 'title', label: 'Title', required: true, placeholder: 'Enter a clear title...', width: 'full' },
      { name: 'description', label: 'Description / Message', type: 'textarea', required: true, width: 'full', hint: 'PHP used rich text here. This version keeps a normal editor but preserves line breaks.' },
      { name: 'attachment', label: 'Attachment (Optional)', type: 'file' },
      { name: 'users', label: 'Select Recipients', type: 'multiselect', optionsKey: 'users', required: true, width: 'full' },
    ]}
    beforeSubmit={(form) => ({
      ...form,
      users: Array.isArray(form.users) ? form.users : (form.users ? [form.users] : []),
      communication_type: 'general',
    })}
  />
);

export const CreatePermissionPage = () => (
  <CreateFormPage
    title="Permissions"
    subtitle="Submit a new permission request"
    apiPath="/communications"
    successTo="/dashboard/permissions"
    submitLabel="Submit Request"
    useMultipart
    fields={[
      { name: 'title', label: 'Permission Title', required: true, placeholder: 'Enter a clear permission title...', width: 'full' },
      { name: 'description', label: 'Permission Description / Request', type: 'textarea', required: true, width: 'full' },
      { name: 'start_time', label: 'Permission Time Period (start)', type: 'datetime-local', placeholder: 'Select start date and time...' },
      { name: 'end_time', label: 'Permission Time Period (end)', type: 'datetime-local', placeholder: 'Select end date and time...' },
      { name: 'attachment', label: 'Attachment (Optional)', type: 'file' },
      { name: 'users', label: 'Select Recipients', type: 'multiselect', optionsKey: 'users', required: true, width: 'full' },
    ]}
    beforeSubmit={(form) => ({
      ...form,
      users: Array.isArray(form.users) ? form.users : (form.users ? [form.users] : []),
      communication_type: 'permission',
    })}
  />
);

export const CreateTicketPage = () => (
  <CreateFormPage
    title="Open Ticket"
    subtitle="Create a new support ticket"
    apiPath="/tickets"
    successTo="/dashboard/tickets"
    submitLabel="Submit Request"
    useMultipart
    fields={[
      { name: 'title', label: 'Title', required: true, width: 'full' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, width: 'full' },
      { name: 'priority', label: 'Priority', type: 'select', options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ] },
      { name: 'category', label: 'Category', type: 'select', options: [
        { value: 'General', label: 'General' },
        { value: 'Technical', label: 'Technical' },
        { value: 'HR', label: 'HR' },
        { value: 'Finance', label: 'Finance' },
        { value: 'Other', label: 'Other' },
      ] },
      { name: 'assigned_to', label: 'Assign to (Optional)', type: 'select', optionsKey: 'users' },
      { name: 'attachment', label: 'Attachment (Optional)', type: 'file' },
    ]}
    beforeSubmit={(form) => ({
      ...form,
      category: String(form.category || 'general').toLowerCase(),
    })}
  />
);

export const CreateTodoPage = () => (
  <CreateFormPage
    title="Enhanced Todo Manager"
    subtitle="Create a new task or to-do item"
    apiPath="/todos"
    successTo="/dashboard/todos"
    submitLabel="Submit Request"
    fields={[
      { name: 'title', label: 'Task Title', required: true, placeholder: 'Enter task title', width: 'full' },
      { name: 'priority', label: 'Priority', type: 'select', options: [
        { value: 'Low', label: 'Low' },
        { value: 'Medium', label: 'Medium' },
        { value: 'High', label: 'High' },
        { value: 'Urgent', label: 'Urgent' },
      ] },
      { name: 'location', label: 'Location', placeholder: 'Task location' },
      { name: 'from_datetime', label: 'From Date & Time', type: 'datetime-local' },
      { name: 'to_datetime', label: 'To Date & Time', type: 'datetime-local' },
      { name: 'due_date', label: 'Due Date', type: 'date' },
      { name: 'description', label: 'Description', type: 'textarea', width: 'full' },
    ]}
  />
);

export const CreateAttendancePage = () => (
  <CreateFormPage
    title="Create Attendance"
    subtitle="Record staff attendance for a session"
    apiPath="/attendance"
    successTo="/dashboard/attendance"
    submitLabel="Submit Request"
    fields={[
      { name: 'title', label: 'Title', required: true },
      { name: 'type', label: 'Type', placeholder: 'Meeting / Training' },
      { name: 'location', label: 'Location' },
      { name: 'attendance_date', label: 'Date & Time', type: 'datetime-local', required: true },
      { name: 'user_ids', label: 'Selected Participants', type: 'multiselect', optionsKey: 'users', width: 'full' },
    ]}
    beforeSubmit={(form) => ({
      ...form,
      user_ids: Array.isArray(form.user_ids) ? form.user_ids : (form.user_ids ? [form.user_ids] : []),
    })}
  />
);

const REQ_STATUS = {
  name: 'status',
  label: 'Status',
  allLabel: 'All Status',
  options: [
    { value: 'draft', label: 'Draft' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ],
};

const LEAVE_STATUS = {
  name: 'status',
  label: 'Status',
  allLabel: 'All Status',
  options: [
    { value: 'pending', label: 'Pending' },
    { value: 'verified_by_hr', label: 'Verified by HR' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'reverted', label: 'Reverted' },
  ],
};

const MISSION_STATUS = {
  name: 'status',
  label: 'Status',
  allLabel: 'All Status',
  options: [
    { value: 'pending', label: 'Pending' },
    { value: 'verified_by_hr', label: 'Verified by HR' },
    { value: 'edited', label: 'Edited' },
    { value: 'reverted', label: 'Reverted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected_by_hr', label: 'Rejected by HR' },
    { value: 'rejected_by_ed', label: 'Rejected by ED' },
  ],
};

const DATE_FILTERS = [
  { name: 'date_from', type: 'date', label: 'From Date' },
  { name: 'date_to', type: 'date', label: 'To Date' },
];

export const RequisitionsListPage = () => (
  <ListPage
    title="Requisitions"
    subtitle="Manage purchase and expense requisitions"
    apiPath="/requisitions"
    openTo="/dashboard/requisitions"
    createTo="/dashboard/create/requisitions"
    tabs={[
      { value: 'my', label: 'My Requisitions' },
      { value: 'received', label: 'Received' },
      { value: 'all', label: 'All Requisitions', reviewerOnly: true },
    ]}
    filters={[REQ_STATUS, ...DATE_FILTERS]}
    columns={[
      { key: 'id', label: 'Requisition #', format: 'id' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'preparer.names', label: 'Prepared By' },
      { key: 'department.name', label: 'Department' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'total_amount_requested', label: 'Total Amount', format: 'money' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
    ]}
    documentTo="/dashboard/requisitions/:id/document"
  />
);

export const FinanceRequisitionsListPage = () => (
  <ListPage
    title="Finance Requisitions"
    subtitle="Approved and authorized requisitions ready for finance. Petty cash is under RWF 100,000."
    apiPath="/requisitions"
    openTo="/dashboard/requisitions"
    tabs={[
      { value: 'finance', label: 'All Finance' },
      { value: 'finance_pending', label: 'Pending Payment' },
      { value: 'finance_paid', label: 'Paid' },
      { value: 'finance_rejected', label: 'Rejected' },
    ]}
    filters={[...DATE_FILTERS]}
    columns={[
      { key: 'id', label: 'Req #', format: 'id' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'department.name', label: 'Department' },
      { key: 'preparer.names', label: 'Prepared By' },
      { key: 'total_amount_requested', label: 'Amount', format: 'money' },
      { key: 'classification', label: 'Classification', format: 'classification' },
      { key: 'finance_status', label: 'Finance Status', format: 'status' },
      { key: 'status', label: 'Workflow', format: 'status' },
    ]}
    documentTo="/dashboard/requisitions/:id/document"
  />
);

export const VehicleListPage = () => (
  <ListPage
    title="Vehicle Utilization"
    subtitle="Track and manage vehicle usage requests"
    apiPath="/special-requisitions"
    openTo="/dashboard/special-requisitions"
    createTo="/dashboard/create/special-requisitions"
    searchPlaceholder="Search title/description..."
    tabs={[
      { value: 'my', label: 'My' },
      { value: 'received', label: 'Received', vehicleReceivedOnly: true },
    ]}
    filters={[
      REQ_STATUS,
      { name: 'type', label: 'Type', allLabel: 'All Types', options: [
        { value: 'Car Wash', label: 'Car Wash' },
        { value: 'Fueling', label: 'Fueling' },
        { value: 'Repair', label: 'Repair' },
        { value: 'Official Duty', label: 'Official Duty' },
        { value: 'Other', label: 'Other' },
      ] },
    ]}
    columns={[
      { key: 'id', label: '#', render: (row, idx) => idx + 1 },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'department.name', label: 'Department' },
      { key: 'preparer.names', label: 'Prepared By' },
      { key: 'start_time', label: 'Start', format: 'datetime' },
      { key: 'end_time', label: 'End', format: 'datetime' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'created_at', label: 'Created', format: 'datetime' },
    ]}
    documentTo="/dashboard/special-requisitions/:id/document"
  />
);

export const LeaveListPage = LeaveReportsListPage;

export const LeaveScheduleListPage = () => (
  <ListPage
    title="Leave Schedule Management"
    subtitle="Plan and manage staff leave schedules"
    apiPath="/leave-schedule"
    openTo="/dashboard/leave-schedule"
    createTo="/dashboard/create/leave-schedule"
    documentTo="/dashboard/leave-schedule/:id/document"
    filters={[
      { name: 'status', label: 'Status', allLabel: 'All Status', options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ] },
      { name: 'user_id', type: 'applicant', label: 'Employee' },
      { name: 'from_date', type: 'date', label: 'From Date' },
      { name: 'to_date', type: 'date', label: 'To Date' },
    ]}
    columns={[
      { key: 'id', label: '#', render: (row, idx) => idx + 1 },
      { key: 'user.names', label: 'Employee' },
      { key: 'from_date', label: 'From Date', format: 'date' },
      { key: 'return_date', label: 'Return Date', format: 'date' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'hr_read_status', label: 'HR Read' },
      { key: 'ed_read_status', label: 'ED Read' },
    ]}
  />
);

export const MissionsListPage = () => (
  <ListPage
    title="Mission Requests"
    subtitle="Track and manage staff travel and mission requests"
    apiPath="/mission-requests"
    openTo="/dashboard/missions"
    createTo="/dashboard/create/missions"
    searchPlaceholder="Search by name, destination..."
    tabs={[
      { value: 'my', label: 'My Mission Requests' },
      { value: 'received', label: 'Received Mission Requests', reviewerOnly: true },
    ]}
    filters={[MISSION_STATUS, { name: 'user_id', type: 'applicant', label: 'Applicant' }, ...DATE_FILTERS]}
    canDeleteRow={(row, user) => {
      const role = String(user?.role || '').toLowerCase();
      if (role === 'hr' || role === 'admin') return true;
      return Number(row.user_id) === Number(user?.id) && row.mission_requests_status === 'pending';
    }}
    columns={[
      { key: 'id', label: '#', render: (row, idx) => idx + 1 },
      { key: 'user.names', label: 'Applicant' },
      { key: 'destination', label: 'Destination' },
      { key: 'period', label: 'Period', format: 'period', from: 'departure_date', to: 'return_date' },
      { key: 'days_requested', label: 'Days' },
      { key: 'mission_requests_status', label: 'Status' },
      { key: 'created_at', label: 'Created', format: 'datetime' },
    ]}
    documentTo="/dashboard/missions/:id/document"
  />
);

export const TicketsListPage = () => (
  <ListPage
    title="Open Ticket"
    subtitle="View and manage support tickets"
    apiPath="/tickets"
    openTo="/dashboard/tickets"
    createTo="/dashboard/create/tickets"
    createLabel="Open Ticket"
    tabs={[
      { value: 'mine', label: 'My Tickets' },
      { value: 'assigned', label: 'Assigned to Me' },
      { value: 'all', label: 'All Tickets', hrAdminOnly: true },
    ]}
    columns={[
      { key: 'id', label: '#', render: (row, idx) => idx + 1 },
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'priority', label: 'Priority' },
      { key: 'category', label: 'Category' },
      { key: 'created_at', label: 'Created', format: 'datetime' },
      { key: 'replies', label: 'Replies', format: 'count' },
    ]}
    canDeleteRow={(row, user) => ['admin', 'hr'].includes(String(user?.role || '').toLowerCase()) || (
      Number(row.created_by) === Number(user?.id)
      && (row.assigned_to == null || Number(row.assigned_to) === Number(user?.id) || ['open', 'resolved', 'closed'].includes(row.status))
    )}
  />
);

export const TodosListPage = () => (
  <ListPage
    title="Enhanced Todo Manager"
    subtitle="Organize and track your tasks and to-dos"
    apiPath="/todos"
    openTo="/dashboard/todos"
    createTo="/dashboard/create/todos"
    tabs={[
      { value: 'mine', label: 'My Todos' },
      { value: 'shared', label: 'Shared' },
      { value: 'all', label: 'All' },
    ]}
    columns={[
      { key: 'title', label: 'Task Title' },
      { key: 'priority', label: 'Priority' },
      { key: 'location', label: 'Location' },
      { key: 'from_datetime', label: 'From Date & Time', format: 'datetime' },
      { key: 'to_datetime', label: 'To Date & Time', format: 'datetime' },
      { key: 'due_date', label: 'Due Date', format: 'date' },
      { key: 'is_completed', label: 'Status', format: 'yesno' },
    ]}
  />
);

export const CommunicationsListPage = () => (
  <ListPage
    title="Communications"
    subtitle="View and manage internal communications"
    apiPath="/communications"
    query={{ communication_type: 'general' }}
    openTo="/dashboard/communications"
    createTo="/dashboard/create/communications"
    fileKey="attachment_url"
    searchPlaceholder="Search title/description..."
    defaultTab="my"
    tabs={[
      { value: 'all', label: 'All' },
      { value: 'my', label: 'My Communications' },
      { value: 'received', label: 'Received' },
    ]}
    filters={[
      { name: 'exact_date', type: 'date', label: 'Exact Date' },
      ...DATE_FILTERS,
      { name: 'created_by', type: 'applicant', label: 'Created By', allLabel: 'All Users' },
    ]}
    columns={[
      { key: 'title', label: 'Title' },
      { key: 'creator.names', label: 'Created By' },
      { key: 'recipient_count', label: 'Recipients' },
      { key: 'reply_count', label: 'Replies' },
      { key: 'is_read', label: 'Read', format: 'yesno' },
      { key: 'created_at', label: 'Date', format: 'datetime' },
    ]}
    canDeleteRow={(row, user) => Number(row.created_by) === Number(user?.id) || ['ed', 'chairman', 'admin'].includes(String(user?.role || '').toLowerCase())}
  />
);

export const PermissionsListPage = () => (
  <ListPage
    title="Permissions"
    subtitle="Manage permission requests and approvals"
    apiPath="/communications"
    query={{ communication_type: 'permission' }}
    openTo="/dashboard/permissions"
    createTo="/dashboard/create/permissions"
    fileKey="attachment_url"
    searchPlaceholder="Search title/description..."
    defaultTab="my"
    tabs={[
      { value: 'all', label: 'All' },
      { value: 'my', label: 'My Permissions' },
      { value: 'received', label: 'Received' },
    ]}
    filters={[
      { name: 'exact_date', type: 'date', label: 'Exact Date' },
      ...DATE_FILTERS,
      { name: 'created_by', type: 'applicant', label: 'Created By', allLabel: 'All Users' },
    ]}
    columns={[
      { key: 'title', label: 'Permission Title' },
      { key: 'creator.names', label: 'Created By' },
      { key: 'start_time', label: 'From Date', format: 'datetime' },
      { key: 'end_time', label: 'To Date', format: 'datetime' },
    ]}
    canDeleteRow={(row, user) => Number(row.created_by) === Number(user?.id) || ['ed', 'chairman', 'admin'].includes(String(user?.role || '').toLowerCase())}
  />
);

export const AttendanceListPage = () => (
  <ListPage
    title="Attendance"
    subtitle="Track and manage staff attendance records"
    apiPath="/attendance"
    openTo="/dashboard/attendance"
    createTo="/dashboard/create/attendance"
    columns={[
      { key: 'title', label: 'Title' },
      { key: 'attendance_date', label: 'Date & Time', format: 'datetime' },
      { key: 'location', label: 'Location' },
      { key: 'creator.names', label: 'Creator' },
      { key: 'type', label: 'Type' },
    ]}
  />
);


export const RequisitionDetailPage = () => (
  <DetailPage
    title="Requisition"
    apiPath="/requisitions"
    backTo="/dashboard/requisitions"
    workflow="requisition"
    documentTo="/dashboard/requisitions/:id/document"
    logsKey="requisition_logs_requisition_id"
    fields={[
      { key: 'id', label: 'Requisition #', format: 'id' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'department.name', label: 'Department' },
      { key: 'budget_source', label: 'Budget Source' },
      { key: 'account_code', label: 'Account Code' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'finance_status', label: 'Finance Status', format: 'status' },
      { key: 'classification', label: 'Classification', format: 'classification' },
      { key: 'total_amount_requested', label: 'Total Amount', format: 'money' },
      { key: 'amount_in_words', label: 'Amount in Words' },
      { key: 'preparer.names', label: 'Prepared By' },
      { key: 'sendToUser.names', label: 'Send To (Verifier)' },
      { key: 'verifier.names', label: 'Verified By' },
      { key: 'approver.names', label: 'Approved By' },
      { key: 'authorizer.names', label: 'Authorized By' },
    ]}
    itemTable={{
      key: 'requisitionitems_requisition_id',
      columns: [
        { key: 'sn', label: '#' },
        { key: 'description', label: 'Description' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'unit_price', label: 'Unit Price', format: 'money' },
        { key: 'total_amount', label: 'Total', format: 'money' },
      ],
    }}
    action={{
      path: '/requisitions/:id/finance',
      field: 'finance_status',
      label: 'Finance status',
      submitLabel: 'Update finance status',
      when: (row) => Boolean(row.permissions?.can_finance),
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'rejected', label: 'Rejected' },
      ],
    }}
  />
);

export const VehicleDetailPage = () => (
  <DetailPage
    title="Vehicle Utilization"
    apiPath="/special-requisitions"
    backTo="/dashboard/special-requisitions"
    workflow="vehicle"
    documentTo="/dashboard/special-requisitions/:id/document"
    logsKey="special_requisition_logs_special_requisition_id"
    fields={[
      { key: 'preparer.names', label: 'Employee Name' },
      { key: 'department.name', label: 'Department' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'type_other', label: 'Please specify' },
      { key: 'description', label: 'Description' },
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'start_time', label: 'Start Time', format: 'datetime' },
      { key: 'end_time', label: 'End Time', format: 'datetime' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'verifier.names', label: 'Verified By' },
      { key: 'approver.names', label: 'Approved By' },
      { key: 'authorizer.names', label: 'Authorized By' },
    ]}
  />
);

export const LeaveDetailPage = () => (
  <DetailPage
    title="Leave Request"
    apiPath="/leave-requests"
    backTo="/dashboard/leave-requests"
    workflow="leave"
    documentTo="/dashboard/leave-requests/:id/document"
    letterKey="letter_url"
    logsKey="logs"
    renderMeta={(item) => (
      <div className="space-y-4 border-t border-gray-100 pt-4">
        {item.balance && (
          <LeaveBalanceSummary
            balance={item.balance}
            userName={item.user?.names}
            compact
          />
        )}
        <LeaveDirectWorkflowAlert role={item.user?.role} />
        <LeaveRequestDistribution item={item} />
        {item.leave_requests_status === 'reverted' && Array.isArray(item.logs) && (
          (() => {
            const revertLog = [...item.logs].reverse().find((row) => row.status === 'reverted');
            if (!revertLog?.comment) return null;
            return (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                <p className="font-semibold">Returned for revision</p>
                <p className="mt-1 whitespace-pre-wrap">{revertLog.comment}</p>
                <p className="mt-2 text-xs text-rose-700">
                  {revertLog.changedByUser?.names ? `By ${revertLog.changedByUser.names}` : ''}
                  {revertLog.created_at ? ` · ${formatDateTime(revertLog.created_at)}` : ''}
                </p>
              </div>
            );
          })()
        )}
        {item.permissions?.is_special_case && item.leave_requests_status === 'pending' && (
          <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
            Awaiting direct approval from {item.executive?.names || 'Executive approver'} (no HR step).
          </p>
        )}
      </div>
    )}
    fields={[
      { key: 'user.names', label: 'Employee' },
      { key: 'user.email', label: 'Email' },
      { key: 'leave_type', label: 'Leave Reason' },
      { key: 'year', label: 'Year' },
      { key: 'requested_days', label: 'Requested Days' },
      { key: 'days_authorized', label: 'Days Authorized' },
      { key: 'leave_from', label: 'Leave From', format: 'date' },
      { key: 'return_date', label: 'Return Date', format: 'date' },
      { key: 'leave_requests_status', label: 'Status' },
      { key: 'letter_url', label: 'Supporting Letter / Document', format: 'letter' },
      { key: 'hr.names', label: 'HR Officer' },
      { key: 'executive.names', label: 'Executive Approver' },
    ]}
  />
);

export const LeaveScheduleDetailPage = () => (
  <DetailPage
    title="Leave Schedule Details"
    apiPath="/leave-schedule"
    backTo="/dashboard/leave-schedule"
    workflow="leave-schedule"
    documentTo="/dashboard/leave-schedule/:id/document"
    replyPath="/leave-schedule/:id/replies"
    replyLabel="Message"
    repliesKey="leave_schedule_replies_leave_schedule_id"
    fields={[
      { key: 'user.names', label: 'Employee' },
      { key: 'from_date', label: 'From Date', format: 'date' },
      { key: 'return_date', label: 'Return Date', format: 'date' },
      { key: 'status', label: 'Status', format: 'status' },
      { key: 'hr_read_status', label: 'HR Read' },
      { key: 'ed_read_status', label: 'ED Read' },
    ]}
  />
);

export const MissionDetailPage = () => (
  <DetailPage
    title="Mission Request"
    apiPath="/mission-requests"
    backTo="/dashboard/missions"
    workflow="mission"
    documentTo="/dashboard/missions/:id/document"
    documentButtonLabel="Print mission document"
    documentButtonLabel="Print mission document"
    fields={[
      { key: 'user.names', label: 'Employee Name' },
      { key: 'user.email', label: 'Email' },
      { key: 'user.role', label: 'Job title' },
      { key: 'purpose', label: 'Purpose of travel' },
      { key: 'destination', label: 'Destination' },
      { key: 'departure_date', label: 'Travel period (from)', format: 'date' },
      { key: 'return_date', label: 'Travel period (to)', format: 'date' },
      { key: 'days_requested', label: 'Number of Days (Manual Entry)' },
      { key: 'days_authorized', label: 'Days Authorized' },
      { key: 'mission_requests_status', label: 'Status' },
      { key: 'hr.names', label: 'HR Officer' },
      { key: 'executive.names', label: 'Executive Approver' },
    ]}
  />
);

export { default as TicketDetailPage } from './TicketDetailPage';

export const TodoDetailPage = () => (
  <DetailPage
    title="Todo"
    apiPath="/todos"
    backTo="/dashboard/todos"
    fields={[
      { key: 'title', label: 'Task Title' },
      { key: 'priority', label: 'Priority' },
      { key: 'location', label: 'Location' },
      { key: 'description', label: 'Description' },
      { key: 'from_datetime', label: 'From Date & Time', format: 'datetime' },
      { key: 'to_datetime', label: 'To Date & Time', format: 'datetime' },
      { key: 'due_date', label: 'Due Date', format: 'date' },
      { key: 'is_completed', label: 'Status', format: 'yesno' },
    ]}
  />
);

export const CommunicationDetailPage = () => (
  <DetailPage
    title="Communication"
    apiPath="/communications"
    backTo="/dashboard/communications"
    replyPath="/communications/:id/replies"
    replyLabel="Your Reply"
    replyThreadKey="threaded_replies"
    onLoad={async (row, id) => {
      if (!row?.is_read) {
        await api.post(`/communications/${id}/viewed`, {});
      }
    }}
    renderMeta={(item) => (
      <div className="space-y-4 pt-4">
        {item.communication_type === 'permission' && (
          <div className="rounded-xl bg-blue-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-[#2f5d31]">Permission time period</p>
            <p className="mt-1">From: {item.start_time ? formatDateTime(item.start_time) : '—'}</p>
            <p>To: {item.end_time ? formatDateTime(item.end_time) : '—'}</p>
          </div>
        )}
        {item.recipient_users?.length > 0 && (
          <div>
            <h3 className="mb-2 font-semibold">Recipients</h3>
            <div className="flex flex-wrap gap-2">
              {item.recipient_users.map((user) => (
                <span key={user.id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                  {user.names} ({user.role})
                </span>
              ))}
            </div>
          </div>
        )}
        {(item.viewed_user_ids?.length > 0 || item.unread_user_ids?.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-700">Read</p>
              <p className="mt-1 text-sm text-gray-700">{item.viewed_user_ids?.length || 0} recipient(s)</p>
              {item.viewed_users_detail?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.viewed_users_detail.map((user) => (
                    <span key={user.id} className="rounded-full bg-white px-2.5 py-1 text-xs text-emerald-700">
                      {user.names}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="font-semibold text-amber-700">Unread</p>
              <p className="mt-1 text-sm text-gray-700">{item.unread_user_ids?.length || 0} recipient(s)</p>
              {item.unread_users_detail?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.unread_users_detail.map((user) => (
                    <span key={user.id} className="rounded-full bg-white px-2.5 py-1 text-xs text-amber-700">
                      {user.names}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {item.communication_attachments_communication_id?.length > 0 && (
          <div>
            <h3 className="mb-2 font-semibold">Attachments</h3>
            <div className="space-y-2">
              {item.communication_attachments_communication_id.map((attachment) => (
                <div key={attachment.id}>
                  <button
                    type="button"
                    className="text-sm font-medium text-[#2f5d31]"
                    onClick={() => window.open(fileUrl(attachment.link, { auth: true }), '_blank', 'noopener,noreferrer')}
                  >
                    Open attachment
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {item.link && (
          <div>
            <h3 className="mb-2 font-semibold">External link</h3>
            <a href={item.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#2f5d31]">
              {item.link}
            </a>
          </div>
        )}
      </div>
    )}
    fields={[
      { key: 'title', label: 'Title' },
      { key: 'communication_type', label: 'Type', format: 'status' },
      { key: 'description', label: 'Description / Message', format: 'html' },
      { key: 'creator.names', label: 'Created By' },
      { key: 'start_time', label: 'From Date', format: 'datetime' },
      { key: 'end_time', label: 'To Date', format: 'datetime' },
      { key: 'attachment_url', label: 'Attachment', format: 'file' },
    ]}
  />
);

export const PermissionDetailPage = () => (
  <DetailPage
    title="Permission"
    apiPath="/communications"
    backTo="/dashboard/permissions"
    replyPath="/communications/:id/replies"
    replyLabel="Your Reply"
    replyThreadKey="threaded_replies"
    onLoad={async (row, id) => {
      if (!row?.is_read) {
        await api.post(`/communications/${id}/viewed`, {});
      }
    }}
    renderMeta={(item) => (
      <div className="space-y-4 pt-4">
        <div className="rounded-xl bg-blue-50 p-4 text-sm text-gray-700">
          <p className="font-semibold text-[#2f5d31]">Permission time period</p>
          <p className="mt-1">From: {item.start_time ? formatDateTime(item.start_time) : '—'}</p>
          <p>To: {item.end_time ? formatDateTime(item.end_time) : '—'}</p>
        </div>
        {item.recipient_users?.length > 0 && (
          <div>
            <h3 className="mb-2 font-semibold">Recipients</h3>
            <div className="flex flex-wrap gap-2">
              {item.recipient_users.map((user) => (
                <span key={user.id} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                  {user.names} ({user.role})
                </span>
              ))}
            </div>
          </div>
        )}
        {(item.viewed_user_ids?.length > 0 || item.unread_user_ids?.length > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-700">Read</p>
              <p className="mt-1 text-sm text-gray-700">{item.viewed_user_ids?.length || 0} recipient(s)</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="font-semibold text-amber-700">Unread</p>
              <p className="mt-1 text-sm text-gray-700">{item.unread_user_ids?.length || 0} recipient(s)</p>
            </div>
          </div>
        )}
        {item.attachment_url && (
          <div>
            <h3 className="mb-2 font-semibold">Attachment</h3>
            <a href={fileUrl(item.attachment_url, { auth: true })} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#2f5d31]">
              Open attachment
            </a>
          </div>
        )}
        {item.link && (
          <div>
            <h3 className="mb-2 font-semibold">External link</h3>
            <a href={item.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#2f5d31]">
              {item.link}
            </a>
          </div>
        )}
      </div>
    )}
    fields={[
      { key: 'title', label: 'Permission Title' },
      { key: 'description', label: 'Permission Description / Request', format: 'html' },
      { key: 'creator.names', label: 'Created By' },
      { key: 'start_time', label: 'From Date', format: 'datetime' },
      { key: 'end_time', label: 'To Date', format: 'datetime' },
      { key: 'attachment_url', label: 'Attachment', format: 'file' },
    ]}
  />
);

export const AttendanceDetailPage = () => (
  <DetailPage
    title="Attendance"
    apiPath="/attendance"
    backTo="/dashboard/attendance"
    fields={[
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'location', label: 'Location' },
      { key: 'attendance_date', label: 'Date & Time', format: 'datetime' },
      { key: 'creator.names', label: 'Creator' },
      { key: 'status', label: 'Status', format: 'status' },
    ]}
    itemTable={{
      key: 'attendance_users_attendance_id',
      columns: [
        { key: 'user.names', label: 'Name' },
        { key: 'signed', label: 'Signed', format: 'yesno' },
        { key: 'responded_at', label: 'Signed At', format: 'datetime' },
      ],
    }}
  />
);
