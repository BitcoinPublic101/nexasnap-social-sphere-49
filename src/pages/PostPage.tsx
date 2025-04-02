
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { TrendingSideBar } from '@/components/TrendingSideBar';
import { 
  ArrowUp, ArrowDown, MessageSquare, Share2, Flag, Bookmark, BookmarkCheck, 
  Calendar, ArrowUpRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

const PostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const numericPostId = parseInt(postId || '0', 10);

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [squad, setSquad] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  useEffect(() => {
    const fetchPostDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch post data
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', numericPostId)
          .single();
        
        if (postError) throw postError;
        setPost(postData);
        
        // Fetch squad data
        if (postData.squad_id) {
          const { data: squadData, error: squadError } = await supabase
            .from('squads')
            .select('*')
            .eq('id', postData.squad_id)
            .single();
          
          if (!squadError) {
            setSquad(squadData);
          }
        }
        
        // Fetch author data
        const { data: authorData, error: authorError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', postData.author_id)
          .single();
        
        if (!authorError) {
          setAuthor(authorData);
        }
        
        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles:author_id(username, avatar_url)
          `)
          .eq('post_id', numericPostId)
          .order('created_at', { ascending: false });
        
        if (!commentsError) {
          setComments(commentsData || []);
        }
        
        // Check user vote (if logged in)
        if (user) {
          const { data: voteData, error: voteError } = await supabase
            .from('votes')
            .select('*')
            .eq('post_id', numericPostId)
            .eq('user_id', user.id)
            .single();
          
          if (!voteError && voteData) {
            setUserVote(voteData.is_upvote ? 'upvote' : 'downvote');
          }
          
          // Check if user has bookmarked this post
          const { data: bookmarkData, error: bookmarkError } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('post_id', numericPostId)
            .eq('user_id', user.id)
            .single();
          
          if (!bookmarkError && bookmarkData) {
            setIsBookmarked(true);
          }
        }
        
        // Update view count
        if (postData.id) {
          await supabase
            .from('posts')
            .update({ view_count: (postData.view_count || 0) + 1 })
            .eq('id', numericPostId);
        }
      } catch (error: any) {
        console.error('Error fetching post details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load post details. ' + error.message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (numericPostId) {
      fetchPostDetails();
    }
  }, [numericPostId, user, toast]);
  
  const handleVote = async (isUpvote: boolean) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to vote on posts',
        variant: 'default',
      });
      navigate('/login');
      return;
    }
    
    try {
      // Check if the user has already voted
      const { data: existingVote, error: voteCheckError } = await supabase
        .from('votes')
        .select('*')
        .eq('post_id', numericPostId)
        .eq('user_id', user.id)
        .single();
      
      if (voteCheckError && voteCheckError.code !== 'PGRST116') {
        // PGRST116 means "no rows returned" which is expected if the user hasn't voted
        throw voteCheckError;
      }
      
      // Calculate vote change for the post
      let upvoteDelta = 0;
      let downvoteDelta = 0;
      
      if (existingVote) {
        if (existingVote.is_upvote === isUpvote) {
          // Remove vote if clicking the same button again
          await supabase
            .from('votes')
            .delete()
            .eq('id', existingVote.id);
          
          // Update vote counts
          upvoteDelta = existingVote.is_upvote ? -1 : 0;
          downvoteDelta = existingVote.is_upvote ? 0 : -1;
          setUserVote(null);
        } else {
          // Change vote direction
          await supabase
            .from('votes')
            .update({ is_upvote: isUpvote })
            .eq('id', existingVote.id);
          
          // Update vote counts (switch from upvote to downvote or vice versa)
          upvoteDelta = isUpvote ? 1 : -1;
          downvoteDelta = isUpvote ? -1 : 1;
          setUserVote(isUpvote ? 'upvote' : 'downvote');
        }
      } else {
        // Create new vote
        await supabase
          .from('votes')
          .insert({ 
            post_id: numericPostId, 
            user_id: user.id, 
            is_upvote: isUpvote 
          });
        
        // Update vote counts
        upvoteDelta = isUpvote ? 1 : 0;
        downvoteDelta = isUpvote ? 0 : 1;
        setUserVote(isUpvote ? 'upvote' : 'downvote');
      }
      
      // Update post vote counts
      if (post) {
        const updatedPost = {
          ...post,
          upvotes: (post.upvotes || 0) + upvoteDelta,
          downvotes: (post.downvotes || 0) + downvoteDelta,
        };
        
        await supabase
          .from('posts')
          .update({ 
            upvotes: updatedPost.upvotes, 
            downvotes: updatedPost.downvotes 
          })
          .eq('id', numericPostId);
        
        setPost(updatedPost);
      }
    } catch (error: any) {
      console.error('Error voting on post:', error);
      toast({
        title: 'Error',
        description: 'Failed to register your vote. ' + error.message,
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
      navigate('/login');
      return;
    }
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', numericPostId)
          .eq('user_id', user.id);
        
        setIsBookmarked(false);
        toast({
          title: 'Bookmark removed',
          description: 'Post has been removed from your bookmarks',
        });
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({ 
            post_id: numericPostId,
            user_id: user.id 
          });
        
        setIsBookmarked(true);
        toast({
          title: 'Bookmark added',
          description: 'Post has been saved to your bookmarks',
        });
      }
    } catch (error: any) {
      console.error('Error bookmarking post:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bookmark. ' + error.message,
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
      navigate('/login');
      return;
    }
    
    if (!commentContent.trim()) {
      toast({
        title: 'Empty comment',
        description: 'Please enter some content for your comment',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Add comment
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .insert({
          post_id: numericPostId,
          author_id: user.id,
          content: commentContent,
        })
        .select('*, profiles:author_id(username, avatar_url)')
        .single();
      
      if (commentError) throw commentError;
      
      // Update the post's comment count
      await supabase
        .from('posts')
        .update({ 
          commentcount: post ? (post.commentcount || 0) + 1 : 1 
        })
        .eq('id', numericPostId);
      
      if (post) {
        setPost({
          ...post,
          commentcount: (post.commentcount || 0) + 1,
        });
      }
      
      // Add new comment to the list
      setComments([commentData, ...comments]);
      setCommentContent('');
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted successfully',
      });
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post your comment. ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex justify-center items-center flex-1 p-6">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex justify-center items-center flex-1 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <div className="flex flex-1">
        {/* Left Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-64 shrink-0">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar p-4">
            {squad && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">r/{squad.name}</h3>
                    <Button variant="outline" size="sm">Join</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {squad.description || 'No description available'}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <Users className="h-3 w-3" />
                      <span>{squad.member_count?.toLocaleString() || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created {new Date(squad.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 px-4 py-6">
          <Card className="mb-6">
            {/* Post Header */}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                {squad && (
                  <>
                    <Link to={`/r/${squad.name}`} className="font-medium text-foreground hover:underline">
                      r/{squad.name}
                    </Link>
                    <span>•</span>
                  </>
                )}
                <span>Posted by</span>
                {author && (
                  <Link to={`/u/${author.username}`} className="hover:underline">
                    u/{author.username}
                  </Link>
                )}
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
              </div>
              
              <h1 className="text-xl md:text-2xl font-bold leading-tight">{post.title}</h1>
            </CardHeader>
            
            {/* Post Content */}
            <CardContent>
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-line mb-4">{post.content}</p>
                
                {post.image && (
                  <div className="mt-3 max-h-[500px] overflow-hidden rounded-md">
                    <img 
                      src={post.image} 
                      alt="Post content" 
                      className="w-full object-contain"
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex flex-wrap gap-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-4 w-4" /> 
                  {post.upvotes?.toLocaleString() || 0} upvotes
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ArrowDown className="h-4 w-4" /> 
                  {post.downvotes?.toLocaleString() || 0} downvotes
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> 
                  {post.commentcount?.toLocaleString() || 0} comments
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" /> 
                  {post.view_count?.toLocaleString() || 0} views
                </span>
              </div>
            </CardContent>
            
            {/* Post Actions */}
            <CardFooter className="border-t pt-3 pb-1 flex justify-between">
              <div className="flex gap-2 md:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${userVote === 'upvote' ? 'text-primary' : ''}`}
                  onClick={() => handleVote(true)}
                >
                  <ArrowUp className="h-4 w-4" />
                  <span className="hidden md:inline">Upvote</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${userVote === 'downvote' ? 'text-primary' : ''}`}
                  onClick={() => handleVote(false)}
                >
                  <ArrowDown className="h-4 w-4" />
                  <span className="hidden md:inline">Downvote</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => document.getElementById('comment-field')?.focus()}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden md:inline">Comment</span>
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center gap-2 ${isBookmarked ? 'text-primary' : ''}`}
                  onClick={handleBookmark}
                >
                  {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  <span className="hidden md:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: 'Link copied',
                      description: 'Post link copied to clipboard',
                    });
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden md:inline">Share</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => {
                    if (!user) {
                      toast({
                        title: 'Authentication required',
                        description: 'Please sign in to report content',
                        variant: 'default',
                      });
                      navigate('/login');
                      return;
                    }
                    
                    toast({
                      title: 'Report submitted',
                      description: 'Thanks for helping keep NexaSnap safe',
                    });
                  }}
                >
                  <Flag className="h-4 w-4" />
                  <span className="hidden md:inline">Report</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Comment Input */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Add a comment</h3>
              <Textarea
                id="comment-field"
                placeholder="What are your thoughts?"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="mb-4"
                rows={4}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment} 
                  disabled={isSubmitting || !commentContent.trim()}
                >
                  {isSubmitting ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Comments ({post.commentcount?.toLocaleString() || 0})
            </h3>
            
            {comments.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardHeader className="pb-2 flex flex-row items-start space-x-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles?.avatar_url} />
                        <AvatarFallback>
                          {comment.profiles?.username?.substring(0, 2)?.toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Link 
                            to={`/u/${comment.profiles?.username}`} 
                            className="font-medium hover:underline"
                          >
                            {comment.profiles?.username}
                          </Link>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(comment.created_at))} ago
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line text-sm">{comment.content}</p>
                    </CardContent>
                    <CardFooter className="pt-0 pb-2">
                      <div className="flex space-x-2 text-sm text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-primary">
                          <ArrowUp className="h-3.5 w-3.5" />
                          <span>{comment.upvotes?.toLocaleString() || 0}</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-primary">
                          <ArrowDown className="h-3.5 w-3.5" />
                          <span>{comment.downvotes?.toLocaleString() || 0}</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-primary">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
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
  );
};

// Add missing imports
import { Link } from 'react-router-dom';
import { Eye, Users } from 'lucide-react';

export default PostPage;
