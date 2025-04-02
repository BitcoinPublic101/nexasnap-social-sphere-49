
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  full_name: z.string().optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  website: z.string().url('Invalid URL').or(z.string().length(0)).optional(),
  avatar_url: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const securityFormSchema = z.object({
  currentPassword: z.string().min(1, 'Please enter your current password'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SecurityFormValues = z.infer<typeof securityFormSchema>;

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      full_name: '',
      bio: '',
      website: '',
      avatar_url: '',
    },
  });

  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProfileData(data);
          profileForm.reset({
            username: data.username || '',
            full_name: data.full_name || '',
            bio: data.bio || '',
            website: data.website || '',
            avatar_url: data.avatar_url || '',
          });
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Failed to load profile',
          description: 'Something went wrong while loading your profile.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, profileForm, toast]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: data.full_name,
          bio: data.bio,
          website: data.website,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSecuritySubmit = async (data: SecurityFormValues) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // First, verify the current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: data.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // If current password is correct, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      securityForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !user) {
      return;
    }

    try {
      setIsLoading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload the file to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      // Update the avatar URL in the form
      profileForm.setValue('avatar_url', publicUrl);
      setAvatarUrl(publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-3xl font-bold">Your Account</h1>
      
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and public information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>
                    {profileData?.username?.substring(0, 2)?.toUpperCase() || user.email?.substring(0, 2)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Profile Picture</h3>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isLoading}
                      className="max-w-sm"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG or GIF. 1MB max.
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="username" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your unique username for NexaSnap
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your name as it will appear on your profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us a little bit about yourself"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description for your profile
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your personal website or portfolio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...securityForm}>
                <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                  <FormField
                    control={securityForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={securityForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Password must be at least 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={securityForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
