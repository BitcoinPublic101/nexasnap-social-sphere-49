
import React from 'react';
import { Home, Flame, ArrowUp, PlusCircle, Users, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export function CommunitySidebar() {
  // Mock data for communities
  const topCommunities = [
    { id: 1, name: "r/programming", members: 5400000 },
    { id: 2, name: "r/webdev", members: 1200000 },
    { id: 3, name: "r/technology", members: 14300000 },
    { id: 4, name: "r/science", members: 29000000 },
    { id: 5, name: "r/space", members: 3100000 },
    { id: 6, name: "r/datascience", members: 956000 },
    { id: 7, name: "r/machinelearning", members: 2500000 },
    { id: 8, name: "r/devops", members: 400000 },
  ];

  const formatMembers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}m members`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k members`;
    }
    return `${count} members`;
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-reddit-darkBg border-r border-gray-200 dark:border-gray-800">
      <ScrollArea className="flex-1">
        <div className="px-3 py-4">
          <div className="space-y-1 mb-4">
            <Button variant="ghost" className="w-full justify-start gap-2 px-3 font-medium">
              <Home className="h-5 w-5" />
              Home
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 px-3 font-medium">
              <Flame className="h-5 w-5" />
              Popular
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 px-3 font-medium">
              <ArrowUp className="h-5 w-5" />
              Rising
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="mb-2">
            <h4 className="px-3 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Your Communities</h4>
            <Button variant="ghost" className="w-full justify-start gap-2 px-3 text-reddit-orange">
              <PlusCircle className="h-5 w-5" />
              Create Community
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Top Communities</h4>
              <Star className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            
            <div className="space-y-1">
              {topCommunities.map((community, index) => (
                <Button 
                  key={community.id}
                  variant="ghost" 
                  className="w-full justify-start gap-3 px-3"
                >
                  <span className="text-gray-500 dark:text-gray-400 font-medium w-4">
                    {index + 1}
                  </span>
                  <Users className="h-5 w-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{community.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatMembers(community.members)}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 px-3 text-sm text-blue-600 dark:text-blue-400 mt-2"
            >
              View All Communities
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
