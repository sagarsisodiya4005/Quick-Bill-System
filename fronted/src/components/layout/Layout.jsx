import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

export default function Layout() {
  const { isAuthenticated } = useSelector(s => s.auth);
  const [dark, setDark] = useState(() => localStorage.getItem('qb_theme') === 'dark');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (dark) { document.documentElement.classList.add('dark'); localStorage.setItem('qb_theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('qb_theme', 'light'); }
  }, [dark]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar dark={dark} setDark={setDark} collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: dark ? '#1f2937' : '#fff', color: dark ? '#f9fafb' : '#111827', border: '1px solid', borderColor: dark ? '#374151' : '#e5e7eb', fontSize: '14px' } }} />
    </div>
  );
}
