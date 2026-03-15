import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import {
    UserCheck, ArrowRight, ShieldCheck
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pendingKyc: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const kycRes = await api.get('/kyc/pending');
                setStats({ pendingKyc: kycRes.data.data.pendings.length });
            } catch (err: any) {
                console.error('Failed to fetch dashboard stats', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) return <div className="h-[80vh] flex items-center justify-center"><Loader size="lg" /></div>;

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-8 animate-in fade-in duration-700">
            {/* Minimalist Welcome Section */}
            <div className="text-center space-y-2">
                <motion.h1
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight"
                >
                    Welcome back, <span className="text-blue-600">{user?.name || 'Admin'}</span>
                </motion.h1>
                <motion.p
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-sm text-slate-400 font-bold uppercase tracking-widest"
                >
                    Administrative Command Center
                </motion.p>
            </div>

            {/* Focused Action Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm"
            >
                <Card
                    onClick={() => navigate('/admin/kyc')}
                    className="p-8 rounded-[2.5rem] border-none shadow-2xl shadow-blue-100 bg-white hover:shadow-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform flex-none">
                            <UserCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pending KYC</p>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.pendingKyc}</h2>
                        </div>
                        <div className="ml-auto p-2 bg-transparent group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};
