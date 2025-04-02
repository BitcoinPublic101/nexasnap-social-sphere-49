
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { CommunitySidebar } from '@/components/ui/CommunitySidebar';
import { TrendingSideBar } from '@/components/TrendingSideBar';
import { ThemeProvider } from '@/context/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { PostWithAuthor, CommentWithAuthor } from '@/types/supabase-custom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ChevronUp, ChevronDown, MessageSquare, Share } from 'lucide-react';
import SEOMetaTags from '@/components/SEOMetaTags';

const PostDetails = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        
        // Fetch post with author and squad info
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('*, profiles(username, avatar_url), squads(name)')
          .eq('id', parseInt(postId!))
          .single();
        
        if (postError) throw postError;
        
        // Fetch comments for this post
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*, profiles(username, avatar_url)')
          .eq('post_id', parseInt(postId!))
          .order('created_at', { ascending: false });
        
        if (commentsError) throw commentsError;
        
        setPost(postData as PostWithAuthor);
        setComments(commentsData as CommentWithAuthor[]);
      } catch (error) {
        console.error('Error fetching post details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load post details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (postId) {
      fetchPostAndComments();
    }
  }, [postId, toast]);

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
    
    if (!newComment.trim()) {
      toast({
        title: 'Empty comment',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: parseInt(postId!),
          author_id: user.id,
          content: newComment.trim(),
          parent_id: null // Top-level comment
        })
        .select('*, profiles(username, avatar_url)')
        .single();
      
      if (error) throw error;
      
      setComments([data as CommentWithAuthor, ...comments]);
      setNewComment('');
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted',
      });
      
      // Update comment count in post
      await supabase
        .from('posts')
        .update({ commentcount: (post?.commentcount || 0) + 1 })
        .eq('id', parseInt(postId!));
      
      if (post) {
        setPost({
          ...post,
          commentcount: (post.commentcount || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post your comment',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="h-40 w-full animate-pulse bg-gray-200 rounded-md"></div>
          <div className="h-20 w-full animate-pulse bg-gray-200 rounded-md"></div>
        </div>
      );
    }
    
    if (!post) {
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-2">Post not found</h2>
          <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={post.profiles?.avatar_url} alt={post.profiles?.username || 'User'} />
                <AvatarFallback>
                  {post.profiles?.username?.substring(0, 2)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{post.profiles?.username || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">
                  {post.squads?.name ? `in r/${post.squads.name} • ` : ''}
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            <div className="prose dark:prose-invert max-w-none">
              <p>{post.content}</p>
              {post.image && (
                <img 
                  src={post.image} 
                  alt="Post image" 
                  className="mt-4 max-h-96 w-auto rounded-md object-contain"
                />
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ChevronUp className="h-5 w-5" />
                </Button>
                <span className="mx-1 text-sm font-medium">{post.upvotes - post.downvotes}</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex items-center">
                <Button variant="ghost" size="sm" className="space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.commentcount || 0} Comments</span>
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <Share className="mr-1 h-4 w-4" />
              Share
            </Button>
          </CardFooter>
        </Card>
        
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Comments</h2>
          
          {user && (
            <div className="flex space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.username || 'User'} />
                <AvatarFallback>
                  {user.user_metadata?.username?.substring(0, 2)?.toUpperCase() || user.email?.substring(0, 2)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea 
                  placeholder="Add a comment..." 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmitComment} 
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {!user && (
            <div className="rounded-md bg-muted p-4 text-center">
              <p className="mb-2">Sign in to leave a comment</p>
              <Button onClick={() => navigate('/login')}>Sign In</Button>
            </div>
          )}
          
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardHeader className="py-3">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={comment.profiles?.avatar_url} alt={comment.profiles?.username || 'User'} />
                        <AvatarFallback>
                          {comment.profiles?.username?.substring(0, 2)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center">
                        <p className="text-sm font-medium">{comment.profiles?.username || 'Anonymous'}</p>
                        <span className="mx-2 text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <p>{comment.content}</p>
                  </CardContent>
                  <CardFooter className="py-2 flex items-center">
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <span className="text-xs font-medium">{comment.upvotes - comment.downvotes}</span>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs ml-2">
                      Reply
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <SEOMetaTags 
          title={post?.title || 'Post Details'}
          description={post?.content?.substring(0, 160) || 'View and comment on this post on NexaSnap.'}
          keywords={['post', 'comments', 'discussion', 'social']}
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

export default PostDetails;
