import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Teachers from "@/pages/Teachers";
import Courses from "@/pages/Courses";
import Batches from "@/pages/Batches";
import Exams from "@/pages/Exams";
import Attendance from "@/pages/Attendance";
import Fees from "@/pages/Fees";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Layout title="Dashboard" subtitle="Welcome back! Here's what's happening at your institute.">
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/dashboard">
        <Layout title="Dashboard" subtitle="Welcome back! Here's what's happening at your institute.">
          <Dashboard />
        </Layout>
      </Route>
      <Route path="/students">
        <Layout title="Students" subtitle="Manage all the students in your institute.">
          <Students />
        </Layout>
      </Route>
      <Route path="/teachers">
        <Layout title="Teachers" subtitle="Manage all the teachers in your institute.">
          <Teachers />
        </Layout>
      </Route>
      <Route path="/courses">
        <Layout title="Courses" subtitle="Manage all the courses in your institute.">
          <Courses />
        </Layout>
      </Route>
      <Route path="/batches">
        <Layout title="Batches" subtitle="Manage all the batches in your institute.">
          <Batches />
        </Layout>
      </Route>
      <Route path="/exams">
        <Layout title="Exams" subtitle="Manage all the exams in your institute.">
          <Exams />
        </Layout>
      </Route>
      <Route path="/attendance">
        <Layout title="Attendance" subtitle="Manage all the attendance in your institute.">
          <Attendance />
        </Layout>
      </Route>
      <Route path="/fees">
        <Layout title="Fees" subtitle="Manage all the fees in your institute.">
          <Fees />
        </Layout>
      </Route>
      <Route path="/messages">
        <Layout title="Messages" subtitle="Manage all the messages in your institute.">
          <Messages />
        </Layout>
      </Route>
      <Route>
        <Layout title="404" subtitle="Page not found.">
          <NotFound />
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
