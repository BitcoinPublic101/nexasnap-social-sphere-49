
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { CommunitySidebar } from '@/components/ui/CommunitySidebar';
import { ThemeProvider } from '@/context/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { PostWithAuthor, Profile, Squad } from '@/types/supabase-custom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Users } from 'lucide-react';
import SEOMetaTags from '@/components/SEOMetaTags';

const UserProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [joinedSquads, setJoinedSquads] = useState<Squad[]>([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
        
        if (profileError) throw profileError;
        
        setProfile(profileData);
        
        // Fetch user's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*, profiles(username, avatar_url), squads(name)')
          .eq('author_id', profileData.id)
          .order('created_at', { ascending: false });
        
        if (postsError) throw postsError;
        
        // Cast to PostWithAuthor - we've verified the structure above
        setPosts(postsData as unknown as PostWithAuthor[]);
        
        // Fetch squads the user has joined
        const { data: squadsData, error: squadsError } = await supabase
          .from('squad_members')
          .select('squads(*)')
          .eq('user_id', profileData.id);
        
        if (squadsError) throw squadsError;
        
        const squads = squadsData.map(item => item.squads);
        setJoinedSquads(squads);
        
        // Check if current user is following this profile
        if (currentUser) {
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', profileData.id);
          
          if (!followError && followData) {
            setIsFollowing(followData.length > 0);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load user profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (username) {
      fetchProfileData();
    }
  }, [username, currentUser, toast]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to follow users',
        variant: 'default',
      });
      navigate('/login');
      return;
    }
    
    if (!profile) return;
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);
        
        if (error) throw error;
        
        setIsFollowing(false);
        toast({
          title: 'Unfollowed',
          description: `You no longer follow ${profile.username}`,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: profile.id,
          });
        
        if (error) throw error;
        
        setIsFollowing(true);
        toast({
          title: 'Following',
          description: `You are now following ${profile.username}`,
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }
    
    if (!profile) {
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      );
    }
    
    const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
            <AvatarFallback>{profile.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {profile.is_verified && (
                <Badge variant="secondary" className="h-6 w-fit">Verified</Badge>
              )}
              {profile.role === 'admin' && (
                <Badge className="bg-red-500 h-6 w-fit">Admin</Badge>
              )}
              {profile.role === 'moderator' && (
                <Badge className="bg-green-500 h-6 w-fit">Moderator</Badge>
              )}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground gap-4">
              <div className="flex items-center">
                <CalendarDays className="mr-1 h-4 w-4" />
                <span>Joined {joinDate}</span>
              </div>
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                <span>{profile.followers_count || 0} followers</span>
              </div>
            </div>
            
            {profile.bio && (
              <p className="text-sm mt-2 max-w-2xl">{profile.bio}</p>
            )}
          </div>
          
          {currentUser && currentUser.id !== profile.id && (
            <Button 
              onClick={handleFollowToggle}
              variant={isFollowing ? "outline" : "default"}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="squads">Squads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4 mt-4">
            {posts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="mb-2">No posts yet</p>
                <p className="text-sm">This user hasn't posted anything yet</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="comments" className="mt-4">
            <div className="text-center py-10 text-muted-foreground">
              <p>Comments will be displayed here</p>
            </div>
          </TabsContent>
          
          <TabsContent value="squads" className="mt-4">
            {joinedSquads.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="mb-2">No squads joined</p>
                <p className="text-sm">This user hasn't joined any squads yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {joinedSquads.map(squad => (
                  <div 
                    key={squad.id} 
                    className="border rounded-lg p-4 cursor-pointer hover:border-primary"
                    onClick={() => navigate(`/r/${squad.name}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={squad.avatar_url || ''} alt={squad.name} />
                        <AvatarFallback>{squad.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">r/{squad.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {squad.member_count || 0} members
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <SEOMetaTags 
          title={`${profile?.username || 'User'} - Profile`}
          description={`View ${profile?.username || 'this user'}'s profile, posts and activity on NexaSnap.`}
          keywords={['profile', 'user', 'posts', 'social media']}
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
            <div className="max-w-4xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default UserProfilePage;
