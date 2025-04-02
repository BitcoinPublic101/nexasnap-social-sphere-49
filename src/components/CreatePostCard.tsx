
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Image, Link, Loader2 } from 'lucide-react';

export const CreatePostCard = ({ squadId, onPostCreated }: { squadId?: number, onPostCreated?: (post: any) => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSquad, setSelectedSquad] = useState<string | null>(squadId ? squadId.toString() : null);
  const [squads, setSquads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  const handleOpenDialog = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a post',
        variant: 'default',
      });
      navigate('/login');
      return;
    }
    
    setOpen(true);
    
    // Only fetch squads if not already on a squad page (squadId is provided)
    if (!squadId) {
      setIsLoading(true);
      try {
        // Get squads where user is a member
        const { data: memberSquads, error: memberError } = await supabase
          .from('squad_members')
          .select(`
            squad_id,
            squads:squad_id(id, name)
          `)
          .eq('user_id', user.id);
        
        if (memberError) throw memberError;
        
        // Also get some popular squads
        const { data: popularSquads, error: popularError } = await supabase
          .from('squads')
          .select('id, name')
          .order('member_count', { ascending: false })
          .limit(5);
        
        if (popularError) throw popularError;
        
        // Combine and deduplicate squads
        const memberSquadIds = memberSquads.map(s => s.squads.id);
        const allSquads = [
          ...memberSquads.map(s => s.squads),
          ...popularSquads.filter(s => !memberSquadIds.includes(s.id))
        ];
        
        setSquads(allSquads);
        
        // Set default squad if any available
        if (allSquads.length > 0 && !selectedSquad) {
          setSelectedSquad(allSquads[0].id.toString());
        }
      } catch (error: any) {
        console.error('Error fetching squads:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load squads',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleCreatePost = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create a post',
        variant: 'default',
      });
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your post',
        variant: 'default',
      });
      return;
    }
    
    if (!selectedSquad) {
      toast({
        title: 'Squad required',
        description: 'Please select a squad for your post',
        variant: 'default',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Create post in Supabase
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          image: imageUrl.trim() || null,
          squad_id: parseInt(selectedSquad, 10),
          author_id: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Post created',
        description: 'Your post has been published successfully',
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setImageUrl('');
      setSelectedSquad(null);
      
      // Refresh the feed (if callback provided)
      if (onPostCreated) {
        onPostCreated(post);
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.user_metadata?.username?.substring(0, 2)?.toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Input
                placeholder="Create Post"
                className="bg-secondary/50"
                onClick={handleOpenDialog}
                readOnly
              />
            </div>
            <Button variant="ghost" size="icon" onClick={handleOpenDialog}>
              <Image className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleOpenDialog}>
              <Link className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create a post</DialogTitle>
            <DialogDescription>
              Share something interesting with the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {!squadId && (
              <div className="grid gap-2">
                <Label htmlFor="squad">Squad</Label>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading squads...</span>
                  </div>
                ) : (
                  <>
                    {squads.length === 0 ? (
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>You haven't joined any squads yet. Join a squad first to post.</span>
                      </div>
                    ) : (
                      <Select
                        value={selectedSquad?.toString()}
                        onValueChange={(value) => setSelectedSquad(Number(value))}
                      >
                        <SelectTrigger id="squad">
                          <SelectValue placeholder="Select a squad" />
                        </SelectTrigger>
                        <SelectContent>
                          {squads.map((squad) => (
                            <SelectItem key={squad.id} value={squad.id.toString()}>
                              r/{squad.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </>
                )}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a title"
                maxLength={300}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[120px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL (optional)</Label>
              <Input
                id="image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              {imageUrl && (
                <div className="mt-2 rounded-md overflow-hidden bg-black/5 dark:bg-white/5">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-[200px] w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePost} disabled={!title.trim() || !selectedSquad || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
