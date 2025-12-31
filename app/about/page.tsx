"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Users,
  Sparkles,
  Award,
} from "lucide-react";
import { DiscordIcon } from "@/components/ui/discord-icon";

// Sample data - in production this would come from Convex
const values = [
  {
    icon: Heart,
    title: "Passion",
    description: "We share a deep love for LEGO and the creativity it inspires in builders of all ages.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We foster an inclusive, welcoming environment where every builder belongs.",
  },
  {
    icon: Sparkles,
    title: "Creativity",
    description: "We celebrate unique visions and encourage experimentation with bricks.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "We strive to create impressive displays and share building knowledge.",
  },
];

const milestones = [
  { year: "2019", event: "BobaLUG founded with 12 charter members" },
  { year: "2020", event: "Launched online building challenges during the pandemic" },
  { year: "2023", event: "Attended Brickworld Chicago for the first time with 5 members" },
  { year: "2024", event: "Displayed our largest collab: Sylvoria at Brickworld Chicago" },
  { year: "2025", event: "60+ members and growing stronger every year" },
];

const faqs = [
  {
    question: "How do I join BobaLUG?",
    answer: "Fill out the application form on the Apply page. We review applications every two weeks. If denied, you will be required to wait 90 days before reapplying.",
  },
  {
    question: "What age groups are welcome?",
    answer: "We welcome builders of all ages to participate in our Discord as long as they are in compliance with Discord's Terms of Service (13+ years of age). To become a member, you must be at least 16 years old.",
  },
];

export default function AboutPage() {
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
              About BobaLUG
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Learn about our community, our values, and our journey
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Our Mission
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Building Connections, One Brick at a Time
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              BobaLUG is a LEGO Users Group bringing together enthusiasts of all 
              ages and skill levels. We share our passion for building, collaborate 
              on amazing creations, and inspire each other to push the boundaries 
              of what&apos;s possible with plastic bricks.
            </p>
          </div>
        </section>

        <Separator className="mx-auto max-w-6xl" />

        {/* Values Section */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Our Values
            </h2>
            <p className="mt-2 text-muted-foreground">
              The principles that guide our community
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <Card key={value.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold">{value.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="mx-auto max-w-6xl" />

        {/* Timeline Section */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Our Journey
            </h2>
            <p className="mt-2 text-muted-foreground">
              Key moments in BobaLUG history
            </p>
          </div>
          <div className="mx-auto max-w-2xl">
            <div className="relative border-l-2 border-border pl-8">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`relative pb-8 ${index === milestones.length - 1 ? "pb-0" : ""}`}
                >
                  <div className="absolute -left-[25px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-primary">
                      {milestone.year}
                    </span>
                    <span className="text-muted-foreground">
                      {milestone.event}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Separator className="mx-auto max-w-6xl" />

        {/* FAQ Section */}
        <section className="mx-auto max-w-6xl px-6 py-16" id="faq">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-muted-foreground">
              Common questions about joining and participating
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-6">
            {faqs.map((faq) => (
              <Card key={faq.question}>
                <CardContent className="px-5">
                  <h3 className="font-semibold">{faq.question}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Join CTA */}
        <section className="border-t border-border/40 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight">
                Ready to Join?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Become part of our growing community of LEGO enthusiasts.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a href="https://discord.gg/rAKjsXCfjW" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="gap-2">
                    <DiscordIcon />
                    Join the Discord
                  </Button>
                </a>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="gap-2">
                    Contact Us
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
