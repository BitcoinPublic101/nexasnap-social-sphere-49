
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SEOMetaTags from '@/components/SEOMetaTags';

const PaymentSuccess = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Get session_id from URL query params
      const query = new URLSearchParams(location.search);
      const sessionId = query.get('session_id');

      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Verify the session and get subscription details
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) throw error;
        
        setSubscriptionDetails(data.subscription);
        toast({
          title: 'Subscription activated',
          description: 'Your subscription has been successfully activated.',
        });
      } catch (error: any) {
        console.error('Error fetching subscription details:', error);
        toast({
          title: 'Error',
          description: 'Could not verify subscription. Please contact support.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [user, navigate, location.search, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMetaTags 
        title="Payment Successful"
        description="Your payment has been successfully processed."
        keywords={['payment', 'success', 'subscription']}
      />
      
      <NavBar />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckIcon className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
          
          <p className="mb-6 text-muted-foreground">
            Thank you for your payment. Your subscription has been activated successfully.
          </p>
          
          {subscriptionDetails && (
            <div className="mb-8 p-4 bg-muted rounded-md text-left">
              <h2 className="font-semibold mb-2">Subscription Details</h2>
              <p>Type: {subscriptionDetails.subscription_type === 'premium' ? 'Premium Membership' : 'Squad Creator'}</p>
              {subscriptionDetails.subscription_type === 'premium' && (
                <p>Plan: {subscriptionDetails.subscription_tier === 'monthly' ? 'Monthly' : 'Yearly'}</p>
              )}
              <p>Valid until: {new Date(subscriptionDetails.expires_at).toLocaleDateString()}</p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/">Return to Home</Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/premium">Manage Subscription</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
