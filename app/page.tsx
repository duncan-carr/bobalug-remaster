"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Instagram,
  Users,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { DiscordIcon } from "@/components/ui/discord-icon";

// Types for Behold.so Instagram feed
interface InstagramPost {
  id: string;
  permalink: string;
  mediaUrl: string;
  caption: string;
  prunedCaption: string;
  timestamp: string;
  sizes: {
    medium: { mediaUrl: string; height: number; width: number };
  };
}

const sponsors = [
  {
    name: "FigFabLabs",
    logo: "/figfablabs-logo.png",
    description: "Custom machine printed figures with UV digital printing and child-safe inks.",
    discountCode: "Bobalug",
    discountPercent: "5%",
    url: "https://fig-fablabs.com",
  },
  {
    name: "VenomCBW",
    logo: "/venomcbw-logo.png",
    description: "Custom LEGO minifigures and minifigure accessories. Let your creativity go wild!",
    discountCode: "BOBALUG",
    discountPercent: "5%",
    url: "https://venomcbw.com",
  },
  {
    name: "FireStarToys",
    logo: "/firestartoys-logo.png",
    description: "Creative, collectible and rare LEGO and custom minifigures.",
    discountCode: "FSBOBALUG",
    discountPercent: "10%",
    url: "https://www.firestartoys.com",
  },
];

export default function Home() {
  // Fetch data from Convex
  const homeStats = useQuery(api.home.getHomeStats);
  const featuredMembers = useQuery(api.home.getFeaturedMembers);
  
  // Instagram feed state
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[] | null>(null);
  const [instagramLoading, setInstagramLoading] = useState(true);
  
  // Fetch Instagram feed from Behold.so
  useEffect(() => {
    async function fetchInstagramFeed() {
      try {
        const response = await fetch("https://feeds.behold.so/DAQuc4zCCTFnpMFc2c9k");
        if (!response.ok) {
          console.warn("Instagram feed unavailable:", response.status);
          setInstagramPosts([]);
          return;
        }
        const data = await response.json();
        setInstagramPosts(data.posts?.slice(0, 4) ?? []);
      } catch (error) {
        console.error("Failed to fetch Instagram feed:", error);
        setInstagramPosts([]);
      } finally {
        setInstagramLoading(false);
      }
    }
    fetchInstagramFeed();
  }, []);
  

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
            <div
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-6">
                Est. 2019
              </Badge>
              <h1 className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
                Where Creativity
                <span className="text-primary"> Clicks </span>
                Together
              </h1>
              <p className="mb-10 text-lg text-muted-foreground md:text-xl">
                BobaLUG is a passionate community of LEGO enthusiasts dedicated to
                building, sharing, and celebrating the art of brick creation.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a href="https://discord.gg/rAKjsXCfjW" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2">
                    <DiscordIcon />
                    Join the Discord
                  </Button>
                </a>
                <a href="https://www.instagram.com/bobalug/" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Instagram className="h-4 w-4" />
                    Follow on Instagram
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="border-y border-border/40 bg-muted/30">
          <div className="mx-auto max-w-4xl px-6 py-12">
            <div className="flex justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-semibold tracking-tight">
                  {homeStats?.memberCount?.toLocaleString() ?? "—"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Active Members
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instagram Feed Section */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                From Our Instagram
              </h2>
              <p className="mt-2 text-muted-foreground">
                Latest creations from our talented community members
              </p>
            </div>
            <a
              href="https://www.instagram.com/bobalug/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1 text-sm text-primary hover:underline md:flex"
            >
              <Instagram className="h-4 w-4" />
              Follow @bobalug
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {instagramLoading ? (
              // Loading state
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden p-0">
                  <Skeleton className="aspect-square rounded-none" />
                </Card>
              ))
            ) : instagramPosts?.length === 0 ? (
              // Empty state
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <Instagram className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p>Follow us on Instagram to see our latest builds!</p>
              </div>
            ) : (
              // Data loaded
              instagramPosts?.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="overflow-hidden p-0 transition-all hover:ring-2 hover:ring-primary/20">
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={post.sizes?.medium?.mediaUrl ?? post.mediaUrl}
                        alt={post.prunedCaption?.slice(0, 100) ?? "Instagram post"}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <Instagram className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </Card>
                </a>
              ))
            )}
          </div>

          <div className="mt-8 text-center md:hidden">
            <a
              href="https://www.instagram.com/bobalug/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Instagram className="h-4 w-4" />
              Follow @bobalug
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </section>

        <Separator className="mx-auto max-w-6xl" />

        {/* Members Section */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Meet Our Leadership
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              The dedicated team keeping our community thriving
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8">
            {featuredMembers === undefined ? (
              // Loading state
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="text-center">
                    <Skeleton className="mx-auto h-5 w-24" />
                    <Skeleton className="mx-auto mt-1 h-4 w-20" />
                  </div>
                </div>
              ))
            ) : featuredMembers.length === 0 ? (
              // Empty state - show placeholder message
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-3 h-10 w-10 opacity-50" />
                <p>Leadership team coming soon!</p>
              </div>
            ) : (
              // Data loaded
              featuredMembers.map((member) => (
                <div key={member.id} className="flex flex-col items-center gap-3">
                  <Avatar className="h-20 w-20 ring-2 ring-border">
                    <AvatarImage src={member.image ?? ""} alt={member.name} />
                    <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {member.role}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-12 text-center">
            <Link href="/members">
              <Button variant="outline" className="gap-2">
                View All Members
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <Separator className="mx-auto max-w-6xl" />

        {/* Sponsors Section */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Check Out Our Sponsors!
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Thank you to the organizations that support our community
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sponsors.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="h-full transition-all hover:ring-2 hover:ring-primary/20">
                  <CardContent className="flex h-full flex-col px-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted/50 p-2">
                        <img
                          src={sponsor.logo}
                          alt={`${sponsor.name} logo`}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                            {sponsor.name}
                          </h3>
                          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {sponsor.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        {sponsor.discountPercent} Off
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Code: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{sponsor.discountCode}</code>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Interested in sponsoring BobaLUG?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Get in touch
              </Link>
            </p>
          </div>
        </section>

        {/* Call to Action */}
        <section className="border-t border-border/40 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Ready to Build Together?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join our growing community of LEGO enthusiasts. Share your builds,
                attend events, and connect with fellow builders.
              </p>
              <div className="mt-8">
                <a href="https://discord.gg/rAKjsXCfjW" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2">
                    <DiscordIcon />
                    Join the Discord
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
