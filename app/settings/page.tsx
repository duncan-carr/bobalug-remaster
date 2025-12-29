"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft,
  Palette,
  User,
  LogOut,
  Trash2,
  Check,
  Loader2,
  Save,
} from "lucide-react";

export default function SettingsPage() {
  const { signOut } = useAuthActions();
  const [activeSection, setActiveSection] = useState("account");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: "",
    website: "",
  });

  // Get user data
  const currentUser = useQuery(api.users.getCurrentUser);
  const getOrCreateProfile = useMutation(api.users.getOrCreateProfile);
  const updateProfile = useMutation(api.users.updateProfile);

  // Ensure profile exists on mount
  useEffect(() => {
    if (currentUser && !currentUser.profile) {
      getOrCreateProfile();
    }
  }, [currentUser, getOrCreateProfile]);

  // Update form data when profile loads
  useEffect(() => {
    if (currentUser?.profile) {
      setFormData({
        displayName: currentUser.profile.displayName ?? currentUser.name ?? "",
        username: currentUser.profile.username ?? "",
        bio: currentUser.profile.bio ?? "",
        website: currentUser.profile.website ?? "",
      });
    } else if (currentUser) {
      setFormData({
        displayName: currentUser.name ?? "",
        username: "",
        bio: "",
        website: "",
      });
    }
  }, [currentUser]);

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateProfile(formData);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <Unauthenticated>
          <section className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-md text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Sign in to access settings
              </h1>
              <p className="mt-2 text-muted-foreground">
                You need to be signed in to access your settings.
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
            <div className="mx-auto max-w-6xl px-6 py-12">
              <Link
                href="/"
                className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Settings
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </section>

          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
              {/* Sidebar Navigation */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveSection("account")}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeSection === "account"
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <User className="h-4 w-4" />
                  Account
                </button>
                <button
                  onClick={() => setActiveSection("appearance")}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeSection === "appearance"
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Palette className="h-4 w-4" />
                  Appearance
                </button>
              </nav>

              {/* Main Content */}
              <div className="space-y-6">
                {/* Account Section */}
                {activeSection === "account" && (
                  <>
                    {/* Profile Settings Card */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          <CardTitle>Profile</CardTitle>
                        </div>
                        <CardDescription>
                          Update your public profile information
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {currentUser === undefined ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <form
                            className="space-y-6"
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSave();
                            }}
                          >
                            <div className="grid gap-6 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input
                                  id="displayName"
                                  value={formData.displayName}
                                  onChange={(e) =>
                                    setFormData({ ...formData, displayName: e.target.value })
                                  }
                                  className="bg-muted/30"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                  id="username"
                                  value={formData.username}
                                  onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                  }
                                  placeholder="yourname"
                                  className="bg-muted/30"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="bio">Bio</Label>
                              <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) =>
                                  setFormData({ ...formData, bio: e.target.value })
                                }
                                placeholder="Tell us about yourself..."
                                rows={3}
                                className="resize-none bg-muted/30"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="website">Website</Label>
                              <Input
                                id="website"
                                type="url"
                                value={formData.website}
                                onChange={(e) =>
                                  setFormData({ ...formData, website: e.target.value })
                                }
                                placeholder="https://yourwebsite.com"
                                className="bg-muted/30"
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                type="submit"
                                className="gap-2"
                                disabled={saveStatus === "saving"}
                              >
                                {saveStatus === "saving" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4" />
                                )}
                                {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                              </Button>
                              {saveStatus === "saved" && (
                                <span className="text-sm text-green-600">Changes saved!</span>
                              )}
                              {saveStatus === "error" && (
                                <span className="text-sm text-destructive">Failed to save</span>
                              )}
                            </div>
                          </form>
                        )}
                      </CardContent>
                    </Card>

                    {/* Connected Accounts Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Connected Accounts</CardTitle>
                        <CardDescription>
                          Manage your connected services and sign-in methods
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={currentUser?.email ?? ""}
                            className="max-w-md bg-muted/30"
                            disabled
                          />
                          <p className="text-xs text-muted-foreground">
                            This email is linked to your Discord account and cannot be changed here
                          </p>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5865F2]">
                              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                              </svg>
                            </div>
                            <div>
                              <p className="font-medium">Discord</p>
                              <p className="text-sm text-muted-foreground">
                                {currentUser?.name ?? "Connected"}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="gap-1.5">
                            <Check className="h-3 w-3" />
                            Connected
                          </Badge>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                          <div>
                            <h4 className="text-sm font-medium">Sign Out</h4>
                            <p className="text-sm text-muted-foreground">
                              Sign out of your account on this device
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => void signOut()}
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Danger Zone Card */}
                    <Card className="border-destructive/20">
                      <CardHeader>
                        <CardTitle className="text-destructive">Danger Zone</CardTitle>
                        <CardDescription>
                          Irreversible and destructive actions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                              <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-destructive">Delete Account</h4>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Permanently delete your account and all associated data. This action cannot be undone.
                              </p>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="mt-4"
                              >
                                Delete Account
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Appearance Section */}
                {activeSection === "appearance" && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        <CardTitle>Appearance</CardTitle>
                      </div>
                      <CardDescription>
                        Customize how BobaLUG looks for you
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Label>Theme</Label>
                        {mounted ? (
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              onClick={() => setTheme("light")}
                              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                                theme === "light"
                                  ? "border-primary"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="h-8 w-8 rounded-full bg-white ring-1 ring-border" />
                              <span className={`text-sm ${theme === "light" ? "font-medium" : ""}`}>
                                Light
                              </span>
                            </button>
                            <button
                              onClick={() => setTheme("dark")}
                              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                                theme === "dark"
                                  ? "border-primary"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="h-8 w-8 rounded-full bg-zinc-900 ring-1 ring-border" />
                              <span className={`text-sm ${theme === "dark" ? "font-medium" : ""}`}>
                                Dark
                              </span>
                            </button>
                            <button
                              onClick={() => setTheme("system")}
                              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                                theme === "system"
                                  ? "border-primary"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="flex h-8 w-8 overflow-hidden rounded-full ring-1 ring-border">
                                <div className="h-full w-1/2 bg-white" />
                                <div className="h-full w-1/2 bg-zinc-900" />
                              </div>
                              <span className={`text-sm ${theme === "system" ? "font-medium" : ""}`}>
                                System
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </Authenticated>
      </main>

      <Footer />
    </div>
  );
}
