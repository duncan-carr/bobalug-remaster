import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";

// Types for Discord API responses
interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
  managed: boolean;
}

interface DiscordGuildMember {
  roles: string[];
  user: {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
  };
  nick?: string;
  joined_at: string;
}

// Internal query to get user's Discord ID from auth accounts
export const getUserDiscordId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get the user's auth accounts
    const accounts = await ctx.db
      .query("authAccounts")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    // Find the Discord account
    const discordAccount = accounts.find(
      (account) => account.provider === "discord"
    );

    return discordAccount?.providerAccountId ?? null;
  },
});

// Internal mutation to update user's Discord roles
export const updateUserDiscordRoles = internalMutation({
  args: {
    userId: v.id("users"),
    roles: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        color: v.number(),
        position: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      // Create profile if it doesn't exist
      await ctx.db.insert("profiles", {
        userId: args.userId,
        discordRoles: args.roles,
        discordRolesSyncedAt: Date.now(),
        profileVisible: true,
        showOnlineStatus: false,
        notifyEvents: true,
        notifyBuildComments: true,
        notifyMentions: true,
        notifyNewsletter: false,
        badges: [],
      });
    } else {
      await ctx.db.patch(profile._id, {
        discordRoles: args.roles,
        discordRolesSyncedAt: Date.now(),
      });
    }
  },
});

// Action to sync Discord roles for the current user
export const syncMyDiscordRoles = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string; roles?: Array<{ id: string; name: string; color: number; position: number }> }> => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { success: false, message: "Not authenticated" };
    }

    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;

    if (!botToken || !guildId) {
      return {
        success: false,
        message: "Discord bot token or guild ID not configured",
      };
    }

    // Get user's Discord ID
    const discordUserId = await ctx.runQuery(internal.discord.getUserDiscordId, {
      userId,
    });

    if (!discordUserId) {
      return { success: false, message: "Discord account not linked" };
    }

    try {
      // Fetch guild roles
      const rolesResponse = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/roles`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      if (!rolesResponse.ok) {
        const errorText = await rolesResponse.text();
        console.error("Failed to fetch guild roles:", errorText);
        return { success: false, message: "Failed to fetch guild roles" };
      }

      const guildRoles: DiscordRole[] = await rolesResponse.json();

      // Fetch guild member
      const memberResponse = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`,
        {
          headers: {
            Authorization: `Bot ${botToken}`,
          },
        }
      );

      if (!memberResponse.ok) {
        if (memberResponse.status === 404) {
          // User is not in the guild - clear their roles
          await ctx.runMutation(internal.discord.updateUserDiscordRoles, {
            userId,
            roles: [],
          });
          return { success: true, message: "User is not in the Discord server", roles: [] };
        }
        const errorText = await memberResponse.text();
        console.error("Failed to fetch guild member:", errorText);
        return { success: false, message: "Failed to fetch guild member" };
      }

      const memberData: DiscordGuildMember = await memberResponse.json();

      // Map member's role IDs to full role objects
      const userRoles = guildRoles
        .filter((role) => memberData.roles.includes(role.id))
        // Exclude @everyone role (has the same ID as the guild)
        .filter((role) => role.id !== guildId)
        // Sort by position (highest first)
        .sort((a, b) => b.position - a.position)
        .map((role) => ({
          id: role.id,
          name: role.name,
          color: role.color,
          position: role.position,
        }));

      // Update user's profile with roles
      await ctx.runMutation(internal.discord.updateUserDiscordRoles, {
        userId,
        roles: userRoles,
      });

      return {
        success: true,
        message: `Synced ${userRoles.length} roles`,
        roles: userRoles,
      };
    } catch (error) {
      console.error("Error syncing Discord roles:", error);
      return { success: false, message: "An error occurred while syncing roles" };
    }
  },
});

// Query to get all guild roles (cached in a table for efficiency)
// This can be used by admins to configure role-based access
export const getGuildRoles = query({
  args: {},
  handler: async (ctx) => {
    // This would return cached guild roles
    // For now, we just return an empty array
    // In a full implementation, you'd periodically sync guild roles to a table
    return [];
  },
});

// Helper function to convert Discord color integer to hex string
export function discordColorToHex(color: number): string {
  if (color === 0) return "#99aab5"; // Default Discord grey for no color
  return `#${color.toString(16).padStart(6, "0")}`;
}

