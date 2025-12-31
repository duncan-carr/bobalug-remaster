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
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

// Instagram icon component
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

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
                      {profile.location && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">{profile.location}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {(profile.instagram || profile.website) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Links</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {profile.instagram && (
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
                        {profile.website && (
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
                      {profile.location && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">{profile.location}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {(profile.instagram || profile.website) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Links</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {profile.instagram && (
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
                        {profile.website && (
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
