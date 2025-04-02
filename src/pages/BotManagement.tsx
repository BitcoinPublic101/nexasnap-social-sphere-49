
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot, Calendar, Edit, Info, Plus, Trash } from 'lucide-react';
import { ExtendedSystemBot } from '@/types/supabase-custom';
import { useAuth } from '@/context/AuthContext';
import { NavBar } from '@/components/ui/NavBar';
import { useNavigate } from 'react-router-dom';

const BotManagement = () => {
  const [bots, setBots] = useState<ExtendedSystemBot[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // Default configuration for a new bot
  const defaultBotConfig = {
    name: '',
    description: '',
    type: 'content',
    schedule: 'daily',
    prompt_template: '',
    is_active: true,
    personality: 'helpful',
    avatar_url: '',
  };

  const [editingBot, setEditingBot] = useState<ExtendedSystemBot | null>(null);
  const [newBot, setNewBot] = useState<ExtendedSystemBot & { [key: string]: any }>(defaultBotConfig as any);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    // Check if current user is admin
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (!data.is_admin) {
          toast({
            title: 'Access Denied',
            description: 'You need administrator access for this page.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
        fetchBots();
      } catch (error: any) {
        console.error('Error checking admin status:', error);
        toast({
          title: 'Authentication Error',
          description: error.message || 'Failed to verify your access privileges',
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    checkAdminStatus();
  }, [user, navigate, toast]);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_bots')
        .select('*')
        .order('name');

      if (error) throw error;

      // Enhance the bots with default avatar and personality if they don't have it
      const enhancedBots = data.map(bot => ({
        ...bot,
        personality: bot.personality || 'helpful',
        avatar_url: bot.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${bot.name}`,
      }));

      setBots(enhancedBots);
    } catch (error: any) {
      console.error('Error fetching bots:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load bots',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditBot = (bot: ExtendedSystemBot) => {
    setEditingBot(bot);
    setIsCreatingNew(false);
  };

  const handleCreateNewBot = () => {
    setEditingBot(null);
    setIsCreatingNew(true);
    setNewBot(defaultBotConfig as any);
  };

  const handleSaveBot = async () => {
    const botToSave = isCreatingNew ? newBot : editingBot;
    if (!botToSave) return;
    
    try {
      if (isCreatingNew) {
        // Create new bot
        const { data, error } = await supabase
          .from('system_bots')
          .insert({
            name: botToSave.name,
            description: botToSave.description,
            type: botToSave.type,
            schedule: botToSave.schedule,
            prompt_template: botToSave.prompt_template,
            is_active: botToSave.is_active,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: 'Bot Created',
          description: `Successfully created bot: ${botToSave.name}`,
        });
      } else {
        // Update existing bot
        const { error } = await supabase
          .from('system_bots')
          .update({
            name: botToSave.name,
            description: botToSave.description,
            type: botToSave.type,
            schedule: botToSave.schedule,
            prompt_template: botToSave.prompt_template,
            is_active: botToSave.is_active,
          })
          .eq('id', botToSave.id);

        if (error) throw error;

        toast({
          title: 'Bot Updated',
          description: `Successfully updated bot: ${botToSave.name}`,
        });
      }

      // Reset states and refresh bots
      setEditingBot(null);
      setIsCreatingNew(false);
      fetchBots();
    } catch (error: any) {
      console.error('Error saving bot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save bot',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBot = async (botId: number) => {
    if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('system_bots')
        .delete()
        .eq('id', botId);

      if (error) throw error;

      toast({
        title: 'Bot Deleted',
        description: 'The bot has been removed from the system',
      });

      fetchBots();
    } catch (error: any) {
      console.error('Error deleting bot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bot',
        variant: 'destructive',
      });
    }
  };

  const handleToggleBot = async (botId: number, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('system_bots')
        .update({ is_active: isActive })
        .eq('id', botId);

      if (error) throw error;

      toast({
        title: isActive ? 'Bot Activated' : 'Bot Deactivated',
        description: `Bot has been ${isActive ? 'activated' : 'deactivated'} successfully`,
      });

      // Update local state
      setBots(prevBots => 
        prevBots.map(bot => 
          bot.id === botId ? { ...bot, is_active: isActive } : bot
        )
      );
    } catch (error: any) {
      console.error('Error toggling bot status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bot status',
        variant: 'destructive',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (isCreatingNew) {
      setNewBot(prev => ({ ...prev, [name]: value }));
    } else if (editingBot) {
      setEditingBot(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSwitchChange = (checked: boolean) => {
    if (isCreatingNew) {
      setNewBot(prev => ({ ...prev, is_active: checked }));
    } else if (editingBot) {
      setEditingBot(prev => prev ? { ...prev, is_active: checked } : null);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (isCreatingNew) {
      setNewBot(prev => ({ ...prev, [name]: value }));
    } else if (editingBot) {
      setEditingBot(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <p>Checking access privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Bot Management</h1>
          <Button onClick={handleCreateNewBot}>
            <Plus className="mr-2 h-4 w-4" /> Create New Bot
          </Button>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Bots</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Bots</TabsTrigger>
            <TabsTrigger value="all">All Bots</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.filter(bot => bot.is_active).map(bot => (
                <BotCard 
                  key={bot.id} 
                  bot={bot} 
                  onEdit={() => handleEditBot(bot)}
                  onDelete={() => handleDeleteBot(bot.id)}
                  onToggle={(isActive) => handleToggleBot(bot.id, isActive)}
                />
              ))}
              {loading && <p>Loading active bots...</p>}
              {!loading && bots.filter(bot => bot.is_active).length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No active bots found</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="inactive">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.filter(bot => !bot.is_active).map(bot => (
                <BotCard 
                  key={bot.id} 
                  bot={bot} 
                  onEdit={() => handleEditBot(bot)}
                  onDelete={() => handleDeleteBot(bot.id)}
                  onToggle={(isActive) => handleToggleBot(bot.id, isActive)}
                />
              ))}
              {loading && <p>Loading inactive bots...</p>}
              {!loading && bots.filter(bot => !bot.is_active).length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No inactive bots found</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map(bot => (
                <BotCard 
                  key={bot.id} 
                  bot={bot} 
                  onEdit={() => handleEditBot(bot)}
                  onDelete={() => handleDeleteBot(bot.id)}
                  onToggle={(isActive) => handleToggleBot(bot.id, isActive)}
                />
              ))}
              {loading && <p>Loading bots...</p>}
              {!loading && bots.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-8">No bots found</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {(editingBot || isCreatingNew) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl overflow-y-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">
                    {isCreatingNew ? 'Create New Bot' : 'Edit Bot'}
                  </h2>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setEditingBot(null);
                      setIsCreatingNew(false);
                    }}
                  >
                    ×
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Bot Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={isCreatingNew ? newBot.name : editingBot?.name || ''} 
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      value={isCreatingNew ? newBot.description : editingBot?.description || ''} 
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Bot Type</Label>
                      <Select 
                        value={isCreatingNew ? newBot.type : editingBot?.type || 'content'} 
                        onValueChange={(value) => handleSelectChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="content">Content Generator</SelectItem>
                          <SelectItem value="moderation">Content Moderation</SelectItem>
                          <SelectItem value="assistant">AI Assistant</SelectItem>
                          <SelectItem value="notification">Notification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="schedule">Schedule</Label>
                      <Select 
                        value={isCreatingNew ? newBot.schedule : editingBot?.schedule || 'daily'} 
                        onValueChange={(value) => handleSelectChange('schedule', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select schedule" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="on-demand">On Demand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="prompt_template">Prompt Template</Label>
                    <Textarea 
                      id="prompt_template" 
                      name="prompt_template" 
                      value={isCreatingNew ? newBot.prompt_template : editingBot?.prompt_template || ''} 
                      onChange={handleInputChange}
                      className="h-36"
                      placeholder="Write your prompt template here. Use variables like {{username}} that will be replaced when the bot runs."
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={isCreatingNew ? newBot.is_active : editingBot?.is_active || false}
                      onCheckedChange={handleSwitchChange}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditingBot(null);
                        setIsCreatingNew(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveBot}>
                      {isCreatingNew ? 'Create Bot' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

interface BotCardProps {
  bot: ExtendedSystemBot;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
}

const BotCard = ({ bot, onEdit, onDelete, onToggle }: BotCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className={`p-4 ${bot.is_active ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={bot.avatar_url} alt={bot.name} />
              <AvatarFallback>
                <Bot size={24} />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold">{bot.name}</h3>
              <p className="text-xs text-muted-foreground">{bot.type}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Switch
              checked={bot.is_active}
              onCheckedChange={onToggle}
              aria-label="Toggle bot active status"
            />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-4">{bot.description || 'No description provided.'}</p>
        
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="h-3 w-3" />
            <span>Schedule: {bot.schedule}</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Last run: {bot.last_run ? new Date(bot.last_run).toLocaleString() : 'Never'}</span>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BotManagement;
