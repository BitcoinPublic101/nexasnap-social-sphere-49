
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '@/components/ui/NavBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, Users, FileText, Flag, Ban, ShieldAlert, LineChart, 
  Search, Filter, ChevronDown, MoreHorizontal, CheckCircle, XCircle, 
  Edit, Trash, Eye, UserX, BarChart3, TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalSquads: 0,
    totalComments: 0,
    activeUsers: 0,
    reportedContent: 0
  });
  
  // Tabs data
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [squads, setSquads] = useState<any[]>([]);
  
  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [postFilter, setPostFilter] = useState('');
  const [reportFilter, setReportFilter] = useState('all');

  // Chart data
  const userGrowthData = [
    { date: 'Jan', users: 120 },
    { date: 'Feb', users: 180 },
    { date: 'Mar', users: 250 },
    { date: 'Apr', users: 310 },
    { date: 'May', users: 420 },
    { date: 'Jun', users: 520 },
    { date: 'Jul', users: 680 },
  ];
  
  const contentDistributionData = [
    { name: 'Posts', value: 45 },
    { name: 'Comments', value: 55 },
  ];
  
  const engagementData = [
    { squad: 'technology', posts: 85, comments: 320 },
    { squad: 'science', posts: 65, comments: 240 },
    { squad: 'gaming', posts: 120, comments: 540 },
    { squad: 'movies', posts: 50, comments: 190 },
    { squad: 'music', posts: 40, comments: 150 },
  ];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      
      setIsLoading(true);
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
            description: 'You do not have permission to access the admin dashboard',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }
        
        setIsAdmin(true);
        
        // Fetch dashboard stats
        const [
          { count: usersCount }, 
          { count: postsCount }, 
          { count: squadsCount }, 
          { count: commentsCount },
          { count: reportsCount }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('posts').select('*', { count: 'exact', head: true }),
          supabase.from('squads').select('*', { count: 'exact', head: true }),
          supabase.from('comments').select('*', { count: 'exact', head: true }),
          supabase.from('content_reports').select('*', { count: 'exact', head: true })
        ]);
        
        setStats({
          totalUsers: usersCount || 0,
          totalPosts: postsCount || 0,
          totalSquads: squadsCount || 0,
          totalComments: commentsCount || 0,
          activeUsers: Math.floor((usersCount || 0) * 0.7), // Just an example
          reportedContent: reportsCount || 0
        });
        
        // Fetch users
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        setUsers(usersData || []);
        
        // Fetch posts
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            *,
            profiles:author_id(username, avatar_url),
            squads:squad_id(name)
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        
        setPosts(postsData || []);
        
        // Fetch reports
        const { data: reportsData } = await supabase
          .from('content_reports')
          .select(`
            *,
            profiles:reporter_id(username, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(10);
        
        setReports(reportsData || []);
        
        // Fetch squads
        const { data: squadsData } = await supabase
          .from('squads')
          .select('*')
          .order('member_count', { ascending: false })
          .limit(10);
        
        setSquads(squadsData || []);
      } catch (error: any) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load admin dashboard',
          variant: 'destructive',
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdmin();
  }, [user, navigate, toast]);
  
  const handleDeletePost = async (postId: number) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_hidden: true })
        .eq('id', postId);
      
      if (error) throw error;
      
      // Update local state
      setPosts(posts.filter(post => post.id !== postId));
      
      toast({
        title: 'Post hidden',
        description: 'The post has been hidden from public view',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to hide post',
        variant: 'destructive',
      });
    }
  };
  
  const handleBanUser = async (userId: string) => {
    try {
      // In a real implementation, you would add the user to the bans table
      // and update the profile to mark them as inactive
      
      toast({
        title: 'User banned',
        description: 'The user has been banned from the platform',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to ban user',
        variant: 'destructive',
      });
    }
  };
  
  const handleReportAction = async (reportId: number, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      
      const { error } = await supabase
        .from('content_reports')
        .update({ status })
        .eq('id', reportId);
      
      if (error) throw error;
      
      // Update local state
      setReports(reports.map(report => 
        report.id === reportId ? { ...report, status } : report
      ));
      
      toast({
        title: `Report ${status}`,
        description: `The report has been ${status}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update report',
        variant: 'destructive',
      });
    }
  };
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(userFilter.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(userFilter.toLowerCase()))
  );
  
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(postFilter.toLowerCase()) ||
    post.content.toLowerCase().includes(postFilter.toLowerCase())
  );
  
  const filteredReports = reportFilter === 'all' 
    ? reports 
    : reports.filter(report => report.status === reportFilter);
  
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        </div>
        
        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <h3 className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</h3>
                  <p className="text-xs text-green-500 mt-1">+12% from last month</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Content</p>
                  <h3 className="text-2xl font-bold">{(stats.totalPosts + stats.totalComments).toLocaleString()}</h3>
                  <p className="text-xs text-green-500 mt-1">+8% from last month</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reported Content</p>
                  <h3 className="text-2xl font-bold">{stats.reportedContent.toLocaleString()}</h3>
                  <p className="text-xs text-amber-500 mt-1">+3% from last month</p>
                </div>
                <div className="bg-primary/10 p-3 rounded-full">
                  <Flag className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>
                Key metrics from the last 7 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium mb-3">User Growth</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        width={500}
                        height={300}
                        data={userGrowthData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#88888830" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary) / 0.2)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Engagement by Squad</h4>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        width={500}
                        height={300}
                        data={engagementData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#88888830" />
                        <XAxis dataKey="squad" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="posts" fill="#8884d8" name="Posts" />
                        <Bar dataKey="comments" fill="#82ca9d" name="Comments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h4 className="text-sm font-medium mb-3">Content Distribution</h4>
                <div className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart width={400} height={300}>
                      <Pie
                        data={contentDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {contentDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Management Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="squads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Squads</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users Management</CardTitle>
                <CardDescription>
                  Manage users, roles, and permissions.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" className="sm:w-[140px] flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>
                                  {user.username?.substring(0, 2)?.toUpperCase() || "??"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.username}</p>
                                <p className="text-sm text-muted-foreground">
                                  {user.full_name || 'No name set'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.is_admin ? (
                              <Badge variant="default">Admin</Badge>
                            ) : user.is_moderator ? (
                              <Badge variant="outline">Moderator</Badge>
                            ) : (
                              <Badge variant="secondary">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 hover:bg-green-500/10">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 hover:bg-red-500/10">
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/u/${user.username}`)}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  <span>Edit User</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                                  onClick={() => handleBanUser(user.id)}
                                >
                                  <UserX className="h-4 w-4" />
                                  <span>Ban User</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>
                  Manage posts, comments, and other content.
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search content..."
                      className="pl-8"
                      value={postFilter}
                      onChange={(e) => setPostFilter(e.target.value)}
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="sm:w-[140px]">
                      <SelectValue placeholder="Content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All content</SelectItem>
                      <SelectItem value="posts">Posts only</SelectItem>
                      <SelectItem value="comments">Comments only</SelectItem>
                      <SelectItem value="flagged">Flagged content</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Squad</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No content found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPosts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium line-clamp-1">{post.title}</p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {post.content}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={post.profiles?.avatar_url} />
                                <AvatarFallback>
                                  {post.profiles?.username?.substring(0, 2)?.toUpperCase() || "??"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{post.profiles?.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            r/{post.squads?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {new Date(post.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/post/${post.id}`)}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Post</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  <span>Edit Post</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span>Delete Post</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Content Reports</CardTitle>
                <CardDescription>
                  Review and manage reported content.
                </CardDescription>
                <div className="flex justify-end mt-4">
                  <Select 
                    value={reportFilter} 
                    onValueChange={setReportFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All reports</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Content Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No reports found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={report.profiles?.avatar_url} />
                                <AvatarFallback>
                                  {report.profiles?.username?.substring(0, 2)?.toUpperCase() || "??"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{report.profiles?.username}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {report.content_type.charAt(0).toUpperCase() + report.content_type.slice(1)}
                          </TableCell>
                          <TableCell>
                            <p className="line-clamp-1">{report.reason}</p>
                          </TableCell>
                          <TableCell>
                            {report.status === 'pending' && (
                              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/10">
                                Pending
                              </Badge>
                            )}
                            {report.status === 'approved' && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 hover:bg-green-500/10">
                                Approved
                              </Badge>
                            )}
                            {report.status === 'rejected' && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 hover:bg-red-500/10">
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(report.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleReportAction(report.id, 'approve')}
                                disabled={report.status !== 'pending'}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleReportAction(report.id, 'reject')}
                                disabled={report.status !== 'pending'}
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="squads">
            <Card>
              <CardHeader>
                <CardTitle>Squads Management</CardTitle>
                <CardDescription>
                  Manage communities and their settings.
                </CardDescription>
                <div className="flex justify-end mt-4">
                  <Button>Create Squad</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Squad</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Posts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {squads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No squads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      squads.map((squad) => (
                        <TableRow key={squad.id}>
                          <TableCell>
                            <div className="font-medium">r/{squad.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {squad.description || 'No description'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {squad.member_count.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {squad.post_count.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {squad.is_active ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 hover:bg-green-500/10">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 hover:bg-red-500/10">
                                Inactive
                              </Badge>
                            )}
                            {squad.is_verified && (
                              <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-600 hover:bg-blue-500/10">
                                Verified
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(squad.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => navigate(`/r/${squad.name}`)}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Squad</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  <span>Edit Squad</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <ShieldAlert className="h-4 w-4" />
                                  <span>Manage Moderators</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive">
                                  <Ban className="h-4 w-4" />
                                  <span>{squad.is_active ? 'Deactivate' : 'Activate'} Squad</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
