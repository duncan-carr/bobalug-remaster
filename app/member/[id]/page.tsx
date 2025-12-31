"use client";

import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscordRolesList } from "@/components/discord-role-badge";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Settings,
  ExternalLink,
  Loader2,
  UserX,
  RefreshCw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Get the user's public profile
  const profile = useQuery(api.users.getPublicProfile, {
    userId: id as Id<"users">,
  });

  const syncRoles = useAction(api.discord.syncMyDiscordRoles);

  const handleSyncRoles = async () => {
    setIsSyncing(true);
    try {
      const result = await syncRoles();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to sync Discord roles");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {profile === undefined ? (
          // Loading state
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : profile === null ? (
          // Profile not found or not visible
          <section className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <UserX className="h-8 w-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Profile Not Found
              </h1>
              <p className="mt-2 text-muted-foreground">
                This user profile doesn&apos;t exist or is set to private.
              </p>
              <Link href="/members">
                <Button className="mt-6">View All Members</Button>
              </Link>
            </div>
          </section>
        ) : profile.isOwnProfile ? (
          // Own profile view
          <>
            {/* Page Header - Own Profile */}
            <section className="border-b border-border/40 bg-muted/20">
              <div className="mx-auto max-w-6xl px-6 py-12">
                <Link
                  href="/members"
                  className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Members
                </Link>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 ring-4 ring-background">
                      <AvatarImage src={profile.image ?? ""} alt={profile.name} />
                      <AvatarFallback className="bg-primary text-xl font-medium text-primary-foreground">
                        {profile.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">
                          {profile.name}
                        </h1>
                        <Badge variant="secondary">You</Badge>
                      </div>
                      {profile.username && (
                        <p className="text-muted-foreground">@{profile.username}</p>
                      )}
                    </div>
                  </div>
                  <Link href="/settings">
                    <Button variant="outline" className="gap-2 self-start">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </section>

            <div className="mx-auto max-w-6xl px-6 py-12">
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="space-y-8 lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {profile.bio || "No bio yet. Add one in Settings!"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Discord Roles Card */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Shield className="h-4 w-4" />
                        Discord Roles
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSyncRoles}
                        disabled={isSyncing}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                        />
                        <span className="sr-only">Sync roles</span>
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {profile.discordRoles && profile.discordRoles.length > 0 ? (
                        <DiscordRolesList
                          roles={profile.discordRoles}
                          variant="compact"
                        />
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          <p>No Discord roles synced yet.</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={handleSyncRoles}
                            disabled={isSyncing}
                            className="mt-1 h-auto p-0"
                          >
                            {isSyncing ? "Syncing..." : "Sync now"}
                          </Button>
                        </div>
                      )}
                      {profile.discordRolesSyncedAt && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Last synced:{" "}
                          {new Date(profile.discordRolesSyncedAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Joined</p>
                          <p className="font-medium">{formatDate(profile.joinedAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {profile.website && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Links</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                              <ExternalLink className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">Website</span>
                          </div>
                          <span className="text-xs text-primary">Visit</span>
                        </a>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // Public profile view
          <>
            {/* Page Header */}
            <section className="border-b border-border/40 bg-muted/20">
              <div className="mx-auto max-w-6xl px-6 py-12">
                <Link
                  href="/members"
                  className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Members
                </Link>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 ring-4 ring-background">
                    <AvatarImage src={profile.image ?? ""} alt={profile.name} />
                    <AvatarFallback className="bg-primary text-xl font-medium text-primary-foreground">
                      {profile.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {profile.name}
                    </h1>
                    {profile.username && (
                      <p className="text-muted-foreground">@{profile.username}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="mx-auto max-w-6xl px-6 py-12">
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="space-y-8 lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {profile.bio || "This member hasn't added a bio yet."}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Discord Roles Card */}
                  {profile.discordRoles && profile.discordRoles.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Shield className="h-4 w-4" />
                          Discord Roles
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DiscordRolesList
                          roles={profile.discordRoles}
                          variant="compact"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Joined</p>
                          <p className="font-medium">{formatDate(profile.joinedAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {profile.website && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Links</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                              <ExternalLink className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium">Website</span>
                          </div>
                          <span className="text-xs text-primary">Visit</span>
                        </a>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
