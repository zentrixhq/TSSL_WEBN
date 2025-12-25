import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { saveAdminSession } from '../lib/adminAuth';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const navigate = useNavigate();

  const checkLoginAttempts = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('attempted_at, success')
        .eq('email', email)
        .gte('attempted_at', new Date(Date.now() - LOCKOUT_DURATION).toISOString())
        .order('attempted_at', { ascending: false });

      if (error) throw error;

      const recentFailedAttempts = data?.filter(attempt => !attempt.success).length || 0;

      if (recentFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
        setIsLockedOut(true);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error checking login attempts:', err);
      return true;
    }
  };

  const logLoginAttempt = async (email: string, success: boolean) => {
    try {
      await supabase.from('login_attempts').insert({
        email,
        success,
        attempted_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error logging login attempt:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const canAttemptLogin = await checkLoginAttempts(email);

      if (!canAttemptLogin) {
        setError(`Too many failed login attempts. Please try again in 15 minutes.`);
        setIsLoading(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        await logLoginAttempt(email, false);
        setError('Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (data.user) {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('id, is_active, role')
          .eq('id', data.user.id)
          .maybeSingle();

        if (adminError || !adminData || !adminData.is_active) {
          await supabase.auth.signOut();
          await logLoginAttempt(email, false);
          setError('Unauthorized: This account does not have admin access');
          setIsLoading(false);
          return;
        }

        await supabase
          .from('admin_users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);

        await logLoginAttempt(email, true);

        saveAdminSession(data.user.id, email);
        navigate('/myadminaccess');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-600 p-3 rounded-full">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Admin Login</h1>
          <p className="text-gray-600 text-center mb-6">Enter your credentials to access the admin panel</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isLockedOut && (
            <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-4 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>Account temporarily locked due to multiple failed login attempts.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                placeholder="Enter email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-red-600"
                placeholder="Enter password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
