
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, Users, MapPin, Link as LinkIcon, User, UserCheck } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { TrendingSideBar } from '@/components/TrendingSideBar';

const UserProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Get profile info
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
        
        if (profileError) throw profileError;
        setProfile(profileData);
        
        // Get posts by this user
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:author_id(username, avatar_url),
            squads:squad_id(name)
          `)
          .eq('author_id', profileData.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!postsError) {
          setPosts(postsData || []);
        }
        
        // Get comments by this user
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            posts:post_id(title, id)
          `)
          .eq('author_id', profileData.id)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (!commentsError) {
          setComments(commentsData || []);
        }
        
        // Get follower count (people following this user)
        const { count: followersCount, error: followersError } = await supabase
          .rpc('count_followers', { user_id: profileData.id });

        if (!followersError && followersCount !== null) {
          setFollowerCount(followersCount);
        }
        
        // Get following count (people this user follows)
        const { count: followingCountData, error: followingError } = await supabase
          .rpc('count_following', { user_id: profileData.id });
        
        if (!followingError && followingCountData !== null) {
          setFollowingCount(followingCountData);
        }
        
        // Check if logged-in user is following this profile
        if (user) {
          const { data: followData } = await supabase
            .rpc('check_is_following', { 
              follower_user_id: user.id, 
              followed_user_id: profileData.id 
            });
          
          setIsFollowing(!!followData);
        }
      } catch (error: any) {
        console.error('Error fetching profile data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (username) {
      fetchProfileData();
    }
  }, [username, user, toast]);
  
  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to follow users',
      });
      return;
    }
    
    if (user.id === profile?.id) {
      toast({
        title: 'Cannot follow yourself',
        description: 'You cannot follow your own profile',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .rpc('unfollow_user', { 
            follower_user_id: user.id, 
            followed_user_id: profile.id 
          });
        
        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast({
          title: 'Unfollowed',
          description: `You are no longer following ${profile.username}`,
        });
      } else {
        // Follow
        await supabase
          .rpc('follow_user', { 
            follower_user_id: user.id, 
            followed_user_id: profile.id 
          });
        
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast({
          title: 'Following',
          description: `You are now following ${profile.username}`,
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update follow status',
        variant: 'destructive',
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex justify-center items-center flex-1 p-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex justify-center items-center flex-1 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The user you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center md:items-start">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarImage src={profile.avatar_url} />
                      <AvatarFallback>
                        {profile.username?.substring(0, 2)?.toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {user && user.id !== profile.id && (
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        className="mb-2 w-full"
                        onClick={handleFollowToggle}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Following
                          </>
                        ) : (
                          <>
                            <User className="mr-2 h-4 w-4" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                    
                    {user && user.id === profile.id && (
                      <Button variant="outline" className="mb-2 w-full" asChild>
                        <Link to="/settings">Edit Profile</Link>
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-1">{profile.username}</h1>
                    
                    {profile.full_name && (
                      <h2 className="text-lg text-muted-foreground mb-4">{profile.full_name}</h2>
                    )}
                    
                    {profile.bio && (
                      <p className="mb-4 whitespace-pre-line">{profile.bio}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{followerCount} followers</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Following {followingCount}</span>
                      </div>
                      
                      {profile.website && (
                        <div className="flex items-center gap-1">
                          <LinkIcon className="h-4 w-4" />
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {new URL(profile.website).hostname}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Profile Tabs */}
            <Tabs defaultValue="posts">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
                <TabsTrigger value="comments" className="flex-1">Comments</TabsTrigger>
                <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts">
                {posts.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {user && user.id === profile.id 
                          ? "You haven't created any posts yet."
                          : `${profile.username} hasn't created any posts yet.`}
                      </p>
                      {user && user.id === profile.id && (
                        <Button asChild>
                          <Link to="/">Create a Post</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div>
                    {posts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="comments">
                {comments.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <h3 className="text-lg font-medium mb-2">No comments yet</h3>
                      <p className="text-muted-foreground">
                        {user && user.id === profile.id 
                          ? "You haven't made any comments yet."
                          : `${profile.username} hasn't made any comments yet.`}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <Card key={comment.id}>
                        <CardHeader className="pb-2">
                          <div className="text-sm text-muted-foreground">
                            <span>Comment on </span>
                            <Link to={`/post/${comment.post_id}`} className="font-medium text-foreground hover:underline">
                              {comment.posts?.title || 'Deleted Post'}
                            </Link>
                            <span> • {formatDistanceToNow(new Date(comment.created_at))} ago</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="whitespace-pre-line">{comment.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="about">
                <Card>
                  <CardHeader>
                    <CardTitle>About {profile.username}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Username</h3>
                      <p>{profile.username}</p>
                    </div>
                    
                    {profile.full_name && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Full Name</h3>
                        <p>{profile.full_name}</p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Account Created</h3>
                      <p>{new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>
                    
                    {profile.bio && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Bio</h3>
                        <p className="whitespace-pre-line">{profile.bio}</p>
                      </div>
                    )}
                    
                    {profile.website && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Website</h3>
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
  );
};

export default UserProfile;
