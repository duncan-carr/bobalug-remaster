import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";

// 3 months in milliseconds
const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000;

// Check if user can apply (no pending app, and if rejected, 3 months have passed)
export const canUserApply = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { canApply: false, reason: "Not authenticated" };

    // Get all applications for this user
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (applications.length === 0) {
      return { canApply: true, reason: null };
    }

    // Check for any pending or reviewing applications
    const pendingApp = applications.find(
      (app) => app.status === "pending" || app.status === "reviewing"
    );
    if (pendingApp) {
      return {
        canApply: false,
        reason: "You have an application currently under review.",
        application: pendingApp,
      };
    }

    // Check for accepted applications - once accepted, can't reapply
    const acceptedApp = applications.find((app) => app.status === "accepted");
    if (acceptedApp) {
      return {
        canApply: false,
        reason: "You are already a member!",
        application: acceptedApp,
      };
    }

    // Check for rejected applications - must wait 3 months
    const rejectedApps = applications.filter((app) => app.status === "rejected");
    if (rejectedApps.length > 0) {
      const mostRecentRejection = rejectedApps[0]; // Already sorted desc
      const rejectionDate = mostRecentRejection.reviewedAt ?? mostRecentRejection.submittedAt;
      const timeSinceRejection = Date.now() - rejectionDate;

      if (timeSinceRejection < THREE_MONTHS_MS) {
        const waitDays = Math.ceil((THREE_MONTHS_MS - timeSinceRejection) / (24 * 60 * 60 * 1000));
        return {
          canApply: false,
          reason: `You must wait ${waitDays} more days before reapplying.`,
          application: mostRecentRejection,
          canReapplyAt: rejectionDate + THREE_MONTHS_MS,
        };
      }
    }

    return { canApply: true, reason: null };
  },
});

// Get the user's current/most relevant application (for showing status)
export const getMyApplication = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    // Get all applications sorted by date (newest first)
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (applications.length === 0) return null;

    // Return the most recent pending/reviewing app, or accepted, or most recent rejected
    const pendingApp = applications.find(
      (app) => app.status === "pending" || app.status === "reviewing"
    );
    if (pendingApp) return pendingApp;

    const acceptedApp = applications.find((app) => app.status === "accepted");
    if (acceptedApp) return acceptedApp;

    // Return most recent (which could be rejected)
    return applications[0];
  },
});

// Get ALL of the user's past applications (for history/review)
export const getMyApplicationHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Get pending (draft) application
export const getPendingApplication = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const pending = await ctx.db
      .query("pendingApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return pending;
  },
});

// Save pending application (auto-save as user fills out form)
export const savePendingApplication = mutation({
  args: {
    // Section 1: About You
    birthMonth: v.optional(v.string()),
    birthDay: v.optional(v.string()),
    birthYear: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    state: v.optional(v.string()),
    stateCode: v.optional(v.string()),
    appliedBefore: v.optional(v.boolean()),
    previousApplications: v.optional(v.number()),

    // Section 2: Social Media
    instagramUsername: v.optional(v.string()),
    flickrUsername: v.optional(v.string()),
    youtubeChannel: v.optional(v.string()),
    youtubeExperience: v.optional(v.string()),
    otherSocialMedia: v.optional(v.string()),

    // Section 3: Building Experience
    yearsBuilding: v.optional(v.string()),
    selfRating: v.optional(v.number()),
    mocsPerMonth: v.optional(v.number()),
    mocSize: v.optional(v.string()),

    // Section 4: Your Work
    mocImageIds: v.optional(v.array(v.id("_storage"))),
    activityLevel: v.optional(v.number()),

    // Section 5: Deep Dive Questions
    aboutYourself: v.optional(v.string()),
    communityThrive: v.optional(v.string()),
    collaborationExample: v.optional(v.string()),
    handleDisagreements: v.optional(v.string()),
    buildStrengths: v.optional(v.string()),
    challengeOvercome: v.optional(v.string()),
    favoriteTheme: v.optional(v.string()),
    conventions: v.optional(v.string()),

    // Section 6: Motivation & Goals
    communityMotivation: v.optional(v.string()),
    legoAmbitions: v.optional(v.string()),
    improvementArea: v.optional(v.string()),
    whyJoin: v.optional(v.string()),
    questionsForUs: v.optional(v.string()),

    // Track current step
    currentStep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user has a pending/reviewing submitted application
    const existingSubmitted = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const hasActiveApplication = existingSubmitted.some(
      (app) => app.status === "pending" || app.status === "reviewing"
    );

    if (hasActiveApplication) {
      throw new Error("You already have an application under review");
    }

    // Check for existing pending (draft) application
    const existing = await ctx.db
      .query("pendingApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        ...args,
        lastUpdatedAt: Date.now(),
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("pendingApplications", {
        userId,
        lastUpdatedAt: Date.now(),
        ...args,
      });
    }
  },
});

// Delete pending application (after submission)
export const deletePendingApplication = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const pending = await ctx.db
      .query("pendingApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (pending) {
      await ctx.db.delete(pending._id);
    }
  },
});

// Submit a new application
export const submitApplication = mutation({
  args: {
    // Section 1: About You
    age: v.number(),
    location: v.string(),
    appliedBefore: v.boolean(),
    previousApplications: v.number(),

    // Section 2: Social Media
    instagramUsername: v.string(),
    flickrUsername: v.string(),
    youtubeChannel: v.string(),
    youtubeExperience: v.string(),
    otherSocialMedia: v.string(),

    // Section 3: Building Experience
    yearsBuilding: v.string(),
    selfRating: v.number(),
    mocsPerMonth: v.number(),
    mocSize: v.string(),

    // Section 4: Your Work
    mocImageIds: v.array(v.id("_storage")),
    activityLevel: v.number(),

    // Section 5: Deep Dive Questions
    aboutYourself: v.string(),
    communityThrive: v.string(),
    collaborationExample: v.string(),
    handleDisagreements: v.string(),
    buildStrengths: v.string(),
    challengeOvercome: v.string(),
    favoriteTheme: v.string(),
    conventions: v.string(),

    // Section 6: Motivation & Goals
    communityMotivation: v.string(),
    legoAmbitions: v.string(),
    improvementArea: v.string(),
    whyJoin: v.string(),
    questionsForUs: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all existing applications
    const existingApplications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Check for pending/reviewing applications
    const hasActiveApplication = existingApplications.some(
      (app) => app.status === "pending" || app.status === "reviewing"
    );
    if (hasActiveApplication) {
      throw new Error("You already have an application under review");
    }

    // Check for accepted applications
    const isAccepted = existingApplications.some((app) => app.status === "accepted");
    if (isAccepted) {
      throw new Error("You are already a member!");
    }

    // Check for recent rejected applications (3 month cooldown)
    const rejectedApps = existingApplications
      .filter((app) => app.status === "rejected")
      .sort((a, b) => b.submittedAt - a.submittedAt);

    if (rejectedApps.length > 0) {
      const mostRecent = rejectedApps[0];
      const rejectionDate = mostRecent.reviewedAt ?? mostRecent.submittedAt;
      const timeSinceRejection = Date.now() - rejectionDate;

      if (timeSinceRejection < THREE_MONTHS_MS) {
        const waitDays = Math.ceil((THREE_MONTHS_MS - timeSinceRejection) / (24 * 60 * 60 * 1000));
        throw new Error(`You must wait ${waitDays} more days before reapplying`);
      }
    }

    // Create the application
    const applicationId = await ctx.db.insert("applications", {
      userId,
      submittedAt: Date.now(),
      status: "pending",
      age: args.age,
      location: args.location,
      appliedBefore: args.appliedBefore || existingApplications.length > 0,
      previousApplications: args.previousApplications || existingApplications.length,
      instagramUsername: args.instagramUsername || undefined,
      flickrUsername: args.flickrUsername || undefined,
      youtubeChannel: args.youtubeChannel || undefined,
      youtubeExperience: args.youtubeExperience || undefined,
      otherSocialMedia: args.otherSocialMedia || undefined,
      yearsBuilding: args.yearsBuilding,
      selfRating: args.selfRating,
      mocsPerMonth: args.mocsPerMonth,
      mocSize: args.mocSize,
      mocImageIds: args.mocImageIds,
      activityLevel: args.activityLevel,
      aboutYourself: args.aboutYourself,
      communityThrive: args.communityThrive,
      collaborationExample: args.collaborationExample,
      handleDisagreements: args.handleDisagreements,
      buildStrengths: args.buildStrengths,
      challengeOvercome: args.challengeOvercome,
      favoriteTheme: args.favoriteTheme,
      conventions: args.conventions || undefined,
      communityMotivation: args.communityMotivation,
      legoAmbitions: args.legoAmbitions,
      improvementArea: args.improvementArea,
      whyJoin: args.whyJoin,
      questionsForUs: args.questionsForUs || undefined,
    });

    // Delete the pending (draft) application after successful submission
    const pending = await ctx.db
      .query("pendingApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (pending) {
      await ctx.db.delete(pending._id);
    }

    return applicationId;
  },
});

// Get all applications (admin only - for future use)
export const getAllApplications = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    // In production, you'd check if the user is an admin here

    if (args.status) {
      return await ctx.db
        .query("applications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db.query("applications").order("desc").collect();
  },
});

// Update application status (admin only)
export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.string(),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // In production, check if user is admin

    // Get the application to access its image IDs
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");

    // Update the application status
    await ctx.db.patch(args.applicationId, {
      status: args.status,
      reviewedAt: Date.now(),
      reviewedBy: userId,
      reviewNotes: args.reviewNotes,
    });

    // Delete uploaded images when application is reviewed (accepted or rejected)
    // This helps keep storage costs down
    if (args.status === "accepted" || args.status === "rejected") {
      if (application.mocImageIds && application.mocImageIds.length > 0) {
        await Promise.all(
          application.mocImageIds.map((id) => ctx.storage.delete(id))
        );
      }
    }

    return args.applicationId;
  },
});
