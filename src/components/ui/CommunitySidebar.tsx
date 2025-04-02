import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HomeIcon, Star, Compass, TrendingUp, Users, Plus, Search, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'react-router-dom';

export function CommunitySidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  
  const [favoriteSquads, setFavoriteSquads] = useState<any[]>([]);
  const [joinedSquads, setJoinedSquads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchSquads = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch favorite squads
        const { data: favoritesData, error: favoritesError } = await supabase
          .from('squad_favorites')
          .select(`
            squads:squad_id(id, name, member_count, is_verified)
          `)
          .eq('user_id', user.id);
        
        if (favoritesError) throw favoritesError;
        
        // Extract squad data from nested structure
        const favorites = favoritesData.map(item => item.squads);
        setFavoriteSquads(favorites || []);
        
        // Fetch joined squads (excluding favorites)
        const { data: joinedData, error: joinedError } = await supabase
          .from('squad_members')
          .select(`
            squads:squad_id(id, name, member_count, is_verified)
          `)
          .eq('user_id', user.id);
        
        if (joinedError) throw joinedError;
        
        // Filter out squads that are already in favorites
        const favoriteIds = favorites.map(squad => squad.id);
        const joined = joinedData
          .map(item => item.squads)
          .filter(squad => !favoriteIds.includes(squad.id));
        
        setJoinedSquads(joined || []);
      } catch (error: any) {
        console.error('Error fetching squads:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load squads',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSquads();
  }, [user, toast]);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const isSquadActive = (squadName: string) => {
    return location.pathname === `/r/${squadName}`;
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 h-full">
        <div className="space-y-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="mb-2">
          <Skeleton className="h-5 w-24" />
        </div>
        
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 h-full">
      <div className="space-y-2">
        <Button 
          variant={isActive('/') ? "secondary" : "ghost"} 
          className="w-full justify-start" 
          size="sm"
          asChild
        >
          <Link to="/">
            <HomeIcon className="mr-2 h-4 w-4" />
            Home
          </Link>
        </Button>
        
        <Button 
          variant={isActive('/popular') ? "secondary" : "ghost"}
          className="w-full justify-start" 
          size="sm"
          asChild
        >
          <Link to="/popular">
            <TrendingUp className="mr-2 h-4 w-4" />
            Popular
          </Link>
        </Button>
        
        <Button 
          variant={isActive('/explore') ? "secondary" : "ghost"}
          className="w-full justify-start" 
          size="sm"
          asChild
        >
          <Link to="/explore">
            <Compass className="mr-2 h-4 w-4" />
            Explore
          </Link>
        </Button>
      </div>
      
      <Separator className="my-4" />
      
      {user ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Favorites</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Star className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-[25vh]">
            <div className="space-y-1 pr-2">
              {favoriteSquads.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-1.5">
                  No favorite squads yet.
                </p>
              ) : (
                favoriteSquads.map(squad => (
                  <Button
                    key={squad.id}
                    variant={isSquadActive(squad.name) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    asChild
                  >
                    <Link to={`/r/${squad.name}`}>
                      <div className="flex items-center w-full overflow-hidden">
                        <Users className="mr-2 h-4 w-4" />
                        <span className="truncate">r/{squad.name}</span>
                        {squad.is_verified && (
                          <Star className="ml-auto h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </Link>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="flex items-center justify-between mt-4 mb-2">
            <h3 className="text-sm font-medium">Your Squads</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-[25vh]">
            <div className="space-y-1 pr-2">
              {joinedSquads.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-1.5">
                  You haven't joined any squads yet.
                </p>
              ) : (
                joinedSquads.map(squad => (
                  <Button
                    key={squad.id}
                    variant={isSquadActive(squad.name) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    size="sm"
                    asChild
                  >
                    <Link to={`/r/${squad.name}`}>
                      <div className="flex items-center w-full overflow-hidden">
                        <Users className="mr-2 h-4 w-4" />
                        <span className="truncate">r/{squad.name}</span>
                        {squad.is_verified && (
                          <Star className="ml-auto h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </Link>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Join to follow your favorite communities and create posts.
          </p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      )}
      
      <div className="mt-auto pt-4">
        <Separator className="mb-4" />
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            size="sm"
            asChild
          >
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
