import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    FileCode, 
    Play, 
    Bug, 
    Send, 
    Terminal, 
    FolderTree, 
    ChevronDown,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Zap,
    Search,
    History as HistoryIcon,
    Code2,
    Square,
    Share2,
    Save,
    Wand2,
    Download,
    Cpu,
    Plus,
    X,
    Globe
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Editor, { useMonaco } from '@monaco-editor/react';
import { toast, ToastContainer } from 'react-toastify';
import { Sun, Moon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { useTheme } from '../../context/ThemeContext';

// Piston API language map — use '*' to always pick the latest available runtime
const PISTON_LANGS: Record<string, { language: string; version: string }> = {
    python:     { language: 'python',     version: '*' },
    javascript: { language: 'javascript', version: '*' },
    java:       { language: 'java',       version: '*' },
    cpp:        { language: 'c++',        version: '*' },
    c:          { language: 'c',          version: '*' },
};

const CodeIDE: React.FC = () => {
    const [files, setFiles] = useState([
        { 
            name: 'solution.py', 
            code: `def solve_problem(n):\n    # TODO: Implement algorithm\n    result = []\n    for i in range(n):\n        if i % 2 == 0:\n            result.append(i * 2)\n    return result\n\nprint(solve_problem(10))`, 
            language: 'python' 
        }
    ]);
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempFileName, setTempFileName] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const activeFile = files[activeFileIndex];
    const code = activeFile?.code || '';
    const fileName = activeFile?.name || 'untitled';
    const language = activeFile?.language || 'python';

    const langExtensions: Record<string, string> = {
        python: '.py',
        javascript: '.js',
        java: '.java',
        cpp: '.cpp',
        c: '.c',
        html: '.html'
    };

    const setCode = (newCode: string) => {
        setFiles(prev => prev.map((f, i) => i === activeFileIndex ? { ...f, code: newCode } : f));
    };

    const setFileName = (newName: string) => {
        setFiles(prev => prev.map((f, i) => i === activeFileIndex ? { ...f, name: newName } : f));
    };

    const setLanguage = (newLang: string) => {
        setFiles(prev => prev.map((f, i) => i === activeFileIndex ? { ...f, language: newLang } : f));
    };
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisStep, setAnalysisStep] = useState(0);
    const [showReport, setShowReport] = useState(false);
    const [consoleLogs, setConsoleLogs] = useState<{type: 'system' | 'error' | 'success' | 'output' | 'info', content: string}[]>([]);
    const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
    const [stdin, setStdin] = useState('');
    const [terminalInput, setTerminalInput] = useState('');
    const [submissionCount, setSubmissionCount] = useState(() => {
        return parseInt(localStorage.getItem('guest_submissions') || '0');
    });
    const [theme, setEditorTheme] = useState('vs-dark');
    const { theme: globalTheme } = useTheme();
    const [isBeautifying, setIsBeautifying] = useState(false);
    const monaco = useMonaco();
    const editorRef = useRef<any>(null);
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [consoleLogs]);

    const steps = [
        "Pre-processing code (removing comments & formatting)...",
        "Generating Abstract Syntax Tree (AST) using LogicParser...",
        "Similarity Engine calculating token-level matches...",
        "AST-based structural logic analysis in progress...",
        "Final plagiarism score calculation..."
    ];

    const addLog = (type: 'system' | 'error' | 'success' | 'output' | 'info', content: string) => {
        setConsoleLogs(prev => [...prev, { type, content }]);
    };

    const handleEditorDidMount = (editor: any, monacoInstance: any) => {
        editorRef.current = editor;
        // Enhance TS/JS IntelliSense
        if (monacoInstance?.languages?.typescript) {
            monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: false,
                noSyntaxValidation: false,
            });
            monacoInstance.languages.typescript.javascriptDefaults.setCompilerOptions({
                target: monacoInstance.languages.typescript.ScriptTarget.ESNext,
                allowNonTsExtensions: true,
            });
        }
    };

    // ── Real-time independent code runner via Piston API ──
    // ── Real-time code runner via local Backend (Independent of Auth) ──
    const handleRun = async () => {
        setConsoleLogs([]);
        setHtmlPreview(null);

        // HTML: render in iframe
        if (language === 'html') {
            addLog('system', `Rendering ${fileName}`);
            setHtmlPreview(code);
            addLog('success', 'HTML rendered in preview panel.');
            return;
        }

        setIsRunning(true);
        addLog('system', `./run ${fileName}`);
        addLog('info', `Executing via GuardianEngine...`);

        try {
            // Get token if available
            const token = localStorage.getItem('user_token');
            
            const response = await axios.post('http://localhost:8081/api/execute', 
                { language, code, input: stdin } 
            );

            const data = response.data;
            
            if (data.stderr && data.stderr.includes("NoSuchElementException")) {
                addLog('output', "Enter a string: ");
                addLog('info', "[WAITING FOR INPUT: Please type your string in the $ box below and click Run]");
            } else if (data.stderr) {
                addLog('error', `Execution Error: ${data.stderr}`);
            } else {
                if (data.output) {
                    const lines = data.output.trim().split('\n');
                    lines.forEach((line: string) => {
                        if (line.trim() !== '') addLog('output', line);
                    });
                }
                addLog('success', "Process exited successfully.");
            }

        } catch (error: any) {
            if (error.code === 'ERR_NETWORK') {
                addLog('error', 'Execution Service is offline. Please start the Backend (Port 8081).');
            } else {
                const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
                addLog('error', `Execution Error: ${errorMsg}`);
            }
        } finally {
            setIsRunning(false);
        }
    };

    const handleStop = () => {
        setIsRunning(false);
        addLog('info', 'Process terminated.');
    };

    const handleBeautify = async () => {
        if (!code.trim()) {
            toast.info("Please write some code first.");
            return;
        }

        setIsBeautifying(true);
        const beautifyToastId = "beautify-toast";
        // Dismiss all previous toasts to ensure only one message is visible at a time
        toast.dismiss();
        toast.loading("AI is beautifying your code...", { toastId: beautifyToastId });

        try {
            const response = await axios.post(
                `http://localhost:8081/api/analysis/beautify`,
                { code, language }
            );

            const beautifiedCode = response.data.beautifiedCode;

            if (beautifiedCode && !beautifiedCode.includes("AI Beautify Error")) {
                // Remove potential markdown code blocks if AI ignored the instruction
                const cleanedCode = beautifiedCode.replace(/```[a-z]*\n?|```/gi, '').trim();
                setCode(cleanedCode);
                toast.update(beautifyToastId, { 
                    render: "Code beautified successfully!", 
                    type: "success", 
                    isLoading: false, 
                    autoClose: 3000 
                });
            } else {
                throw new Error(beautifiedCode || "No response from AI");
            }
        } catch (error: any) {
            console.error("Beautify Error:", error);
            const errorMessage = error.response?.data?.beautifiedCode || error.message;
            toast.update(beautifyToastId, { 
                render: errorMessage.includes("429") ? "AI is busy (Rate Limit). Please wait a moment." : "Failed to beautify code. " + errorMessage, 
                type: "error", 
                isLoading: false, 
                autoClose: 5000 
            });
        } finally {
            setIsBeautifying(false);
        }
    };

    const handleSave = () => {
        localStorage.setItem('saved_code', code);
    };

    const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        saveAs(blob, fileName);
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
    };

    const handleCreateFile = () => {
        const ext = langExtensions[language] || '.py';
        const newName = `file${files.length + 1}${ext}`;
        const newFile = {
            name: newName,
            code: '// New code file',
            language: language
        };
        setFiles([...files, newFile]);
        setActiveFileIndex(files.length);
        setEditingIndex(files.length);
        setTempFileName(newName);
    };

    const handleRenameFile = (idx: number, newName: string) => {
        if (!newName.trim()) {
            setEditingIndex(null);
            return;
        }
        setFiles(prev => prev.map((f, i) => i === idx ? { ...f, name: newName } : f));
        setEditingIndex(null);
    };

    const handleDeleteFile = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        if (files.length <= 1) return;
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
        if (activeFileIndex >= index) {
            setActiveFileIndex(Math.max(0, activeFileIndex - 1));
        }
    };

    const handleSubmit = async () => {
        if (!localStorage.getItem('user_token')) {
            toast.error("Please login to submit your code for plagiarism analysis.");
            navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
            return;
        }

        setIsAnalyzing(true);
        setAnalysisStep(0);
        // Ensure only one message is visible
        toast.dismiss();
        setConsoleLogs([`[SYSTEM] Connecting to CodeGuardian Analysis Pipeline...`]);
        
        try {
            const token = localStorage.getItem('user_token');
            // Real Submission
            const response = await axios.post('http://localhost:8081/api/submissions', 
                { language, code },
                {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                }
            );
            
            const submission = response.data;
            addLog(`[SUCCESS] Code submitted! ID: ${submission.id}`);
            
            // Artificial delay to show steps for premium feel as requested
            let currentStep = 0;
            const interval = setInterval(() => {
                if (currentStep < steps.length) {
                    addLog(`[INFO] ${steps[currentStep]}`);
                    setAnalysisStep(currentStep + 1);
                    currentStep++;
                } else {
                    clearInterval(interval);
                    setIsAnalyzing(false);
                    toast.success("Analysis Complete!");
                    navigate(`/student/analysis/${submission.id}`);
                }
            }, 800);

        } catch (error: any) {
            setIsAnalyzing(false);
            const errorMsg = error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : error.message);
            addLog(`[ERROR] Submission failed: ${errorMsg}`);
            toast.error(`Submission failed: ${errorMsg}`, { toastId: 'submit-error' });
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("CodeGuardian Plagiarism Report", 20, 20);
        doc.setFontSize(12);
        doc.text(`Submission ID: #SUB-20240327-01`, 20, 35);
        doc.text(`Overall Similarity Score: 12%`, 20, 45);
        doc.text(`Lexical Similarity: 14.5%`, 20, 55);
        doc.text(`Structural Similarity: 8.2%`, 20, 65);
        doc.text(`Logic Similarity: 5.0%`, 20, 75);
        doc.text("--------------------------------------------------", 20, 85);
        doc.text("Code Preview:", 20, 95);
        doc.setFontSize(8);
        const splitCode = doc.splitTextToSize(code, 170);
        doc.text(splitCode, 20, 105);
        doc.save('Plagiarism_Report.pdf');
    };

    const downloadWord = () => {
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        children: [new TextRun({ text: "CodeGuardian Plagiarism Report", bold: true, size: 32 })],
                    }),
                    new Paragraph({ text: `Submission ID: #SUB-20240327-01` }),
                    new Paragraph({ text: `Overall Similarity Score: 12%` }),
                    new Paragraph({ text: `Lexical Similarity: 14.5%` }),
                    new Paragraph({ text: `Structural Similarity: 8.2%` }),
                    new Paragraph({ text: `Logic Similarity: 5.0%` }),
                    new Paragraph({ text: "\nCode Preview:\n" }),
                    new Paragraph({ text: code }),
                ],
            }],
        });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, "Plagiarism_Report.docx");
        });
    };

    if (showReport) {
        return (
            <div className="space-y-6 animate-in fade-in duration-700 pb-12">
                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-khaki-200 dark:border-slate-700 glass">
                    <div className="flex items-center space-x-3">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Plagiarism Analysis Report</h2>
                            <p className="text-sm text-slate-500">Submission ID: #SUB-20240327-01</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={downloadPDF} className="flex items-center">
                            <Download className="w-4 h-4 mr-2" /> PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadWord} className="flex items-center">
                            <Download className="w-4 h-4 mr-2" /> Word
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowReport(false)}>Back to Editor</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="md:col-span-1 flex flex-col items-center justify-center p-8 border-primary-500/20 bg-primary-50 dark:bg-primary-900/10">
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Overall Score</p>
                        <div className="relative flex items-center justify-center">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-khaki-100 dark:text-slate-700" />
                                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * 0.88} className="text-primary-500 transition-all duration-1000 ease-out" />
                            </svg>
                            <span className="absolute text-3xl font-bold text-slate-900 dark:text-white">12%</span>
                        </div>
                        <p className="mt-4 text-xs font-medium text-emerald-500 flex items-center">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Safe Submission
                        </p>
                    </Card>

                    <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Card className="flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <Search className="text-primary-500" size={24} />
                                <span className="text-xs bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded font-bold">TOKENS</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">14.5%</p>
                                <p className="text-xs text-slate-500">Lexical similarity found</p>
                            </div>
                        </Card>
                        <Card className="flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <Code2 className="text-indigo-500" size={24} />
                                <span className="text-xs bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded font-bold">STRUCTURAL</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">8.2%</p>
                                <p className="text-xs text-slate-500">AST semantic match</p>
                            </div>
                        </Card>
                        <Card className="flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <Zap className="text-amber-500" size={24} />
                                <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-bold">LOGIC</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">5.0%</p>
                                <p className="text-xs text-slate-500">Algorithmic logic match</p>
                            </div>
                        </Card>
                    </div>
                </div>

                <Card title="Code Quality & Complexity" className="dark:bg-slate-800 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Cyclomatic Complexity</span>
                                <span className="text-emerald-500 font-bold">3 (Low)</span>
                            </div>
                            <div className="w-full h-2 bg-khaki-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[30%]" />
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Maintainability Index</span>
                                <span className="text-primary-500 font-bold">85/100</span>
                            </div>
                            <div className="w-full h-2 bg-khaki-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 w-[85%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Suggestions:</p>
                            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                                <li className="flex items-start">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-2 mt-0.5" />
                                    Good use of list append in Pythonic way.
                                </li>
                                <li className="flex items-start">
                                    <AlertTriangle className="w-3 h-3 text-amber-500 mr-2 mt-0.5" />
                                    Consider adding type hints for better type safety.
                                </li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <ToastContainer 
                theme="colored" 
                icon={false} 
                hideProgressBar={true} 
                limit={1} 
                position="top-center"
            />
            
            {/* Optimized Header / Toolbar */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-xl border border-khaki-200 dark:border-slate-800 shadow-md overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-2 px-2 min-w-max">
                    <Code2 className="text-primary-500 w-5 h-5" />
                    <span className="hidden sm:inline text-sm font-bold text-slate-900 dark:text-white">CodeGuardian IDE</span>
                    
                    <select 
                        value={language}
                        onChange={(e) => {
                            const newLang = e.target.value;
                            setLanguage(newLang);
                            const defaults: Record<string, { name: string, code: string }> = {
                                python: {
                                    name: 'solution.py',
                                    code: 'def solve_problem(n):\n    # TODO: Implement algorithm\n    result = []\n    for i in range(n):\n        if i % 2 == 0:\n            result.append(i * 2)\n    return result\n\nprint(solve_problem(10))'
                                },
                                javascript: {
                                    name: 'solution.js',
                                    code: 'function solveProblem(n) {\n    // TODO: Implement algorithm\n    const result = [];\n    for (let i = 0; i < n; i++) {\n        if (i % 2 === 0) {\n            result.push(i * 2);\n        }\n    }\n    return result;\n}\n\nconsole.log(solveProblem(10));'
                                },
                                java: {
                                    name: 'Main.java',
                                    code: 'public class Main {\n    public static void main(String[] args) {\n        // TODO: Implement algorithm\n        System.out.println("Hello, World!");\n    }\n}'
                                },
                                cpp: {
                                    name: 'main.cpp',
                                    code: '#include <iostream>\n\nint main() {\n    // TODO: Implement algorithm\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
                                },
                                c: {
                                    name: 'main.c',
                                    code: '#include <stdio.h>\n\nint main() {\n    // TODO: Implement algorithm\n    printf("Hello, World!\\n");\n    return 0;\n}'
                                },
                                html: {
                                    name: 'index.html',
                                    code: '<!DOCTYPE html>\n<html>\n<head>\n    <title>Demo</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>'
                                }
                            };
                            if (defaults[newLang]) {
                                setCode(defaults[newLang].code);
                                setFileName(defaults[newLang].name);
                            }
                        }}
                        className="text-xs bg-white dark:bg-slate-800 border border-khaki-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500 text-slate-700 dark:text-slate-300 ml-2"
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="c">C</option>
                        <option value="html">HTML/CSS/JS</option>
                    </select>

                    <span className="hidden lg:inline text-[10px] px-3 py-1 rounded-full font-black ml-4 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                        PRO PLAN ACTIVATED (UNLIMITED)
                    </span>
                </div>

                <div className="flex items-center space-x-2 sm:space-x-3 px-2 min-w-max">
                    <Button variant="outline" size="sm" onClick={handleRun} disabled={isRunning} className="h-8 sm:h-9 px-2 sm:px-3 border-khaki-200 text-emerald-600 hover:bg-emerald-50">
                        {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 sm:mr-1.5" />}
                        <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Run'}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleStop} disabled={!isRunning} className="h-8 sm:h-9 px-2 sm:px-3 border-khaki-200 text-red-500 hover:bg-red-50">
                        <Square className="w-3 h-3 sm:mr-1.5" /> <span className="hidden sm:inline">Stop</span>
                    </Button>
                    
                    <div className="hidden sm:block w-px h-6 bg-khaki-200 dark:bg-slate-700 mx-1" />
                    
                    <button 
                        onClick={handleBeautify} 
                        disabled={isBeautifying}
                        className={`p-1.5 transition-colors ${isBeautifying ? 'text-primary-500 animate-pulse' : 'text-slate-500 hover:text-primary-500'}`} 
                        title="AI Beautify (Pro)"
                    >
                        {isBeautifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    </button>
                    <button onClick={handleSave} className="hidden sm:block p-1.5 text-slate-500 hover:text-primary-500 transition-colors" title="Save">
                        <Save className="w-4 h-4" />
                    </button>
                    <button onClick={handleShare} className="p-1.5 text-slate-500 hover:text-primary-500 transition-colors" title="Share">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={handleDownload} className="hidden sm:block p-1.5 text-slate-500 hover:text-primary-500 transition-colors" title="Download">
                        <Download className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-khaki-200 dark:bg-slate-700 mx-1" />
                    
                    <button 
                        onClick={() => setEditorTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
                        className="p-1.5 transition-colors text-slate-500 hover:text-amber-500"
                        title="Toggle IDE Theme"
                    >
                        {theme === 'vs-dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    <div className="w-px h-6 bg-khaki-200 dark:bg-slate-700 mx-1" />
                    
                    <Button size="sm" onClick={handleSubmit} isLoading={isAnalyzing} className="h-8 sm:h-9 px-3 sm:px-6 bg-primary-600 hover:bg-primary-700 text-white ml-2 sm:ml-4 shadow-lg shadow-primary-500/20">
                        <Send className="w-3.5 h-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Submit</span>
                    </Button>
                </div>
            </div>

            {/* Main IDE Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden border border-khaki-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-md">
                {/* Optimized Sidebar - Visible only on large screens */}
                <div className="hidden lg:flex w-56 bg-khaki-50 dark:bg-slate-950 border-r border-khaki-200 dark:border-slate-800 flex-col">
                    <div className="p-3 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-khaki-200 dark:border-slate-800">
                        <span>Explorer</span>
                        <div className="flex items-center space-x-2">
                             <button onClick={handleCreateFile} className="hover:text-primary-500 transition-colors">
                                <Plus size={14} />
                             </button>
                             <FolderTree size={12} />
                        </div>
                    </div>
                    <div className="flex-1 py-1 overflow-auto">
                        <div className="px-3 py-1 space-y-1">
                            <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider py-1">
                                <ChevronDown size={12} /> <span>Workspace</span>
                            </div>
                            <div className="space-y-0.5">
                                {files.map((file, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setActiveFileIndex(idx)}
                                        onDoubleClick={() => {
                                            setEditingIndex(idx);
                                            setTempFileName(file.name);
                                        }}
                                        className={`group flex items-center justify-between space-x-2 text-xs p-1.5 rounded cursor-pointer transition-all ${
                                            idx === activeFileIndex 
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/30' 
                                            : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                                            <FileCode size={14} className="shrink-0" /> 
                                            {editingIndex === idx ? (
                                                <input 
                                                    autoFocus
                                                    className="bg-white dark:bg-slate-900 border border-primary-500 rounded px-1 w-full outline-none"
                                                    value={tempFileName}
                                                    onBlur={() => handleRenameFile(idx, tempFileName)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRenameFile(idx, tempFileName);
                                                        if (e.key === 'Escape') setEditingIndex(null);
                                                    }}
                                                    onChange={(e) => setTempFileName(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className="truncate">{file.name}</span>
                                            )}
                                        </div>
                                        {files.length > 1 && editingIndex !== idx && (
                                            <button 
                                                onClick={(e) => handleDeleteFile(e, idx)}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/10 hover:text-red-500 rounded transition-all"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monaco Editor Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                    <div className="flex bg-[#252526] border-b border-white/5 h-9">
                        <div className="flex items-center space-x-2 px-4 py-1.5 bg-[#1e1e1e] text-xs font-medium text-primary-400 border-t-2 border-t-primary-500">
                            <FileCode size={14} /> <span>{fileName}</span>
                        </div>
                        {/* Theme toggle */}
                        <button
                            onClick={() => setEditorTheme(t => t === 'vs-dark' ? 'vs' : 'vs-dark')}
                            className="ml-auto mr-3 text-slate-500 hover:text-white transition-colors"
                            title="Toggle editor theme"
                        >
                            {theme === 'vs-dark' ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            height="100%"
                            language={language === 'cpp' ? 'cpp' : language}
                            theme={theme}
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            onMount={handleEditorDidMount}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: true },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 20 },
                                fontFamily: 'Fira Code, JetBrains Mono, monospace',
                                fontLigatures: true,
                                formatOnPaste: true,
                                formatOnType: true,
                                // IntelliSense / suggestions
                                quickSuggestions: { other: true, comments: false, strings: true },
                                quickSuggestionsDelay: 100,
                                suggestOnTriggerCharacters: true,
                                acceptSuggestionOnEnter: 'on',
                                tabCompletion: 'on',
                                wordBasedSuggestions: 'allDocuments',
                                parameterHints: { enabled: true },
                                suggestSelection: 'first',
                                snippetSuggestions: 'top',
                                inlineSuggest: { enabled: true },
                                // UI
                                lineNumbers: 'on',
                                renderLineHighlight: 'all',
                                bracketPairColorization: { enabled: true },
                                guides: { bracketPairs: true, indentation: true },
                                cursorBlinking: 'phase',
                                cursorSmoothCaretAnimation: 'on',
                                smoothScrolling: true,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Unified Console Area */}
            <div className="h-[300px] lg:flex-1 lg:min-h-[250px] bg-slate-950 border border-slate-800 rounded-xl flex flex-col shadow-2xl overflow-hidden font-mono mt-3 lg:mt-4 shrink-0 lg:shrink">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Terminal size={14} className="text-primary-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unified Console</span>
                        </div>
                        <div className="flex space-x-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                        </div>
                    </div>
                    <button 
                        onClick={() => setConsoleLogs([{ type: 'info', content: 'Terminal cleared.' }])}
                        className="text-[10px] text-slate-500 hover:text-white transition-colors flex items-center space-x-1"
                    >
                        <X size={10} /> <span>Clear Console</span>
                    </button>
                </div>
                
                <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
                    {/* HTML Preview Panel */}
                    {htmlPreview !== null ? (
                        <div className="flex-1 flex flex-col bg-white">
                            <div className="px-3 py-1 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                    <Globe size={10} /> HTML Preview
                                </span>
                                <button onClick={() => setHtmlPreview(null)} className="text-slate-500 hover:text-white"><X size={10}/></button>
                            </div>
                            <iframe
                                srcDoc={htmlPreview}
                                className="flex-1 w-full border-0"
                                sandbox="allow-scripts"
                                title="HTML Preview"
                            />
                        </div>
                    ) : (
                        <>
                    {/* Output Area (Terminal) - Now full width */}
                    <div className="flex-1 flex flex-col bg-black/40">
                        <div className="px-3 py-1 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Execution Output</span>
                            <div className="flex items-center space-x-2 text-slate-500 text-[9px]">
                                <span>{fileName}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${(isAnalyzing || isRunning) ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            </div>
                        </div>
                        <div className="flex-1 p-4 overflow-auto custom-scrollbar space-y-1.5 font-mono text-sm leading-relaxed">
                            {consoleLogs.length === 0 && !isAnalyzing && !isRunning && (
                                <div className="text-slate-700 italic select-none">Ready for execution — click Run to start...</div>
                            )}
                            {isRunning && consoleLogs.length === 0 && (
                                <div className="flex items-center space-x-2 text-primary-400 animate-pulse">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Executing...</span>
                                </div>
                            )}
                            
                            {consoleLogs.map((log, index) => (
                                <div key={index} className="flex space-x-2 animate-in fade-in slide-in-from-left-1 duration-200">
                                    {log.type === 'system' && (
                                        <div className="flex items-center space-x-2 w-full">
                                            <span className="text-emerald-500 font-bold shrink-0">guardian@cloud:~$</span>
                                            <span className="text-slate-200">{log.content}</span>
                                        </div>
                                    )}
                                    {log.type === 'info' && (
                                        <div className="text-primary-400 border-l-2 border-primary-500/30 pl-3">
                                            {log.content}
                                        </div>
                                    )}
                                    {log.type === 'output' && (
                                        <div className="text-slate-300 pl-3 flex items-start space-x-2">
                                            <span className="text-slate-700 select-none">|</span>
                                            <span>{log.content}</span>
                                        </div>
                                    )}
                                    {log.type === 'error' && (
                                        <div className="text-red-400 border-l-2 border-red-500/50 pl-3 bg-red-500/5 rounded-r py-0.5">
                                            <span className="font-bold mr-2 text-[10px] uppercase tracking-wider bg-red-500/20 px-1.5 rounded">Error</span>
                                            {log.content}
                                        </div>
                                    )}
                                    {log.type === 'success' && (
                                        <div className="text-emerald-400 border-l-2 border-emerald-500/50 pl-3 bg-emerald-500/5 rounded-r py-0.5">
                                            <span className="font-bold mr-2 text-[10px] uppercase tracking-wider bg-emerald-500/20 px-1.5 rounded">Success</span>
                                            {log.content}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {isAnalyzing && (
                                <div className="flex items-center space-x-3 text-primary-400 mt-2 animate-pulse pl-1">
                                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
                                    <span className="text-xs italic">Analyzing: {steps[analysisStep-1]}</span>
                                </div>
                            )}
                            
                            <div className="h-4" ref={terminalEndRef} />
                        </div>
                        
                        {/* Interactive Input Prompt */}
                        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
                             <span className="text-primary-500 font-bold">$</span>
                             <input 
                                type="text" 
                                value={terminalInput}
                                onChange={(e) => setTerminalInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && terminalInput.trim()) {
                                        const val = terminalInput;
                                        setConsoleLogs(prev => [...prev, { type: 'info', content: `> ${val}` }]);
                                        setStdin(prev => prev + val + '\n');
                                        setTerminalInput('');
                                    }
                                }}
                                placeholder="Type input and Enter..."
                                className="flex-1 bg-transparent border-none outline-none text-slate-300 text-sm font-mono placeholder:text-slate-600 focus:ring-0"
                             />
                             <button onClick={() => {setStdin(''); setConsoleLogs([]);}} className="text-[10px] text-slate-500 font-bold uppercase hover:text-red-500 transition-colors">Clear</button>
                        </div>
                    </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CodeIDE;
