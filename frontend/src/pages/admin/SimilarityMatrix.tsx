import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '../../components/common/Card';
import { ShieldAlert, Info, Loader2 } from 'lucide-react';

const PlagiarismMatrix: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'matrix' | 'leaderboard' | 'users'>('users');
    const [activeAchieverEmail, setActiveAchieverEmail] = useState<string | null>(null);
    const [selectedUserForView, setSelectedUserForView] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('achieverEmail');
        if (stored) {
            setActiveAchieverEmail(stored);
        }
    }, []);

    const toggleAchiever = (email: string) => {
        if (activeAchieverEmail === email) {
            setActiveAchieverEmail(null);
            localStorage.removeItem('achieverEmail');
        } else {
            setActiveAchieverEmail(email);
            localStorage.setItem('achieverEmail', email);
        }
        window.dispatchEvent(new Event('achieverChanged'));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('user_token');
                const [matrixRes, allRes, usersRes] = await Promise.all([
                    axios.get('http://localhost:8081/api/admin/similarity-matrix', {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    }),
                    axios.get('http://localhost:8081/api/admin/submissions', {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    }),
                    axios.get('http://localhost:8081/api/admin/users', {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    })
                ]);
                console.log("Admin Submissions Response:", allRes.data);
                console.log("Admin Users Response:", usersRes.data);
                setData(matrixRes.data);
                setAllSubmissions(allRes.data);
                setAllUsers(usersRes.data);
            } catch (error) {
                console.error("Failed to fetch admin data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate Leaderboard with safety checks
    const userStats = allUsers.reduce((acc: any, user: any) => {
        acc[user.id] = { 
            id: user.id, 
            name: user.name || 'Unknown', 
            email: user.email || 'N/A',
            total: 0, 
            avgSimilarity: 0, 
            safeCount: 0 
        };
        return acc;
    }, {});

    allSubmissions.forEach((sub: any) => {
        if (!sub.user || !sub.user.id) return;
        const userId = sub.user.id;
        if (!userStats[userId]) return; // Should not happen now
        
        userStats[userId].total += 1;
        userStats[userId].avgSimilarity += (sub.similarityScore || 0);
        if ((sub.similarityScore || 0) < 30) userStats[userId].safeCount += 1;
    });

    const leaderboard = Object.values(userStats)
        .map((user: any) => ({
            ...user,
            avgSimilarity: user.total > 0 ? (user.avgSimilarity / user.total).toFixed(1) : "0.0"
        }))
        .sort((a: any, b: any) => parseFloat(a.avgSimilarity) - parseFloat(b.avgSimilarity));

    const getColor = (value: number) => {
        if (value >= 90) return 'bg-gray-800 text-gray-500';
        if (value > 70) return 'bg-red-500/20 text-red-500 font-bold';
        if (value > 40) return 'bg-amber-500/20 text-amber-500';
        if (value > 10) return 'bg-emerald-500/10 text-emerald-500';
        return 'bg-white/5 text-gray-600';
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Review Submissions</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">Cross-referencing and identifying top performers.</p>
                    {activeAchieverEmail && (
                        <div className="mt-4 inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl animate-in fade-in zoom-in duration-300">
                            <span className="text-lg">🏆</span>
                            <span className="text-sm font-bold text-emerald-500">Achiever: {activeAchieverEmail.split('@')[0]}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Users
                    </button>
                    <button 
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Leaderboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('matrix')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'matrix' ? 'bg-primary-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Similarity Matrix
                    </button>
                </div>
            </div>

            <Card className="p-8">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        <p>Scanning global submissions...</p>
                    </div>
                ) : activeTab === 'users' ? (
                    !selectedUserForView ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {leaderboard.length > 0 ? (
                                leaderboard.map((user: any) => {
                                    const isSelected = activeAchieverEmail === user.email;
                                    const isDisabled = activeAchieverEmail !== null && !isSelected;
                                    return (
                                        <div key={user.id} className={`p-4 sm:p-6 rounded-2xl border transition-all duration-300 ${isSelected ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-primary-500 uppercase">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded-md">{user.total} Submissions</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white truncate">{user.email.split('@')[0]}</h3>
                                            <p className="text-xs text-slate-500 truncate mb-6">{user.email}</p>
                                            <div className="flex flex-col space-y-3">
                                                <button 
                                                    onClick={() => setSelectedUserForView(user.id)}
                                                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    View Submissions
                                                </button>
                                                <button 
                                                    onClick={() => user.email && !isDisabled && toggleAchiever(user.email)}
                                                    disabled={isDisabled}
                                                    className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase transition-all duration-300 ${
                                                        isSelected 
                                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-[1.02]' 
                                                            : isDisabled
                                                                ? 'bg-slate-800/30 text-slate-600 cursor-not-allowed italic'
                                                                : 'bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white'
                                                    }`}
                                                >
                                                    {isSelected ? 'Selected' : isDisabled ? 'Locked' : 'Select Achiever'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                                        <ShieldAlert className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-white">No Users Found</p>
                                        <p className="text-sm">Submissions might be missing user associations. Please restart the backend.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button 
                                onClick={() => setSelectedUserForView(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-2"
                            >
                                <span>← Back to Users</span>
                            </button>
                            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="text-slate-500 text-xs uppercase tracking-wider text-left bg-slate-950">
                                            <th className="p-4">Submission</th>
                                            <th className="p-4">Language</th>
                                            <th className="p-4">Similarity</th>
                                            <th className="p-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {allSubmissions.filter((sub: any) => sub.user?.id === selectedUserForView).map((sub: any) => (
                                            <tr key={sub.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4">
                                                    <span className="text-sm font-bold text-white">#SUB-{sub.id}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded uppercase">{sub.language}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getColor(sub.similarityScore || 0)}`}>
                                                        {(sub.similarityScore || 0).toFixed(1)}%
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-bold ${sub.status === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>
                                                        {sub.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : activeTab === 'leaderboard' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-wider text-left">
                                    <th className="p-4">Student</th>
                                    <th className="p-4">Submissions</th>
                                    <th className="p-4">Avg Similarity</th>
                                    <th className="p-4">Integrity Rank</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {leaderboard.map((user: any, index: number) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-primary-500 border border-primary-500/20">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{user.name}</p>
                                                    <p className="text-[10px] text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-medium text-slate-300">{user.total} Tasks</span>
                                        </td>
                                        <td className="p-4">
                                            <div className={`px-3 py-1 rounded-full text-xs inline-block ${getColor(parseFloat(user.avgSimilarity))}`}>
                                                {user.avgSimilarity}%
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-xs font-bold ${index === 0 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                                {index === 0 ? '👑 TOP PERFORMER' : index < 3 ? 'EXCELLENT' : 'GOOD'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {(() => {
                                                const isSelected = activeAchieverEmail === user.email;
                                                const isDisabled = activeAchieverEmail !== null && !isSelected;
                                                
                                                if (isDisabled) {
                                                    return <span className="text-[10px] font-bold text-slate-600 italic opacity-50 transition-opacity">LOCKED</span>;
                                                }

                                                return (
                                                    <button 
                                                        onClick={() => user.email && toggleAchiever(user.email)}
                                                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all duration-300 shadow-lg ${
                                                            isSelected 
                                                                ? 'bg-emerald-500 text-white shadow-emerald-500/20 scale-105' 
                                                                : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
                                                        }`}
                                                    >
                                                        {isSelected ? 'Selected' : 'Select Achiever'}
                                                    </button>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="p-4 text-left">Submission A</th>
                                    <th className="p-4 text-left">Submission B</th>
                                    <th className="p-4 text-center">Logic Similarity</th>
                                    <th className="p-4 text-center">Detected On</th>
                                    <th className="p-4 text-right">Preview</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {data.map((sim) => (
                                    <tr key={sim.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">#SUB-{sim.submissionA?.id}</span>
                                                <span className="text-xs text-slate-500">{sim.submissionA?.user?.name || 'Guest'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white">#SUB-{sim.submissionB?.id}</span>
                                                <span className="text-xs text-slate-500">{sim.submissionB?.user?.name || 'Guest'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className={`px-3 py-1 rounded-full text-xs inline-block ${getColor(sim.similarityScore)}`}>
                                                {sim.similarityScore}%
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-xs text-slate-500">
                                            {new Date(sim.submissionA.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Info className="w-4 h-4 text-slate-500 ml-auto cursor-pointer hover:text-primary-500" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal removed to use pure local storage toggle functionality */}
            </Card>
        </div>
    );
};

export default PlagiarismMatrix;
