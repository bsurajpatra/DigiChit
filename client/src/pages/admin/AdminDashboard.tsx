import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import {
    UserCheck, ArrowRight, Users
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ pendingKyc: 0, organizerApps: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [kycRes, orgRes] = await Promise.all([
                    api.get('/kyc/pending'),
                    api.get('/organizer/applications')
                ]);
                setStats({ 
                    pendingKyc: kycRes.data.data.pendings.length,
                    organizerApps: orgRes.data.data.applications.length
                });
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
        <div className="h-full flex flex-col items-center justify-center gap-10 animate-in fade-in duration-700">
            {/* Minimalist Welcome Section */}
            <div className="text-center space-y-2">
                <motion.h1
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight"
                >
                    Welcome back, <span className="text-emerald-600">{user?.name || 'Admin'}</span>
                </motion.h1>
                <motion.p
                    initial={{ y: -5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-xs text-slate-400 font-extrabold uppercase tracking-[0.2em]"
                >
                    Administrative Command Center
                </motion.p>
            </div>

            {/* Focused Action Cards */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card
                        onClick={() => navigate('/admin/kyc')}
                        className="p-8 rounded-[2.5rem] border-none shadow-2xl shadow-emerald-200/50 bg-white hover:shadow-emerald-300/50 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform flex-none">
                                <UserCheck className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pending KYC</p>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.pendingKyc}</h2>
                            </div>
                            <div className="ml-auto p-2 bg-transparent group-hover:translate-x-1 transition-transform">
                                <ArrowRight className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card
                        onClick={() => navigate('/admin/applications')}
                        className="p-8 rounded-[2.5rem] border-none shadow-2xl shadow-blue-200/50 bg-white hover:shadow-blue-300/50 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform flex-none">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Organizer Apps</p>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.organizerApps}</h2>
                            </div>
                            <div className="ml-auto p-2 bg-transparent group-hover:translate-x-1 transition-transform">
                                <ArrowRight className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};
