import React, { useEffect, useState } from 'react';
import { FileCode, Search, Filter, ChevronRight, Eye, Loader2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SubmissionHistory: React.FC = () => {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('user_token');
            const response = await axios.get('http://localhost:8081/api/submissions/my', {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            setSubmissions(response.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return { date: 'Pending', time: '...' };
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return { date: 'Recently', time: '...' };
            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '4-digit' }),
                time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
            };
        } catch (e) {
            return { date: 'Processing', time: '...' };
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-1 animate-in fade-in duration-500">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Your Code Reports</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors mt-1">
                        Timeline of all your code submissions and their analysis results.
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-khaki-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-khaki-50/50 dark:bg-slate-950/50">
                                <tr className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest border-b border-khaki-100 dark:border-slate-800">
                                    <th className="px-6 py-4">Submission</th>
                                    <th className="px-6 py-4">Language</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Risk Level</th>
                                    <th className="px-6 py-4 text-right">Preview</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-khaki-100 dark:divide-slate-800/50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center space-y-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                                <p className="text-slate-500 text-sm animate-pulse">Syncing reports...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : submissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center space-y-2 opacity-50">
                                                <FileCode size={40} className="text-slate-300" />
                                                <p className="text-slate-500">No submissions yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    submissions.map((sub) => {
                                        const { date, time } = formatDate(sub.createdAt);
                                        const similarity = sub.status === 'COMPLETED' ? `${(sub.similarityScore || 0).toFixed(1)}%` : "Pending...";
                                        const riskPercent = sub.similarityScore || 0;
                                        return (
                                            <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`p-2 rounded-lg ${sub.language === 'python' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            <FileCode size={18} />
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                            SUB-{sub.id}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-tighter">
                                                        {sub.language}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{date}</div>
                                                    <div className="text-[10px] text-slate-400">{time}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`text-xs font-bold ${riskPercent > 70 ? 'text-red-500' : riskPercent > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                            {similarity}
                                                        </span>
                                                        <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full transition-all duration-1000 ${riskPercent > 70 ? 'bg-red-500' : riskPercent > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                                                style={{ width: sub.status === 'COMPLETED' ? `${riskPercent}%` : '0%' }} 
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        onClick={() => navigate(`/student/analysis/${sub.id}`)}
                                                        className="p-2 hover:bg-primary-500/10 hover:text-primary-500 rounded-full transition-all text-slate-400"
                                                        title="View Full Report"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubmissionHistory;
