import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/routes/ProtectedRoute';
import { RoleRoute } from './components/routes/RoleRoute';

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
import { KYCPanel } from './pages/admin/KYCPanel';

// Legacy components (can be phased out)
import LandingPage from './components/LandingPage';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Landing Page */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Standalone Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/verify-email-info" element={<VerifyEmailInfo />} />
                    <Route path="/resend-verification" element={<ResendVerification />} />

                    {/* Protected Routes Wrapper */}
                    <Route element={<ProtectedRoute />}>
                        {/* KYC Requires auth but runs before dashboard accesses */}
                        <Route path="/kyc/submit" element={<SubmitKYC />} />
                        <Route path="/kyc/status" element={<KYCStatus />} />

                        {/* Dashboard Layout includes the Sidebar */}
                        <Route element={<DashboardLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            
                            {/* Admin specific routes */}
                            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                                <Route path="/admin/kyc" element={<KYCPanel />} />
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
