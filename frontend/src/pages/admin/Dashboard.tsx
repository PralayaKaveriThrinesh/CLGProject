import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    Users, 
    FileText, 
    AlertCircle, 
    TrendingUp,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import Card from '../../components/common/Card';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    LineChart, 
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const AdminDashboard: React.FC = () => {
    const [liveStats, setLiveStats] = useState({ totalUsers: 0, totalSubmissions: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:8081/api/admin/stats');
                setLiveStats(response.data);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { label: 'Total Users', value: liveStats.totalUsers.toLocaleString(), icon: Users, color: 'text-primary-500' },
        { label: 'Submissions', value: liveStats.totalSubmissions.toLocaleString(), icon: FileText, color: 'text-indigo-500' },
        { label: 'Flagged Cases', value: '4', icon: ShieldAlert, color: 'text-red-500' },
        { label: 'Avg Similarity', value: '18%', icon: TrendingUp, color: 'text-emerald-500' },
    ];

    const submissionData = [
        { name: 'Mon', count: 400 },
        { name: 'Tue', count: 300 },
        { name: 'Wed', count: 600 },
        { name: 'Thu', count: 800 },
        { name: 'Fri', count: 500 },
        { name: 'Sat', count: 200 },
        { name: 'Sun', count: 100 },
    ];

    const pieData = [
        { name: 'Python', value: 450 },
        { name: 'Java', value: 300 },
        { name: 'C++', value: 200 },
        { name: 'JS', value: 150 },
    ];

    const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">System Analytics</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">Global submission trends and plagiarism statistics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.label} className="p-4 flex items-center space-x-4">
                        <div className={`p-3 rounded-lg bg-khaki-100 dark:bg-slate-800 ${stat.color} transition-colors`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Submission Volume (Weekly)">
                    <div className="h-80 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={submissionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Language Distribution">
                    <div className="h-80 w-full mt-4 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col space-y-2 right-8 top-1/2 -translate-y-1/2">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-xs text-gray-400">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <Card title="Plagiarism Severity Trends">
                <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={submissionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip 
                                 contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                            />
                            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default AdminDashboard;
