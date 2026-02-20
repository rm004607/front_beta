import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { UserProvider } from "@/contexts/UserContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Services from "./pages/Services";
import PostService from "./pages/PostService";
import Wall from "./pages/Wall";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Support from "./pages/Support";
import FlowCallback from "./pages/FlowCallback";
import NotFound from "./pages/NotFound";
<<<<<<< HEAD
import { LocationProvider } from "@/contexts/LocationContext";
import ScrollToTop from "@/components/ScrollToTop";
import "./i18n";
=======
>>>>>>> parent of 68faae9 (a)

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          <BrowserRouter>
            <ScrollToTop />
            <UserProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/registro" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/servicios" element={<Services />} />
                    <Route path="/servicios/publicar" element={<PostService />} />
                    <Route path="/muro" element={<Wall />} />
                    <Route path="/perfil" element={<Profile />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/ayuda" element={<Support />} />
                    <Route path="/flow/callback" element={<FlowCallback />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </TooltipProvider>
            </UserProvider>
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
