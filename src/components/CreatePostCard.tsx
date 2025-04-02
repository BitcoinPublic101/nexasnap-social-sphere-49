import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { ImageUpload } from '@/components/ui/image-upload';

interface CreatePostCardProps {
  onPostCreated?: () => void;
  defaultSquadId?: number | null;
  isSquadPage?: boolean;
}

const CreatePostCard: React.FC<CreatePostCardProps> = ({ 
  onPostCreated, 
  defaultSquadId = null,
  isSquadPage = false 
}) => {
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [squadId, setSquadId] = useState<string>(defaultSquadId ? defaultSquadId.toString() : '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [squads, setSquads] = useState<any[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleImageUpload = useCallback(async (file: File) => {
    if (!user) return;
    
    try {
      setIsUploading(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);
        
      setImageUrl(publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload image. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user, toast]);
  
  React.useEffect(() => {
    const fetchSquads = async () => {
      if (!user) return;
      
      try {
        // Fetch squads the user is a member of
        const { data, error } = await supabase
          .from('squad_members')
          .select(`
            squad_id,
            squads:squad_id (
              id,
              name
            )
          `)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        if (data) {
          const formattedSquads = data.map(item => ({
            id: item.squads.id,
            name: item.squads.name
          }));
          
          setSquads(formattedSquads);
        }
      } catch (error: any) {
        console.error('Error fetching squads:', error);
      }
    };
    
    fetchSquads();
  }, [user]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ 
        title: 'Sign in required', 
        description: 'You must be signed in to create a post.' 
      });
      return;
    }
    
    if (!title.trim()) {
      toast({ 
        title: 'Title required', 
        description: 'Please enter a title for your post.' 
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const postData = {
        title,
        content,
        author_id: user.id,
        squad_id: squadId ? parseInt(squadId) : null,
        image: imageUrl || null
      };
      
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Clear form
      setTitle('');
      setContent('');
      setImageUrl('');
      if (!defaultSquadId) {
        setSquadId('');
      }
      
      // Notify success
      toast({ 
        title: 'Post created!', 
        description: 'Your post has been published successfully.' 
      });
      
      // Callback if provided
      if (onPostCreated) {
        onPostCreated();
      }
      
      // Navigate to the post if we're not on a squad page
      if (!isSquadPage && data) {
        navigate(`/post/${data.id}`);
      }
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create post. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Please sign in to create a post.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handlePostSubmit}>
        <CardContent className="p-6 space-y-4">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
            className="text-lg font-medium"
          />
          
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            className="min-h-[120px] resize-none"
          />
          
          {!defaultSquadId && squads.length > 0 && (
            <Select
              value={squadId}
              onValueChange={setSquadId}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Post to a squad (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Personal post (no squad)</SelectItem>
                {squads.map((squad) => (
                  <SelectItem key={squad.id} value={squad.id.toString()}>
                    {squad.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Add an image (optional)</p>
            <ImageUpload
              value={imageUrl}
              onChange={handleImageUpload}
              disabled={isSubmitting || isUploading}
            />
          </div>
        </CardContent>
        
        <CardFooter className="px-6 py-4 bg-muted/50 flex justify-between">
          <Button 
            variant="ghost" 
            type="button"
            onClick={() => {
              setTitle('');
              setContent('');
              setImageUrl('');
              if (!defaultSquadId) setSquadId('');
            }}
            disabled={isSubmitting || (!title && !content && !imageUrl)}
          >
            Clear
          </Button>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || isUploading || !title.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CreatePostCard;
