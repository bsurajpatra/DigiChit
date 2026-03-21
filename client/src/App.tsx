import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { GuestRoute } from './components/routes/GuestRoute';

// Layouts
import { DashboardLayout } from './components/layouts/DashboardLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { VerifyEmail } from './pages/auth/VerifyEmail';
import { VerifyEmailInfo } from './pages/auth/VerifyEmailInfo';
import { ResendVerification } from './pages/auth/ResendVerification';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// KYC Pages
import { SubmitKYC } from './pages/kyc/SubmitKYC';
import { KYCStatus } from './pages/kyc/KYCStatus';

// Dashboard & Admin
import { Dashboard } from './pages/dashboard/Dashboard';
import { Profile } from './pages/dashboard/Profile';
import { OrganizerStatus } from './pages/dashboard/OrganizerStatus';
import { Support } from './pages/dashboard/Support';
import { CreateChit } from './pages/organizer/CreateChit';
import { MyOrganizedChits } from './pages/organizer/MyChits';
import { ChitDiscovery } from './pages/dashboard/ChitDiscovery';
import { UserChits } from './pages/dashboard/UserChits';
import { ChitDetails } from './pages/dashboard/ChitDetails';
import { KYCPanel } from './pages/admin/KYCPanel';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OrganizerApplications } from './pages/admin/OrganizerApplications';
import ContactQueries from './pages/admin/ContactQueries';
import { JoinInvite } from './pages/dashboard/JoinInvite';

// Legacy components (can be phased out)
import LandingPage from './components/LandingPage';

// Utilities
import ScrollToTop from './components/ScrollToTop';

// Informational / Legal Pages
import AboutUs from './components/AboutUs';
import Contact from './pages/legal/Contact';
import TermsAndConditions from './pages/legal/TermsAndConditions';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import Disclaimer from './pages/legal/Disclaimer';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <ScrollToTop />
                <Routes>
                    {/* Public Landing Page */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Public Info / Legal Pages */}
                    <Route path="/about-us" element={<AboutUs />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/disclaimer" element={<Disclaimer />} />

                    {/* Guest Only Routes (Login, Signup, Reset) */}
                    <Route element={<GuestRoute />}>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                    </Route>

                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/verify-email-info" element={<VerifyEmailInfo />} />
                    <Route path="/resend-verification" element={<ResendVerification />} />
                    <Route path="/join/:id" element={<JoinInvite />} />

                    {/* Protected Routes Wrapper */}
                    <Route element={<ProtectedRoute />}>
                        {/* KYC Requires auth but runs before dashboard accesses */}
                        <Route path="/kyc/submit" element={<SubmitKYC />} />
                        <Route path="/kyc/status" element={<KYCStatus />} />

                        {/* Dashboard Layout includes the Sidebar */}
                        <Route element={<DashboardLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/organizer-status" element={<OrganizerStatus />} />
                            <Route path="/support" element={<Support />} />
                            <Route path="/join-chit" element={<ChitDiscovery />} />
                            <Route path="/my-chits" element={<UserChits />} />
                            <Route path="/chit-details/:id" element={<ChitDetails />} />

                            {/* Organizer specific routes */}
                            <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
                                <Route path="/organizer/create-chit" element={<CreateChit />} />
                                <Route path="/organizer/my-chits" element={<MyOrganizedChits />} />
                            </Route>

                            {/* Admin specific routes */}
                            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} unauthorizedRedirect="/" />}>
                                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                <Route path="/admin/kyc" element={<KYCPanel />} />
                                <Route path="/admin/organizers" element={<OrganizerApplications />} />
                                <Route path="/admin/queries" element={<ContactQueries />} />
                            </Route>
                        </Route>
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
