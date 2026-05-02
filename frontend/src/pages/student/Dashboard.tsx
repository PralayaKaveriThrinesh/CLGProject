import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FileCode, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart, 
  Plus,
  Loader2,
  Trophy,
  Sparkles
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const StudentDashboard: React.FC = () => {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [announcement, setAnnouncement] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('user_token');
                const subResponse = await axios.get('http://localhost:8081/api/submissions/my', {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                setSubmissions(subResponse.data);

                const annResponse = await axios.get('http://localhost:8081/api/announcements/latest');
                if (annResponse.status === 200) {
                    setAnnouncement(annResponse.data);
                }
            } catch (error) {
                console.error("Dashboard fetch failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const avgSimilarity = submissions.length > 0 
        ? (submissions.reduce((acc, sub) => acc + (sub.similarityScore || 0), 0) / submissions.length).toFixed(1)
        : '0';

    const pendingReviews = submissions.filter(s => s.status === 'PENDING').length;
    const avgScore = parseFloat(avgSimilarity);
    const qualityScore = avgScore > 70 ? 'C' : avgScore > 40 ? 'B' : 'A';

    const stats = [
        { label: 'Total Submissions', value: isLoading ? '...' : submissions.length.toString(), icon: FileCode, color: 'text-primary-500' },
        { label: 'Avg Similarity', value: `${avgSimilarity}%`, icon: BarChart, color: 'text-emerald-500' },
        { label: 'Pending Reviews', value: isLoading ? '...' : pendingReviews.toString(), icon: Clock, color: 'text-amber-500' },
        { label: 'Quality Score', value: isLoading ? '...' : qualityScore, icon: CheckCircle2, color: 'text-indigo-500' },
    ];

    const recentSubmissions = submissions.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">Student Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 transition-colors">Monitor your code quality and plagiarism reports.</p>
        </div>
        <Button onClick={() => navigate('/student/upload')}>
            <Plus className="w-5 h-5 mr-2" />
            New Submission
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 sm:p-6 flex items-center space-x-4 border-none shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-2xl bg-khaki-100 dark:bg-slate-800 ${stat.color} transition-colors`}>
                <stat.icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors uppercase font-bold tracking-wider">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white transition-colors">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <Card title="Recent Submissions">
                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-khaki-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm transition-colors">
                                <th className="pb-4 font-medium">Filename</th>
                                <th className="pb-4 font-medium">Date</th>
                                <th className="pb-4 font-medium">Similarity</th>
                                <th className="pb-4 font-medium">Status</th>
                                <th className="pb-4 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-khaki-100 dark:divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                            <p>Loading dashboard...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : recentSubmissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        No recent activity. Start by uploading code!
                                    </td>
                                </tr>
                            ) : recentSubmissions.map((sub) => (
                                <tr key={sub.id} className="text-slate-700 dark:text-slate-300 transition-colors group">
                                    <td className="py-4 flex items-center space-x-2">
                                        <FileCode className="w-4 h-4 text-primary-500" />
                                        <span className="font-medium">
                                            {sub.language === 'python' ? 'main.py' : 
                                             sub.language === 'html' ? 'index.html' : 
                                             sub.language === 'javascript' ? 'script.js' : 
                                             sub.language === 'java' ? 'Solution.java' : 
                                             `submission_${sub.id}.${sub.language === 'cpp' ? 'cpp' : sub.language}`}
                                        </span>
                                    </td>
                                    <td className="py-4 text-sm">{new Date(sub.createdAt).toLocaleDateString()}</td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            (sub.similarityScore || 0) > 70 ? 'bg-red-500/10 text-red-500' : 
                                            (sub.similarityScore || 0) > 40 ? 'bg-amber-500/10 text-amber-500' : 
                                            'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                            {(sub.similarityScore || 0).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className={`flex items-center text-xs font-medium ${sub.status === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`}>
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> {sub.status}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <button 
                                            onClick={() => navigate(`/student/analysis/${sub.id}`)}
                                            className="text-primary-500 hover:text-primary-400 text-sm font-medium"
                                        >
                                            View Report
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Card title="AI Insights" subtitle="Recent suggestions for your code">
                <div className="space-y-4 mt-6">
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-khaki-200 dark:border-slate-800 transition-colors">
                        <p className="text-sm text-slate-900 dark:text-white font-medium mb-1">Complexity Alert</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Your BinarySearch.py has a high cyclomatic complexity in the main loop.</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-khaki-200 dark:border-slate-800 transition-colors">
                        <p className="text-sm text-slate-900 dark:text-white font-medium mb-1">Style Improvement</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Consider using list comprehensions in QuickSort.java for better readability.</p>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full text-xs text-primary-600 dark:text-primary-400 hover:bg-khaki-100 dark:hover:bg-slate-800">View All Suggestions</Button>
                </div>
            </Card>
        </div>
      </div>

      {announcement && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-primary-600 p-8 text-white shadow-2xl animate-in slide-in-from-bottom-4 duration-1000 group mt-8">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 opacity-10 transition-transform group-hover:scale-110 duration-700">
            <Trophy size={200} />
          </div>
          <div className="relative flex items-center space-x-6">
            <div className="flex-shrink-0 p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <Trophy size={48} className="text-yellow-300" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles size={16} className="text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Weekly Achiever Announcement</span>
              </div>
              <h2 className="text-2xl font-bold">Outstanding Performance: {announcement.user.name}</h2>
              <p className="text-indigo-50/90 text-sm leading-relaxed max-w-2xl italic">
                "{announcement.message}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
