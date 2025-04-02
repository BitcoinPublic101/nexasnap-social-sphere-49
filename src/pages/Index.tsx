
import React from 'react';
import { NavBar } from '@/components/ui/NavBar';
import Feed from '@/components/Feed';
import { CommunitySidebar } from '@/components/ui/CommunitySidebar';
import { TrendingSideBar } from '@/components/TrendingSideBar';
import { ThemeProvider } from '@/context/ThemeContext';
import SEOMetaTags from '@/components/SEOMetaTags';

const Index = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <SEOMetaTags 
          title="Home"
          description="Join the NexaSnap community to discover and share content with like-minded individuals."
          keywords={['social media', 'community', 'posts', 'trending']}
        />
        
        <NavBar />
        
        <div className="flex flex-1">
          {/* Left Sidebar - Hidden on mobile */}
          <div className="hidden md:block w-64 shrink-0">
            <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar">
              <CommunitySidebar />
            </div>
          </div>
          
          {/* Main Content */}
          <main className="flex-1 px-4 py-6">
            <Feed />
          </main>
          
          {/* Right Sidebar - Hidden on mobile */}
          <div className="hidden lg:block w-80 shrink-0 px-4 py-6">
            <div className="sticky top-20">
              <TrendingSideBar />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Index;
