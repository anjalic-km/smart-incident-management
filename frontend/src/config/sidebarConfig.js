import {
  LayoutDashboard,
  FolderKanban,
  Bug,
  ShieldCheck,
  FileBarChart,
  Users,
  ClipboardList,
  Wrench
} from "lucide-react";

export const SIDEBAR_CONFIG = {
  ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Projects", path: "/admin/projects", icon: FolderKanban },
    // { label: "Issues", path: "/admin/issues", icon: Bug },
    { label: "SLA Monitoring", path: "/admin/sla-monitoring", icon: ShieldCheck },
    { label: "SLA Configuration", path: "/admin/sla-config", icon: Wrench },
    { label: "User Management", path: "/admin/users", icon: Users },
    { label: "Reports", path: "/admin/reports", icon: FileBarChart }
  ],

  MANAGER: [
    { label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
    { label: "Assigned Projects", path: "/manager/projects", icon: FolderKanban },
    { label: "Issues", path: "/manager/issues", icon: Bug },
    { label: "Assign Issues", path: "/manager/assign-issues", icon: ClipboardList },
    { label: "SLA Monitoring", path: "/manager/sla-monitoring", icon: ShieldCheck },
    { label: "Workload", path: "/manager/workload", icon: FileBarChart },
    { label: "Team Users", path: "/manager/team-users", icon: Users },
    { label: "Reports", path: "/manager/reports", icon: FileBarChart }
  ],

  ENGINEER: [
    { label: "Dashboard", path: "/engineer/dashboard", icon: LayoutDashboard },
    { label: "Project Details", path: "/engineer/project", icon: FolderKanban },
    { label: "Assigned Issues", path: "/engineer/issues", icon: Bug },
    { label: "SLA Policies", path: "/engineer/sla-policies", icon: ShieldCheck },
    { label: "My Workload", path: "/engineer/workload", icon: FileBarChart },
    { label: "Issue Status", path: "/engineer/issue-status", icon: ClipboardList },
    { label: "Solved Issues", path: "/engineer/solved-issues", icon: Bug },
    { label: "Reports", path: "/engineer/reports", icon: FileBarChart }
  ],

  USER: [
    { label: "Dashboard", path: "/user/dashboard", icon: LayoutDashboard },
    { label: "Project Details", path: "/user/project", icon: FolderKanban },
    { label: "Create Issue", path: "/user/create-issue", icon: Bug },
    { label: "My Issues", path: "/user/issues", icon: ClipboardList },
    { label: "Reports", path: "/user/reports", icon: FileBarChart }
  ]
};
