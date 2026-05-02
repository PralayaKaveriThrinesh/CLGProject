import React from 'react';
import Sidebar from './Sidebar';
import ChatBot from '../common/ChatBot';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'admin';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role }) => {
  return (
    <div className="flex bg-beige-50 dark:bg-slate-950 transition-colors duration-300" style={{ height: 'calc(100vh - 64px)' }}>
      <Sidebar role={role} />
      <main className="flex-1 overflow-auto p-4 lg:p-6 custom-scrollbar">
        <div className="max-w-[1536px] mx-auto">
          {children}
        </div>
      </main>
      <ChatBot />
    </div>
  );
};

export default DashboardLayout;
