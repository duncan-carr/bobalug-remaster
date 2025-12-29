import { query } from "./_generated/server";

// Get statistics for the homepage
export const getHomeStats = query({
  args: {},
  handler: async (ctx) => {
    // Count active members (users with profiles)
    const profiles = await ctx.db.query("profiles").collect();
    const memberCount = profiles.length;

    // Count events
    const events = await ctx.db
      .query("events")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
    const eventCount = events.length;

    return {
      memberCount,
      eventCount,
    };
  },
});

// Get featured members (leadership) for the homepage
export const getFeaturedMembers = query({
  args: {},
  handler: async (ctx) => {
    // Get profiles with leadership roles
    const profiles = await ctx.db.query("profiles").collect();
    
    // Filter to only those with a role set, then sort by role priority
    const roleOrder: Record<string, number> = {
      "President": 1,
      "Vice President": 2,
      "Events Lead": 3,
      "Community Manager": 4,
      "Secretary": 5,
    };
    
    const leadershipProfiles = profiles
      .filter((p) => p.role)
      .sort((a, b) => {
        const orderA = roleOrder[a.role ?? ""] ?? 99;
        const orderB = roleOrder[b.role ?? ""] ?? 99;
        return orderA - orderB;
      })
      .slice(0, 5);

    // Enrich with user information
    const enrichedMembers = await Promise.all(
      leadershipProfiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        const name = profile.displayName ?? user?.name ?? "Member";
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return {
          id: profile._id,
          name,
          role: profile.role ?? "Member",
          avatar: initials,
          image: profile.avatarUrl ?? user?.image ?? null,
        };
      })
    );

    return enrichedMembers;
  },
});

