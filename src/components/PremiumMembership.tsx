
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, AlertCircleIcon, StarIcon, SparklesIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PremiumFeature {
  name: string;
  description: string;
  included: boolean;
}

interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: PremiumFeature[];
  popular?: boolean;
}

const plans: PremiumPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'monthly',
    features: [
      { name: 'Basic posting', description: 'Create posts and comments', included: true },
      { name: 'Join communities', description: 'Join existing squads', included: true },
      { name: 'Standard feed', description: 'Regular content feed', included: true },
      { name: 'AI content generation', description: 'AI assistance for creating content', included: false },
      { name: 'Ad-free experience', description: 'No advertisements', included: false },
      { name: 'Premium badge', description: 'Show your premium status', included: false },
      { name: 'Advanced analytics', description: 'Detailed insights on your content', included: false },
    ],
  },
  {
    id: 'premium_monthly',
    name: 'Premium',
    price: 9.99,
    interval: 'monthly',
    popular: true,
    features: [
      { name: 'Basic posting', description: 'Create posts and comments', included: true },
      { name: 'Join communities', description: 'Join existing squads', included: true },
      { name: 'Advanced feed', description: 'Personalized content recommendations', included: true },
      { name: 'AI content generation', description: 'AI assistance for creating content', included: true },
      { name: 'Ad-free experience', description: 'No advertisements', included: true },
      { name: 'Premium badge', description: 'Show your premium status', included: true },
      { name: 'Advanced analytics', description: 'Detailed insights on your content', included: true },
    ],
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 99.99,
    interval: 'yearly',
    features: [
      { name: 'Basic posting', description: 'Create posts and comments', included: true },
      { name: 'Join communities', description: 'Join existing squads', included: true },
      { name: 'Advanced feed', description: 'Personalized content recommendations', included: true },
      { name: 'AI content generation', description: 'AI assistance for creating content', included: true },
      { name: 'Ad-free experience', description: 'No advertisements', included: true },
      { name: 'Premium badge', description: 'Show your premium status', included: true },
      { name: 'Advanced analytics', description: 'Detailed insights on your content', included: true },
    ],
  },
];

export const PremiumMembership: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) throw error;
        setSubscription(data.subscription);
      } catch (error: any) {
        console.error('Error checking subscription:', error);
      }
    };
    
    checkSubscription();
  }, [user]);

  const handleSubscribe = async (productType: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to subscribe',
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
        body: { productType },
      });
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate checkout',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto py-10 max-w-7xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Premium Membership</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Upgrade your NexaSnap experience with premium features and benefits.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${plan.popular ? 'border-primary shadow-lg relative' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute top-4 right-4 bg-primary text-white">
                Most Popular
              </Badge>
            )}
            
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.price === 0 ? (
                  'Free forever'
                ) : (
                  <>
                    <span className="text-2xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircleIcon className="h-5 w-5 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${!feature.included ? 'text-muted-foreground' : ''}`}>
                        {feature.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.id === 'free' ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || (subscription?.subscription_type === 'premium' && 
                     (plan.interval === subscription?.subscription_tier))}
                >
                  {subscription?.subscription_type === 'premium' && 
                   (plan.interval === subscription?.subscription_tier) 
                    ? 'Current Plan' 
                    : `Subscribe ${plan.interval}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 bg-muted/50 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <StarIcon className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-xl font-semibold">Squad Creator Subscription</h3>
            <p className="text-muted-foreground">Create and moderate your own communities</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p>As a Squad Creator, you can:</p>
            <ul className="mt-2 space-y-2">
              <li className="flex gap-2 items-center">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>Create unlimited squads</span>
              </li>
              <li className="flex gap-2 items-center">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>Customize squad appearance</span>
              </li>
              <li className="flex gap-2 items-center">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>Access advanced moderation tools</span>
              </li>
              <li className="flex gap-2 items-center">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>View detailed squad analytics</span>
              </li>
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">$5.99<span className="text-base font-normal text-muted-foreground">/month</span></div>
              <Button 
                className="mt-4" 
                onClick={() => handleSubscribe('squad_subscription')}
                disabled={loading || subscription?.subscription_type === 'squad_creator'}
              >
                {subscription?.subscription_type === 'squad_creator' ? 'Current Plan' : 'Become a Creator'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumMembership;
