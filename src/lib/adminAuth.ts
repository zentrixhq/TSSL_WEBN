import { supabase } from './supabase';

const ADMIN_SESSION_KEY = 'admin_session_verified';
const SESSION_DURATION = 24 * 60 * 60 * 1000;

interface AdminSession {
  userId: string;
  email: string;
  timestamp: number;
}

export const saveAdminSession = (userId: string, email: string) => {
  const session: AdminSession = {
    userId,
    email,
    timestamp: Date.now(),
  };
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('adminAuth', 'true');
};

export const getAdminSession = (): AdminSession | null => {
  const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!stored) return null;

  try {
    const session: AdminSession = JSON.parse(stored);
    if (Date.now() - session.timestamp > SESSION_DURATION) {
      clearAdminSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

export const clearAdminSession = () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem('adminAuth');
};

export const verifyAdminStatus = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error verifying admin status:', error);
      return false;
    }

    return data?.is_active === true;
  } catch (err) {
    console.error('Exception verifying admin status:', err);
    return false;
  }
};

export const checkAuthAndVerify = async (): Promise<{ isAuthenticated: boolean; session: AdminSession | null }> => {
  const savedSession = getAdminSession();

  if (savedSession) {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user && session.user.id === savedSession.userId) {
      const isAdmin = await verifyAdminStatus(session.user.id);
      if (isAdmin) {
        return { isAuthenticated: true, session: savedSession };
      }
    }
  }

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    const isAdmin = await verifyAdminStatus(session.user.id);
    if (isAdmin) {
      saveAdminSession(session.user.id, session.user.email || '');
      return { isAuthenticated: true, session: { userId: session.user.id, email: session.user.email || '', timestamp: Date.now() } };
    }
  }

  clearAdminSession();
  return { isAuthenticated: false, session: null };
};
