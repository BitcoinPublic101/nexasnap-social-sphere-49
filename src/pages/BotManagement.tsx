
import React, { useState, useEffect } from 'react';
import { NavBar } from '@/components/ui/NavBar';
import { ThemeProvider } from '@/context/ThemeContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Bot, Plus, Trash2, Settings, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SystemBot } from '@/types/supabase-custom';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SEOMetaTags from '@/components/SEOMetaTags';

// To fix TypeScript errors with the form states, define proper interfaces
interface BotFormState {
  name: string;
  description: string;
  personality: string;
  avatar_url: string;
  is_active: boolean;
}

const defaultBotForm: BotFormState = {
  name: '',
  description: '',
  personality: '',
  avatar_url: '',
  is_active: true
};

const BotManagement = () => {
  const [bots, setBots] = useState<SystemBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentBot, setCurrentBot] = useState<SystemBot | null>(null);
  const [newBotForm, setNewBotForm] = useState<BotFormState>(defaultBotForm);
  const [editBotForm, setEditBotForm] = useState<BotFormState>(defaultBotForm);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchBots = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('system_bots')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setBots(data || []);
      } catch (error: any) {
        console.error('Error fetching bots:', error);
        toast({
          title: 'Error fetching bots',
          description: error.message || 'Could not load bots',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBots();
  }, []);
  
  const handleCreateBot = async () => {
    try {
      if (!newBotForm.name || !newBotForm.description) {
        toast({
          title: 'Missing information',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }
      
      const { data, error } = await supabase
        .from('system_bots')
        .insert({
          name: newBotForm.name,
          description: newBotForm.description,
          personality: newBotForm.personality,
          avatar_url: newBotForm.avatar_url,
          is_active: newBotForm.is_active,
          created_by: user?.id
        })
        .select();
        
      if (error) throw error;
      
      setBots([...(data as SystemBot[]), ...bots]);
      setCreateDialogOpen(false);
      setNewBotForm(defaultBotForm);
      
      toast({
        title: 'Bot created',
        description: `${newBotForm.name} has been created successfully`,
      });
    } catch (error: any) {
      console.error('Error creating bot:', error);
      toast({
        title: 'Error creating bot',
        description: error.message || 'Could not create bot',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateBot = async () => {
    try {
      if (!currentBot) return;
      
      const { error } = await supabase
        .from('system_bots')
        .update({
          name: editBotForm.name,
          description: editBotForm.description,
          personality: editBotForm.personality,
          avatar_url: editBotForm.avatar_url,
          is_active: editBotForm.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentBot.id);
        
      if (error) throw error;
      
      // Update the local state
      setBots(bots.map(bot => 
        bot.id === currentBot.id ? {...bot, ...editBotForm, updated_at: new Date().toISOString()} : bot
      ));
      
      setEditDialogOpen(false);
      
      toast({
        title: 'Bot updated',
        description: `${editBotForm.name} has been updated successfully`,
      });
    } catch (error: any) {
      console.error('Error updating bot:', error);
      toast({
        title: 'Error updating bot',
        description: error.message || 'Could not update bot',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteBot = async () => {
    try {
      if (!currentBot) return;
      
      const { error } = await supabase
        .from('system_bots')
        .delete()
        .eq('id', currentBot.id);
        
      if (error) throw error;
      
      // Update the local state
      setBots(bots.filter(bot => bot.id !== currentBot.id));
      
      setDeleteDialogOpen(false);
      
      toast({
        title: 'Bot deleted',
        description: `${currentBot.name} has been deleted successfully`,
      });
    } catch (error: any) {
      console.error('Error deleting bot:', error);
      toast({
        title: 'Error deleting bot',
        description: error.message || 'Could not delete bot',
        variant: 'destructive',
      });
    }
  };
  
  const handleNewBotInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewBotForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditBotInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditBotForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEdit = (bot: SystemBot) => {
    setCurrentBot(bot);
    setEditBotForm({
      name: bot.name,
      description: bot.description || '',
      personality: bot.personality || '',
      avatar_url: bot.avatar_url || '',
      is_active: bot.is_active
    });
    setEditDialogOpen(true);
  };
  
  const handleDelete = (bot: SystemBot) => {
    setCurrentBot(bot);
    setDeleteDialogOpen(true);
  };
  
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <SEOMetaTags 
          title="Bot Management"
          description="Manage your AI assistants and bots"
          keywords={['AI', 'bot', 'assistant', 'management']}
        />
        
        <NavBar />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Bot Management</h1>
              <p className="text-muted-foreground">Create and manage AI assistants for your community</p>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Bot
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Bot</DialogTitle>
                  <DialogDescription>
                    Configure your new AI assistant. Give it a personality and purpose.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., HelpBot"
                      value={newBotForm.name}
                      onChange={handleNewBotInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="What does this bot do?"
                      value={newBotForm.description}
                      onChange={handleNewBotInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="personality">Personality (Optional)</Label>
                    <Textarea
                      id="personality"
                      name="personality"
                      placeholder="Describe how the bot should interact with users"
                      value={newBotForm.personality}
                      onChange={handleNewBotInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avatar_url">Avatar URL (Optional)</Label>
                    <Input
                      id="avatar_url"
                      name="avatar_url"
                      placeholder="https://example.com/avatar.png"
                      value={newBotForm.avatar_url}
                      onChange={handleNewBotInputChange}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      name="is_active"
                      checked={newBotForm.is_active}
                      onCheckedChange={(checked) => 
                        setNewBotForm(prev => ({ ...prev, is_active: checked }))
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBot}>Create Bot</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-gray-100 dark:bg-gray-800"></CardHeader>
                  <CardContent className="h-48 mt-2">
                    <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded mb-2"></div>
                    <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : bots.length === 0 ? (
            <Card className="p-8 text-center">
              <CardHeader>
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">No Bots Created Yet</CardTitle>
                <CardDescription>
                  Create your first AI assistant to help manage your community.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Bot
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bots.map((bot) => (
                <Card key={bot.id} className={bot.is_active ? "" : "opacity-60"}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={bot.avatar_url || ""} alt={bot.name} />
                        <AvatarFallback>{bot.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(bot)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(bot)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="mt-2">{bot.name}</CardTitle>
                    {!bot.is_active && (
                      <div className="flex items-center mt-1 text-sm text-amber-500">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {bot.description}
                    </p>
                    
                    {bot.personality && (
                      <>
                        <Separator className="my-3" />
                        <div className="mt-2">
                          <Label className="text-xs text-muted-foreground">Personality</Label>
                          <p className="text-sm line-clamp-2">{bot.personality}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground pt-0">
                    Created {new Date(bot.created_at).toLocaleDateString()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Bot</DialogTitle>
                <DialogDescription>
                  Update your AI assistant's configuration.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit_name">Name</Label>
                  <Input
                    id="edit_name"
                    name="name"
                    value={editBotForm.name}
                    onChange={handleEditBotInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea
                    id="edit_description"
                    name="description"
                    value={editBotForm.description}
                    onChange={handleEditBotInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_personality">Personality</Label>
                  <Textarea
                    id="edit_personality"
                    name="personality"
                    value={editBotForm.personality}
                    onChange={handleEditBotInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit_avatar_url">Avatar URL</Label>
                  <Input
                    id="edit_avatar_url"
                    name="avatar_url"
                    value={editBotForm.avatar_url}
                    onChange={handleEditBotInputChange}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_is_active"
                    checked={editBotForm.is_active}
                    onCheckedChange={(checked) => 
                      setEditBotForm(prev => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label htmlFor="edit_is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateBot}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Bot</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this bot? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting this bot will remove it permanently and any associated data.
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteBot}>
                  Delete Bot
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </ThemeProvider>
  );
};

export default BotManagement;
