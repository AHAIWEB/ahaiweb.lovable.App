import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import PostsList from "./pages/admin/PostsList";
import QuickPost from "./pages/admin/QuickPost";
import UrlPost from "./pages/admin/UrlPost";
import EditorPost from "./pages/admin/EditorPost";
import MediaManager from "./pages/admin/MediaManager";
import TagManager from "./pages/admin/TagManager";
import ProfileEdit from "./pages/admin/ProfileEdit";
import CategoryManager from "./pages/admin/CategoryManager";
import RssFeedManager from "./pages/admin/RssFeedManager";
import SiteCustomizer from "./pages/admin/SiteCustomizer";
import ScraperHub from "./pages/admin/ScraperHub";
import PostDetail from "./pages/PostDetail";
import CardMaker from "./pages/CardMaker";
import PhotoCardMaker from "./pages/PhotoCardMaker";
import Dictionary from "./pages/Dictionary";
import Library from "./pages/Library";
import EbookReader from "./pages/EbookReader";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="posts" element={<PostsList />} />
              <Route path="quick-post" element={<QuickPost />} />
              <Route path="url-post" element={<UrlPost />} />
              <Route path="editor-post" element={<EditorPost />} />
              <Route path="media" element={<MediaManager />} />
              <Route path="tags" element={<TagManager />} />
              <Route path="profile" element={<ProfileEdit />} />
              <Route path="categories" element={<CategoryManager />} />
              <Route path="rss-feeds" element={<RssFeedManager />} />
              <Route path="site-customizer" element={<SiteCustomizer />} />
              <Route path="scrapers" element={<ScraperHub />} />
            </Route>
            <Route path="/post/:slug" element={<PostDetail />} />
            <Route path="/card-maker" element={<CardMaker />} />
            <Route path="/photo-card-maker" element={<PhotoCardMaker />} />
            <Route path="/dictionary" element={<Dictionary />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/:id" element={<EbookReader />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
