import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  History, 
  BarChart2, 
  Users, 
  ShieldCheck,
  Settings,
  LogOut
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';


interface SidebarProps {
  role: 'student' | 'admin';
}

const Sidebar: React.FC<SidebarProps> = ({ role: roleProp }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const role = (user?.role?.toLowerCase() as 'student' | 'admin') || roleProp;
  const studentLinks = [
    { to: '/student/upload', icon: Upload, label: 'IDE / Editor' },
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/student/history', icon: History, label: 'Reports' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: BarChart2, label: 'Analytics' },
    { to: '/admin/submissions', icon: ShieldCheck, label: 'Review All' },
  ];

  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <aside className="w-64 h-full border-r border-khaki-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1c] flex flex-col shadow-sm transition-colors z-40">
      <div className="pt-6" />

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:text-primary-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-500'}`} />
                <span className="font-medium text-sm">{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>


    </aside>
  );
};

export default Sidebar;
