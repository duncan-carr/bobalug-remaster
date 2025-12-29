"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { DiscordRolesList } from "@/components/discord-role-badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Calendar,
  Users,
} from "lucide-react";

// Convert Discord color integer to hex string
function discordColorToHex(color: number): string {
  if (color === 0) return "#99aab5"; // Default Discord grey for no color
  return `#${color.toString(16).padStart(6, "0")}`;
}

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12; // 4 columns x 3 rows

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const membersData = useQuery(api.users.getAllMembers, {
    search: debouncedSearch || undefined,
    page,
    pageSize,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
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
              Our Members
            </h1>
            <p className="mt-2 text-muted-foreground">
              Meet the builders that make up our community
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="border-b border-border/40">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            {membersData && (
              <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                <Users className="h-4 w-4" />
                <span>{membersData.totalCount} members</span>
              </div>
            )}
          </div>
        </section>

        {/* Members Grid */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          {membersData === undefined ? (
            // Loading state
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="flex flex-col items-center pt-6">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="mt-4 h-5 w-32" />
                    <Skeleton className="mt-2 h-4 w-24" />
                    <Skeleton className="mt-4 h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : membersData.items.length === 0 ? (
            // Empty state
            <div className="py-16 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No members found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Be the first to join our community!"}
              </p>
            </div>
          ) : (
            // Members grid
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {membersData.items.map((member) => (
                <Link key={member.id} href={`/member/${member.id}`}>
                  <Card className="group h-full cursor-pointer transition-all hover:ring-2 hover:ring-primary/20">
                    <CardContent className="flex flex-col items-center pt-6 text-center">
                      <Avatar 
                        className="h-20 w-20 ring-2 transition-all group-hover:ring-primary/30"
                        style={{
                          // Use the primary role color for the avatar ring if available
                          borderColor: member.primaryRoleColor 
                            ? discordColorToHex(member.primaryRoleColor)
                            : undefined,
                        }}
                      >
                        <AvatarImage src={member.image ?? ""} alt={member.name} />
                        <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>

                      <h3 
                        className="mt-4 text-lg font-medium"
                        style={{
                          // Use the primary role color for the name if available
                          color: member.primaryRoleColor 
                            ? discordColorToHex(member.primaryRoleColor)
                            : undefined,
                        }}
                      >
                        {member.name}
                      </h3>
                      
                      {/* Show Discord roles if available, otherwise show legacy role */}
                      {member.discordRoles && member.discordRoles.length > 0 ? (
                        <div className="mt-2">
                          <DiscordRolesList
                            roles={member.discordRoles}
                            variant="compact"
                            maxDisplay={2}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      )}

                      <div className="mt-4 flex w-full justify-center border-t border-border/40 pt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {member.joinDate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {membersData && membersData.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={membersData.page}
                totalPages={membersData.totalPages}
                totalItems={membersData.totalCount}
                pageSize={membersData.pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
