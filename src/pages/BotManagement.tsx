import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusIcon, Settings, Trash2, Play, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Define TypeScript interfaces
interface SystemBot {
  id: number;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  prompt_template: string | null;
  schedule: string;
  last_run: string | null;
  created_at: string;
  created_by: string;
}

const BotManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bots, setBots] = useState<SystemBot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Form states for creating a new bot
  const [newBotName, setNewBotName] = useState<string>('');
  const [newBotDescription, setNewBotDescription] = useState<string>('');
  const [newBotType, setNewBotType] = useState<string>('content_generator');
  const [newBotPromptTemplate, setNewBotPromptTemplate] = useState<string>('');
  const [newBotSchedule, setNewBotSchedule] = useState<string>('daily');
  const [newBotActive, setNewBotActive] = useState<boolean>(true);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedBotId, setSelectedBotId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData && profileData.is_admin) {
          setIsAdmin(true);
          await fetchBots();
        } else {
          navigate('/');
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive'
          });
        }
      } catch (error: any) {
        console.error('Error checking admin status:', error);
        toast({
          title: 'Error',
          description: 'Failed to verify your access permissions.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate, toast]);

  const fetchBots = async () => {
    try {
      setLoading(true);
      
      // This needs a custom query to work with the types
      const { data, error } = await supabase
        .rpc('get_system_bots'); // Create this RPC function

      if (error) throw error;
      
      setBots(data || []);
    } catch (error: any) {
      console.error('Error fetching bots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system bots.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createBot = async () => {
    if (!newBotName) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a name for the bot.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // This needs a custom query to work with the types
      const { data, error } = await supabase
        .rpc('create_system_bot', {
          p_name: newBotName,
          p_description: newBotDescription || null,
          p_type: newBotType,
          p_is_active: newBotActive,
          p_prompt_template: newBotPromptTemplate || null,
          p_schedule: newBotSchedule,
        });

      if (error) throw error;
      
      toast({
        title: 'Bot Created',
        description: `${newBotName} has been successfully created.`
      });
      
      // Reset form and close dialog
      resetForm();
      setIsCreateDialogOpen(false);
      
      // Refresh the bot list
      await fetchBots();
    } catch (error: any) {
      console.error('Error creating bot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bot.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBot = async () => {
    if (!selectedBotId) return;
    
    try {
      setIsSubmitting(true);
      
      // This needs a custom query to work with the types
      const { error } = await supabase
        .rpc('delete_system_bot', {
          p_bot_id: selectedBotId
        });
      
      if (error) throw error;
      
      toast({
        title: 'Bot Deleted',
        description: 'The bot has been successfully deleted.'
      });
      
      // Close dialog and refresh list
      setIsDeleteDialogOpen(false);
      setSelectedBotId(null);
      await fetchBots();
    } catch (error: any) {
      console.error('Error deleting bot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bot.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBotStatus = async (botId: number, currentStatus: boolean) => {
    try {
      // This needs a custom query to work with the types
      const { error } = await supabase
        .rpc('update_bot_status', {
          p_bot_id: botId,
          p_is_active: !currentStatus
        });
      
      if (error) throw error;
      
      toast({
        title: 'Status Updated',
        description: `Bot has been ${!currentStatus ? 'activated' : 'deactivated'}.`
      });
      
      // Refresh the bot list
      await fetchBots();
    } catch (error: any) {
      console.error('Error toggling bot status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bot status.',
        variant: 'destructive'
      });
    }
  };

  const runBotManually = async (botId: number) => {
    try {
      // This needs a custom query to work with the types
      const { error } = await supabase
        .rpc('run_bot_manually', {
          p_bot_id: botId
        });
      
      if (error) throw error;
      
      toast({
        title: 'Bot Triggered',
        description: 'The bot has been manually triggered to run.'
      });
      
      // Refresh after a short delay to show updated last_run time
      setTimeout(() => fetchBots(), 2000);
    } catch (error: any) {
      console.error('Error running bot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to run the bot.',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setNewBotName('');
    setNewBotDescription('');
    setNewBotType('content_generator');
    setNewBotPromptTemplate('');
    setNewBotSchedule('daily');
    setNewBotActive(true);
  };

  if (!isAdmin) {
    return null; // Don't render anything if not admin (will redirect)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">System Bot Management</h1>
      
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage automated system bots for content generation and moderation.</p>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create New Bot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New System Bot</DialogTitle>
              <DialogDescription>
                Configure an automated bot to perform tasks on a schedule.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input 
                  id="name" 
                  value={newBotName} 
                  onChange={(e) => setNewBotName(e.target.value)} 
                  className="col-span-3" 
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newBotDescription}
                  onChange={(e) => setNewBotDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select value={newBotType} onValueChange={setNewBotType} >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="content_generator">Content Generator</SelectItem>
                    <SelectItem value="content_moderator">Content Moderator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prompt" className="text-right">
                  Prompt Template
                </Label>
                <Textarea
                  id="prompt"
                  value={newBotPromptTemplate}
                  onChange={(e) => setNewBotPromptTemplate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="schedule" className="text-right">
                  Schedule
                </Label>
                <Select value={newBotSchedule} onValueChange={setNewBotSchedule}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Active
                </Label>
                <Switch 
                  id="active" 
                  checked={newBotActive} 
                  onCheckedChange={(checked) => setNewBotActive(checked)} 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={createBot} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Bot'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <Card>
          <CardContent>
            <p>Loading system bots...</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bots.map((bot) => (
              <TableRow key={bot.id}>
                <TableCell className="font-medium">{bot.name}</TableCell>
                <TableCell>{bot.type}</TableCell>
                <TableCell>{bot.schedule}</TableCell>
                <TableCell>
                  {bot.is_active ? (
                    <div className="flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Active
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                      Inactive
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {bot.last_run ? (
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {new Date(bot.last_run).toLocaleString()}
                    </div>
                  ) : (
                    'Never'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => runBotManually(bot.id)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleBotStatus(bot.id, bot.is_active)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Dialog open={isDeleteDialogOpen && selectedBotId === bot.id} onOpenChange={(open) => {
                      setIsDeleteDialogOpen(open);
                      if (open) {
                        setSelectedBotId(bot.id);
                      } else {
                        setSelectedBotId(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Are you sure?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. This will permanently delete the bot from our servers.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="secondary" onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setSelectedBotId(null);
                          }}>Cancel</Button>
                          <Button variant="destructive" onClick={deleteBot} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Delete'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default BotManagement;
