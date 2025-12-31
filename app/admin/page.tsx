"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pagination } from "@/components/ui/pagination";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { toast } from "sonner";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  ChevronRight,
  Check,
  X,
  Clock,
  Eye,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Calendar,
  ShieldX,
} from "lucide-react";

type AdminSection = "dashboard" | "applications" | "messages" | "users";

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [rolesSynced, setRolesSynced] = useState(false);

  // Sync Discord roles when admin page loads
  const syncRoles = useAction(api.discord.syncMyDiscordRoles);
  
  useEffect(() => {
    if (!rolesSynced) {
      syncRoles()
        .then(() => setRolesSynced(true))
        .catch((err) => {
          console.error("Failed to sync Discord roles:", err);
          setRolesSynced(true); // Continue anyway
        });
    }
  }, [syncRoles, rolesSynced]);

  // Get permissions (will update after role sync)
  const permissions = useQuery(api.permissions.getMyAdminPermissions);

  // Get section from URL, default based on permissions
  const urlSection = searchParams.get("section") as AdminSection | null;
  
  // Determine valid default section based on permissions
  const getDefaultSection = (): AdminSection => {
    if (!permissions) return "applications"; // Loading state
    if (permissions.canViewDashboard) return "dashboard";
    if (permissions.canViewApplications) return "applications";
    return "applications";
  };
  
  const activeSection = urlSection || getDefaultSection();
  
  // Get selected application ID from URL (for direct links to applications)
  const selectedAppId = searchParams.get("app") as Id<"applications"> | null;

  // Helper to update URL params
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
  }, [searchParams, pathname, router]);

  const setActiveSection = (section: AdminSection) => {
    // Clear app selection when changing sections
    updateParams({ section: section === getDefaultSection() ? null : section, app: null });
  };

  const setSelectedApp = (appId: Id<"applications"> | null) => {
    updateParams({ app: appId });
  };

  // If still loading permissions or syncing roles
  if (permissions === undefined || !rolesSynced) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">
            {!rolesSynced ? "Syncing permissions..." : "Loading..."}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If user doesn't have admin access
  if (!permissions.canAccessAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <section className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-md text-center">
              <ShieldX className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                Access Denied
              </h1>
              <p className="mt-2 text-muted-foreground">
                You don&apos;t have permission to access the admin panel.
              </p>
              <Link href="/">
                <Button className="mt-6">Go to Home</Button>
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <Unauthenticated>
          <section className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-md text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Admin Access Required
              </h1>
              <p className="mt-2 text-muted-foreground">
                You need to be signed in to access the admin panel.
              </p>
              <Link href="/">
                <Button className="mt-6">Go to Home</Button>
              </Link>
            </div>
          </section>
        </Unauthenticated>

        <Authenticated>
          {/* Page Header */}
          <section className="border-b border-border/40 bg-muted/20">
            <div className="mx-auto max-w-7xl px-6 py-8">
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Site
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight">
                Admin Panel
              </h1>
              <p className="mt-1 text-muted-foreground">
                Manage applications, content, and community resources
              </p>
            </div>
          </section>

          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
              {/* Sidebar Navigation */}
              <nav className="space-y-1">
                {permissions.canViewDashboard && (
                  <NavButton
                    icon={LayoutDashboard}
                    label="Dashboard"
                    active={activeSection === "dashboard"}
                    onClick={() => setActiveSection("dashboard")}
                  />
                )}
                {permissions.canViewApplications && (
                  <NavButton
                    icon={FileText}
                    label="Applications"
                    active={activeSection === "applications"}
                    onClick={() => setActiveSection("applications")}
                  />
                )}
                {permissions.canViewMessages && (
                  <NavButton
                    icon={MessageSquare}
                    label="Messages"
                    active={activeSection === "messages"}
                    onClick={() => setActiveSection("messages")}
                  />
                )}
                {permissions.canViewUsers && (
                  <NavButton
                    icon={Users}
                    label="Users"
                    active={activeSection === "users"}
                    onClick={() => setActiveSection("users")}
                  />
                )}
              </nav>

              {/* Main Content */}
              <div className="min-w-0">
                {activeSection === "dashboard" && permissions.canViewDashboard && <DashboardSection />}
                {activeSection === "applications" && permissions.canViewApplications && (
                  <ApplicationsSection 
                    selectedAppId={selectedAppId}
                    onSelectApp={setSelectedApp}
                  />
                )}
                {activeSection === "messages" && permissions.canViewMessages && <MessagesSection />}
                {activeSection === "users" && permissions.canViewUsers && <UsersSection />}
              </div>
            </div>
          </div>
        </Authenticated>
      </main>

      <Footer />
    </div>
  );
}

// Navigation Button Component
function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {badge !== undefined && badge > 0 && (
        <Badge variant={active ? "secondary" : "default"} className="text-xs">
          {badge}
        </Badge>
      )}
    </button>
  );
}

// ==================== DASHBOARD SECTION ====================
function DashboardSection() {
  const stats = useQuery(api.admin.getDashboardStats);

  if (!stats) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard Overview</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Pending Applications"
          value={stats.pendingApplications}
          total={stats.totalApplications}
          icon={FileText}
          color="text-amber-500"
        />
        <StatCard
          title="Unread Messages"
          value={stats.pendingMessages}
          total={stats.totalMessages}
          icon={MessageSquare}
          color="text-blue-500"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-semibold">{stats.totalMembers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                <p className="text-2xl font-semibold">
                  {stats.totalApplications > 0
                    ? `${Math.round(((stats.totalApplications - stats.pendingApplications) / stats.totalApplications) * 100)}%`
                    : "N/A"}
                </p>
              </div>
              <Check className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  total,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  total?: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-semibold">
              {value}
              {total !== undefined && (
                <span className="text-lg text-muted-foreground">/{total}</span>
              )}
            </p>
          </div>
          <div className={`rounded-lg bg-muted p-2 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== APPLICATIONS SECTION ====================
function ApplicationsSection({
  selectedAppId,
  onSelectApp,
}: {
  selectedAppId: Id<"applications"> | null;
  onSelectApp: (id: Id<"applications"> | null) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Reset to page 1 when filter changes
  const handleFilterChange = (status: string | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };
  
  const applicationsData = useQuery(api.admin.getApplications, { 
    status: statusFilter,
    page,
    pageSize,
  });
  const selectedApplication = useQuery(
    api.admin.getApplication,
    selectedAppId ? { id: selectedAppId } : "skip"
  );
  const updateStatus = useMutation(api.admin.updateApplicationStatus);

  const handleStatusUpdate = async (id: Id<"applications">, status: string) => {
    try {
      await updateStatus({ id, status });
      toast.success(`Application ${status}`);
    } catch {
      toast.error("Failed to update application");
    }
  };

  // Copy link to clipboard
  const copyApplicationLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  if (selectedApplication && selectedAppId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectApp(null)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Applications
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={copyApplicationLink}
            className="gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            Copy Link
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedApplication.userName}</CardTitle>
                <CardDescription>{selectedApplication.userEmail}</CardDescription>
              </div>
              <Badge
                variant={
                  selectedApplication.status === "accepted"
                    ? "default"
                    : selectedApplication.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
              >
                {selectedApplication.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium mb-2">Basic Information</h4>
              <div className="grid gap-2 text-sm">
                <p><span className="text-muted-foreground">Age:</span> {selectedApplication.age}</p>
                <p><span className="text-muted-foreground">Location:</span> {selectedApplication.location}</p>
                <p><span className="text-muted-foreground">Years Building:</span> {selectedApplication.yearsBuilding}</p>
                <p><span className="text-muted-foreground">Self Rating:</span> {selectedApplication.selfRating}/10</p>
              </div>
            </div>

            <Separator />

            {/* MOC Images */}
            {selectedApplication.mocImageIds && selectedApplication.mocImageIds.length > 0 && (
              <>
                <div>
                  <h4 className="font-medium mb-2">MOC Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedApplication.mocImageIds.map((storageId, i) => {
                      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
                      const convexSiteUrl = convexUrl.replace(".cloud", ".site");
                      const imageUrl = `${convexSiteUrl}/getImage?storageId=${storageId}`;
                      return (
                        <a
                          key={storageId}
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square overflow-hidden rounded-lg border border-border hover:ring-2 hover:ring-primary/50 transition-all"
                        >
                          <img
                            src={imageUrl}
                            alt={`MOC ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Written Responses */}
            <div className="space-y-4">
              <h4 className="font-medium">Written Responses</h4>
              <ResponseField label="About Yourself" value={selectedApplication.aboutYourself} />
              <ResponseField label="Why Join BobaLUG?" value={selectedApplication.whyJoin} />
              <ResponseField label="Community Motivation" value={selectedApplication.communityMotivation} />
              <ResponseField label="Build Strengths" value={selectedApplication.buildStrengths} />
              <ResponseField label="Favorite Theme" value={selectedApplication.favoriteTheme} />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusUpdate(selectedAppId, "accepted")}
                disabled={selectedApplication.status === "accepted"}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusUpdate(selectedAppId, "rejected")}
                disabled={selectedApplication.status === "rejected"}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate(selectedAppId, "reviewing")}
                disabled={selectedApplication.status === "reviewing"}
              >
                <Clock className="h-4 w-4 mr-2" />
                Mark Reviewing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Applications</h2>
        <div className="flex gap-2">
          {["all", "pending", "reviewing", "accepted", "rejected"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === (status === "all" ? undefined : status) ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange(status === "all" ? undefined : status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {applicationsData?.items.map((app) => (
          <Card
            key={app._id}
            className="cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => onSelectApp(app._id)}
          >
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">{app.userName}</p>
                  <p className="text-sm text-muted-foreground">{app.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant={
                    app.status === "accepted"
                      ? "default"
                      : app.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {app.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(app.submittedAt).toLocaleDateString()}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
        {applicationsData?.items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No applications found
          </p>
        )}
      </div>

      {applicationsData && applicationsData.totalPages > 1 && (
        <Pagination
          currentPage={applicationsData.page}
          totalPages={applicationsData.totalPages}
          totalItems={applicationsData.totalCount}
          pageSize={applicationsData.pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function ResponseField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

// ==================== MESSAGES SECTION ====================
function MessagesSection() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset to page 1 when filter changes
  const handleFilterChange = (status: string | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };

  const messagesData = useQuery(api.admin.getContactMessages, { 
    status: statusFilter,
    page,
    pageSize,
  });
  const updateStatus = useMutation(api.admin.updateContactStatus);

  const handleStatusUpdate = async (id: Id<"contactSubmissions">, status: string) => {
    try {
      await updateStatus({ id, status });
      toast.success(`Message marked as ${status}`);
    } catch {
      toast.error("Failed to update message");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Contact Messages</h2>
        <div className="flex gap-2">
          {["all", "pending", "reviewed", "resolved"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === (status === "all" ? undefined : status) ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange(status === "all" ? undefined : status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {messagesData?.items.map((msg) => (
          <Card key={msg._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">
                    {msg.firstName} {msg.lastName}
                  </CardTitle>
                  <CardDescription>{msg.email}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{msg.subject}</Badge>
                  <Badge
                    variant={
                      msg.status === "resolved"
                        ? "default"
                        : msg.status === "reviewed"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {msg.status || "pending"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.submittedAt).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(msg._id, "reviewed")}
                    disabled={msg.status === "reviewed"}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Mark Reviewed
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(msg._id, "resolved")}
                    disabled={msg.status === "resolved"}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Resolve
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {messagesData?.items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No messages found
          </p>
        )}
      </div>

      {messagesData && messagesData.totalPages > 1 && (
        <Pagination
          currentPage={messagesData.page}
          totalPages={messagesData.totalPages}
          totalItems={messagesData.totalCount}
          pageSize={messagesData.pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

// ==================== USERS SECTION ====================
function UsersSection() {
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const usersData = useQuery(api.admin.getUsers, { page, pageSize });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Users</h2>
        {usersData && (
          <span className="text-sm text-muted-foreground">
            {usersData.totalCount} total users
          </span>
        )}
      </div>

      <div className="space-y-2">
        {usersData?.items.map((user) => (
          <Card key={user._id}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? "User"}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{user.name ?? "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.profile?.badges?.map((badge) => (
                  <Badge key={badge} variant="secondary">
                    {badge}
                  </Badge>
                ))}
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(user._creationTime).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {usersData?.items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No users found
          </p>
        )}
      </div>

      {usersData && usersData.totalPages > 1 && (
        <Pagination
          currentPage={usersData.page}
          totalPages={usersData.totalPages}
          totalItems={usersData.totalCount}
          pageSize={usersData.pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

