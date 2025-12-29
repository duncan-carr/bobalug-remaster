"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { DiscordIcon } from "@/components/ui/discord-icon";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const submitForm = useMutation(api.contact.submitContactForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      await submitForm(formData);
      setStatus("success");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    }
  };

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
              Contact Us
            </h1>
            <p className="mt-2 text-muted-foreground">
              Have a question or want to get involved? We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        {/* Discord Card */}
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="mx-auto max-w-md">
            <Card className="text-center transition-all hover:ring-2 hover:ring-primary/20">
              <CardContent className="pt-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <DiscordIcon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Join Our Discord</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  The fastest way to connect with our community. Chat with members, 
                  get help with builds, and stay updated on events.
                </p>
                <a
                  href="https://discord.gg/rAKjsXCfjW"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  discord.gg/rAKjsXCfjW
                </a>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact Form */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mx-auto max-w-2xl">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Send Us a Message</CardTitle>
                <CardDescription>
                  Prefer email? Fill out the form below and we&apos;ll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {status === "success" ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Message Sent!</h3>
                    <p className="mt-2 text-muted-foreground">
                      Thank you for reaching out. We&apos;ll get back to you as soon as possible.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-6"
                      onClick={() => setStatus("idle")}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          className="bg-muted/30"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          className="bg-muted/30"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="bg-muted/30"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="How can we help?"
                        className="bg-muted/30"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more about your inquiry..."
                        rows={5}
                        className="resize-none bg-muted/30"
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        required
                      />
                    </div>

                    {status === "error" && errorMessage && (
                      <p className="text-sm text-destructive">{errorMessage}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={status === "submitting"}
                    >
                      {status === "submitting" ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Teaser */}
        <section className="border-t border-border/40 bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-xl font-semibold tracking-tight">
                Looking for Answers?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Check out our About page for frequently asked questions about
                joining and participating in BobaLUG.
              </p>
              <Link href="/about#faq">
                <Button variant="outline" className="mt-6">
                  View FAQ
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
