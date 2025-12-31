"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LogOut,
  User,
  Settings,
  Shield,
} from "lucide-react";

const baseNavLinks = [
  { href: "/about", label: "About" },
  { href: "/members", label: "Members" },
];

const instagramLink = "https://www.instagram.com/bobalug/";

function useNavLinks() {
  const membershipStatus = useQuery(api.permissions.getAmIMember);
  
  // Show Apply link only if user is not a member (or not authenticated)
  const showApply = !membershipStatus?.isMember;
  
  return showApply 
    ? [...baseNavLinks, { href: "/apply", label: "Apply" }]
    : baseNavLinks;
}

function getInitials(name: string | undefined | null): string {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function HeaderAvatar() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const displayName = currentUser?.profile?.displayName ?? currentUser?.name ?? "User";
  const initials = getInitials(displayName);
  const avatarUrl = currentUser?.image ?? "";

  return (
    <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-primary/20">
      <AvatarImage src={avatarUrl} alt={displayName} />
      <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

function MobileHeaderUser() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const displayName = currentUser?.profile?.displayName ?? currentUser?.name ?? "User";
  const initials = getInitials(displayName);
  const avatarUrl = currentUser?.image ?? "";

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-xs text-muted-foreground">via Discord</p>
      </div>
    </div>
  );
}

function AdminPanelLink() {
  const permissions = useQuery(api.permissions.getMyAdminPermissions);
  
  if (!permissions?.canAccessAdmin) return null;
  
  return (
    <DropdownMenuItem>
      <Link href="/admin" className="flex w-full items-center gap-2">
        <Shield className="h-4 w-4" />
        Admin Panel
      </Link>
    </DropdownMenuItem>
  );
}

function MobileAdminPanelLink({ onNavigate }: { onNavigate: () => void }) {
  const permissions = useQuery(api.permissions.getMyAdminPermissions);
  
  if (!permissions?.canAccessAdmin) return null;
  
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm transition-colors hover:bg-muted"
    >
      <Shield className="h-4 w-4" />
      Admin Panel
    </Link>
  );
}

export function Header() {
  const { signIn, signOut } = useAuthActions();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const navLinks = useNavLinks();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary">
            <img
              src="/bobalug-logo.png"
              alt="BobaLUG"
              className="h-7 w-7 object-contain"
            />
          </div>
          <span className="text-xl font-semibold tracking-tight">BobaLUG</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors hover:text-foreground ${
                pathname === link.href
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth & Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Auth States */}
          <AuthLoading>
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          </AuthLoading>

          <Unauthenticated>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void signIn("discord")}
              className="hidden sm:flex"
            >
              Sign In
            </Button>
            <button
              onClick={() => void signIn("discord")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
            >
              <User className="h-4 w-4" />
            </button>
          </Unauthenticated>

          <Authenticated>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button className="rounded-full ring-offset-background transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                }
              >
                <HeaderAvatar />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Link href="/profile" className="flex w-full items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings" className="flex w-full items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <AdminPanelLink />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => void signOut()}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Authenticated>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-primary">
                    <img
                      src="/bobalug-logo.png"
                      alt="BobaLUG"
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                  BobaLUG
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1 px-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSheetOpen(false)}
                    className={`rounded-lg px-4 py-3 text-sm transition-colors hover:bg-muted ${
                      pathname === link.href
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto border-t border-border p-6">
                <Unauthenticated>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSheetOpen(false);
                      void signIn("discord");
                    }}
                  >
                    Sign In with Discord
                  </Button>
                </Unauthenticated>
                <Authenticated>
                  <MobileHeaderUser />
                  <div className="mt-4 flex flex-col gap-2">
                    <MobileAdminPanelLink onNavigate={() => setSheetOpen(false)} />
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        setSheetOpen(false);
                        void signOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </Authenticated>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
