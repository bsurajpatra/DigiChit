import { Navigate } from 'react-router-dom';

export const MyInstallmentsPage = () => {
    return <Navigate to="/payments?tab=dues" replace />;
};
