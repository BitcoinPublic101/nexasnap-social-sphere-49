
import React, { useState } from 'react';
import { ArrowDown, ArrowUp, MessageSquare, Share, Bookmark, MoreHorizontal, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
  post: {
    id: number;
    title: string;
    content: string;
    squad: string;
    author: string;
    timestamp: string;
    votes: number;
    commentCount: number;
    tags?: string[];
    image?: string;
  };
}

export function PostCard({ post }: PostCardProps) {
  const [votes, setVotes] = useState(post.votes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleUpvote = () => {
    if (userVote === 'up') {
      setUserVote(null);
      setVotes(votes - 1);
    } else {
      if (userVote === 'down') {
        setVotes(votes + 2);
      } else {
        setVotes(votes + 1);
      }
      setUserVote('up');
    }
  };

  const handleDownvote = () => {
    if (userVote === 'down') {
      setUserVote(null);
      setVotes(votes + 1);
    } else {
      if (userVote === 'up') {
        setVotes(votes - 2);
      } else {
        setVotes(votes - 1);
      }
      setUserVote('down');
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition duration-200 animate-slide-up">
      <div className="flex">
        {/* Voting sidebar */}
        <div className="flex flex-col items-center px-2 py-2 bg-gray-50 dark:bg-reddit-darkCard">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-1 ${userVote === 'up' ? 'text-reddit-orange' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={handleUpvote}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium my-1">{votes}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-1 ${userVote === 'down' ? 'text-reddit-blue' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={handleDownvote}
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Post content */}
        <div className="flex-1">
          <CardHeader className="p-3 pb-0">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">
                {post.squad}
              </span>
              <span className="mx-1">•</span>
              <span>Posted by u/{post.author}</span>
              <span className="mx-1">•</span>
              <span>{post.timestamp}</span>
            </div>
            <h3 className="text-lg font-semibold mt-1 text-left">{post.title}</h3>
          </CardHeader>
          
          <CardContent className="p-3">
            <div className="text-sm text-left">
              {post.content}
            </div>
            
            {post.image && (
              <div className="mt-3 rounded-md overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full object-cover max-h-96"
                />
              </div>
            )}
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-0 border-t border-gray-100 dark:border-gray-800">
            <div className="w-full flex items-center justify-between px-3 py-2">
              <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 gap-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">{post.commentCount} Comments</span>
              </Button>
              
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
                  <Share className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
                  <Bookmark className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Hide Post</DropdownMenuItem>
                    <DropdownMenuItem>Report</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
