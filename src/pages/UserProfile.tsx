
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PostCard } from '@/components/PostCard';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Edit, UserPlus, UserMinus, Mail } from 'lucide-react';

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // Fetch profile by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) throw profileError;
        if (!profileData) throw new Error('Profile not found');

        setProfile(profileData);

        // Fetch user's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            squads:squad_id(name),
            profiles:author_id(username)
          `)
          .eq('author_id', profileData.id)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;
        setPosts(postsData || []);

        // Check if current user is following this profile
        if (user) {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('followed_id', profileData.id)
            .maybeSingle();
          
          setIsFollowing(!!followData);
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load profile',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, user, toast]);

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to follow users',
        variant: 'default',
      });
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', profile.id);
        
        setIsFollowing(false);
        toast({
          title: 'Unfollowed',
          description: `You are no longer following ${profile.username}`,
        });
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            followed_id: profile.id
          });
        
        setIsFollowing(true);
        toast({
          title: 'Success',
          description: `You are now following ${profile.username}`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update follow status',
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

  if (!profile) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container py-8">
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold">User not found</h2>
                <p className="text-muted-foreground mt-2">
                  The user you're looking for doesn't exist or has been removed.
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
      <div className="container py-6">
        <div className="bg-card rounded-lg overflow-hidden shadow-md">
          {/* Cover image/banner */}
          <div className="h-32 md:h-40 bg-gradient-to-r from-primary/20 to-primary/5" />
          
          {/* Profile info section */}
          <div className="px-4 md:px-6 pb-6 relative">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <Avatar className="-mt-12 border-4 border-background w-24 h-24 md:w-32 md:h-32">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.username?.substring(0, 2)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 pt-2">
                <h1 className="text-2xl md:text-3xl font-bold">{profile.full_name || profile.username}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
              
              <div className="flex gap-2 mt-4 md:mt-0">
                {user && user.id === profile.id ? (
                  <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                    <a href="/settings">
                      <Edit className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </a>
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={handleFollow}
                      className="flex items-center gap-2"
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4" />
                          <span>Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>Message</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {profile.bio && (
              <div className="mt-4">
                <p>{profile.bio}</p>
              </div>
            )}
            
            <div className="flex gap-6 mt-4">
              <div className="text-sm">
                <span className="font-bold">250</span> 
                <span className="text-muted-foreground"> posts</span>
              </div>
              <div className="text-sm">
                <span className="font-bold">12.4k</span> 
                <span className="text-muted-foreground"> followers</span>
              </div>
              <div className="text-sm">
                <span className="font-bold">142</span> 
                <span className="text-muted-foreground"> following</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <Tabs defaultValue="posts">
            <TabsList className="w-full border-b rounded-none justify-start">
              <TabsTrigger value="posts" className="flex-1 md:flex-none">Posts</TabsTrigger>
              <TabsTrigger value="comments" className="flex-1 md:flex-none">Comments</TabsTrigger>
              <TabsTrigger value="saved" className="flex-1 md:flex-none">Saved</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-4 mt-4">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="py-10">
                    <div className="text-center">
                      <h3 className="text-lg font-medium">No posts yet</h3>
                      <p className="text-muted-foreground mt-2">
                        This user hasn't posted anything yet.
                      </p>
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
                    squad: post.squads?.name || "Unknown",
                    author: post.profiles?.username || "Unknown",
                    image: post.image,
                  }} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Comments</h3>
                    <p className="text-muted-foreground mt-2">
                      This feature is coming soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="saved" className="mt-4">
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Saved Posts</h3>
                    <p className="text-muted-foreground mt-2">
                      This feature is coming soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
