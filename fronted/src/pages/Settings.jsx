import { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { User, Shield, Loader2, CheckCircle, Code2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useSelector(s => s.auth);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', newUser);
      toast.success(`User ${newUser.name} created!`);
      setNewUser({ name: '', email: '', password: '', role: 'staff' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create user'); }
    finally { setLoading(false); }
  };

  const techStack = [
    { label: 'Frontend', value: 'React.js + Vite', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400' },
    { label: 'Styling', value: 'Tailwind CSS', color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400' },
    { label: 'Animations', value: 'Framer Motion', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    { label: 'State', value: 'Redux Toolkit', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400' },
    { label: 'Backend', value: 'Node.js + Express.js', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
    { label: 'Database', value: 'MongoDB Atlas + Mongoose', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    { label: 'Image Storage', value: 'Cloudinary CDN', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    { label: 'AI', value: 'OpenRouter (Llama 3.2)', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
    { label: 'Charts', value: 'Recharts', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' },
    { label: 'PDF Export', value: 'jsPDF + html2canvas', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
    { label: 'Excel Export', value: 'XLSX + FileSaver', color: 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="font-semibold text-gray-900 dark:text-white">My Profile</h2>
          </div>
          <div className="space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">{(user?.name || 'U')[0]}</span>
            </div>
            {[['Name', user?.name], ['Email', user?.email], ['Role', user?.role], ['Status', 'Active']].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-medium capitalize ${label === 'Role' ? 'badge-blue' : label === 'Status' ? 'badge-green' : 'text-gray-900 dark:text-white'}`}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Create User (Admin Only) */}
        {user?.role === 'admin' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Create Staff Account</h2>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3">
              {[['Full Name', 'name', 'text'], ['Email', 'email', 'email'], ['Password', 'password', 'password']].map(([label, key, type]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label} *</label>
                  <input type={type} value={newUser[key]} onChange={e => setNewUser(p => ({ ...p, [key]: e.target.value }))} className="input" placeholder={label} required />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
                <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} className="input">
                  <option value="staff">Staff / Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><CheckCircle className="w-4 h-4" />Create Account</>}
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* Tech Stack */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <Code2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Tech Stack</h2>
            <p className="text-xs text-gray-400">QuickBill POS System v1.0 — Built for Meera's Retail Store</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {techStack.map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1.5">{label}</p>
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
