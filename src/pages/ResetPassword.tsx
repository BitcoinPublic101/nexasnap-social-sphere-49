
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    // Get the hash from the URL
    const hashFromUrl = window.location.hash.substring(1);
    if (hashFromUrl) {
      setHash(hashFromUrl);
    } else {
      toast({
        title: 'Invalid reset link',
        description: 'The password reset link appears to be invalid or expired.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [navigate, toast]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!hash) {
      toast({
        title: 'Invalid reset link',
        description: 'The password reset link appears to be invalid or expired.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      
      if (error) {
        toast({
          title: 'Password reset failed',
          description: error.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated. You can now log in with your new password.',
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Password reset failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
          <CardDescription>
            Create a new password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => navigate('/login')}>
            Back to login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;
