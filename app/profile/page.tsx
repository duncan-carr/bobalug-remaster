"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscordRolesList } from "@/components/discord-role-badge";
import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Settings,
  ExternalLink,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

function getInitials(name: string | undefined | null): string {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const [isSyncing, setIsSyncing] = useState(false);

  // Get user data
  const currentUser = useQuery(api.users.getCurrentUser);
  const userStats = useQuery(api.users.getUserStats);
  const getOrCreateProfile = useMutation(api.users.getOrCreateProfile);
  const syncRoles = useAction(api.discord.syncMyDiscordRoles);

  // Ensure profile exists on mount
  useEffect(() => {
    if (currentUser && !currentUser.profile) {
      getOrCreateProfile();
    }
  }, [currentUser, getOrCreateProfile]);

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

  const profile = currentUser?.profile;
  const displayName = profile?.displayName ?? currentUser?.name ?? "User";
  const initials = getInitials(displayName);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <Unauthenticated>
          <section className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-md text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Sign in to view your profile
              </h1>
              <p className="mt-2 text-muted-foreground">
                You need to be signed in to access your profile page.
              </p>
              <Link href="/">
                <Button className="mt-6">Go to Home</Button>
              </Link>
            </div>
          </section>
        </Unauthenticated>

        <Authenticated>
          {currentUser === undefined ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Page Header */}
              <section className="border-b border-border/40 bg-muted/20">
                <div className="mx-auto max-w-6xl px-6 py-12">
                  <Link
                    href="/"
                    className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to Home
                  </Link>
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 ring-4 ring-background">
                        <AvatarImage src={currentUser?.image ?? ""} alt={displayName} />
                        <AvatarFallback className="bg-primary text-xl font-medium text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                          {displayName}
                        </h1>
                        {profile?.username && (
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
                    {/* Bio Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>About</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {profile?.bio || "No bio yet. Add one in Settings!"}
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
                        {profile?.discordRoles && profile.discordRoles.length > 0 ? (
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
                        {profile?.discordRolesSyncedAt && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Last synced:{" "}
                            {new Date(profile.discordRolesSyncedAt).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Member since</p>
                            <p className="font-medium">
                              {userStats?.memberSince
                                ? formatDate(userStats.memberSince)
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Connected Accounts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Connected Accounts</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#5865F2]">
                              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                              </svg>
                            </div>
                            <span className="text-sm font-medium">Discord</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Connected</span>
                        </div>
                        {profile?.website && (
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
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </>
          )}
        </Authenticated>
      </main>

      <Footer />
    </div>
  );
}
