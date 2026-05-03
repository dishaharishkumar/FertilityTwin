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
import CycleStoryPage from "@/pages/cycle-story";
import StatsPage from "@/pages/stats";
import BbtPage from "@/pages/bbt";
import PatternsPage from "@/pages/patterns";
import LearnPage from "@/pages/learn";
import RitualsPage from "@/pages/rituals";
import PartnerPage from "@/pages/partner";
import CycleArtPage from "@/pages/cycle-art";
import BodyMapPage from "@/pages/body-map";
import ReportCardPage from "@/pages/report-card";

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
        <Route path="/cycle/story" component={CycleStoryPage} />
        <Route path="/stats" component={StatsPage} />
        <Route path="/bbt" component={BbtPage} />
        <Route path="/patterns" component={PatternsPage} />
        <Route path="/learn" component={LearnPage} />
        <Route path="/rituals" component={RitualsPage} />
        <Route path="/partner" component={PartnerPage} />
        <Route path="/cycle-art" component={CycleArtPage} />
        <Route path="/body-map" component={BodyMapPage} />
        <Route path="/report-card" component={ReportCardPage} />
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
