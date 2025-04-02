
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Loader2, Camera, Trash, Moon, Sun, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Email notification preferences
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyPosts, setNotifyPosts] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setProfile(data);
        setUsername(data.username || '');
        setFullName(data.full_name || '');
        setEmail(user.email || '');
        setBio(data.bio || '');
        setWebsite(data.website || '');
        setAvatarUrl(data.avatar_url || '');
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
    
    fetchProfile();
  }, [user, navigate, toast]);
  
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setAvatarFile(file);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      let newAvatarUrl = avatarUrl;
      
      // Upload new avatar if selected
      if (avatarFile) {
        const fileName = `avatar-${user.id}-${Date.now()}`;
        const { error: uploadError, data } = await supabase.storage
          .from('profile-images')
          .upload(fileName, avatarFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);
        
        newAvatarUrl = publicUrl;
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          full_name: fullName,
          bio,
          website,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update user metadata in auth
      await supabase.auth.updateUser({
        data: {
          username,
          avatar_url: newAvatarUrl
        }
      });
      
      setAvatarUrl(newAvatarUrl);
      setAvatarPreview(null);
      setAvatarFile(null);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Email sent',
        description: 'Check your email for a password reset link',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send password reset email',
        variant: 'destructive',
      });
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign out',
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
  
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>
          
          <Tabs defaultValue="profile">
            <div className="flex flex-col md:flex-row gap-8">
              <TabsList className="md:flex-col h-auto md:h-[300px] w-full md:w-[200px] bg-card rounded-lg p-1 md:p-2">
                <TabsTrigger 
                  value="profile" 
                  className="w-full justify-start text-left px-3 py-2 mb-1 data-[state=active]:bg-primary/10"
                >
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="account" 
                  className="w-full justify-start text-left px-3 py-2 mb-1 data-[state=active]:bg-primary/10"
                >
                  Account
                </TabsTrigger>
                <TabsTrigger 
                  value="appearance" 
                  className="w-full justify-start text-left px-3 py-2 mb-1 data-[state=active]:bg-primary/10"
                >
                  Appearance
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="w-full justify-start text-left px-3 py-2 mb-1 data-[state=active]:bg-primary/10"
                >
                  Notifications
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="w-full justify-start text-left px-3 py-2 mb-1 data-[state=active]:bg-primary/10"
                >
                  Privacy & Safety
                </TabsTrigger>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-left px-3 py-2 text-destructive hover:text-destructive mt-auto"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </TabsList>
              
              <div className="flex-1">
                <TabsContent value="profile" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile</CardTitle>
                      <CardDescription>
                        Manage how your profile appears to others.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="relative group">
                          <Avatar className="h-24 w-24 border-2 border-white shadow-md">
                            <AvatarImage 
                              src={avatarPreview || avatarUrl} 
                              alt={username} 
                            />
                            <AvatarFallback className="text-3xl">
                              {username?.substring(0, 2)?.toUpperCase() || user?.email?.substring(0, 2)?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                            <label className="cursor-pointer p-2 text-white">
                              <Camera className="h-5 w-5" />
                              <span className="sr-only">Upload avatar</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleAvatarChange}
                              />
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="username">Username</Label>
                              <Input 
                                id="username" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fullName">Full Name</Label>
                              <Input 
                                id="fullName" 
                                value={fullName} 
                                onChange={(e) => setFullName(e.target.value)} 
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="email">Email</Label>
                              <Input 
                                id="email" 
                                value={email} 
                                disabled 
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="bio">Bio</Label>
                              <Textarea 
                                id="bio" 
                                value={bio} 
                                onChange={(e) => setBio(e.target.value)} 
                                className="min-h-20 resize-none"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="website">Website</Label>
                              <Input 
                                id="website" 
                                value={website} 
                                onChange={(e) => setWebsite(e.target.value)} 
                                placeholder="https://"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button disabled={isSaving} onClick={handleSaveProfile}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : "Save changes"}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="account" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account</CardTitle>
                      <CardDescription>
                        Manage your account details and security.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Authentication</h3>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <p className="font-medium">Email Authentication</p>
                              <p className="text-sm text-muted-foreground">
                                {email}
                              </p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <p className="font-medium">Password</p>
                              <p className="text-sm text-muted-foreground">
                                Last updated: unknown
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleChangePassword}
                            >
                              Change password
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Account Management</h3>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between p-3 border rounded-md border-destructive/50 bg-destructive/5">
                            <div>
                              <p className="font-medium text-destructive">Deactivate Account</p>
                              <p className="text-sm text-muted-foreground">
                                Temporarily disable your account
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Deactivate
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-3 border rounded-md border-destructive/50 bg-destructive/5">
                            <div>
                              <p className="font-medium text-destructive">Delete Account</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                <span>This action is permanent and cannot be undone</span>
                              </p>
                            </div>
                            <Button variant="destructive" size="sm">
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="appearance" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>
                        Customize how NexaSnap looks for you.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Theme</h3>
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            {theme === 'dark' ? (
                              <Moon className="h-5 w-5" />
                            ) : (
                              <Sun className="h-5 w-5" />
                            )}
                            <div>
                              <p className="font-medium">{theme === 'dark' ? 'Dark' : 'Light'} Mode</p>
                              <p className="text-sm text-muted-foreground">
                                {theme === 'dark' 
                                  ? 'Using dark theme for reduced eye strain in low light' 
                                  : 'Using light theme for better visibility in bright environments'
                                }
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={theme === 'dark'}
                            onCheckedChange={toggleTheme}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="notifications" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>
                        Configure how and when you want to be notified.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Email Notifications</h3>
                        <div className="grid gap-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Comments</p>
                              <p className="text-sm text-muted-foreground">
                                Receive email notifications when someone comments on your posts
                              </p>
                            </div>
                            <Switch
                              checked={notifyComments}
                              onCheckedChange={setNotifyComments}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">New Posts</p>
                              <p className="text-sm text-muted-foreground">
                                Receive email notifications about new posts in your favorite squads
                              </p>
                            </div>
                            <Switch
                              checked={notifyPosts}
                              onCheckedChange={setNotifyPosts}
                            />
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Direct Messages</p>
                              <p className="text-sm text-muted-foreground">
                                Receive email notifications when someone sends you a message
                              </p>
                            </div>
                            <Switch
                              checked={notifyMessages}
                              onCheckedChange={setNotifyMessages}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => toast({ title: "Settings saved", description: "Your notification preferences have been updated" })}>
                        Save preferences
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="privacy" className="m-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy & Safety</CardTitle>
                      <CardDescription>
                        Manage your privacy settings and account security.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Profile Visibility</p>
                            <p className="text-sm text-muted-foreground">
                              Allow others to see your profile
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-muted-foreground">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Set up
                          </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Data & Privacy</p>
                            <p className="text-sm text-muted-foreground">
                              Download your data or delete it from our servers
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Download data
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
