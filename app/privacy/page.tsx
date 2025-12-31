"use client";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-16">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-muted-foreground">
              Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none py-8">
              <h2 className="text-xl font-semibold mt-0">Introduction</h2>
              <p className="text-muted-foreground">
                BobaLUG (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting 
                your personal data. This privacy policy explains how we collect, use, and safeguard your 
                information when you use our website and services.
              </p>

              <Separator className="my-6" />

              <h2 className="text-xl font-semibold">Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information that you provide directly to us and information collected automatically 
                through your use of our services:
              </p>
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <strong className="text-foreground">Discord Account Information:</strong> When you sign in with Discord, 
                  we receive your Discord user ID, username, email address, and avatar. We also access your 
                  Discord guild membership and roles within the BobaLUG Discord server.
                </li>
                <li>
                  <strong className="text-foreground">Profile Information:</strong> Any additional information you choose 
                  to add to your profile, such as a display name, bio, or website.
                </li>
                <li>
                  <strong className="text-foreground">Application Data:</strong> If you apply for membership, we collect 
                  information you provide in your application, including contact details, location, and 
                  uploaded images of your LEGO creations.
                </li>
                <li>
                  <strong className="text-foreground">Contact Messages:</strong> If you contact us through our website, 
                  we store your message and contact information.
                </li>
              </ul>

              <Separator className="my-6" />

              <h2 className="text-xl font-semibold">How We Use Your Information</h2>
              <p className="text-muted-foreground">We use the information we collect to:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process membership applications</li>
                <li>Display member profiles on our public members page</li>
                <li>Communicate with you about your account and our services</li>
                <li>Sync your Discord roles to determine access levels on our website</li>
                <li>Respond to your inquiries and support requests</li>
              </ul>

              <Separator className="my-6" />

              <h2 className="text-xl font-semibold">Data Storage and Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely using Convex, a backend-as-a-service platform. We implement 
                appropriate technical and organizational measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p className="text-muted-foreground">
                Images uploaded during the application process are stored temporarily and are deleted 
                once your application has been reviewed.
              </p>

              <Separator className="my-6" />

              <h2 className="text-xl font-semibold">Third-Party Services</h2>
              <p className="text-muted-foreground">We integrate with the following third-party services:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>
                  <strong className="text-foreground">Discord:</strong> For authentication and role synchronization. 
                  Your use of Discord is governed by Discord&apos;s privacy policy.
                </li>
                <li>
                  <strong className="text-foreground">Convex:</strong> For data storage and backend services.
                </li>
                <li>
                  <strong className="text-foreground">Behold.so:</strong> For displaying our Instagram feed.
                </li>
              </ul>

              <Separator className="my-6" />

              <h2 className="text-xl font-semibold">Your Rights</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="text-muted-foreground space-y-2">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your account and associated data</li>
                <li>Control your profile visibility settings</li>
              </ul>
              <p className="text-muted-foreground">
                You can delete your account at any time through the Settings page. This will permanently 
                remove your profile and associated data from our systems.
              </p>

              <Separator className="my-6" />

              <h2 className="text-xl font-semibold">Public Information</h2>
              <p className="text-muted-foreground">
                If you are a member of BobaLUG (with the Member or Charter Member Discord role), your 
                profile may be visible on our public members page. You can control your profile visibility 
                through your account settings.
              </p>

              <Separator className="my-6" />

              <h2 className="text-xl font-semibold">Children&apos;s Privacy</h2>
              <p className="text-muted-foreground">
                Our services are not directed to children under 13 years of age. We do not knowingly 
                collect personal information from children under 13. If you believe we have collected 
                information from a child under 13, please contact us.
              </p>

              <Separator className="my-6" />

              <h2 className="text-xl font-semibold">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify you of any changes 
                by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              </p>

              <Separator className="my-6" />

              <h2 className="text-xl font-semibold">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this privacy policy or our data practices, please 
                contact us through our{" "}
                <a href="/contact" className="text-primary hover:underline">
                  contact page
                </a>{" "}
                or reach out to us on{" "}
                <a 
                  href="https://discord.gg/rAKjsXCfjW" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Discord
                </a>.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}

