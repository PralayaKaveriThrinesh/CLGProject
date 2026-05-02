import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, FileCode, Search, AlertTriangle, ShieldCheck, Zap, Loader2, Download } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import axios from 'axios';
import { jsPDF } from 'jspdf';

const CodeAnalysis: React.FC = () => {
    const { id } = useParams();
    const [submission, setSubmission] = React.useState<any>(null);
    const [aiSuggestions, setAiSuggestions] = React.useState<string>('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isAiLoading, setIsAiLoading] = React.useState(true);
    const [reportTheme, setReportTheme] = React.useState('vs-dark');

    const toggleTheme = () => {
        setReportTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark');
    };

    useEffect(() => {
        fetchData();
        fetchSuggestions();
    }, [id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('user_token');
            const response = await axios.get(`http://localhost:8081/api/submissions/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            console.log("Submission API Response:", response.data);
            setSubmission(response.data);
        } catch (error) {
            console.error("Failed to fetch submission data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSuggestions = async () => {
        setIsAiLoading(true);
        try {
            const token = localStorage.getItem('user_token');
            const response = await axios.get(`http://localhost:8081/api/analysis/ai-suggestions/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            setAiSuggestions(response.data.suggestions);
        } catch (error) {
            console.error("Failed to fetch AI suggestions", error);
            setAiSuggestions("Unable to generate AI suggestions at this time.");
        } finally {
            setIsAiLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
                <p className="text-slate-500 animate-pulse">Generating Report...</p>
            </div>
        );
    }

    const downloadReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Header
        doc.setFillColor(14, 165, 233); // Primary color
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text("CodeGuardian Report", 20, 25);
        
        doc.setFontSize(10);
        doc.text(`Report ID: #${id}`, pageWidth - 50, 25);
        
        // Summary Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.text("Submission Summary", 20, 55);
        
        doc.setFontSize(11);
        doc.text(`Language: ${submission?.language?.toUpperCase()}`, 20, 65);
        doc.text(`Similarity Score: ${(submission?.similarityScore || 0).toFixed(1)}%`, 20, 72);
        doc.text(`Risk Status: ${(submission?.similarityScore || 0) > 70 ? 'High' : (submission?.similarityScore || 0) > 40 ? 'Medium' : 'Low'}`, 20, 79);
        doc.text(`Generated On: ${new Date().toLocaleString()}`, 20, 86);
        
        // Code Section
        doc.setFontSize(16);
        doc.text("Your Uploaded Code", 20, 105);
        doc.setFontSize(9);
        doc.setFont("courier", "normal");
        const splitCode = doc.splitTextToSize(submission?.code || "", pageWidth - 40);
        doc.text(splitCode, 20, 115);
        
        // AI Section on new page
        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(16, 185, 129); // Emerald-500
        doc.text("AI Intelligence Analysis", 20, 25);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        const splitAi = doc.splitTextToSize(aiSuggestions, pageWidth - 40);
        doc.text(splitAi, 20, 40);
        
        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount} - CodeGuardian AI Assistant`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
        
        doc.save(`CodeGuardian_Report_${id}.pdf`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4">
                <Link to="/student/dashboard">
                    <Button variant="ghost" size="sm">
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back
                    </Button>
                </Link>
                <div className="flex-1 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Analysis Report #{id}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors text-uppercase">
                            {submission?.language} Submission
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={downloadReport}
                            className="flex items-center gap-2 shadow-lg shadow-primary-500/20"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={toggleTheme}
                            className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-white dark:bg-slate-800 border border-khaki-200 dark:border-slate-700 text-amber-500"
                        >
                            {reportTheme === 'vs-dark' ? '🌞' : '🌙'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className={`flex items-center space-x-4 p-4 border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 text-center ${
                    (submission?.similarityScore || 0) > 70 ? 'border-red-500/20 bg-red-500/5' : (submission?.similarityScore || 0) > 40 ? 'border-amber-500/20 bg-amber-500/5' : ''
                }`}>
                    <div className={`p-3 rounded-lg ${(submission?.similarityScore || 0) > 70 ? 'bg-red-500/20 text-red-500' : (submission?.similarityScore || 0) > 40 ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold tracking-wider opacity-60">Risk Status</p>
                        <p className={`text-xl font-bold transition-colors ${(submission?.similarityScore || 0) > 70 ? 'text-red-500' : (submission?.similarityScore || 0) > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {(submission?.similarityScore || 0) > 70 ? 'High Risk' : (submission?.similarityScore || 0) > 40 ? 'Medium Risk' : 'Low Risk'}
                        </p>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4 p-4 border-primary-500/20 bg-primary-500/5 dark:bg-primary-500/10">
                    <div className="p-3 bg-primary-500/20 rounded-lg text-primary-500">
                        <Search className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-primary-500 uppercase font-bold tracking-wider">Similarity Score</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white transition-colors">
                            {submission?.status === 'COMPLETED' ? `${(submission?.similarityScore || 0).toFixed(1)}%` : 'Processing...'}
                        </p>
                    </div>
                </Card>
                <Card className="flex items-center space-x-4 p-4 border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10">
                    <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-500">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Status</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white transition-colors">
                            {submission?.status || 'PENDING'}
                        </p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                {/* Left Side: Your Uploaded Code */}
                <div className={`rounded-xl overflow-hidden border shadow-xl flex flex-col transition-all duration-300 ${
                    reportTheme === 'vs-dark' 
                    ? 'bg-slate-900 border-slate-800 text-white' 
                    : 'bg-white border-khaki-200 text-slate-900'
                }`}>
                    <div className={`p-4 border-b flex justify-between items-center transition-colors ${
                        reportTheme === 'vs-dark' ? 'bg-slate-950 border-slate-800' : 'bg-khaki-50 border-khaki-100'
                    }`}>
                        <div className="flex items-center space-x-2">
                            <FileCode className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-bold uppercase tracking-widest">Your Uploaded Code</span>
                        </div>
                        <span className="text-[10px] bg-primary-600/20 text-primary-500 px-2 py-0.5 rounded font-bold uppercase">{submission?.language}</span>
                    </div>
                    <div className={`flex-1 overflow-auto p-6 custom-scrollbar ${
                        reportTheme === 'vs-dark' ? 'bg-slate-950/40' : 'bg-slate-50'
                    }`}>
                        <pre className="text-sm leading-relaxed font-mono whitespace-pre-wrap">
                            <code className="block w-full text-inherit">
                                {submission?.code || "// Code not found or empty"}
                            </code>
                        </pre>
                    </div>
                </div>

                {/* Right Side: AI Intelligence Assistant */}
                <div className={`rounded-xl overflow-hidden border shadow-xl flex flex-col transition-all duration-300 ${
                    reportTheme === 'vs-dark' 
                    ? 'bg-slate-900 border-slate-800 text-white' 
                    : 'bg-white border-khaki-200 text-slate-900'
                }`}>
                    <div className={`p-4 border-b flex items-center space-x-2 transition-colors ${
                        reportTheme === 'vs-dark' ? 'bg-emerald-950/20 border-slate-800' : 'bg-emerald-50 border-khaki-100'
                    }`}>
                        <Zap className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold uppercase tracking-widest text-emerald-500">AI Intelligence Assistant</span>
                    </div>
                    <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                        {isAiLoading ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 text-primary-500">
                                <Loader2 className="w-10 h-10 animate-spin" />
                                <p className="text-sm animate-pulse font-bold">Consulting Ollama AI...</p>
                            </div>
                        ) : (
                            <div className={`p-5 border rounded-xl transition-all ${
                                reportTheme === 'vs-dark' 
                                ? 'bg-slate-800/40 border-emerald-500/10 text-slate-300' 
                                : 'bg-white border-emerald-500/10 text-slate-600'
                            }`}>
                                <div className="text-sm leading-relaxed font-mono whitespace-pre-wrap">
                                    {aiSuggestions}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeAnalysis;
