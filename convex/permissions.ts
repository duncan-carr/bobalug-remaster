import { query } from "./_generated/server";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// Environment variables for role/user IDs
const DISCORD_MEMBER_ROLE_ID = process.env.DISCORD_MEMBER_ROLE_ID;
const DISCORD_CHARTER_MEMBER_ROLE_ID = process.env.DISCORD_CHARTER_MEMBER_ROLE_ID;
const DISCORD_APPLICATION_JUDGE_ROLE_ID = process.env.DISCORD_APPLICATION_JUDGE_ROLE_ID;
const DISCORD_WEB_ADMIN_ID = process.env.DISCORD_WEB_ADMIN_ID;

// Context type that works with both queries and mutations
type DbCtx = QueryCtx | MutationCtx;

// Helper to get user's Discord ID from their account
async function getDiscordUserId(ctx: DbCtx, userId: Id<"users">): Promise<string | null> {
  const accounts = await ctx.db
    .query("authAccounts")
    .filter((q) => q.eq(q.field("userId"), userId))
    .collect();
  
  const discordAccount = accounts.find((a) => a.provider === "discord");
  return discordAccount?.providerAccountId ?? null;
}

// Helper to get user's Discord roles from their profile
async function getUserDiscordRoleIds(ctx: DbCtx, userId: Id<"users">): Promise<string[]> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  
  return profile?.discordRoles?.map((r) => r.id) ?? [];
}

// Check if user is the web admin
export async function isWebAdmin(ctx: DbCtx, userId: Id<"users">): Promise<boolean> {
  if (!DISCORD_WEB_ADMIN_ID) return false;
  const discordId = await getDiscordUserId(ctx, userId);
  return discordId === DISCORD_WEB_ADMIN_ID;
}

// Check if user has the application judge role
export async function isApplicationJudge(ctx: DbCtx, userId: Id<"users">): Promise<boolean> {
  if (!DISCORD_APPLICATION_JUDGE_ROLE_ID) return false;
  const roleIds = await getUserDiscordRoleIds(ctx, userId);
  return roleIds.includes(DISCORD_APPLICATION_JUDGE_ROLE_ID);
}

// Check if user is a member (has member or charter member role)
export async function isMember(ctx: DbCtx, userId: Id<"users">): Promise<boolean> {
  const roleIds = await getUserDiscordRoleIds(ctx, userId);
  
  const memberRoleId = DISCORD_MEMBER_ROLE_ID;
  const charterMemberRoleId = DISCORD_CHARTER_MEMBER_ROLE_ID;
  
  if (memberRoleId && roleIds.includes(memberRoleId)) return true;
  if (charterMemberRoleId && roleIds.includes(charterMemberRoleId)) return true;
  
  return false;
}

// Debug query to help diagnose permission issues
export const debugMyPermissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { error: "Not authenticated" };
    }

    const discordId = await getDiscordUserId(ctx, userId);
    const roleIds = await getUserDiscordRoleIds(ctx, userId);
    
    return {
      convexUserId: userId,
      discordUserId: discordId,
      discordRoleIds: roleIds,
      envVars: {
        DISCORD_WEB_ADMIN_ID_SET: !!DISCORD_WEB_ADMIN_ID,
        DISCORD_WEB_ADMIN_ID_MATCHES: discordId === DISCORD_WEB_ADMIN_ID,
        DISCORD_APPLICATION_JUDGE_ROLE_ID_SET: !!DISCORD_APPLICATION_JUDGE_ROLE_ID,
        DISCORD_MEMBER_ROLE_ID_SET: !!DISCORD_MEMBER_ROLE_ID,
        DISCORD_CHARTER_MEMBER_ROLE_ID_SET: !!DISCORD_CHARTER_MEMBER_ROLE_ID,
      },
    };
  },
});

// Query to check if current user is already a member
export const getAmIMember = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return { isMember: false, isAuthenticated: false };
    }

    const member = await isMember(ctx, userId);
    return { isMember: member, isAuthenticated: true };
  },
});

// Query to get current user's admin permissions
export const getMyAdminPermissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return {
        canAccessAdmin: false,
        canViewApplications: false,
        canViewMessages: false,
        canViewUsers: false,
        canViewDashboard: false,
        isWebAdmin: false,
      };
    }

    const webAdmin = await isWebAdmin(ctx, userId);
    const judge = await isApplicationJudge(ctx, userId);

    // Web admin can do everything
    if (webAdmin) {
      return {
        canAccessAdmin: true,
        canViewApplications: true,
        canViewMessages: true,
        canViewUsers: true,
        canViewDashboard: true,
        isWebAdmin: true,
      };
    }

    // Application judges can only view applications
    if (judge) {
      return {
        canAccessAdmin: true,
        canViewApplications: true,
        canViewMessages: false,
        canViewUsers: false,
        canViewDashboard: false,
        isWebAdmin: false,
      };
    }

    // No admin access
    return {
      canAccessAdmin: false,
      canViewApplications: false,
      canViewMessages: false,
      canViewUsers: false,
      canViewDashboard: false,
      isWebAdmin: false,
    };
  },
});

