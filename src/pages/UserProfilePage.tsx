
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { CommunitySidebar } from '@/components/ui/CommunitySidebar';
import { TrendingSideBar } from '@/components/TrendingSideBar';
import { ThemeProvider } from '@/context/ThemeContext';
import SEOMetaTags from '@/components/SEOMetaTags';
import { supabase } from '@/integrations/supabase/client';
import { PostWithAuthor, Profile } from '@/types/supabase-custom';
import PostCard from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Link as LinkIcon, MapPin, MessageSquare, Settings, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const UserProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
        
        if (profileError) throw profileError;
        
        setProfile(profileData);
        
        // Check if current user is following this profile
        if (user && profileData) {
          const { data: followData } = await supabase
            .from('squad_members')
            .select('id')
            .eq('user_id', user.id)
            .eq('squad_id', profileData.id)
            .single();
          
          setIsFollowing(!!followData);
        }
        
        // Fetch user's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles(username, avatar_url),
            squads(name)
          `)
          .eq('author_id', profileData.id)
          .order('created_at', { ascending: false });
        
        if (postsError) throw postsError;
        
        setPosts(postsData as PostWithAuthor[]);
      } catch (error: any) {
        console.error('Error fetching profile:', error);
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
      fetchProfile();
    }
  }, [username, user, toast]);
  
  const handleFollow = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to follow users',
      });
      return;
    }
    
    if (!profile) return;
    
    try {
      if (isFollowing) {
        // Unfollow user
        await supabase
          .from('squad_members')
          .delete()
          .eq('user_id', user.id)
          .eq('squad_id', profile.id);
        
        setIsFollowing(false);
        toast({
          title: 'Unfollowed',
          description: `You are no longer following ${profile.username}`,
        });
      } else {
        // Follow user
        await supabase
          .from('squad_members')
          .insert({
            user_id: user.id,
            squad_id: profile.id,
          });
        
        setIsFollowing(true);
        toast({
          title: 'Following',
          description: `You are now following ${profile.username}`,
        });
      }
    } catch (error: any) {
      console.error('Error following/unfollowing:', error);
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
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }
    
    if (!profile) {
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <Avatar className="h-24 w-24 border-2 border-primary">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
              <AvatarFallback className="text-2xl">{profile.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                {profile.is_premium && (
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-300 text-white text-xs px-2 py-1 rounded-full">
                    Premium
                  </span>
                )}
                {profile.is_admin && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              
              {profile.full_name && (
                <p className="text-muted-foreground mt-1">{profile.full_name}</p>
              )}
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {formatDistanceToNow(new Date(profile.created_at))} ago
                </div>
                
                {profile.heaven_points !== null && profile.heaven_points !== undefined && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {profile.heaven_points} karma points
                  </div>
                )}
                
                {profile.website && (
                  <div className="flex items-center text-sm">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    <a 
                      href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {user && user.id !== profile.id && (
                <Button 
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
              
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
              
              {user && user.id === profile.id && (
                <Button variant="outline" asChild>
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          {profile.bio && (
            <div className="mt-6">
              <p className="text-sm whitespace-pre-line">{profile.bio}</p>
            </div>
          )}
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="squads">Squads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>This user hasn't posted anything yet.</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Comments will be displayed here.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="squads" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <p>Squads will be displayed here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };
  
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <SEOMetaTags 
          title={profile ? `${profile.username}'s Profile` : 'User Profile'}
          description={profile?.bio?.substring(0, 160) || `Check out ${username}'s profile and posts`}
          keywords={['profile', 'user', 'posts', 'comments']}
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
            <div className="max-w-3xl mx-auto">
              {renderContent()}
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
    </ThemeProvider>
  );
};

export default UserProfilePage;
