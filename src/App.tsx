
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { HelmetProvider } from "react-helmet-async";
import RouteGuard from "@/components/RouteGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import UserProfile from "./pages/UserProfile";
import SquadPage from "./pages/SquadPage";
import PostPage from "./pages/PostPage";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import Premium from "./pages/Premium";
import BotManagement from "./pages/BotManagement";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import Popular from "./pages/Popular";
import Explore from "./pages/Explore";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <AuthProvider>
          <HelmetProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Core pages */}
                <Route path="/u/:username" element={<UserProfile />} />
                <Route path="/r/:squadName" element={<SquadPage />} />
                <Route path="/post/:postId" element={<PostPage />} />
                <Route path="/premium" element={<Premium />} />
                
                {/* New routes */}
                <Route path="/popular" element={<Popular />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/trending" element={<Popular />} />
                <Route path="/following" element={<Index />} />
                <Route path="/latest" element={<Index />} />
                
                {/* Protected routes */}
                <Route 
                  path="/profile" 
                  element={
                    <RouteGuard>
                      <Profile />
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <RouteGuard>
                      <Settings />
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <RouteGuard>
                      <AdminDashboard />
                    </RouteGuard>
                  } 
                />
                <Route 
                  path="/bot-management" 
                  element={
                    <RouteGuard>
                      <BotManagement />
                    </RouteGuard>
                  } 
                />
                
                {/* Payment success/cancel routes */}
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-canceled" element={<PaymentCanceled />} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </HelmetProvider>
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
