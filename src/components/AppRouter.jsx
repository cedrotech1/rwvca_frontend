import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { ProtectedRoute, GuestRoute } from './ProtectedRoute';
import { ChatAssistant } from './ChatAssistant';
import { routerBasename } from '../utils/appPaths';
import PublicLayout from './public/PublicLayout';
import HomePage from '../pages/public/HomePage';
import AboutPage from '../pages/public/AboutPage';
import GalleryPage from '../pages/public/GalleryPage';
import ProgramsPage from '../pages/public/ProgramsPage';
import ProgramDetailPage from '../pages/public/ProgramDetailPage';
import MembershipPage from '../pages/public/MembershipPage';
import MembersProductsPage from '../pages/public/MembersProductsPage';
import EventsPage from '../pages/public/EventsPage';
import EventDetailPage from '../pages/public/EventDetailPage';
import ContactPage from '../pages/public/ContactPage';
import PlatformDetailPage from '../pages/public/PlatformDetailPage.jsx';
import { Login } from '../pages/Login';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { DashboardPage } from '../pages/DashboardPage';
import AdsPage from '../pages/dashboard/AdsPage';
import AssetsPage from '../pages/dashboard/AssetsPage';
import WebsiteSettingsPage from '../pages/dashboard/WebsiteSettingsPage';
import EdFullAccessPage from '../pages/dashboard/EdFullAccessPage';
import UsersManagementPage from '../pages/dashboard/UsersManagementPage';
import MembersListPage from '../pages/dashboard/members/MembersListPage';
import MemberFormPage from '../pages/dashboard/members/MemberFormPage';
import MemberViewPage from '../pages/dashboard/members/MemberViewPage';
import MemberStatisticsPage from '../pages/dashboard/members/MemberStatisticsPage';
import InventoryPage from '../pages/dashboard/InventoryPage';
import ProcurementPage from '../pages/dashboard/ProcurementPage';
import LogsPage from '../pages/LogsPage';
import SystemSettingsFormPage from '../pages/dashboard/SystemSettingsFormPage';
import CompanyInfoPage from '../pages/dashboard/CompanyInfoPage';
import {
  GalleryCmsPage,
  PartnersCmsPage,
  ProgramsCmsPage,
  EventsCmsPage,
  PlatformsCmsPage,
  TeamCmsPage,
  MemberProductsCmsPage,
  AboutCmsPage,
  MembershipSetupCmsPage,
  MessagesCmsPage,
  SubscribersCmsPage,
} from '../pages/dashboard/CmsPages';
import {
  CreateRequisitionPage,
  CreateDocumentPage,
  CreateLeavePage,
  CreateMissionPage,
  CreateVehiclePage,
  CreateLeaveSchedulePage,
  CreateReportPage,
  CreateCommunicationPage,
  CreateTicketPage,
  CreateTodoPage,
  CreateAttendancePage,
  CreatePermissionPage,
  CreateMembershipReportPage,
  RequisitionsListPage,
  FinanceRequisitionsListPage,
  VehicleListPage,
  LeaveListPage,
  LeaveScheduleListPage,
  MissionsListPage,
  DocumentsListPage,
  ReportsListPage,
  TicketsListPage,
  TodosListPage,
  CommunicationsListPage,
  PermissionsListPage,
  AttendanceListPage,
  MembershipReportsListPage,
  MembershipReportDetailPage,
  RequisitionDetailPage,
  VehicleDetailPage,
  LeaveDetailPage,
  LeaveScheduleDetailPage,
  MissionDetailPage,
  DocumentDetailPage,
  ReportDetailPage,
  TicketDetailPage,
  TodoDetailPage,
  CommunicationDetailPage,
  PermissionDetailPage,
  AttendanceDetailPage,
  EdNotesListPage,
  EdNotesCreatePage,
  EdNoteDetailPage,
} from '../pages/dashboard/workflow/pages';
import {
  MissionDocumentPage,
  LeaveDocumentPage,
  RequisitionDocumentPage,
  VehicleDocumentPage,
  LeaveScheduleDocumentPage,
} from '../pages/dashboard/workflow/WorkflowDocumentPages';
import {
  MembershipReportDocumentPage,
  MembershipReportGeneratePage,
} from '../pages/dashboard/workflow/MembershipReportDocumentPages';
import SharedMissedMembershipListPage from '../pages/dashboard/workflow/SharedMissedMembershipListPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage';
import { NotFound } from '../pages/NotFound';
import LeaveAnalysisPage from '../pages/dashboard/leave/LeaveAnalysisPage';
import EmployeeAnalysisPage from '../pages/dashboard/employees/EmployeeAnalysisPage';
import MyAnalysisPage from '../pages/dashboard/analysis/MyAnalysisPage';
import MembershipAnalysisPage from '../pages/dashboard/analysis/MembershipAnalysisPage';
import MembersAnalysisPage from '../pages/dashboard/analysis/MembersAnalysisPage';
import RequisitionAnalysisPage from '../pages/dashboard/analysis/RequisitionAnalysisPage';

export const AppRouter = () => (
  <Router basename={routerBasename() === '/' ? undefined : routerBasename()}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:id" element={<ProgramDetailPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/members" element={<MembersProductsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/platforms/:id" element={<PlatformDetailPage />} />
      </Route>

      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/admin" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

      <Route path="/dashboard/missions/:id/document" element={<ProtectedRoute><MissionDocumentPage /></ProtectedRoute>} />
      <Route path="/dashboard/leave-requests/:id/document" element={<ProtectedRoute><LeaveDocumentPage /></ProtectedRoute>} />
      <Route path="/dashboard/requisitions/:id/document" element={<ProtectedRoute><RequisitionDocumentPage /></ProtectedRoute>} />
      <Route path="/dashboard/special-requisitions/:id/document" element={<ProtectedRoute><VehicleDocumentPage /></ProtectedRoute>} />
      <Route path="/dashboard/leave-schedule/:id/document" element={<ProtectedRoute><LeaveScheduleDocumentPage /></ProtectedRoute>} />
      <Route path="/dashboard/membership-reports/generate" element={<ProtectedRoute><MembershipReportGeneratePage /></ProtectedRoute>} />
      <Route path="/dashboard/membership-reports/:id/document" element={<ProtectedRoute><MembershipReportDocumentPage /></ProtectedRoute>} />

      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<DashboardPage />} />
        <Route path="statistics" element={<Navigate to="/dashboard" replace />} />

        <Route path="create/requisitions" element={<CreateRequisitionPage />} />
        <Route path="create/special-requisitions" element={<CreateVehiclePage />} />
        <Route path="create/leave-requests" element={<CreateLeavePage />} />
        <Route path="create/leave-schedule" element={<CreateLeaveSchedulePage />} />
        <Route path="create/missions" element={<CreateMissionPage />} />
        <Route path="create/documents" element={<CreateDocumentPage />} />
        <Route path="create/reports" element={<CreateReportPage />} />
        <Route path="create/tickets" element={<CreateTicketPage />} />
        <Route path="create/todos" element={<CreateTodoPage />} />
        <Route path="create/communications" element={<CreateCommunicationPage />} />
        <Route path="create/permissions" element={<CreatePermissionPage />} />
        <Route path="create/attendance" element={<CreateAttendancePage />} />
        <Route path="create/ed-notes" element={<EdNotesCreatePage />} />
        <Route path="create/membership-reports" element={<CreateMembershipReportPage />} />
        <Route path="membership-reports/:id/edit" element={<CreateMembershipReportPage />} />

        <Route path="requisitions" element={<RequisitionsListPage />} />
        <Route path="requisitions/:id" element={<RequisitionDetailPage />} />
        <Route path="special-requisitions" element={<VehicleListPage />} />
        <Route path="special-requisitions/:id" element={<VehicleDetailPage />} />
        <Route path="leave-requests" element={<LeaveListPage />} />
        <Route path="leave-requests/:id" element={<LeaveDetailPage />} />
        <Route path="leave-analysis" element={<LeaveAnalysisPage />} />
        <Route path="employee-analysis" element={<EmployeeAnalysisPage />} />
        <Route path="employee-analysis/:id" element={<EmployeeAnalysisPage />} />
        <Route path="my-analysis" element={<MyAnalysisPage />} />
        <Route path="membership-analysis" element={<MembershipAnalysisPage />} />
        <Route path="members-analysis" element={<MembersAnalysisPage />} />
        <Route path="requisition-analysis" element={<RequisitionAnalysisPage />} />
        <Route path="leave-schedule" element={<LeaveScheduleListPage />} />
        <Route path="leave-schedule/:id" element={<LeaveScheduleDetailPage />} />
        <Route path="missions" element={<MissionsListPage />} />
        <Route path="missions/:id" element={<MissionDetailPage />} />
        <Route path="documents" element={<DocumentsListPage />} />
        <Route path="documents/:id" element={<DocumentDetailPage />} />
        <Route path="reports" element={<ReportsListPage />} />
        <Route path="reports/:id" element={<ReportDetailPage />} />
        <Route path="tickets" element={<TicketsListPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="todos" element={<TodosListPage />} />
        <Route path="todos/:id" element={<TodoDetailPage />} />
        <Route path="communications" element={<CommunicationsListPage />} />
        <Route path="communications/:id" element={<CommunicationDetailPage />} />
        <Route path="permissions/:id" element={<PermissionDetailPage />} />
        <Route path="attendance" element={<AttendanceListPage />} />
        <Route path="attendance/:id" element={<AttendanceDetailPage />} />
        <Route path="ed-notes" element={<EdNotesListPage />} />
        <Route path="ed-notes/:id" element={<EdNoteDetailPage />} />

        <Route path="ads" element={<AdsPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="gallery" element={<GalleryCmsPage />} />
        <Route path="partners" element={<PartnersCmsPage />} />
        <Route path="programs" element={<ProgramsCmsPage />} />
        <Route path="events" element={<EventsCmsPage />} />
        <Route path="platforms" element={<PlatformsCmsPage />} />
        <Route path="team" element={<TeamCmsPage />} />
        <Route path="users" element={<UsersManagementPage />} />
        <Route path="website" element={<WebsiteSettingsPage />} />
        <Route path="finance-requisitions" element={<FinanceRequisitionsListPage />} />
        <Route path="membership-reports" element={<MembershipReportsListPage />} />
        <Route path="membership-reports/shared-missed/:id" element={<SharedMissedMembershipListPage />} />
        <Route path="membership-reports/:id" element={<MembershipReportDetailPage />} />
        <Route path="members/statistics" element={<MemberStatisticsPage />} />
        <Route path="members/new" element={<MemberFormPage />} />
        <Route path="members/:id/edit" element={<MemberFormPage />} />
        <Route path="members/:id" element={<MemberViewPage />} />
        <Route path="members" element={<MembersListPage />} />
        <Route path="permissions" element={<PermissionsListPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="procurement" element={<ProcurementPage />} />
        <Route path="ed-full-access" element={<EdFullAccessPage />} />
        <Route path="subscribers" element={<SubscribersCmsPage />} />
        <Route path="messages" element={<MessagesCmsPage />} />
        <Route path="member-products" element={<MemberProductsCmsPage />} />
        <Route path="membership-setup" element={<MembershipSetupCmsPage />} />
        <Route path="about" element={<AboutCmsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfileSettingsPage />} />
        <Route path="settings" element={<SystemSettingsFormPage />} />
        <Route path="company" element={<CompanyInfoPage />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    <ChatAssistant />
  </Router>
);
