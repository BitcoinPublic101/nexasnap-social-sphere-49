
import React, { useState, useEffect } from 'react';
import PostCard from '@/components/PostCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';
import { useFeedAlgorithm } from '@/hooks/useFeedAlgorithm';
import { Skeleton } from '@/components/ui/skeleton';
import CreatePostCard from '@/components/CreatePostCard';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { FeedSortOption } from '@/types/supabase-custom';

const Feed = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>('for-you');
  const { user } = useAuth();
  const { 
    posts, 
    loading, 
    hasMore, 
    loadMore, 
    refreshFeed,
    changeSort,
    currentSort 
  } = useFeedAlgorithm({ 
    initialSort: 'trending' 
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Set initial tab based on current path
  useEffect(() => {
    const path = location.pathname;
    
    if (path === '/') {
      setActiveTab('for-you');
    } else if (path === '/following') {
      setActiveTab('following');
    } else if (path === '/trending') {
      setActiveTab('trending');
    } else if (path === '/latest') {
      setActiveTab('latest');
    }
  }, [location.pathname]);

  // Change sort when tab changes
  useEffect(() => {
    let sortOption: FeedSortOption = 'trending';
    
    switch (activeTab) {
      case 'for-you':
        sortOption = 'personalized';
        break;
      case 'following':
        sortOption = 'following';
        break;
      case 'trending':
        sortOption = 'trending';
        break;
      case 'latest':
        sortOption = 'new';
        break;
      default:
        sortOption = 'trending';
    }
    
    if (sortOption !== currentSort) {
      changeSort(sortOption);
    }
  }, [activeTab, changeSort, currentSort]);

  const renderFeed = () => {
    if (loading && posts.length === 0) {
      return (
        <>
          <Skeleton className="h-40 w-full rounded-md mb-4" />
          <Skeleton className="h-40 w-full rounded-md mb-4" />
          <Skeleton className="h-40 w-full rounded-md mb-4" />
        </>
      );
    }

    if (!loading && posts.length === 0) {
      return <p className="text-center text-gray-500">No posts available.</p>;
    }

    return (
      <>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </>
    );
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/${tab === 'for-you' ? '' : tab}`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <CreatePostCard onPostCreated={refreshFeed} />
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="for-you">For You</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="latest">Latest</TabsTrigger>
        </TabsList>
        
        <TabsContent value="for-you">
          {renderFeed()}
        </TabsContent>
        
        <TabsContent value="following">
          {renderFeed()}
        </TabsContent>
        
        <TabsContent value="trending">
          {renderFeed()}
        </TabsContent>
        
        <TabsContent value="latest">
          {renderFeed()}
        </TabsContent>
      </Tabs>
      
      {hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <Button variant="outline" onClick={loadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default Feed;
