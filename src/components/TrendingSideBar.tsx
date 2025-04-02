
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

export function TrendingSideBar() {
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [trendingSquads, setTrendingSquads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrending = async () => {
      setIsLoading(true);
      try {
        // Fetch trending posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            title,
            upvotes,
            downvotes,
            commentcount,
            created_at,
            squads:squad_id(name)
          `)
          .eq('is_hidden', false)
          .order('upvotes', { ascending: false })
          .limit(5);
        
        if (postsError) throw postsError;
        setTrendingPosts(postsData || []);
        
        // Fetch trending squads
        const { data: squadsData, error: squadsError } = await supabase
          .from('squads')
          .select('*')
          .eq('is_active', true)
          .order('member_count', { ascending: false })
          .limit(5);
        
        if (squadsError) throw squadsError;
        setTrendingSquads(squadsData || []);
      } catch (error: any) {
        console.error('Error fetching trending data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load trending data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTrending();
  }, [toast]);

  if (isLoading) {
    return (
      <div>
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trending Posts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendingPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trending posts at the moment.</p>
          ) : (
            trendingPosts.map((post, index) => (
              <Link key={post.id} to={`/post/${post.id}`} className="no-underline">
                <div className="flex items-start gap-3 group">
                  <div className="flex-shrink-0 w-5 text-muted-foreground font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium leading-snug group-hover:text-primary line-clamp-2">
                      {post.title}
                    </h4>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>{post.upvotes - post.downvotes} upvotes</span>
                      <span>•</span>
                      <span>{post.commentcount} comments</span>
                      <span>•</span>
                      <span>r/{post.squads?.name}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-md flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Popular Squads</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendingSquads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No squads available at the moment.</p>
          ) : (
            trendingSquads.map((squad) => (
              <Link key={squad.id} to={`/r/${squad.name}`} className="no-underline">
                <div className="flex items-start gap-3 group">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium leading-snug group-hover:text-primary">
                      r/{squad.name}
                    </h4>
                    <div className="text-xs text-muted-foreground mt-1">
                      {squad.member_count.toLocaleString()} members
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-16 text-xs"
                  >
                    Join
                  </Button>
                </div>
              </Link>
            ))
          )}
          
          <div className="pt-2">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View All Squads
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
