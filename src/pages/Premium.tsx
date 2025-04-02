
import React from 'react';
import { NavBar } from '@/components/ui/NavBar';
import PremiumMembership from '@/components/PremiumMembership';
import SEOMetaTags from '@/components/SEOMetaTags';

const Premium = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOMetaTags 
        title="Premium Membership"
        description="Upgrade your NexaSnap experience with premium features including AI content generation, ad-free browsing, and more."
        keywords={['premium', 'membership', 'subscription', 'features', 'ad-free']}
      />
      
      <NavBar />
      
      <main className="flex-1 container py-6">
        <PremiumMembership />
      </main>
    </div>
  );
};

export default Premium;
