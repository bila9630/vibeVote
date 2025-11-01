import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { lazy, Suspense } from "react";

// Lazy load all pages for code splitting
const Homepage = lazy(() => import("./pages/Homepage"));
const Analytics = lazy(() => import("./pages/Analytics"));
const QuestionDetail = lazy(() => import("./pages/QuestionDetail"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Trees = lazy(() => import("./pages/Trees"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/analytics/:id" element={<QuestionDetail />} />
              <Route path="/rewards" element={<Rewards />} />
              <Route path="/trees" element={<Trees />} />
              <Route path="/profile" element={<Profile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
