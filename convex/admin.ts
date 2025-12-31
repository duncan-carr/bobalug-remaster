import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { isWebAdmin, isApplicationJudge } from "./permissions";

// ==================== APPLICATIONS ====================

export const getApplications = query({
  args: {
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Permission check: must be web admin or application judge
    const webAdmin = await isWebAdmin(ctx, userId);
    const judge = await isApplicationJudge(ctx, userId);
    if (!webAdmin && !judge) throw new Error("Not authorized");

    const page = args.page ?? 1;
    const pageSize = args.pageSize ?? 10;

    let allApplications;
    if (args.status) {
      allApplications = await ctx.db
        .query("applications")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      allApplications = await ctx.db
        .query("applications")
        .order("desc")
        .collect();
    }

    const totalCount = allApplications.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Slice for pagination
    const start = (page - 1) * pageSize;
    const applications = allApplications.slice(start, start + pageSize);

    // Get user info for each application
    const applicationsWithUsers = await Promise.all(
      applications.map(async (app) => {
        const user = await ctx.db.get(app.userId);
        return {
          ...app,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? "Unknown",
          userImage: user?.image,
        };
      })
    );

    return {
      items: applicationsWithUsers,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },
});

export const getApplication = query({
  args: { id: v.id("applications") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Permission check: must be web admin or application judge
    const webAdmin = await isWebAdmin(ctx, userId);
    const judge = await isApplicationJudge(ctx, userId);
    if (!webAdmin && !judge) throw new Error("Not authorized");
    
    const application = await ctx.db.get(args.id);
    if (!application) return null;

    const user = await ctx.db.get(application.userId);
    return {
      ...application,
      userName: user?.name ?? "Unknown",
      userEmail: user?.email ?? "Unknown",
      userImage: user?.image,
    };
  },
});

export const updateApplicationStatus = mutation({
  args: {
    id: v.id("applications"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    // Permission check: must be web admin or application judge
    const webAdmin = await isWebAdmin(ctx, authUserId);
    const judge = await isApplicationJudge(ctx, authUserId);
    if (!webAdmin && !judge) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { status: args.status });
    return { success: true };
  },
});

// ==================== CONTACT MESSAGES ====================

export const getContactMessages = query({
  args: {
    status: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    // Permission check: web admin only
    const webAdmin = await isWebAdmin(ctx, authUserId);
    if (!webAdmin) throw new Error("Not authorized");

    const page = args.page ?? 1;
    const pageSize = args.pageSize ?? 10;

    let allMessages;
    if (args.status) {
      allMessages = await ctx.db
        .query("contactSubmissions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      allMessages = await ctx.db
        .query("contactSubmissions")
        .order("desc")
        .collect();
    }

    const totalCount = allMessages.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Slice for pagination
    const start = (page - 1) * pageSize;
    const messages = allMessages.slice(start, start + pageSize);

    return {
      items: messages,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },
});

export const updateContactStatus = mutation({
  args: {
    id: v.id("contactSubmissions"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    // Permission check: web admin only
    const webAdmin = await isWebAdmin(ctx, authUserId);
    if (!webAdmin) throw new Error("Not authorized");

    await ctx.db.patch(args.id, { status: args.status });
    return { success: true };
  },
});

// ==================== EVENTS ====================

export const getEvents = query({
  args: {
    includeUnpublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    let events;
    if (args.includeUnpublished) {
      events = await ctx.db.query("events").order("desc").collect();
    } else {
      events = await ctx.db
        .query("events")
        .withIndex("by_published", (q) => q.eq("isPublished", true))
        .order("desc")
        .collect();
    }

    return events;
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    date: v.number(),
    endDate: v.optional(v.number()),
    location: v.string(),
    locationUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    category: v.string(),
    capacity: v.optional(v.number()),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    const eventId = await ctx.db.insert("events", {
      ...args,
      attendees: [],
      createdBy: authUserId,
      createdAt: Date.now(),
    });

    return eventId;
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    endDate: v.optional(v.number()),
    location: v.optional(v.string()),
    locationUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    capacity: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return { success: true };
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ==================== ABOUT CONTENT ====================

export const getAboutContent = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    const content = await ctx.db.query("aboutContent").collect();
    return content.sort((a, b) => a.order - b.order);
  },
});

export const upsertAboutSection = mutation({
  args: {
    id: v.optional(v.id("aboutContent")),
    sectionId: v.string(),
    title: v.string(),
    content: v.string(),
    order: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    if (args.id) {
      // Update existing
      await ctx.db.patch(args.id, {
        sectionId: args.sectionId,
        title: args.title,
        content: args.content,
        order: args.order,
        isVisible: args.isVisible,
        updatedAt: Date.now(),
        updatedBy: authUserId,
      });
      return args.id;
    } else {
      // Create new
      const newId = await ctx.db.insert("aboutContent", {
        sectionId: args.sectionId,
        title: args.title,
        content: args.content,
        order: args.order,
        isVisible: args.isVisible,
        updatedAt: Date.now(),
        updatedBy: authUserId,
      });
      return newId;
    }
  },
});

export const deleteAboutSection = mutation({
  args: { id: v.id("aboutContent") },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ==================== DASHBOARD STATS ====================

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    // Permission check: web admin only
    const webAdmin = await isWebAdmin(ctx, authUserId);
    if (!webAdmin) throw new Error("Not authorized");

    const [
      pendingApplications,
      totalApplications,
      pendingMessages,
      totalMessages,
      upcomingEvents,
      totalMembers,
    ] = await Promise.all([
      ctx.db
        .query("applications")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect()
        .then((r) => r.length),
      ctx.db.query("applications").collect().then((r) => r.length),
      ctx.db
        .query("contactSubmissions")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect()
        .then((r) => r.length),
      ctx.db.query("contactSubmissions").collect().then((r) => r.length),
      ctx.db
        .query("events")
        .withIndex("by_date")
        .filter((q) => q.gte(q.field("date"), Date.now()))
        .collect()
        .then((r) => r.length),
      ctx.db.query("users").collect().then((r) => r.length),
    ]);

    return {
      pendingApplications,
      totalApplications,
      pendingMessages,
      totalMessages,
      upcomingEvents,
      totalMembers,
    };
  },
});

// ==================== USERS (for admin reference) ====================

export const getUsers = query({
  args: {
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authUserId = await auth.getUserId(ctx);
    if (!authUserId) throw new Error("Not authenticated");

    // Permission check: web admin only
    const webAdmin = await isWebAdmin(ctx, authUserId);
    if (!webAdmin) throw new Error("Not authorized");

    const page = args.page ?? 1;
    const pageSize = args.pageSize ?? 15;

    const allUsers = await ctx.db.query("users").order("desc").collect();

    const totalCount = allUsers.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Slice for pagination
    const start = (page - 1) * pageSize;
    const users = allUsers.slice(start, start + pageSize);

    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();
        return {
          ...user,
          profile,
        };
      })
    );

    return {
      items: usersWithProfiles,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },
});

