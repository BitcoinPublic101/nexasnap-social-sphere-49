import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/PostCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import SEOMetaTags from '@/components/SEOMetaTags';

interface Post {
  id: number;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
  image: string | null;
  upvotes: number | null;
  downvotes: number | null;
  commentcount: number | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

const SquadPage = () => {
  const { squadName } = useParams();
  const [squad, setSquad] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSquadData = async () => {
      setIsLoading(true);
      try {
        const { data: squadData, error: squadError } = await supabase
          .from('squads')
          .select('*')
          .eq('name', squadName)
          .single();

        if (squadError) {
          throw squadError;
        }

        if (squadData) {
          setSquad(squadData);

          // Fetch posts for the squad
          const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select('*, profiles(username, avatar_url)')
            .eq('squad_id', squadData.id)
            .order('created_at', { ascending: false });

          if (postsError) {
            throw postsError;
          }

          if (postsData) {
            setPosts(postsData);
          }

          // Check if the user is a member
          if (user) {
            const { data: memberData, error: memberError } = await supabase
              .from('squad_members')
              .select('*')
              .eq('squad_id', squadData.id)
              .eq('user_id', user.id)
              .single();

            if (!memberError && memberData) {
              setIsMember(true);
            }

            // Check if the squad is a favorite
            const { data: favoriteData, error: favoriteError } = await supabase
              .from('squad_favorites')
              .select('*')
              .eq('squad_id', squadData.id)
              .eq('user_id', user.id)
              .single();

            if (!favoriteError && favoriteData) {
              setIsFavorite(true);
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching squad data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load squad information.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSquadData();
  }, [squadName, user, toast]);

  const handleJoinSquad = async () => {
    if (!user || !squad) {
      toast({
        title: 'Error',
        description: 'You must be logged in to join a squad.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('squad_members')
        .insert({
          squad_id: squad.id,
          user_id: user.id,
        });

      if (error) {
        throw error;
      }

      setIsMember(true);
      toast({
        title: 'Success',
        description: 'You have successfully joined the squad!',
      });
    } catch (error: any) {
      console.error('Error joining squad:', error);
      toast({
        title: 'Error',
        description: 'Failed to join the squad. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveSquad = async () => {
    if (!user || !squad) {
      toast({
        title: 'Error',
        description: 'You must be logged in to leave a squad.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('squad_id', squad.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setIsMember(false);
      toast({
        title: 'Success',
        description: 'You have successfully left the squad.',
      });
    } catch (error: any) {
      console.error('Error leaving squad:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave the squad. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavoriteSquad = async () => {
    if (!user || !squad) {
      toast({
        title: 'Error',
        description: 'You must be logged in to favorite a squad.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('squad_favorites')
          .delete()
          .eq('squad_id', squad.id)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        setIsFavorite(false);
        toast({
          title: 'Success',
          description: 'Squad removed from favorites.',
        });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('squad_favorites')
          .insert({
            squad_id: squad.id,
            user_id: user.id,
          });

        if (error) {
          throw error;
        }

        setIsFavorite(true);
        toast({
          title: 'Success',
          description: 'Squad added to favorites!',
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite squad:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorite status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <SEOMetaTags
        title={`${squad?.name || 'Squad'} - NexaSnap`}
        description={squad?.description || `Explore the ${squadName} squad on NexaSnap.`}
        keywords={[squadName, 'squad', 'community', 'NexaSnap']}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{squad?.name || squadName}</h1>
          <p className="text-muted-foreground">
            {squad?.description || 'A community squad on NexaSnap.'}
          </p>
        </div>
        {user && squad && (
          <div className="space-x-2">
            <Button
              variant={isFavorite ? 'destructive' : 'outline'}
              onClick={toggleFavoriteSquad}
              disabled={isLoading}
            >
              {isFavorite ? 'Unfavorite' : 'Favorite'}
            </Button>
            {isMember ? (
              <Button onClick={handleLeaveSquad} disabled={isLoading}>
                Leave Squad
              </Button>
            ) : (
              <Button onClick={handleJoinSquad} disabled={isLoading}>
                Join Squad
              </Button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center my-8">
          <p>Loading squad information...</p>
        </div>
      ) : squad ? (
        <div>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={squad.banner_image || undefined} alt={squad.name} />
              <AvatarFallback>{squad.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{squad.name}</h2>
              <p className="text-muted-foreground">
                Created on {new Date(squad.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <Tabs defaultValue="posts" className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              {squad.moderator_id === user?.id && (
                <TabsTrigger value="manage">Manage Squad</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="posts">
              
              <div className="grid grid-cols-1 gap-6">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={{
                        ...post,
                        created_at: post.created_at
                      }} 
                    />
                  ))
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-center text-muted-foreground">
                        No posts in this squad yet. Be the first to post!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="about">
              <Card>
                <CardContent className="p-6 prose max-w-none">
                  <h3 className="text-xl font-bold mb-4">About {squad.name}</h3>
                  <p>{squad.description || "No description available."}</p>
                  
                  <div className="mt-6">
                    <h4 className="text-lg font-medium mb-2">Squad Stats</h4>
                    <ul className="list-disc pl-5">
                      <li>Members: {squad.member_count || 0}</li>
                      <li>Posts: {squad.post_count || 0}</li>
                      <li>Created: {new Date(squad.created_at).toLocaleDateString()}</li>
                      {squad.is_verified && <li>Verified Squad</li>}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="members">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Squad Members</h3>
                  <p className="text-muted-foreground">
                    Coming soon: List of squad members and their roles.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {squad.moderator_id === user?.id && (
              <TabsContent value="manage">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Manage Squad</h3>
                    <p className="text-muted-foreground">
                      Coming soon: Options to manage squad settings and members.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Squad not found or has been removed.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SquadPage;
