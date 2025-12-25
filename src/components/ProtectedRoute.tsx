import { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAdminSession, clearAdminSession, saveAdminSession, refreshSessionIfNeeded, checkAuthAndVerify } from '../lib/adminAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const SESSION_REFRESH_INTERVAL = 60 * 60 * 1000;

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const localSession = getAdminSession();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localSession);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    let mounted = true;

    const verifyAuth = async () => {
      if (hasVerified.current) return;
      hasVerified.current = true;

      try {
        const result = await checkAuthAndVerify();

        if (mounted && !result.isAuthenticated) {
          setIsAuthenticated(false);
        } else if (mounted && result.isAuthenticated) {
          refreshIntervalRef.current = setInterval(() => {
            refreshSessionIfNeeded();
          }, SESSION_REFRESH_INTERVAL);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        if (mounted) {
          setIsAuthenticated(false);
        }
      }
    };

    if (localSession) {
      verifyAuth();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        clearAdminSession();
        setIsAuthenticated(false);
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = null;
        }
      } else if (event === 'SIGNED_IN' && session?.user) {
        const result = await checkAuthAndVerify();
        if (mounted) {
          setIsAuthenticated(result.isAuthenticated);
          if (!result.isAuthenticated) {
            await supabase.auth.signOut();
          }
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        saveAdminSession(session.user.id, session.user.email || '');
      }
    });

    return () => {
      mounted = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      subscription.unsubscribe();
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
