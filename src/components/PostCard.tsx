
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUpIcon, ArrowDownIcon, MessageSquare, Bookmark, Share } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PostProps {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  votes: number;
  commentCount: number;
  squad: string;
  author: string;
  image?: string;
  tags?: string[];
}

export function PostCard({ post }: { post: PostProps }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [voteStatus, setVoteStatus] = useState<'upvote' | 'downvote' | null>(null);
  const [voteCount, setVoteCount] = useState(post.votes);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      // Check if post is voted by current user
      const { data: voteData } = await supabase
        .from('votes')
        .select('is_upvote')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .maybeSingle();
      
      if (voteData) {
        setVoteStatus(voteData.is_upvote ? 'upvote' : 'downvote');
      }
      
      // Check if post is bookmarked
      const { data: bookmarkData } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .maybeSingle();
      
      setIsBookmarked(!!bookmarkData);
      
      // Fetch author avatar
      const { data: authorData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('username', post.author)
        .maybeSingle();
      
      if (authorData?.avatar_url) {
        setAuthorAvatar(authorData.avatar_url);
      }
    };
    
    fetchUserData();
  }, [user, post.id, post.author]);
  
  const handleVote = async (isUpvote: boolean) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to vote',
        variant: 'default',
      });
      return;
    }
    
    const newVoteStatus = voteStatus === (isUpvote ? 'upvote' : 'downvote') ? null : (isUpvote ? 'upvote' : 'downvote');
    const oldVoteStatus = voteStatus;
    
    // Update UI optimistically
    setVoteStatus(newVoteStatus);
    
    // Calculate new vote count
    let voteDelta = 0;
    
    if (oldVoteStatus === 'upvote' && !isUpvote) {
      // Changing from upvote to downvote
      voteDelta = -2;
    } else if (oldVoteStatus === 'downvote' && isUpvote) {
      // Changing from downvote to upvote
      voteDelta = 2;
    } else if (oldVoteStatus === 'upvote' && isUpvote) {
      // Removing upvote
      voteDelta = -1;
    } else if (oldVoteStatus === 'downvote' && !isUpvote) {
      // Removing downvote
      voteDelta = 1;
    } else if (isUpvote) {
      // Adding upvote
      voteDelta = 1;
    } else {
      // Adding downvote
      voteDelta = -1;
    }
    
    setVoteCount(prevCount => prevCount + voteDelta);
    
    try {
      if (oldVoteStatus) {
        if (oldVoteStatus === (isUpvote ? 'upvote' : 'downvote')) {
          // If clicking the same vote button, remove the vote
          await supabase
            .from('votes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', post.id);
          
          // Update post vote count in database
          await supabase
            .from('posts')
            .update({
              upvotes: isUpvote ? supabase.rpc('decrement', { row_count: 1 }) : undefined,
              downvotes: !isUpvote ? supabase.rpc('decrement', { row_count: 1 }) : undefined
            })
            .eq('id', post.id);
        } else {
          // If changing vote direction, update the vote
          await supabase
            .from('votes')
            .update({ is_upvote: isUpvote })
            .eq('user_id', user.id)
            .eq('post_id', post.id);
          
          // Update post vote count in database
          await supabase
            .from('posts')
            .update({
              upvotes: isUpvote ? supabase.rpc('increment', { row_count: 1 }) : supabase.rpc('decrement', { row_count: 1 }),
              downvotes: isUpvote ? supabase.rpc('decrement', { row_count: 1 }) : supabase.rpc('increment', { row_count: 1 })
            })
            .eq('id', post.id);
        }
      } else {
        // If no existing vote, insert new vote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            post_id: post.id,
            is_upvote: isUpvote
          });
        
        // Update post vote count in database
        await supabase
          .from('posts')
          .update({
            upvotes: isUpvote ? supabase.rpc('increment', { row_count: 1 }) : undefined,
            downvotes: !isUpvote ? supabase.rpc('increment', { row_count: 1 }) : undefined
          })
          .eq('id', post.id);
      }
    } catch (error: any) {
      console.error('Error voting:', error);
      
      // Revert UI changes on error
      setVoteStatus(oldVoteStatus);
      setVoteCount(post.votes);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to register vote',
        variant: 'destructive',
      });
    }
  };
  
  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to bookmark posts',
        variant: 'default',
      });
      return;
    }
    
    const wasBookmarked = isBookmarked;
    
    // Update UI optimistically
    setIsBookmarked(!wasBookmarked);
    
    try {
      if (wasBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            post_id: post.id
          });
      }
    } catch (error: any) {
      console.error('Error bookmarking:', error);
      
      // Revert UI changes on error
      setIsBookmarked(wasBookmarked);
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bookmark',
        variant: 'destructive',
      });
    }
  };
  
  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    
    toast({
      title: 'Link copied',
      description: 'Post link has been copied to clipboard',
    });
  };
  
  const truncateContent = (content: string, maxLength: number = 250) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to={`/r/${post.squad}`} className="text-sm font-medium hover:underline">
              r/{post.squad}
            </Link>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Posted by</span>
              <Link to={`/u/${post.author}`} className="text-sm hover:underline flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={authorAvatar || ''} />
                  <AvatarFallback className="text-[8px]">
                    {post.author.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>u/{post.author}</span>
              </Link>
            </div>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{post.timestamp}</span>
          </div>
        </div>
        <Link to={`/post/${post.id}`} className="hover:underline mt-2 block">
          <h3 className="text-lg font-semibold">{post.title}</h3>
        </Link>
      </CardHeader>
      
      <CardContent>
        <Link to={`/post/${post.id}`} className="no-underline text-foreground">
          <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3">
            {truncateContent(post.content)}
          </div>
          
          {post.image && (
            <div className="mt-3 max-h-80 overflow-hidden rounded-md">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full object-contain bg-black/5 dark:bg-white/5" 
              />
            </div>
          )}
          
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {post.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Link>
      </CardContent>
      
      <CardFooter className="flex flex-wrap gap-2 pt-0">
        <TooltipProvider>
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`px-2 ${voteStatus === 'upvote' ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => handleVote(true)}
                >
                  <ArrowUpIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Upvote</TooltipContent>
            </Tooltip>
            
            <span className="min-w-8 text-center font-medium">
              {voteCount}
            </span>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`px-2 ${voteStatus === 'downvote' ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => handleVote(false)}
                >
                  <ArrowDownIcon className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Downvote</TooltipContent>
            </Tooltip>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
                asChild
              >
                <Link to={`/post/${post.id}`}>
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentCount} comments</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Comments</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center gap-2 ${isBookmarked ? 'bg-primary/10 text-primary' : ''}`}
                onClick={handleBookmark}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{isBookmarked ? 'Unsave' : 'Save'}</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleShare}
              >
                <Share className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy link</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
