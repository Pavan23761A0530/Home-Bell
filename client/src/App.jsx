import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './components/layouts/PublicLayout';
import CustomerLayout from './components/layouts/CustomerLayout';
import ProviderLayout from './components/layouts/ProviderLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import OTPVerify from './pages/OTPVerify';
import Services from './pages/Services';
import BecomeProvider from './pages/BecomeProvider';
import Dashboard from './pages/Dashboard';
import AddressBook from './pages/AddressBook';
import BookService from './pages/BookService';
import BookingDetails from './pages/BookingDetails';
import RateProvider from './pages/RateProvider';
import ProviderDashboard from './pages/ProviderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminBookings from './pages/AdminBookings';
import AdminContract from './pages/AdminContract';
import AdminServices from './pages/AdminServices';
import AdminSettings from './pages/AdminSettings';
import AdminDisputes from './pages/AdminDisputes';
import AdminAudit from './pages/AdminAudit';
import AdminAssignment from './pages/AdminAssignment';
import AdminNotifications from './pages/AdminNotifications';
import ProviderServices from './pages/ProviderServices';
import ProviderJobs from './pages/ProviderJobs';
import ProviderJobDetails from './pages/ProviderJobDetails';
import ProviderSettings from './pages/ProviderSettings';
import ProviderProfile from './pages/ProviderProfile';
import ProviderEarnings from './pages/ProviderEarnings';
import Payment from './pages/Payment';
import ProviderSearching from './pages/ProviderSearching';
import ContractReview from './pages/ContractReview';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerProfile from './pages/WorkerProfile';
import WorkerLayout from './components/layouts/WorkerLayout';
import CustomerProfile from './pages/CustomerProfile';

// const NotFound = () => <div className="p-8">404 Not Found</div>; // Replaced by distinct component

import { Toaster } from 'react-hot-toast';
import AIChatbot from './components/AIChatbot';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster position="top-right" />
        <Router>
        <div className="relative min-h-screen z-10">
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/otp-verify" element={<OTPVerify />} />
              <Route path="/services" element={<Services />} />
              <Route path="/become-provider" element={<BecomeProvider />} />
            </Route>

            {/* Auth Routes (Standalone) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Booking Route - Accessible to all authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/book/:serviceId" element={<BookService />} />
              <Route path="/bookings/:bookingId" element={<BookingDetails />} />
              <Route path="/bookings/:bookingId/searching" element={<ProviderSearching />} />
              <Route path="/bookings/:bookingId/contract" element={<ContractReview />} />
              <Route path="/payment/:bookingId" element={<Payment />} />
              <Route path="/bookings/:bookingId/rate" element={<RateProvider />} />
              <Route path="/rate-provider" element={<RateProvider />} />
            </Route>

            {/* Customer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer', 'user']} />}>
              <Route path="/dashboard" element={<CustomerLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="bookings" element={<Dashboard />} />
                <Route path="saved-addresses" element={<AddressBook />} />
                <Route path="profile" element={<CustomerProfile />} />
                <Route path="payment" element={<Dashboard />} />
                <Route path="settings" element={<Dashboard />} />
                <Route path="support" element={<Dashboard />} />
              </Route>
            </Route>

            {/* Provider Routes */}
            <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
              <Route path="/provider" element={<ProviderLayout />}>
                <Route index element={<ProviderDashboard />} />
                <Route path="dashboard" element={<ProviderDashboard />} />
                <Route path="jobs" element={<ProviderJobs />} />
                <Route path="jobs/:jobId" element={<ProviderJobDetails />} />
                <Route path="services" element={<ProviderServices />} />
                <Route path="earnings" element={<ProviderEarnings />} />
                <Route path="profile" element={<ProviderProfile />} />
                <Route path="settings" element={<ProviderSettings />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="contracts" element={<AdminContract />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="assignment" element={<AdminAssignment />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="disputes" element={<AdminDisputes />} />
                <Route path="audit" element={<AdminAudit />} />
              </Route>
            </Route>

            {/* Worker Routes */}
            <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
              <Route path="/worker" element={<WorkerLayout />}>
                <Route path="dashboard" element={<WorkerDashboard />} />
                <Route path="profile" element={<WorkerProfile />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIChatbot />
        </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
