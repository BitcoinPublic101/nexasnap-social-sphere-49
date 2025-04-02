
import React, { useState, useEffect } from 'react';
import { NavBar } from '@/components/ui/NavBar';
import { CommunitySidebar } from '@/components/ui/CommunitySidebar';
import { TrendingSideBar } from '@/components/TrendingSideBar';
import { ThemeProvider } from '@/context/ThemeContext';
import SEOMetaTags from '@/components/SEOMetaTags';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Star, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Squad } from '@/types/supabase-custom';
import { useToast } from '@/hooks/use-toast';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [activeTab, setActiveTab] = useState('trending');
  const { toast } = useToast();

  useEffect(() => {
    fetchSquads(activeTab);
  }, [activeTab]);

  const fetchSquads = async (sortBy: string) => {
    setLoading(true);
    try {
      let query = supabase.from('squads').select('*').eq('is_active', true);
      
      switch (sortBy) {
        case 'trending':
          query = query.order('member_count', { ascending: false });
          break;
        case 'new':
          query = query.order('created_at', { ascending: false });
          break;
        case 'verified':
          query = query.eq('is_verified', true).order('member_count', { ascending: false });
          break;
        default:
          query = query.order('member_count', { ascending: false });
      }
      
      const { data, error } = await query.limit(12);
      
      if (error) {
        throw error;
      }
      
      setSquads(data as Squad[] || []);
    } catch (error: any) {
      console.error('Error fetching squads:', error);
      toast({
        title: "Error fetching squads",
        description: error.message || 'Failed to load squads',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchSquads(searchQuery.trim());
    }
  };

  const searchSquads = async (query: string) => {
    setLoading(true);
    try {
      // Basic search implementation - can be improved with Supabase full-text search
      const { data, error } = await supabase
        .from('squads')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .order('member_count', { ascending: false })
        .limit(20);
      
      if (error) {
        throw error;
      }
      
      setSquads(data as Squad[] || []);
    } catch (error: any) {
      console.error('Error searching squads:', error);
      toast({
        title: "Error searching squads",
        description: error.message || 'Failed to search squads',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSquadCards = () => {
    if (loading) {
      return (
        <>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-10 w-10 rounded-full mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </>
      );
    }

    if (squads.length === 0) {
      return (
        <div className="col-span-full text-center p-8">
          <h3 className="text-xl font-medium mb-2">No squads found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try a different search term' : 'Be the first to create a squad!'}
          </p>
          <Button asChild>
            <Link to="/create-squad">Create Squad</Link>
          </Button>
        </div>
      );
    }

    return squads.map((squad) => (
      <Card key={squad.id} className="overflow-hidden hover:shadow-md transition-shadow">
        <CardHeader className="p-4">
          <CardTitle className="text-lg flex items-center">
            r/{squad.name}
            {squad.is_verified && (
              <Badge variant="secondary" className="ml-2">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                Verified
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {squad.description || `Community for ${squad.name}`}
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={squad.banner_image || undefined} alt={squad.name} />
              <AvatarFallback>{squad.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-muted-foreground">
              {squad.member_count || 0} members
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button className="w-full" asChild>
            <Link to={`/r/${squad.name}`}>Visit Squad</Link>
          </Button>
        </CardFooter>
      </Card>
    ));
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <SEOMetaTags 
          title="Explore Communities"
          description="Discover communities and squads on NexaSnap. Find your tribe today!"
          keywords={['explore', 'communities', 'squads', 'discover']}
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
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl font-bold mb-6">Explore Communities</h1>
              
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search for squads..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                  <TabsTrigger value="trending">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="new">
                    <Star className="h-4 w-4 mr-2" />
                    New
                  </TabsTrigger>
                  <TabsTrigger value="verified">
                    <Users className="h-4 w-4 mr-2" />
                    Verified
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="trending" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderSquadCards()}
                  </div>
                </TabsContent>
                
                <TabsContent value="new" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderSquadCards()}
                  </div>
                </TabsContent>
                
                <TabsContent value="verified" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderSquadCards()}
                  </div>
                </TabsContent>
              </Tabs>
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

export default Explore;
