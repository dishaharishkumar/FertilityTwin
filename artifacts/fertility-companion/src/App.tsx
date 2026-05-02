import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import DailyLogPage from "@/pages/log";
import CycleTracker from "@/pages/cycle";
import Insights from "@/pages/insights";
import GenerateInsight from "@/pages/generate-insight";
import ChatPage from "@/pages/chat";
import JournalPage from "@/pages/journal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/log" component={DailyLogPage} />
        <Route path="/cycle" component={CycleTracker} />
        <Route path="/insights" component={Insights} />
        <Route path="/insights/generate" component={GenerateInsight} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/journal" component={JournalPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
