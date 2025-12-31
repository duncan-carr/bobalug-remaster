import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Helper function to detect if a URL is an Instagram URL and extract the username
function extractInstagramUsername(url: string | undefined): string | null {
  if (!url) return null;
  
  // Match instagram.com/username or instagr.am/username patterns
  const instagramPattern = /^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9._]+)\/?(?:\?.*)?$/i;
  const match = url.match(instagramPattern);
  
  if (match && match[1]) {
    // Filter out known non-username paths
    const nonUserPaths = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct', 'tv'];
    if (!nonUserPaths.includes(match[1].toLowerCase())) {
      return match[1];
    }
  }
  
  return null;
}

// Helper function to check if a website URL is an Instagram URL
export function isInstagramUrl(url: string | undefined): boolean {
  if (!url) return false;
  return /^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com|instagr\.am)\//i.test(url);
}

// Get the current user's profile
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    // Get user from auth tables
    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Get profile if exists
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      id: userId,
      email: user.email,
      name: user.name,
      image: user.image,
      profile: profile ?? null,
    };
  },
});

// Get or create user profile
export const getOrCreateProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Check for existing profile
    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Create profile if it doesn't exist
    if (!profile) {
      const profileId = await ctx.db.insert("profiles", {
        userId,
        displayName: user.name ?? undefined,
        profileVisible: true,
        showOnlineStatus: false,
        notifyEvents: true,
        notifyBuildComments: true,
        notifyMentions: true,
        notifyNewsletter: false,
        badges: [],
      });
      profile = await ctx.db.get(profileId);
    }

    // Migrate Instagram from website if applicable
    if (profile && profile.website && !profile.instagram) {
      const instagramUsername = extractInstagramUsername(profile.website);
      if (instagramUsername) {
        await ctx.db.patch(profile._id, {
          instagram: instagramUsername,
          website: undefined, // Clear the website field
          instagramMigratedFromWebsite: true, // Flag for showing popup
        });
        profile = await ctx.db.get(profile._id);
      }
    }

    return profile;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    instagram: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    // Check username uniqueness if changing
    if (args.username && args.username !== profile.username) {
      const existing = await ctx.db
        .query("profiles")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();
      if (existing) throw new Error("Username already taken");
    }

    await ctx.db.patch(profile._id, {
      displayName: args.displayName ?? profile.displayName,
      username: args.username ?? profile.username,
      bio: args.bio ?? profile.bio,
      website: args.website ?? profile.website,
      instagram: args.instagram ?? profile.instagram,
      location: args.location ?? profile.location,
    });

    return await ctx.db.get(profile._id);
  },
});

// Dismiss the Instagram migration notice
export const dismissInstagramMigrationNotice = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, {
      instagramMigratedFromWebsite: false,
    });

    return await ctx.db.get(profile._id);
  },
});

// Update notification settings
export const updateNotificationSettings = mutation({
  args: {
    notifyEvents: v.optional(v.boolean()),
    notifyBuildComments: v.optional(v.boolean()),
    notifyMentions: v.optional(v.boolean()),
    notifyNewsletter: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, args);
    return await ctx.db.get(profile._id);
  },
});

// Update privacy settings
export const updatePrivacySettings = mutation({
  args: {
    profileVisible: v.optional(v.boolean()),
    showOnlineStatus: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    await ctx.db.patch(profile._id, args);
    return await ctx.db.get(profile._id);
  },
});

// Get user stats
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Get profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return {
      // Prefer Discord guild join date, fall back to account creation time
      joinedAt: profile?.discordGuildJoinedAt ?? user._creationTime,
      badgesCount: profile?.badges?.length ?? 0,
      needsRoleSync: !profile?.discordRolesSyncedAt,
    };
  },
});

// Get a user's public profile by user ID
export const getPublicProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // If profile is not visible, return null (unless viewing own profile)
    const currentUserId = await auth.getUserId(ctx);
    if (profile?.profileVisible === false && currentUserId !== args.userId) {
      return null;
    }

    const displayName = profile?.displayName ?? user.name ?? "Member";
    const initials = displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return {
      id: args.userId,
      name: displayName,
      username: profile?.username ?? null,
      bio: profile?.bio ?? null,
      website: profile?.website ?? null,
      instagram: profile?.instagram ?? null,
      location: profile?.location ?? null,
      role: profile?.role ?? "Member",
      avatar: initials,
      image: profile?.avatarUrl ?? user.image ?? null,
      // Prefer Discord guild join date, fall back to account creation time
      joinedAt: profile?.discordGuildJoinedAt ?? user._creationTime,
      isOwnProfile: currentUserId === args.userId,
      discordRoles: profile?.discordRoles ?? [],
      discordRolesSyncedAt: profile?.discordRolesSyncedAt ?? null,
    };
  },
});

// Environment variables for member role IDs
const DISCORD_MEMBER_ROLE_ID = process.env.DISCORD_MEMBER_ROLE_ID;
const DISCORD_CHARTER_MEMBER_ROLE_ID = process.env.DISCORD_CHARTER_MEMBER_ROLE_ID;

// Get all public members for the members page
export const getAllMembers = query({
  args: {
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? 1;
    const pageSize = args.pageSize ?? 12; // 4 columns x 3 rows for grid

    // Get all profiles that are visible
    const profiles = await ctx.db.query("profiles").collect();
    
    // Filter to only visible profiles that have member or charter member roles
    const visibleProfiles = profiles.filter((p) => {
      // Must be visible
      if (p.profileVisible === false) return false;
      
      // Check if user has member or charter member role
      const roleIds = p.discordRoles?.map((r) => r.id) ?? [];
      const hasMemberRole = DISCORD_MEMBER_ROLE_ID && roleIds.includes(DISCORD_MEMBER_ROLE_ID);
      const hasCharterMemberRole = DISCORD_CHARTER_MEMBER_ROLE_ID && roleIds.includes(DISCORD_CHARTER_MEMBER_ROLE_ID);
      
      return hasMemberRole || hasCharterMemberRole;
    });

    // Enrich with user information
    const members = await Promise.all(
      visibleProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        if (!user) return null;

        const name = profile.displayName ?? user.name ?? "Member";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        // Get the highest-colored Discord role for display
        const primaryRole = profile.discordRoles?.find((r) => r.color !== 0) ?? null;

        // Prefer Discord guild join date, fall back to account creation time
        const joinedAt = profile.discordGuildJoinedAt ?? user._creationTime;

        return {
          id: profile.userId, // Return the user ID for linking to profiles
          name,
          role: profile.role ?? "Member",
          avatar: initials,
          image: profile.avatarUrl ?? user.image ?? null,
          joinedAt,
          joinDate: new Date(joinedAt).getFullYear().toString(),
          username: profile.username,
          discordRoles: profile.discordRoles ?? [],
          primaryRoleColor: primaryRole?.color ?? null,
        };
      })
    );

    // Filter out nulls (users that don't exist)
    let filteredMembers = members.filter((m): m is NonNullable<typeof m> => m !== null);

    // Apply search filter if provided
    if (args.search?.trim()) {
      const query = args.search.toLowerCase();
      filteredMembers = filteredMembers.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.role.toLowerCase().includes(query) ||
          (member.username && member.username.toLowerCase().includes(query))
      );
    }

    // Sort by role priority, then by name
    const roleOrder: Record<string, number> = {
      "President": 1,
      "Vice President": 2,
      "Events Lead": 3,
      "Community Manager": 4,
      "Secretary": 5,
      "Member": 99,
    };
    
    filteredMembers.sort((a, b) => {
      const orderA = roleOrder[a.role] ?? 50;
      const orderB = roleOrder[b.role] ?? 50;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    });

    const totalCount = filteredMembers.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Slice for pagination
    const start = (page - 1) * pageSize;
    const paginatedMembers = filteredMembers.slice(start, start + pageSize);

    return {
      items: paginatedMembers,
      totalCount,
      page,
      pageSize,
      totalPages,
    };
  },
});

