import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import CreateCompany from './pages/CreateCompany.jsx';
import EditCompany from './pages/EditCompany.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import EmployeeForm from './pages/EmployeeForm.jsx';
import CompanySettings from './pages/CompanySettings.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import MyLeave from './pages/MyLeave.jsx';
import LeaveRequests from './pages/LeaveRequests.jsx';
import LeavePolicy from './pages/LeavePolicy.jsx';
import DefaultLeavePolicy from './pages/DefaultLeavePolicy.jsx';
import MyProfile from './pages/MyProfile.jsx';
import HolidayCalendar from './pages/HolidayCalendar.jsx';
import PraiseWall from './pages/PraiseWall.jsx';
import MyDepartment from './pages/MyDepartment.jsx';
import MyExpenses from './pages/MyExpenses.jsx';
import SubmitExpense from './pages/SubmitExpense.jsx';
import ExpenseClaims from './pages/ExpenseClaims.jsx';
import CompanyFeed from './pages/CompanyFeed.jsx';
import OrgChart from './pages/OrgChart.jsx';
import Performance from './pages/Performance.jsx';
import TeamReviews from './pages/TeamReviews.jsx';
import ReviewCycles from './pages/ReviewCycles.jsx';
import EmployeeChecklist from './pages/EmployeeChecklist.jsx';
import EmployeeDocuments from './pages/EmployeeDocuments.jsx';
import MyDocuments from './pages/MyDocuments.jsx';
import DocumentCenter from './pages/DocumentCenter.jsx';
import AssetInventory from './pages/AssetInventory.jsx';
import MyAssets from './pages/MyAssets.jsx';
import Resignations from './pages/Resignations.jsx';
import Resign from './pages/Resign.jsx';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/create-company" element={<CreateCompany />} />
        <Route path="/super-admin/edit-company/:companyId" element={<EditCompany />} />
        <Route path="/dashboard/:companyId" element={<Dashboard />} />
        <Route path="/employees/:companyId" element={<Employees />} />
        <Route path="/employees/:companyId/add" element={<EmployeeForm />} />
        <Route path="/employees/:companyId/edit/:employeeId" element={<EmployeeForm />} />
        <Route path="/settings/:companyId" element={<CompanySettings />} />
        <Route path="/leave/:companyId" element={<MyLeave />} />
        <Route path="/leave-requests/:companyId" element={<LeaveRequests />} />
        <Route path="/leave-policy/:companyId" element={<LeavePolicy />} />
        <Route path="/super-admin/leave-policy" element={<DefaultLeavePolicy />} />
        <Route path="/holidays/:companyId" element={<HolidayCalendar />} />
        <Route path="/praise/:companyId" element={<PraiseWall />} />
        <Route path="/my-department/:companyId" element={<MyDepartment />} />
        <Route path="/expenses/:companyId" element={<MyExpenses />} />
        <Route path="/expenses/:companyId/submit" element={<SubmitExpense />} />
        <Route path="/expense-claims/:companyId" element={<ExpenseClaims />} />
        <Route path="/feed/:companyId" element={<CompanyFeed />} />
        <Route path="/org-chart/:companyId" element={<OrgChart />} />
        <Route path="/performance/:companyId" element={<Performance />} />
        <Route path="/team-reviews/:companyId" element={<TeamReviews />} />
        <Route path="/review-cycles/:companyId" element={<ReviewCycles />} />
        <Route path="/employees/:companyId/checklist/:employeeId" element={<EmployeeChecklist />} />
        <Route path="/employees/:companyId/documents/:employeeId" element={<EmployeeDocuments />} />
        <Route path="/my-documents/:companyId" element={<MyDocuments />} />
        <Route path="/documents/:companyId" element={<DocumentCenter />} />
        <Route path="/assets/:companyId" element={<AssetInventory />} />
        <Route path="/my-assets/:companyId" element={<MyAssets />} />
        <Route path="/resignations/:companyId" element={<Resignations />} />
        <Route path="/resign" element={<Resign />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
