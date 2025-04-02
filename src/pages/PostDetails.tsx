
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { CommunitySidebar } from '@/components/ui/CommunitySidebar';
import { TrendingSideBar } from '@/components/TrendingSideBar';
import { ThemeProvider } from '@/context/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { PostWithAuthor, CommentWithAuthor } from '@/types/supabase-custom';
import PostCard from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import SEOMetaTags from '@/components/SEOMetaTags';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronUp, ChevronDown, Reply, Flag } from 'lucide-react';

const PostDetails = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPostAndComments = async () => {
      setLoading(true);
      try {
        // Fetch post details
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles(username, avatar_url),
            squads(name)
          `)
          .eq('id', postId)
          .single();

        if (postError) throw postError;
        
        // Update view count
        if (postData) {
          await supabase
            .from('posts')
            .update({ view_count: (postData.view_count || 0) + 1 })
            .eq('id', postId);
        }

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles(username, avatar_url)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;

        setPost(postData as PostWithAuthor);
        setComments(commentsData as CommentWithAuthor[]);
      } catch (error: any) {
        console.error('Error fetching post:', error);
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

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to comment',
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Empty comment',
        description: 'Please enter a comment',
      });
      return;
    }

    setCommentLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: Number(postId),
          author_id: user.id,
          content: newComment.trim(),
        })
        .select(`
          *,
          profiles(username, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update comments list
      setComments(prevComments => [data as CommentWithAuthor, ...prevComments]);
      
      // Update post comment count
      if (post) {
        const updatedPost = { 
          ...post, 
          commentcount: (post.commentcount || 0) + 1 
        };
        setPost(updatedPost);
        
        // Update comment count in database
        await supabase
          .from('posts')
          .update({ commentcount: updatedPost.commentcount })
          .eq('id', postId);
      }

      setNewComment('');
      toast({
        title: 'Comment added',
        description: 'Your comment was posted successfully',
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post your comment',
        variant: 'destructive',
      });
    } finally {
      setCommentLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      );
    }

    if (!post) {
      return (
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-2">Post not found</h2>
          <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist or has been removed.</p>
          <Button asChild>
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <PostCard post={post} hideActions={false} />
        
        <div className="bg-card rounded-lg border p-4">
          <h3 className="text-lg font-semibold mb-4">Comments ({post.commentcount || 0})</h3>
          
          {user && (
            <div className="mb-6">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-24 mb-2"
              />
              <Button 
                onClick={handleAddComment} 
                disabled={commentLoading || !newComment.trim()}
              >
                {commentLoading ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          )}
          
          {comments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={comment.profiles?.avatar_url || ''} alt={comment.profiles?.username || 'User'} />
                      <AvatarFallback>{comment.profiles?.username?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{comment.profiles?.username}</span>
                    <span className="text-xs text-muted-foreground">
                      • {formatDistanceToNow(new Date(comment.created_at))} ago
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <span className="mx-1">{comment.upvotes || 0}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <Flag className="h-3 w-3 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
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
          description={post?.content?.substring(0, 160) || 'Loading post details...'}
          keywords={['post', 'discussion', 'comments']}
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
