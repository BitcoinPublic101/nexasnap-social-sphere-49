
import React, { useState } from 'react';
import { PostCard } from '@/components/PostCard';
import { CreatePostCard } from '@/components/CreatePostCard';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Flame, Sparkles, Clock, ArrowUp } from 'lucide-react';

// Mock data for posts
const mockPosts = [
  {
    id: 1,
    title: "New breakthrough in AI: Models can now understand complex sarcasm",
    content: "Researchers at MIT have developed a new AI model that can detect and understand sarcasm with 95% accuracy. This has huge implications for sentiment analysis and human-computer interaction.",
    squad: "r/technology",
    author: "techgeek42",
    timestamp: "5 hours ago",
    votes: 458,
    commentCount: 87,
    tags: ["AI", "Machine Learning", "Research"],
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1650&q=80"
  },
  {
    id: 2,
    title: "What's your favorite programming language and why?",
    content: "I've been coding for about 5 years now and I'm curious what languages other developers prefer. I started with JavaScript but I'm leaning more towards TypeScript and Rust these days.",
    squad: "r/programming",
    author: "devcoder123",
    timestamp: "8 hours ago",
    votes: 236,
    commentCount: 312,
    tags: ["Discussion", "Programming"]
  },
  {
    id: 3,
    title: "Just launched my SaaS product after 6 months of building!",
    content: "I'm excited to share that I just launched my first SaaS product - it's a tool for freelancers to manage clients, invoices, and projects in one place. Built with React, Node.js, and MongoDB. Would love your feedback!",
    squad: "r/SideProject",
    author: "entreprenerd",
    timestamp: "2 days ago",
    votes: 789,
    commentCount: 104,
    tags: ["Launch", "SaaS", "Startup"],
    image: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1650&q=80"
  },
  {
    id: 4,
    title: "The future of remote work: What does it look like in 2025?",
    content: "With many companies now offering permanent remote options, I'm curious how you all think the work landscape will evolve in the next few years. Will we see more digital nomads? Better collaboration tools?",
    squad: "r/remotework",
    author: "nomadlife",
    timestamp: "1 day ago",
    votes: 312,
    commentCount: 76,
    tags: ["Remote Work", "Future", "Discussion"]
  }
];

export function Feed() {
  const [posts, setPosts] = useState(mockPosts);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <CreatePostCard />
      
      <Tabs defaultValue="hot" className="mb-4">
        <TabsList className="bg-white dark:bg-reddit-darkCard border border-gray-200 dark:border-gray-800 p-0 h-auto">
          <TabsTrigger 
            value="hot" 
            className="flex items-center gap-1 px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            <Flame className="h-4 w-4" />
            <span>Hot</span>
          </TabsTrigger>
          <TabsTrigger 
            value="new" 
            className="flex items-center gap-1 px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            <Sparkles className="h-4 w-4" />
            <span>New</span>
          </TabsTrigger>
          <TabsTrigger 
            value="top" 
            className="flex items-center gap-1 px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            <ArrowUp className="h-4 w-4" />
            <span>Top</span>
          </TabsTrigger>
          <TabsTrigger 
            value="rising" 
            className="flex items-center gap-1 px-3 py-1.5 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-800"
          >
            <Clock className="h-4 w-4" />
            <span>Rising</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="hot" className="mt-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
        
        <TabsContent value="new" className="mt-3">
          {[...posts].sort((a, b) => b.id - a.id).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
        
        <TabsContent value="top" className="mt-3">
          {[...posts].sort((a, b) => b.votes - a.votes).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
        
        <TabsContent value="rising" className="mt-3">
          {[...posts].sort((a, b) => b.commentCount - a.commentCount).map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
