
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Menu, Search, MessageSquare, LogOut, User, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out',
    });
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-14 items-center">
        {/* Mobile Menu Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2 md:hidden" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">NexaSnap</span>
        </Link>
        
        {/* Search Bar */}
        <div className="hidden flex-1 items-center justify-center px-4 md:flex">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8"
            />
          </div>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Messages</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.username || 'User'} />
                      <AvatarFallback>
                        {user.user_metadata?.username?.substring(0, 2)?.toUpperCase() || user.email?.substring(0, 2)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.username || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
