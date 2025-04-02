
import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PostCard from '@/components/PostCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Separator } from '@/components/ui/separator';
import { useFeedAlgorithm } from '@/hooks/useFeedAlgorithm';
import { Skeleton } from '@/components/ui/skeleton';
import CreatePostCard from '@/components/CreatePostCard';
import { PostWithAuthor } from '@/types/supabase-custom';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
  const [activeTab, setActiveTab] = useState<string>('for-you');
  const { user } = useAuth();
  const { 
    posts, 
    loading, 
    hasMore, 
    loadMore, 
    refreshFeed 
  } = useFeedAlgorithm({ 
    initialSort: 'trending' 
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const renderFeed = (postsList: PostWithAuthor[]) => {
    if (loading && postsList.length === 0) {
      return (
        <>
          <Skeleton className="h-40 w-full rounded-md mb-4" />
          <Skeleton className="h-40 w-full rounded-md mb-4" />
          <Skeleton className="h-40 w-full rounded-md mb-4" />
        </>
      );
    }

    if (!loading && postsList.length === 0) {
      return <p className="text-center text-gray-500">No posts available.</p>;
    }

    return (
      <>
        {postsList.map((post) => (
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
          {renderFeed(posts)}
        </TabsContent>
        
        <TabsContent value="following">
          {renderFeed(posts)}
        </TabsContent>
        
        <TabsContent value="trending">
          {renderFeed(posts)}
        </TabsContent>
        
        <TabsContent value="latest">
          {renderFeed(posts)}
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
