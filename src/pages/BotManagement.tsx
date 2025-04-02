
// Update imports to use ExtendedSystemBot instead of SystemBot
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Robot, 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ExtendedSystemBot } from '@/types/supabase-custom';

interface BotFormData {
  name: string;
  type: string;
  description: string;
  prompt_template: string;
  schedule: string;
  is_active: boolean;
}

const BotManagement = () => {
  const [bots, setBots] = useState<ExtendedSystemBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState<ExtendedSystemBot | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BotFormData>();
  
  useEffect(() => {
    fetchBots();
  }, []);
  
  const fetchBots = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_bots')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBots(data as ExtendedSystemBot[] || []);
    } catch (error: any) {
      console.error('Error fetching bots:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bots',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmitCreate = async (data: BotFormData) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('system_bots')
        .insert({
          name: data.name,
          type: data.type,
          description: data.description,
          prompt_template: data.prompt_template,
          schedule: data.schedule,
          is_active: data.is_active,
          created_by: user.id,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Bot created successfully',
      });
      
      fetchBots();
      setIsCreateDialogOpen(false);
      reset();
    } catch (error: any) {
      console.error('Error creating bot:', error);
      toast({
        title: 'Error',
        description: 'Failed to create bot',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmitEdit = async (data: BotFormData) => {
    if (!selectedBot) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('system_bots')
        .update({
          name: data.name,
          type: data.type,
          description: data.description,
          prompt_template: data.prompt_template,
          schedule: data.schedule,
          is_active: data.is_active,
        })
        .eq('id', selectedBot.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Bot updated successfully',
      });
      
      fetchBots();
      setIsEditDialogOpen(false);
      setSelectedBot(null);
    } catch (error: any) {
      console.error('Error updating bot:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bot',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (bot: ExtendedSystemBot) => {
    if (!confirm(`Are you sure you want to delete ${bot.name}?`)) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('system_bots')
        .delete()
        .eq('id', bot.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Bot deleted successfully',
      });
      
      fetchBots();
    } catch (error: any) {
      console.error('Error deleting bot:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bot',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleActive = async (bot: ExtendedSystemBot) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('system_bots')
        .update({
          is_active: !bot.is_active,
        })
        .eq('id', bot.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Bot ${bot.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      
      fetchBots();
    } catch (error: any) {
      console.error('Error toggling bot status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update bot status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleManualRun = async (bot: ExtendedSystemBot) => {
    try {
      setIsLoading(true);
      // This would trigger a function to manually run the bot
      // For now, just update the last_run timestamp
      const { error } = await supabase
        .from('system_bots')
        .update({
          last_run: new Date().toISOString(),
        })
        .eq('id', bot.id);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Bot triggered to run manually',
      });
      
      fetchBots();
    } catch (error: any) {
      console.error('Error running bot:', error);
      toast({
        title: 'Error',
        description: 'Failed to run bot',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const openEditDialog = (bot: ExtendedSystemBot) => {
    setSelectedBot(bot);
    setValue('name', bot.name);
    setValue('type', bot.type);
    setValue('description', bot.description || '');
    setValue('prompt_template', bot.prompt_template || '');
    setValue('schedule', bot.schedule);
    setValue('is_active', bot.is_active);
    setIsEditDialogOpen(true);
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Bots Management</h1>
          <p className="text-muted-foreground">
            Create and manage automated bots for your application
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Bot
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Bots</CardTitle>
          <CardDescription>
            Manage your system's automated bots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-md animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : bots.length === 0 ? (
            <div className="text-center py-8">
              <Robot className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No Bots Created</h3>
              <p className="text-muted-foreground">
                Create your first bot to automate tasks
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create Bot
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bot</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={bot.avatar_url} alt={bot.name} />
                          <AvatarFallback>
                            {bot.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{bot.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {bot.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {bot.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        {bot.schedule}
                      </div>
                    </TableCell>
                    <TableCell>
                      {bot.last_run ? (
                        formatDistanceToNow(new Date(bot.last_run), { addSuffix: true })
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bot.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400'
                      }`}>
                        {bot.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleManualRun(bot)}
                          title="Run Manually"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleToggleActive(bot)}
                          title={bot.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Power className={`h-4 w-4 ${bot.is_active ? 'text-green-500' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(bot)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(bot)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Bot</DialogTitle>
            <DialogDescription>
              Create an automated bot to perform tasks on a schedule
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitCreate)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bot Name</Label>
                  <Input 
                    id="name" 
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Content Moderator"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Bot Type</Label>
                  <Select 
                    onValueChange={(value) => setValue('type', value)}
                    defaultValue="content-moderator"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content-moderator">Content Moderator</SelectItem>
                      <SelectItem value="trending-analyzer">Trending Analyzer</SelectItem>
                      <SelectItem value="notification-sender">Notification Sender</SelectItem>
                      <SelectItem value="data-aggregator">Data Aggregator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  {...register('description')}
                  placeholder="Describe what this bot does..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt_template">Prompt Template (if applicable)</Label>
                <Textarea 
                  id="prompt_template" 
                  {...register('prompt_template')}
                  placeholder="AI prompt template for this bot..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Select 
                    onValueChange={(value) => setValue('schedule', value)}
                    defaultValue="hourly"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutely">Every Minute</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="is_active">Active Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="is_active" 
                      onCheckedChange={(checked) => setValue('is_active', checked)}
                      defaultChecked
                    />
                    <Label htmlFor="is_active">
                      Set as active immediately
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Bot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Bot</DialogTitle>
            <DialogDescription>
              Update the settings for this bot
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)}>
            {/* Form fields identical to create form */}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Bot Name</Label>
                  <Input 
                    id="edit-name" 
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Content Moderator"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Bot Type</Label>
                  <Select 
                    onValueChange={(value) => setValue('type', value)}
                    defaultValue={selectedBot?.type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content-moderator">Content Moderator</SelectItem>
                      <SelectItem value="trending-analyzer">Trending Analyzer</SelectItem>
                      <SelectItem value="notification-sender">Notification Sender</SelectItem>
                      <SelectItem value="data-aggregator">Data Aggregator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  {...register('description')}
                  placeholder="Describe what this bot does..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prompt_template">Prompt Template (if applicable)</Label>
                <Textarea 
                  id="edit-prompt_template" 
                  {...register('prompt_template')}
                  placeholder="AI prompt template for this bot..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-schedule">Schedule</Label>
                  <Select 
                    onValueChange={(value) => setValue('schedule', value)}
                    defaultValue={selectedBot?.schedule}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutely">Every Minute</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-is_active">Active Status</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="edit-is_active" 
                      onCheckedChange={(checked) => setValue('is_active', checked)}
                      defaultChecked={selectedBot?.is_active}
                    />
                    <Label htmlFor="edit-is_active">
                      Bot is active
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Bot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BotManagement;
