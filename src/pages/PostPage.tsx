
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowUp, ArrowDown, MessageSquare, Share, Bookmark, Flag } from 'lucide-react';

const PostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voteStatus, setVoteStatus] = useState<'upvote' | 'downvote' | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true);
      try {
        // Fetch post by id
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:author_id(id, username, avatar_url),
            squads:squad_id(id, name)
          `)
          .eq('id', postId)
          .single();

        if (postError) throw postError;
        if (!postData) throw new Error('Post not found');

        setPost(postData);

        // Increment view count
        await supabase
          .from('posts')
          .update({ view_count: (postData.view_count || 0) + 1 })
          .eq('id', postId);

        // Fetch comments for this post
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:author_id(id, username, avatar_url)
          `)
          .eq('post_id', postId)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;
        setComments(commentsData || []);

        // Check user's vote if logged in
        if (user) {
          const { data: voteData } = await supabase
            .from('votes')
            .select('is_upvote')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .maybeSingle();
          
          if (voteData) {
            setVoteStatus(voteData.is_upvote ? 'upvote' : 'downvote');
          }
          
          // Check if post is bookmarked
          const { data: bookmarkData } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .maybeSingle();
          
          setIsBookmarked(!!bookmarkData);
        }
      } catch (error: any) {
        console.error('Error fetching post:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load post',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPostData();
    }
  }, [postId, user, toast]);

  const handleVote = async (isUpvote: boolean) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to vote',
        variant: 'default',
      });
      return;
    }

    try {
      const currentVoteStatus = voteStatus;
      const newVoteStatus = currentVoteStatus === (isUpvote ? 'upvote' : 'downvote') ? null : (isUpvote ? 'upvote' : 'downvote');
      
      // Update local state optimistically
      setVoteStatus(newVoteStatus);
      
      // Update vote in database
      if (currentVoteStatus) {
        // Delete existing vote if clicking the same button
        if (currentVoteStatus === (isUpvote ? 'upvote' : 'downvote')) {
          await supabase
            .from('votes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId);
          
          // Update post vote count
          const voteChange = isUpvote ? -1 : 1;
          await supabase
            .from('posts')
            .update({
              upvotes: isUpvote ? post.upvotes - 1 : post.upvotes,
              downvotes: !isUpvote ? post.downvotes - 1 : post.downvotes
            })
            .eq('id', postId);
          
          // Update local post data
          setPost({
            ...post,
            upvotes: isUpvote ? post.upvotes - 1 : post.upvotes,
            downvotes: !isUpvote ? post.downvotes - 1 : post.downvotes
          });
        } else {
          // Update existing vote
          await supabase
            .from('votes')
            .update({ is_upvote: isUpvote })
            .eq('user_id', user.id)
            .eq('post_id', postId);
          
          // Update post vote count (need to adjust both up and down)
          const upvoteChange = isUpvote ? 1 : -1;
          const downvoteChange = isUpvote ? -1 : 1;
          
          await supabase
            .from('posts')
            .update({
              upvotes: post.upvotes + upvoteChange,
              downvotes: post.downvotes + downvoteChange
            })
            .eq('id', postId);
          
          // Update local post data
          setPost({
            ...post,
            upvotes: post.upvotes + upvoteChange,
            downvotes: post.downvotes + downvoteChange
          });
        }
      } else {
        // Create new vote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            post_id: postId,
            is_upvote: isUpvote
          });
        
        // Update post vote count
        await supabase
          .from('posts')
          .update({
            upvotes: isUpvote ? post.upvotes + 1 : post.upvotes,
            downvotes: !isUpvote ? post.downvotes + 1 : post.downvotes
          })
          .eq('id', postId);
        
        // Update local post data
        setPost({
          ...post,
          upvotes: isUpvote ? post.upvotes + 1 : post.upvotes,
          downvotes: !isUpvote ? post.downvotes + 1 : post.downvotes
        });
      }
    } catch (error: any) {
      console.error('Error voting:', error);
      // Revert optimistic update
      setVoteStatus(voteStatus);
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

    try {
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
        
        setIsBookmarked(false);
        toast({
          title: 'Removed from bookmarks',
          description: 'Post has been removed from your bookmarks',
        });
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            post_id: postId
          });
        
        setIsBookmarked(true);
        toast({
          title: 'Bookmarked',
          description: 'Post has been added to your bookmarks',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bookmark',
        variant: 'destructive',
      });
    }
  };
  
  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to comment',
        variant: 'default',
      });
      return;
    }

    if (!commentContent.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please enter a comment',
        variant: 'default',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert comment
      const { data: newComment, error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: commentContent.trim()
        })
        .select(`
          *,
          profiles:author_id(id, username, avatar_url)
        `)
        .single();
      
      if (commentError) throw commentError;
      
      // Update post comment count
      await supabase
        .from('posts')
        .update({ commentcount: post.commentcount + 1 })
        .eq('id', postId);
      
      // Update local state
      setComments([newComment, ...comments]);
      setPost({ ...post, commentcount: post.commentcount + 1 });
      setCommentContent('');
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted successfully',
      });
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sharePost = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied',
      description: 'Post link has been copied to clipboard',
    });
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

  if (!post) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container py-8">
          <Card>
            <CardContent className="py-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Post not found</h2>
                <p className="text-muted-foreground mt-2">
                  The post you're looking for doesn't exist or has been removed.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container py-6">
        <div className="max-w-3xl mx-auto">
          {/* Post card */}
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link to={`/r/${post.squads?.name}`} className="text-sm font-medium hover:underline">
                    r/{post.squads?.name}
                  </Link>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">Posted by</span>
                    <Link to={`/u/${post.profiles?.username}`} className="text-sm hover:underline">
                      u/{post.profiles?.username}
                    </Link>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <h1 className="text-xl md:text-2xl font-bold mt-3">{post.title}</h1>
            </CardHeader>
            
            <CardContent>
              <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert break-words">
                {post.content}
              </div>
              
              {post.image && (
                <div className="mt-4">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="max-h-[500px] rounded-md object-contain bg-black/5 dark:bg-white/5" 
                  />
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-2 pb-3 flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`px-2 ${voteStatus === 'upvote' ? 'text-primary' : ''}`}
                  onClick={() => handleVote(true)}
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
                <span className="min-w-8 text-center font-medium">
                  {post.upvotes - post.downvotes}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`px-2 ${voteStatus === 'downvote' ? 'text-primary' : ''}`}
                  onClick={() => handleVote(false)}
                >
                  <ArrowDown className="h-5 w-5" />
                </Button>
              </div>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{post.commentcount} comments</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={sharePost}
              >
                <Share className="h-4 w-4" />
                <span>Share</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center gap-2 ${isBookmarked ? 'text-primary' : ''}`}
                onClick={handleBookmark}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                <span>Report</span>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Comment form */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.user_metadata?.username?.substring(0, 2)?.toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder={user ? "Add a comment..." : "Sign in to comment"}
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="resize-none"
                    disabled={!user || isSubmitting}
                  />
                  <div className="flex justify-end mt-2">
                    <Button 
                      onClick={handleSubmitComment} 
                      disabled={!user || !commentContent.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : "Comment"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Comments section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium">{comments.length} Comments</h2>
            
            {comments.length === 0 ? (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">No comments yet</h3>
                    <p className="text-muted-foreground mt-2">
                      Be the first to comment on this post!
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback>
                            {comment.profiles?.username?.substring(0, 2)?.toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Link 
                              to={`/u/${comment.profiles?.username}`} 
                              className="text-sm font-medium hover:underline"
                            >
                              {comment.profiles?.username}
                            </Link>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="mt-2">
                            {comment.content}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs"
                            >
                              <ArrowUp className="h-3.5 w-3.5 mr-1" />
                              <span>{comment.upvotes}</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs"
                            >
                              <ArrowDown className="h-3.5 w-3.5 mr-1" />
                              <span>{comment.downvotes}</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs"
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
