
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Rocket, Flame, CircleUser, PlusCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function TrendingSideBar() {
  // Sample trending communities
  const trendingCommunities = [
    { id: 1, name: "r/ai", members: 250000, description: "Artificial Intelligence discussions" },
    { id: 2, name: "r/robotics", members: 120000, description: "Robotics news and projects" },
    { id: 3, name: "r/cryptocurrency", members: 890000, description: "Cryptocurrency market updates" },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Popular Feeds</CardTitle>
        </CardHeader>
        <CardContent className="pb-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Sparkles className="h-5 w-5 text-reddit-orange" />
            <span>Popular</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Flame className="h-5 w-5 text-reddit-orange" />
            <span>Hot</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Rocket className="h-5 w-5 text-blue-500" />
            <span>Rising</span>
          </Button>
        </CardContent>
      </Card>

      {/* Trending Communities Card */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trending Communities</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            {trendingCommunities.map((community) => (
              <div key={community.id} className="group">
                <Button variant="ghost" className="w-full p-2 h-auto justify-start rounded-lg">
                  <div className="flex items-start gap-3 text-left">
                    <CircleUser className="h-8 w-8 mt-1 text-gray-600 dark:text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">{community.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(community.members / 1000).toFixed(1)}k members
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                        {community.description}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 rounded-full text-xs ml-2 self-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Join
                    </Button>
                  </div>
                </Button>
              </div>
            ))}
          </div>
          
          <Separator className="my-3" />
          
          <Button 
            variant="ghost" 
            className="w-full justify-center gap-1 text-sm text-reddit-orange"
          >
            <span>View All Communities</span>
          </Button>
        </CardContent>
      </Card>

      {/* Create Community Card */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full">
              <PlusCircle className="h-6 w-6 text-reddit-orange" />
            </div>
            <div>
              <h4 className="font-medium">Create Your Community</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Start your own Squad and build a community around your interests
              </p>
            </div>
            <Button className="bg-reddit-orange hover:bg-orange-600 w-full">
              Create Squad
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-xs text-gray-500 dark:text-gray-400 p-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <a href="#" className="hover:underline">Help</a>
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
        </div>
        <div className="mt-3">
          &copy; {new Date().getFullYear()} NexaSnap, Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
