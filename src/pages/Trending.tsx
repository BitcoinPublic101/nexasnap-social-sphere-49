
import React from 'react';
import { NavBar } from '@/components/ui/NavBar';
import { CommunitySidebar } from '@/components/ui/CommunitySidebar';
import { TrendingSideBar } from '@/components/TrendingSideBar';
import { ThemeProvider } from '@/context/ThemeContext';
import SEOMetaTags from '@/components/SEOMetaTags';
import { useFeedAlgorithm } from '@/hooks/useFeedAlgorithm';
import PostCard from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import CreatePostCard from '@/components/CreatePostCard';

const Trending = () => {
  const { 
    posts, 
    loading, 
    hasMore, 
    loadMore,
    refreshFeed 
  } = useFeedAlgorithm({ 
    initialSort: 'trending',
    limit: 10 
  });

  const renderContent = () => {
    if (loading && posts.length === 0) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      );
    }

    if (!loading && posts.length === 0) {
      return (
        <div className="text-center p-8">
          <h3 className="text-xl font-medium mb-2">No trending posts yet</h3>
          <p className="text-muted-foreground">Be the first to create trending content!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" onClick={() => loadMore()} disabled={loading}>
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <SEOMetaTags 
          title="Trending Posts"
          description="Discover what's trending on NexaSnap. Join the conversation today!"
          keywords={['trending', 'hot', 'community', 'top posts']}
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
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <CreatePostCard onPostCreated={refreshFeed} />
              </div>
              <h1 className="text-3xl font-bold mb-6">Trending Posts</h1>
              {renderContent()}
            </div>
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

export default Trending;
