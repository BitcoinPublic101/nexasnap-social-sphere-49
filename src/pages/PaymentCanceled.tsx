
import React from 'react';
import { Link } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/button';
import { XIcon } from 'lucide-react';
import SEOMetaTags from '@/components/SEOMetaTags';

const PaymentCanceled = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOMetaTags 
        title="Payment Canceled"
        description="Your payment has been canceled. No charges were made to your account."
        keywords={['payment', 'canceled', 'subscription']}
      />
      
      <NavBar />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XIcon className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Payment Canceled</h1>
          
          <p className="mb-6 text-muted-foreground">
            Your payment was canceled. No charges were made to your account.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/premium">Try Again</Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCanceled;
