
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Share2,
  Bookmark,
  BookmarkCheck,
  Flag
} from 'lucide-react';

interface PostCardProps {
  post: {
    id: number;
    title: string;
    content: string;
    image?: string;
    upvotes: number;
    downvotes: number;
    commentcount: number;
    created_at: string;
    author_id: string;
    squad_id?: number;
    profiles: {
      username: string;
      avatar_url?: string;
    };
    squads?: {
      name: string;
    };
  };
  compact?: boolean;
  hideActions?: boolean;
  onVote?: (postId: number, isUpvote: boolean) => void;
}

const PostCard = ({ post, compact = false, hideActions = false, onVote }: PostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [voteScore, setVoteScore] = useState(post.upvotes - post.downvotes);
  const [bookmarked, setBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has already voted on this post
  React.useEffect(() => {
    const checkUserInteractions = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Check vote
        const { data: voteData } = await supabase
          .from('votes')
          .select('is_upvote')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();
        
        if (voteData) {
          setUserVote(voteData.is_upvote ? 'upvote' : 'downvote');
        }
        
        // Check bookmark
        const { data: bookmarkData } = await supabase
          .from('bookmarks')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();
        
        if (bookmarkData) {
          setBookmarked(true);
        }
      } catch (error) {
        // It's expected to get an error if the user hasn't voted/bookmarked
        // So we don't show an error message
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserInteractions();
  }, [post.id, user]);

  const handleVote = async (isUpvote: boolean) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to vote on posts',
      });
      navigate('/login');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Check if user has already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();
      
      let delta = 0;
      
      if (existingVote) {
        if (existingVote.is_upvote === isUpvote) {
          // Remove vote (clicking same button again)
          await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id);
          
          delta = isUpvote ? -1 : 1;
          setUserVote(null);
        } else {
          // Change vote
          await supabase
            .from('votes')
            .update({ is_upvote: isUpvote })
            .eq('id', existingVote.id);
          
          delta = isUpvote ? 2 : -2;
          setUserVote(isUpvote ? 'upvote' : 'downvote');
        }
      } else {
        // New vote
        await supabase
          .from('votes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            is_upvote: isUpvote
          });
        
        delta = isUpvote ? 1 : -1;
        setUserVote(isUpvote ? 'upvote' : 'downvote');
      }
      
      setVoteScore(prev => prev + delta);
      
      // Update the post's vote counts in the database
      if (onVote) {
        onVote(post.id, isUpvote);
      }
    } catch (error: any) {
      console.error('Error voting:', error);
      toast({
        title: 'Error',
        description: 'Failed to register your vote',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to bookmark posts',
      });
      navigate('/login');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (bookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        
        setBookmarked(false);
        toast({
          title: 'Bookmark removed',
          description: 'Post removed from your bookmarks',
        });
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
        
        setBookmarked(true);
        toast({
          title: 'Bookmark added',
          description: 'Post saved to your bookmarks',
        });
      }
    } catch (error: any) {
      console.error('Error bookmarking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast({
      title: 'Link copied',
      description: 'Post link copied to clipboard',
    });
  };

  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className="mb-4 hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {post.squads && (
              <>
                <Link to={`/r/${post.squads.name}`} className="font-medium text-foreground hover:underline">
                  r/{post.squads.name}
                </Link>
                <span>•</span>
              </>
            )}
            <span>Posted by</span>
            <Link to={`/u/${post.profiles.username}`} className="hover:underline">
              u/{post.profiles.username}
            </Link>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <Link to={`/post/${post.id}`} className="no-underline">
          <h3 className="text-lg font-semibold mb-2 hover:text-primary transition-colors">
            {post.title}
          </h3>
          
          {!compact && (
            <>
              <div className="prose dark:prose-invert max-w-none text-sm">
                <p className="line-clamp-3">{truncateContent(post.content, 250)}</p>
              </div>
              
              {post.image && (
                <div className="mt-3 max-h-[300px] overflow-hidden rounded-md">
                  <img src={post.image} alt={post.title} className="w-full object-cover" />
                </div>
              )}
            </>
          )}
        </Link>
      </CardContent>
      
      {!hideActions && (
        <CardFooter className="pt-0 pb-2 flex justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center border rounded-full pr-2">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 rounded-l-full ${userVote === 'upvote' ? 'text-primary' : ''}`}
                onClick={() => handleVote(true)}
                disabled={isLoading}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium mx-1">{voteScore}</span>
              
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 rounded-r-full ${userVote === 'downvote' ? 'text-primary' : ''}`}
                onClick={() => handleVote(false)}
                disabled={isLoading}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
            
            <Link to={`/post/${post.id}`} className="flex items-center gap-1 hover:text-primary no-underline">
              <MessageSquare className="h-4 w-4" />
              <span>{post.commentcount || 0}</span>
            </Link>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 flex items-center gap-1"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 flex items-center gap-1 ${bookmarked ? 'text-primary' : ''}`}
              onClick={handleBookmark}
              disabled={isLoading}
            >
              {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 flex items-center gap-1"
              onClick={() => {
                if (!user) {
                  toast({
                    title: 'Authentication required',
                    description: 'Please sign in to report content',
                  });
                  navigate('/login');
                  return;
                }
                
                toast({
                  title: 'Report submitted',
                  description: 'Thank you for helping keep NexaSnap safe',
                });
              }}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default PostCard;
