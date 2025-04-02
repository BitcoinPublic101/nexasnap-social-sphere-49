
import React, { useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Image, Link as LinkIcon, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export function CreatePostCard() {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Post created! It will appear once approved.");
    setIsFocused(false);
  };

  return (
    <Card className="mb-4 border-gray-200 dark:border-gray-800">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 bg-gray-200 dark:bg-gray-700">
              <div className="text-xs font-medium">U</div>
            </Avatar>
            
            {isFocused ? (
              <div className="flex-1">
                <Input 
                  className="bg-gray-100 dark:bg-gray-800 border-none text-base"
                  placeholder="Title"
                  autoFocus
                />
                <div className="mt-3">
                  <textarea
                    className="w-full h-24 p-3 bg-gray-100 dark:bg-gray-800 rounded-md border-none resize-none focus:outline-none focus:ring-2 focus:ring-reddit-orange"
                    placeholder="What are your thoughts?"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsFocused(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-reddit-orange hover:bg-orange-600"
                  >
                    Post
                  </Button>
                </div>
              </div>
            ) : (
              <Input 
                className="flex-1 bg-gray-100 dark:bg-gray-800 border-none"
                placeholder="Create Post"
                onClick={() => setIsFocused(true)}
              />
            )}
          </div>

          {!isFocused && (
            <div className="flex mt-3 -mx-2">
              <Button type="button" variant="ghost" className="flex-1 gap-2 text-gray-500 dark:text-gray-400">
                <Image className="h-5 w-5" />
                <span>Image</span>
              </Button>
              <Separator orientation="vertical" className="h-6 my-auto mx-1" />
              <Button type="button" variant="ghost" className="flex-1 gap-2 text-gray-500 dark:text-gray-400">
                <LinkIcon className="h-5 w-5" />
                <span>Link</span>
              </Button>
              <Separator orientation="vertical" className="h-6 my-auto mx-1" />
              <Button type="button" variant="ghost" className="flex-1 gap-2 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-5 w-5" />
                <span>Discussion</span>
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
