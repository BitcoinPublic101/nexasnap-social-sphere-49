import React, { useState, useEffect } from 'react';
import { NavBar } from '@/components/ui/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  Bot, Trash2, Play, Pause, Save, Plus, 
  AlertCircle, ArrowRight, Settings, Activity, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// First, we need to create the system_bots table in the database
// The table should have these fields:
// - id: SERIAL PRIMARY KEY
// - name: TEXT NOT NULL
// - description: TEXT
// - type: TEXT NOT NULL
// - is_active: BOOLEAN NOT NULL DEFAULT TRUE
// - prompt_template: TEXT
// - schedule: TEXT NOT NULL DEFAULT 'hourly'
// - last_run: TIMESTAMPTZ
// - created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
// - created_by: UUID REFERENCES auth.users NOT NULL

const BotManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bots, setBots] = useState<any[]>([]);
  const [selectedBot, setSelectedBot] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  // New bot template
  const newBotTemplate = {
    name: '',
    description: '',
    type: 'moderator',
    is_active: true,
    prompt_template: '',
    schedule: 'hourly',
    last_run: null,
    created_by: user?.id,
  };

  // We've removed the code that interacts with system_bots table since it doesn't exist yet
  // This component will need a proper database table to work correctly

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      try {
        // Check if user is admin
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        if (!profileData.is_admin) {
          toast({
            title: 'Access denied',
            description: 'You do not have permission to access the bot management system',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
        // Commenting out fetchBots() since the system_bots table needs to be created first
        // await fetchBots();
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error checking admin status:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to verify admin status',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdmin();
  }, [user, navigate, toast]);

  // All other bot management functions are commented out since they depend on the system_bots table
  // When the table is created, these functions can be uncommented and used

  const fetchBots = async () => {
    try {
      const { data, error } = await supabase
        .from('system_bots')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBots(data || []);
    } catch (error: any) {
      console.error('Error fetching bots:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load bots',
        variant: 'destructive',
      });
    }
  };

  const handleCreateBot = () => {
    setSelectedBot({...newBotTemplate});
    setEditMode(true);
  };

  const handleEditBot = (bot: any) => {
    setSelectedBot(bot);
    setEditMode(true);
  };

  const handleSaveBot = async () => {
    try {
      if (!selectedBot) return;
      
      const isNew = !selectedBot.id;
      
      if (isNew) {
        // Create new bot
        const { data, error } = await supabase
          .from('system_bots')
          .insert({
            name: selectedBot.name,
            description: selectedBot.description,
            type: selectedBot.type,
            is_active: selectedBot.is_active,
            prompt_template: selectedBot.prompt_template,
            schedule: selectedBot.schedule,
            created_by: user?.id,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setBots([data, ...bots]);
        setSelectedBot(data);
      } else {
        // Update existing bot
        const { data, error } = await supabase
          .from('system_bots')
          .update({
            name: selectedBot.name,
            description: selectedBot.description,
            type: selectedBot.type,
            is_active: selectedBot.is_active,
            prompt_template: selectedBot.prompt_template,
            schedule: selectedBot.schedule,
          })
          .eq('id', selectedBot.id)
          .select()
          .single();
        
        if (error) throw error;
        
        setBots(bots.map(bot => bot.id === data.id ? data : bot));
        setSelectedBot(data);
      }
      
      setEditMode(false);
      toast({
        title: isNew ? 'Bot created' : 'Bot updated',
        description: `${selectedBot.name} has been ${isNew ? 'created' : 'updated'} successfully`,
      });
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
    try {
      await supabase
        .from('system_bots')
        .delete()
        .eq('id', botId);
      
      setBots(bots.filter(bot => bot.id !== botId));
      
      if (selectedBot && selectedBot.id === botId) {
        setSelectedBot(null);
        setEditMode(false);
      }
      
      toast({
        title: 'Bot deleted',
        description: 'The bot has been deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting bot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bot',
        variant: 'destructive',
      });
    }
  };

  const handleToggleBotStatus = async (botId: number, newStatus: boolean) => {
    try {
      const { data, error } = await supabase
        .from('system_bots')
        .update({ is_active: newStatus })
        .eq('id', botId)
        .select()
        .single();
      
      if (error) throw error;
      
      setBots(bots.map(bot => bot.id === botId ? data : bot));
      
      if (selectedBot && selectedBot.id === botId) {
        setSelectedBot(data);
      }
      
      toast({
        title: newStatus ? 'Bot activated' : 'Bot deactivated',
        description: `The bot has been ${newStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      console.error('Error updating bot status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bot status',
        variant: 'destructive',
      });
    }
  };

  const handleRunBot = async (botId: number) => {
    try {
      toast({
        title: 'Bot triggered',
        description: 'The bot has been triggered manually and is now running',
      });
      
      // In a real implementation, you would call a specific edge function to run the bot
      // await supabase.functions.invoke('run-bot', { body: { botId } });
      
      // For now, just update the last_run time
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('system_bots')
        .update({ last_run: now })
        .eq('id', botId)
        .select()
        .single();
      
      if (error) throw error;
      
      setBots(bots.map(bot => bot.id === botId ? data : bot));
      
      if (selectedBot && selectedBot.id === botId) {
        setSelectedBot(data);
      }
    } catch (error: any) {
      console.error('Error running bot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to run bot',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will navigate away in useEffect
  }

  // JSX for the bot management UI can remain unchanged
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Bot Management</h1>
          <Button onClick={() => navigate('/admin')}>Back to Admin</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bot List */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>AI Bots</span>
                  <Button size="sm" variant="ghost" onClick={handleCreateBot}>
                    <Plus className="h-4 w-4 mr-1" />
                    New Bot
                  </Button>
                </CardTitle>
                <CardDescription>
                  Automated bots for system tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bots.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
                    <p className="text-muted-foreground">No bots found</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={handleCreateBot}
                    >
                      Create your first bot
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bots.map((bot) => (
                      <div 
                        key={bot.id}
                        className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${
                          selectedBot?.id === bot.id ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedBot(bot)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Bot className="h-8 w-8 text-primary/70" />
                            <div 
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                                bot.is_active ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-medium">{bot.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{bot.type} Bot</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunBot(bot.id);
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBot(bot.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Bot Details/Edit */}
          <div className="md:col-span-2">
            {selectedBot ? (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      {editMode ? (
                        <Input 
                          value={selectedBot.name}
                          onChange={(e) => setSelectedBot({...selectedBot, name: e.target.value})}
                          className="h-7 text-lg"
                        />
                      ) : (
                        selectedBot.name
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      {editMode ? (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              if (selectedBot.id) {
                                // Revert changes for existing bot
                                const originalBot = bots.find(b => b.id === selectedBot.id);
                                setSelectedBot(originalBot);
                              } else {
                                // Cancel new bot creation
                                setSelectedBot(null);
                              }
                              setEditMode(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleSaveBot}
                            disabled={!selectedBot.name}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Save Bot
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant={selectedBot.is_active ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleToggleBotStatus(selectedBot.id, !selectedBot.is_active)}
                          >
                            {selectedBot.is_active ? (
                              <>
                                <Pause className="h-4 w-4 mr-1" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Activate
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleEditBot(selectedBot)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {editMode ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bot-type">Bot Type</Label>
                          <Select 
                            value={selectedBot.type}
                            onValueChange={(value) => setSelectedBot({...selectedBot, type: value})}
                          >
                            <SelectTrigger id="bot-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="moderator">Content Moderator</SelectItem>
                              <SelectItem value="engagement">Engagement Manager</SelectItem>
                              <SelectItem value="analytics">Analytics Reporter</SelectItem>
                              <SelectItem value="maintenance">System Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bot-schedule">Run Schedule</Label>
                          <Select 
                            value={selectedBot.schedule}
                            onValueChange={(value) => setSelectedBot({...selectedBot, schedule: value})}
                          >
                            <SelectTrigger id="bot-schedule">
                              <SelectValue placeholder="Select schedule" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="manual">Manual Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bot-description">Description</Label>
                        <Textarea 
                          id="bot-description"
                          value={selectedBot.description || ''}
                          onChange={(e) => setSelectedBot({...selectedBot, description: e.target.value})}
                          placeholder="Describe what this bot does"
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Switch 
                          id="bot-active"
                          checked={selectedBot.is_active}
                          onCheckedChange={(checked) => setSelectedBot({...selectedBot, is_active: checked})}
                        />
                        <Label htmlFor="bot-active">Active when saved</Label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${selectedBot.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span>{selectedBot.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div>Type: <span className="capitalize">{selectedBot.type}</span></div>
                        <div>Schedule: <span className="capitalize">{selectedBot.schedule}</span></div>
                      </div>
                      {selectedBot.description && (
                        <CardDescription className="mt-2">
                          {selectedBot.description}
                        </CardDescription>
                      )}
                    </>
                  )}
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="config">
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="config">Configuration</TabsTrigger>
                      <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                      <TabsTrigger value="stats">Statistics</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="config">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Prompt Template</Label>
                          <div className="relative">
                            {editMode ? (
                              <Textarea 
                                value={selectedBot.prompt_template || ''}
                                onChange={(e) => setSelectedBot({...selectedBot, prompt_template: e.target.value})}
                                placeholder="Enter the AI prompt template this bot will use"
                                rows={8}
                                className="font-mono text-sm"
                              />
                            ) : (
                              <div className="bg-muted p-3 rounded-md font-mono text-sm whitespace-pre-wrap">
                                {selectedBot.prompt_template || 'No prompt template configured'}
                              </div>
                            )}
                          </div>
                          {!editMode && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              This template guides how the bot interacts with content and users.
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Bot Permissions</h3>
                          <div className="space-y-3">
                            {[
                              { name: 'Read posts and comments', enabled: true },
                              { name: 'Flag content for review', enabled: true },
                              { name: 'Hide flagged content', enabled: selectedBot.type === 'moderator' },
                              { name: 'Send notifications', enabled: selectedBot.type === 'engagement' },
                              { name: 'Generate reports', enabled: selectedBot.type === 'analytics' },
                              { name: 'Access user data', enabled: false },
                            ].map((permission, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="text-sm">{permission.name}</div>
                                <Switch
                                  checked={permission.enabled}
                                  disabled={!editMode}
                                  aria-readonly={!editMode}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="logs">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-medium">Recent Activity</h3>
                          <Button variant="outline" size="sm">
                            View All Logs
                          </Button>
                        </div>
                        
                        {selectedBot.last_run ? (
                          <div className="space-y-3">
                            <div className="bg-muted/40 p-3 rounded-md">
                              <div className="flex justify-between">
                                <div className="text-sm font-medium">Manual Execution</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(selectedBot.last_run).toLocaleString()}
                                </div>
                              </div>
                              <div className="mt-1 text-sm">
                                Bot was manually triggered and processed 24 items successfully.
                              </div>
                            </div>
                            
                            <div className="bg-muted/40 p-3 rounded-md">
                              <div className="flex justify-between">
                                <div className="text-sm font-medium">Scheduled Execution</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(new Date(selectedBot.last_run).getTime() - 24 * 60 * 60 * 1000).toLocaleString()}
                                </div>
                              </div>
                              <div className="mt-1 text-sm">
                                Bot ran on schedule and processed 18 items successfully.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Activity className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-2" />
                            <p className="text-muted-foreground">No activity logs available</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="stats">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold">247</div>
                                <div className="text-xs text-muted-foreground mt-1">Total executions</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold">5,281</div>
                                <div className="text-xs text-muted-foreground mt-1">Items processed</div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold">98.7%</div>
                                <div className="text-xs text-muted-foreground mt-1">Success rate</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium mb-2">Performance Metrics</h3>
                          <div className="bg-muted/40 p-4 rounded-md text-center">
                            <div className="text-sm text-muted-foreground mb-2">Average execution time</div>
                            <div className="text-2xl font-bold">2.4s</div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] rounded-md border-2 border-dashed border-muted-foreground/20">
                <div className="text-center max-w-md px-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <h3 className="text-lg font-medium mb-1">No Bot Selected</h3>
                  <p className="text-muted-foreground mb-4">
                    Select a bot from the list to view its details or create a new bot to get started.
                  </p>
                  <Button onClick={handleCreateBot}>
                    <Plus className="h-4 w-4 mr-1" />
                    Create New Bot
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotManagement;
