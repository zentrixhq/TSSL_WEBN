import { supabase } from './supabase';

const ADMIN_SESSION_KEY = 'admin_session_verified';
const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000;
const SESSION_REFRESH_INTERVAL = 60 * 60 * 1000;

interface AdminSession {
  userId: string;
  email: string;
  timestamp: number;
  lastActivity: number;
  lastRefresh: number;
}

export const saveAdminSession = (userId: string, email: string) => {
  const session: AdminSession = {
    userId,
    email,
    timestamp: Date.now(),
    lastActivity: Date.now(),
    lastRefresh: Date.now(),
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('adminAuth', 'true');
};

let lastActivityUpdate = 0;
const ACTIVITY_UPDATE_INTERVAL = 30 * 1000;

export const updateSessionActivity = () => {
  const now = Date.now();

  if (now - lastActivityUpdate < ACTIVITY_UPDATE_INTERVAL) {
    return;
  }

  lastActivityUpdate = now;

  const stored = localStorage.getItem(ADMIN_SESSION_KEY);
  if (stored) {
    try {
      const session: AdminSession = JSON.parse(stored);
      session.lastActivity = now;
      session.lastRefresh = now;
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    } catch {
      return;
    }
  }
};

export const updateSessionTimestamp = () => {
  updateSessionActivity();
};

export const getAdminSession = (): AdminSession | null => {
  const stored = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!stored) return null;

  try {
    const session: AdminSession = JSON.parse(stored);
    const inactiveTime = Date.now() - (session.lastActivity || session.timestamp);

    if (inactiveTime > INACTIVITY_TIMEOUT) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
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

export const refreshSessionIfNeeded = async (): Promise<void> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return;
    }

    const { data, error: refreshError } = await supabase.auth.refreshSession();

    if (!refreshError && data.session) {
      updateSessionTimestamp();
    }
  } catch (err) {
    console.error('Error refreshing session:', err);
  }
};

export const checkAuthAndVerify = async (): Promise<{ isAuthenticated: boolean; session: AdminSession | null }> => {
  try {
    const savedSession = getAdminSession();

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      clearAdminSession();
      return { isAuthenticated: false, session: null };
    }

    if (session?.user) {
      const isAdmin = await verifyAdminStatus(session.user.id);

      if (isAdmin) {
        if (!savedSession || savedSession.userId !== session.user.id) {
          saveAdminSession(session.user.id, session.user.email || '');
        } else {
          updateSessionActivity();
        }

        return {
          isAuthenticated: true,
          session: {
            userId: session.user.id,
            email: session.user.email || '',
            timestamp: savedSession?.timestamp || Date.now(),
            lastActivity: Date.now(),
            lastRefresh: Date.now()
          }
        };
      }
    }

    if (savedSession) {
      const { data, error: refreshError } = await supabase.auth.refreshSession();

      if (!refreshError && data.session?.user) {
        const isAdmin = await verifyAdminStatus(data.session.user.id);

        if (isAdmin) {
          saveAdminSession(data.session.user.id, data.session.user.email || '');
          return {
            isAuthenticated: true,
            session: {
              userId: data.session.user.id,
              email: data.session.user.email || '',
              timestamp: savedSession.timestamp,
              lastActivity: Date.now(),
              lastRefresh: Date.now()
            }
          };
        }
      }
    }

    clearAdminSession();
    return { isAuthenticated: false, session: null };
  } catch (err) {
    console.error('Exception in checkAuthAndVerify:', err);
    clearAdminSession();
    return { isAuthenticated: false, session: null };
  }
};
