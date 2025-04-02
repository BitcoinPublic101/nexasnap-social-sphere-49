
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePostCard } from '@/components/CreatePostCard';
import { PostCard } from '@/components/PostCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Users, Info, Bell, BellOff, Settings } from 'lucide-react';

const SquadPage = () => {
  const { squadName } = useParams<{ squadName: string }>();
  const [squad, setSquad] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSquadData = async () => {
      setIsLoading(true);
      try {
        // Fetch squad by name
        const { data: squadData, error: squadError } = await supabase
          .from('squads')
          .select('*')
          .eq('name', squadName)
          .single();

        if (squadError) throw squadError;
        if (!squadData) throw new Error('Squad not found');

        setSquad(squadData);

        // Fetch squad's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:author_id(username, avatar_url)
          `)
          .eq('squad_id', squadData.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData || []);

        // Check if user is a member of this squad
        if (user) {
          const { data: memberData } = await supabase
            .from('squad_members')
            .select('*')
            .eq('user_id', user.id)
            .eq('squad_id', squadData.id)
            .maybeSingle();
          
          setIsMember(!!memberData);
          
          // Check if squad is favorited
          const { data: favoriteData } = await supabase
            .from('squad_favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('squad_id', squadData.id)
            .maybeSingle();
          
          setIsFavorite(!!favoriteData);
        }
      } catch (error: any) {
        console.error('Error fetching squad:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load squad',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (squadName) {
      fetchSquadData();
    }
  }, [squadName, user, toast]);

  const handleJoinSquad = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to join squads',
        variant: 'default',
      });
      return;
    }

    try {
      if (isMember) {
        // Leave squad
        await supabase
          .from('squad_members')
          .delete()
          .eq('user_id', user.id)
          .eq('squad_id', squad.id);
        
        setIsMember(false);
        toast({
          title: 'Left squad',
          description: `You have left r/${squad.name}`,
        });
      } else {
        // Join squad
        await supabase
          .from('squad_members')
          .insert({
            user_id: user.id,
            squad_id: squad.id
          });
        
        setIsMember(true);
        toast({
          title: 'Success',
          description: `You have joined r/${squad.name}`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update squad membership',
        variant: 'destructive',
      });
    }
  };

  const handleFavoriteSquad = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to favorite squads',
        variant: 'default',
      });
      return;
    }

    try {
      if (isFavorite) {
        // Remove favorite
        await supabase
          .from('squad_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('squad_id', squad.id);
        
        setIsFavorite(false);
        toast({
          title: 'Removed from favorites',
          description: `r/${squad.name} has been removed from your favorites`,
        });
      } else {
        // Add favorite
        await supabase
          .from('squad_favorites')
          .insert({
            user_id: user.id,
            squad_id: squad.id
          });
        
        setIsFavorite(true);
        toast({
          title: 'Added to favorites',
          description: `r/${squad.name} has been added to your favorites`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update favorites',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container py-8">
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Squad not found</h2>
                <p className="text-muted-foreground mt-2">
                  The squad you're looking for doesn't exist or has been removed.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      
      {/* Squad header */}
      <div className="bg-card border-b">
        {squad.banner_image ? (
          <div 
            className="h-32 md:h-48 bg-center bg-cover"
            style={{ backgroundImage: `url(${squad.banner_image})` }}
          />
        ) : (
          <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
        
        <div className="container py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                r/{squad.name}
                {squad.is_verified && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base mt-1">
                {squad.member_count.toLocaleString()} members • {squad.post_count.toLocaleString()} posts
              </p>
              {squad.description && (
                <p className="mt-2 text-sm md:text-base max-w-3xl">{squad.description}</p>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 self-stretch md:self-auto">
              <Button
                variant={isMember ? "outline" : "default"}
                onClick={handleJoinSquad}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span>{isMember ? "Leave" : "Join"}</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={handleFavoriteSquad}
                className="flex items-center gap-2"
              >
                {isFavorite ? (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>Unfavorite</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Favorite</span>
                  </>
                )}
              </Button>
              
              {user && squad.moderator_id === user.id && (
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Manage</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container py-6">
        <div className="max-w-2xl mx-auto">
          {isMember && <CreatePostCard squadId={squad.id} />}
          
          <Tabs defaultValue="posts" className="mt-6">
            <TabsList className="w-full border-b rounded-none justify-start">
              <TabsTrigger value="posts" className="flex-1 md:flex-none">Posts</TabsTrigger>
              <TabsTrigger value="about" className="flex-1 md:flex-none">About</TabsTrigger>
              <TabsTrigger value="rules" className="flex-1 md:flex-none">Rules</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-4 mt-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="py-10">
                    <div className="text-center">
                      <h3 className="text-lg font-medium">No posts yet</h3>
                      <p className="text-muted-foreground mt-2">
                        Be the first to post in this squad!
                      </p>
                      
                      {!isMember && (
                        <Button onClick={handleJoinSquad} className="mt-4">
                          Join and Create Post
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={{
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    timestamp: new Date(post.created_at).toLocaleString(),
                    votes: post.upvotes - post.downvotes,
                    commentCount: post.commentcount,
                    squad: squad.name,
                    author: post.profiles?.username || "Unknown",
                    image: post.image,
                  }} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="about" className="mt-4">
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">About r/{squad.name}</h3>
                      <p className="text-muted-foreground mt-2">
                        {squad.description || "No description available."}
                      </p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <span className="text-sm font-medium">Created:</span>
                          <span className="text-sm ml-2 text-muted-foreground">
                            {new Date(squad.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Members:</span>
                          <span className="text-sm ml-2 text-muted-foreground">
                            {squad.member_count.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Posts:</span>
                          <span className="text-sm ml-2 text-muted-foreground">
                            {squad.post_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="rules" className="mt-4">
              <Card>
                <CardContent className="py-6">
                  <h3 className="text-lg font-medium">Community Rules</h3>
                  <p className="text-muted-foreground mt-2">
                    Rules for this community have not been set up yet.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SquadPage;
