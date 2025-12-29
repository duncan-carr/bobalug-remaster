import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

// Submit a contact form
export const submitContactForm = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user ID if signed in (optional)
    const userId = await auth.getUserId(ctx);

    // Validate inputs
    if (!args.firstName.trim()) throw new Error("First name is required");
    if (!args.lastName.trim()) throw new Error("Last name is required");
    if (!args.email.trim()) throw new Error("Email is required");
    if (!args.subject.trim()) throw new Error("Subject is required");
    if (!args.message.trim()) throw new Error("Message is required");

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) throw new Error("Invalid email address");

    // Insert submission
    const submissionId = await ctx.db.insert("contactSubmissions", {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      email: args.email.trim().toLowerCase(),
      subject: args.subject.trim(),
      message: args.message.trim(),
      submittedAt: Date.now(),
      userId: userId ?? undefined,
      status: "pending",
    });

    return { success: true, id: submissionId };
  },
});

