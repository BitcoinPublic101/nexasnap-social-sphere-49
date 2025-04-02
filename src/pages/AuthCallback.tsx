
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        setError(error.message);
        toast({
          title: 'Authentication failed',
          description: error.message || 'Something went wrong during authentication',
          variant: 'destructive',
        });
        // Redirect to login after error
        setTimeout(() => navigate('/login'), 3000);
      } else {
        // Successful auth - redirect to home
        toast({
          title: 'Welcome!',
          description: 'You have successfully signed in',
        });
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
        <h1 className="mb-6 text-2xl font-bold text-center">
          {error ? 'Authentication Error' : 'Completing Authentication'}
        </h1>
        
        {error ? (
          <div className="text-center text-red-500">
            <p className="mb-4">{error}</p>
            <p>Redirecting to login page...</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p>Please wait while we complete your authentication...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
