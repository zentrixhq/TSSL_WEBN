import { supabase } from './supabase';

export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
};

export const safeSupabaseOperation = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  errorMessage: string = 'Operation failed'
): Promise<T> => {
  try {
    const result = await withRetry(operation, 2, 500);

    if (result.error) {
      console.error(`${errorMessage}:`, result.error);
      throw new Error(result.error.message || errorMessage);
    }

    if (result.data === null) {
      throw new Error('No data returned from operation');
    }

    return result.data;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    throw error;
  }
};

export const handleSupabaseError = (error: any, operation: string): string => {
  if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
    return 'Your session has expired. Please refresh the page and try again.';
  }

  if (error.code === '42501' || error.message?.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }

  if (error.code === '23505' || error.message?.includes('duplicate')) {
    return 'This item already exists. Please use a different name.';
  }

  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  console.error(`Error during ${operation}:`, error);
  return `Failed to ${operation}. Please try again.`;
};

export const verifyAdminSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      return false;
    }

    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('is_active')
      .eq('id', session.user.id)
      .maybeSingle();

    return !adminError && adminData?.is_active === true;
  } catch (error) {
    console.error('Error verifying admin session:', error);
    return false;
  }
};
