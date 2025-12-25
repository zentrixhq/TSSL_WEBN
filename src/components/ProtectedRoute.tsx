import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { checkAuthAndVerify, clearAdminSession, saveAdminSession } from '../lib/adminAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const result = await checkAuthAndVerify();

      if (mounted) {
        setIsAuthenticated(result.isAuthenticated);
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        clearAdminSession();
        setIsAuthenticated(false);
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
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
