import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import InvoiceEditor from "@/pages/InvoiceEditor";
import Settings from "@/pages/Settings";
import { Blog } from "./pages/blog";
import ContactPage from "./pages/contact";
import DisclaimerPage from "./pages/disclaimer";
import { PrivacyPolicy } from "./pages/privacy-policy";
import { TermsOfService } from "./pages/terms-of-service";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/blog" component={Blog} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/disclaimer" component={DisclaimerPage} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/estimate/new" component={InvoiceEditor} />
        <Route path="/estimate/:id" component={InvoiceEditor} />
        <Route path="/invoice/new" component={InvoiceEditor} />
        <Route path="/invoice/:id" component={InvoiceEditor} />
        <Route path="/document/:id" component={InvoiceEditor} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
