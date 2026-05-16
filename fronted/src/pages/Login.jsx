import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { setCredentials } from '../redux/slices/authSlice';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Login() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      dispatch(setCredentials(data.data));
      toast.success(`Welcome back, ${data.data.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/30">
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">QuickBill POS</h1>
          <p className="text-gray-400 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                  placeholder="admin@quickbill.com" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">Demo credentials</p>
            <div className="mt-2 bg-gray-800/60 rounded-lg p-3 text-xs text-gray-400 space-y-1">
              <p><span className="text-gray-500">Email:</span> admin@quickbill.com</p>
              <p><span className="text-gray-500">Password:</span> Admin@123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">QuickBill POS System © 2024</p>
      </motion.div>
    </div>
  );
}
