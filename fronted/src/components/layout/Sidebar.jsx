import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, ClipboardList,
  BarChart2, Settings, LogOut, ChevronLeft, ChevronRight, Zap,
  Sun, Moon, User, AlertTriangle, Menu, X
} from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { getInitials } from '../../utils/format';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Warehouse },
  { to: '/pos', label: 'POS Billing', icon: ShoppingCart },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ dark, setDark, collapsed, setCollapsed }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-30 flex-shrink-0"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">QuickBill</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">POS System</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-[72px] w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-40">
        {collapsed ? <ChevronRight className="w-3 h-3 text-gray-500" /> : <ChevronLeft className="w-3 h-3 text-gray-500" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate text-sm">
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
        <button onClick={() => setDark(!dark)} className="sidebar-link-inactive w-full">
          {dark ? <Sun className="w-5 h-5 flex-shrink-0" /> : <Moon className="w-5 h-5 flex-shrink-0" />}
          <AnimatePresence>
            {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm">{dark ? 'Light Mode' : 'Dark Mode'}</motion.span>}
          </AnimatePresence>
        </button>
        <button onClick={handleLogout} className="sidebar-link-inactive w-full hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-900/20">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm">Logout</motion.span>}
          </AnimatePresence>
        </button>
        {/* User info */}
        <div className="flex items-center gap-2.5 pt-2 mt-1 border-t border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">{getInitials(user?.name)}</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 capitalize truncate">{user?.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
