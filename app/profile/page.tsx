"use client";

import { useEffect, useState, useRef } from "react";
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
  AlertCircle,
  MapPin,
  Info,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DiscordIcon } from "@/components/ui/discord-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Instagram icon component with gradient background
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

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
  const [notInGuild, setNotInGuild] = useState(false);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const hasTriedInitialSync = useRef(false);
  const hasCalledMigration = useRef(false);

  // Get user data
  const currentUser = useQuery(api.users.getCurrentUser);
  const userStats = useQuery(api.users.getUserStats);
  const getOrCreateProfile = useMutation(api.users.getOrCreateProfile);
  const dismissMigrationNotice = useMutation(api.users.dismissInstagramMigrationNotice);
  const syncRoles = useAction(api.discord.syncMyDiscordRoles);

  // Ensure profile exists on mount and run any migrations (only once)
  useEffect(() => {
    if (currentUser && !hasCalledMigration.current) {
      hasCalledMigration.current = true;
      getOrCreateProfile();
    }
  }, [currentUser, getOrCreateProfile]);

  // Show migration dialog if Instagram was migrated from website
  useEffect(() => {
    if (currentUser?.profile?.instagramMigratedFromWebsite) {
      setShowMigrationDialog(true);
    }
  }, [currentUser?.profile?.instagramMigratedFromWebsite]);

  const handleDismissMigration = async () => {
    setShowMigrationDialog(false);
    try {
      await dismissMigrationNotice();
    } catch (error) {
      console.error("Failed to dismiss migration notice:", error);
    }
  };

  // Auto-sync roles on first sign-in
  useEffect(() => {
    if (
      userStats?.needsRoleSync &&
      !hasTriedInitialSync.current &&
      !isSyncing
    ) {
      hasTriedInitialSync.current = true;
      handleSyncRoles(true);
    }
  }, [userStats?.needsRoleSync, isSyncing]);

  const handleSyncRoles = async (isInitialSync = false) => {
    setIsSyncing(true);
    setNotInGuild(false);
    try {
      const result = await syncRoles();
      if (result.success) {
        if (result.inGuild === false) {
          setNotInGuild(true);
          if (!isInitialSync) {
            toast.error("You're not in the BobaLUG Discord server");
          }
        } else {
          if (!isInitialSync) {
            toast.success(result.message);
          }
        }
      } else {
        if (!isInitialSync) {
          toast.error(result.message);
        }
      }
    } catch (error) {
      if (!isInitialSync) {
        toast.error("Failed to sync Discord roles");
      }
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
                          onClick={() => handleSyncRoles(false)}
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
                        {isSyncing && !profile?.discordRoles?.length ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Syncing your Discord roles...</span>
                          </div>
                        ) : notInGuild ? (
                          <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Not in Discord Server</AlertTitle>
                            <AlertDescription className="mt-2 space-y-3">
                              <p className="text-sm">
                                Join the BobaLUG Discord server to sync your roles and become a member.
                              </p>
                              <div className="flex flex-col gap-2">
                                <a
                                  href="https://discord.gg/rAKjsXCfjW"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button size="sm" className="w-full gap-2">
                                    <DiscordIcon className="h-4 w-4" />
                                    Join Discord
                                  </Button>
                                </a>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSyncRoles(false)}
                                  disabled={isSyncing}
                                  className="w-full gap-2"
                                >
                                  <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                                  Try Again
                                </Button>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ) : profile?.discordRoles && profile.discordRoles.length > 0 ? (
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
                              onClick={() => handleSyncRoles(false)}
                              disabled={isSyncing}
                              className="mt-1 h-auto p-0"
                            >
                              {isSyncing ? "Syncing..." : "Sync now"}
                            </Button>
                          </div>
                        )}
                        {profile?.discordRolesSyncedAt && !notInGuild && (
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
                            <p className="text-sm text-muted-foreground">Joined</p>
                            <p className="font-medium">
                              {userStats?.joinedAt
                                ? formatDate(userStats.joinedAt)
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
                        {profile?.instagram && (
                          <a
                            href={`https://instagram.com/${profile.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#bc1888]">
                                <InstagramIcon className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">Instagram</span>
                                <span className="text-xs text-muted-foreground">@{profile.instagram}</span>
                              </div>
                            </div>
                            <span className="text-xs text-primary">Visit</span>
                          </a>
                        )}
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

                    {/* Location */}
                    {profile?.location && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="h-4 w-4" />
                            Location
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{profile.location}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </Authenticated>
      </main>

      <Footer />

      {/* Instagram Migration Notice Dialog */}
      <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Profile Updated
            </DialogTitle>
            <DialogDescription className="pt-2 text-left">
              We noticed your website link was an Instagram profile, so we automatically moved it to the new Instagram field for better display.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">
                Your Instagram username <strong className="text-foreground">@{profile?.instagram}</strong> is now displayed properly as a connected account on your profile.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleDismissMigration}>
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
