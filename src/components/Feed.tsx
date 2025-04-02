
import React, { useEffect, useState } from 'react';
import PostCard from '@/components/PostCard';
import { CreatePostCard } from '@/components/CreatePostCard';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Flame, Sparkles, Clock, ArrowUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:author_id(username, avatar_url),
            squads:squad_id(name)
          `)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) throw error;
        
        setPosts(data || []);
      } catch (error: any) {
        console.error('Error fetching posts:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load posts',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPosts();
  }, [toast]);

  const sortByHot = (postsToSort: any[]) => {
    // Hot sorting considers both votes and recency
    return [...postsToSort].sort((a, b) => {
      const aScore = (a.upvotes - a.downvotes) + (Date.parse(a.created_at) / 1000000000);
      const bScore = (b.upvotes - b.downvotes) + (Date.parse(b.created_at) / 1000000000);
      return bScore - aScore;
    });
  };

  const sortByNew = (postsToSort: any[]) => {
    return [...postsToSort].sort((a, b) => 
      Date.parse(b.created_at) - Date.parse(a.created_at)
    );
  };

  const sortByTop = (postsToSort: any[]) => {
    return [...postsToSort].sort((a, b) => 
      (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
    );
  };

  const sortByRising = (postsToSort: any[]) => {
    // Rising considers comment count and recency
    return [...postsToSort].sort((a, b) => {
      const aAge = (Date.now() - Date.parse(a.created_at)) / 3600000; // Age in hours
      const bAge = (Date.now() - Date.parse(b.created_at)) / 3600000;
      
      // Comments per hour, with a minimum age of 1 hour to avoid division by zero
      const aScore = a.commentcount / Math.max(1, aAge);
      const bScore = b.commentcount / Math.max(1, bAge);
      
      return bScore - aScore;
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <CreatePostCard />
        
        <div className="mt-4">
          <Skeleton className="h-12 w-full mb-4" />
          
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-[200px] w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <CreatePostCard />
      
      <Tabs defaultValue="hot" className="mb-4 mt-4">
        <TabsList className="bg-white dark:bg-card border border-gray-200 dark:border-gray-800 p-0 h-auto">
          <TabsTrigger 
            value="hot" 
            className="flex items-center gap-1 px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            <Flame className="h-4 w-4" />
            <span>Hot</span>
          </TabsTrigger>
          <TabsTrigger 
            value="new" 
            className="flex items-center gap-1 px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            <Sparkles className="h-4 w-4" />
            <span>New</span>
          </TabsTrigger>
          <TabsTrigger 
            value="top" 
            className="flex items-center gap-1 px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            <ArrowUp className="h-4 w-4" />
            <span>Top</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rising" 
            className="flex items-center gap-1 px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            <Clock className="h-4 w-4" />
            <span>Rising</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="hot" className="mt-3">
          {sortByHot(posts).map((post) => (
            <PostCard key={post.id} post={{
              id: post.id,
              title: post.title,
              content: post.content,
              timestamp: new Date(post.created_at).toLocaleString(),
              votes: post.upvotes - post.downvotes,
              commentCount: post.commentcount,
              squad: post.squads?.name || "Unknown",
              author: post.profiles?.username || "Unknown",
              image: post.image,
            }} />
          ))}
        </TabsContent>
        
        <TabsContent value="new" className="mt-3">
          {sortByNew(posts).map((post) => (
            <PostCard key={post.id} post={{
              id: post.id,
              title: post.title,
              content: post.content,
              timestamp: new Date(post.created_at).toLocaleString(),
              votes: post.upvotes - post.downvotes,
              commentCount: post.commentcount,
              squad: post.squads?.name || "Unknown",
              author: post.profiles?.username || "Unknown",
              image: post.image,
            }} />
          ))}
        </TabsContent>
        
        <TabsContent value="top" className="mt-3">
          {sortByTop(posts).map((post) => (
            <PostCard key={post.id} post={{
              id: post.id,
              title: post.title,
              content: post.content,
              timestamp: new Date(post.created_at).toLocaleString(),
              votes: post.upvotes - post.downvotes,
              commentCount: post.commentcount,
              squad: post.squads?.name || "Unknown",
              author: post.profiles?.username || "Unknown",
              image: post.image,
            }} />
          ))}
        </TabsContent>
        
        <TabsContent value="rising" className="mt-3">
          {sortByRising(posts).map((post) => (
            <PostCard key={post.id} post={{
              id: post.id,
              title: post.title,
              content: post.content,
              timestamp: new Date(post.created_at).toLocaleString(),
              votes: post.upvotes - post.downvotes,
              commentCount: post.commentcount,
              squad: post.squads?.name || "Unknown",
              author: post.profiles?.username || "Unknown",
              image: post.image,
            }} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
