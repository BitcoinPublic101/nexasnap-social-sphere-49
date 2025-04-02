import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PostCard from '@/components/PostCard';
import { TrendingSideBar } from '@/components/TrendingSideBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, UserPlus, UserCheck, Settings, ExternalLink, Calendar, MapPin, Sparkles } from 'lucide-react';

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
        
        if (profileError) throw profileError;
        if (!profileData) throw new Error('User not found');
        
        setUser(profileData);
        setIsPremium(profileData.is_premium || false);
        
        // Update follow-related data after user is fetched
        await fetchFollowData(profileData.id);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load profile',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [username, navigate, toast]);

  const fetchFollowData = async (userId: string) => {
    try {
      if (!userId) return;
      
      // Temporarily use placeholder values for follower and following counts
      // Fetch follower count
      // const { count: followerCountData, error: followerError } = await supabase.rpc(
      //   'count_followers',
      //   { user_id: userId }
      // );
      
      // if (!followerError) {
      //   setFollowerCount(followerCountData || 0);
      // }
      
      // // Fetch following count
      // const { count: followingCountData, error: followingError } = await supabase.rpc(
      //   'count_following',
      //   { user_id: userId }
      // );
      
      // if (!followingError) {
      //   setFollowingCount(followingCountData || 0);
      // }
      
      // // Check if current user is following this profile
      // if (currentUser) {
      //   const { data: isFollowingData, error: followCheckError } = await supabase.rpc(
      //     'check_is_following',
      //     { 
      //       follower_user_id: currentUser.id, 
      //       followed_user_id: userId 
      //     }
      //   );
        
      //   if (!followCheckError) {
      //     setIsFollowing(isFollowingData || false);
      //   }
      // }

      // Using placeholder values
      setFollowerCount(123);
      setFollowingCount(45);
      setIsFollowing(false);
      
      // Fetch posts by this user
      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id(username, avatar_url),
          squads:squad_id(name)
        `)
        .eq('author_id', userId)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (postsError) throw postsError;
      
      setPosts(userPosts || []);
    } catch (error) {
      console.error('Error fetching follow data:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to follow users',
      });
      navigate('/login');
      return;
    }
    
    if (!user) return;
    
    setIsLoadingFollow(true);
    try {
      // Comment out RPC calls since they depend on functions that may not exist yet
      // if (isFollowing) {
      //   await supabase.rpc('unfollow_user', {
      //     follower_user_id: currentUser.id,
      //     followed_user_id: user.id
      //   });
      //   setIsFollowing(false);
      //   setFollowerCount(prev => Math.max(0, prev - 1));
      //   toast({
      //     title: 'Unfollowed',
      //     description: `You no longer follow ${user.username}`,
      //   });
      // } else {
      //   await supabase.rpc('follow_user', {
      //     follower_user_id: currentUser.id,
      //     followed_user_id: user.id
      //   });
      //   setIsFollowing(true);
      //   setFollowerCount(prev => prev + 1);
      //   toast({
      //     title: 'Following',
      //     description: `You are now following ${user.username}`,
      //   });
      // }

      // Show a toast message about this feature being under development
      toast({
        title: 'Feature in development',
        description: 'The follow functionality is currently being implemented.',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingFollow(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <Skeleton className="h-10 w-full mb-4" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[200px] w-full mb-4" />
                ))}
              </div>
            </div>
            
            <div className="hidden md:block">
              <TrendingSideBar />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <p className="text-muted-foreground mb-6">
            The user you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary/10">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">{user.username}</h1>
                        {isPremium && (
                          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-300 text-white">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {currentUser?.id === user.id ? (
                      <Button variant="outline" onClick={() => navigate('/settings')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    ) : (
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        onClick={handleFollowToggle}
                        disabled={isLoadingFollow}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{followerCount}</span>
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{followingCount}</span>
                    <span className="text-muted-foreground">Following</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{posts.length}</span>
                    <span className="text-muted-foreground">Posts</span>
                  </div>
                </div>
                
                {user.bio && (
                  <p className="text-sm mb-4">{user.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.website && (
                    <a 
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Website</span>
                    </a>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <Tabs defaultValue="posts">
                <TabsList>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="upvoted">Upvoted</TabsTrigger>
                </TabsList>
                
                <TabsContent value="posts" className="mt-4">
                  {posts.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground mb-2">No posts yet</p>
                        {currentUser?.id === user.id && (
                          <Button onClick={() => navigate('/')}>Create your first post</Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <PostCard 
                          key={post.id} 
                          post={{
                            id: post.id,
                            title: post.title,
                            content: post.content,
                            timestamp: new Date(post.created_at).toLocaleString(),
                            votes: post.upvotes - post.downvotes,
                            commentCount: post.commentcount,
                            squad: post.squads?.name || "Unknown",
                            author: post.profiles?.username || "Unknown",
                            image: post.image,
                          }} 
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="comments" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">Comments will be displayed here</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="upvoted" className="mt-4">
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">Upvoted content will be displayed here</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div className="hidden md:block">
            <TrendingSideBar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
