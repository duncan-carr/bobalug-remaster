import { convexAuth } from "@convex-dev/auth/server";
import Discord from "@auth/core/providers/discord";

// Discord guild ID from environment variable
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

// Type for Discord guild member response
interface DiscordGuildMember {
  roles: string[];
  user?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      // Add scopes for guild member information
      authorization: {
        params: {
          scope: "identify email guilds guilds.members.read",
        },
      },
      // Custom profile function to fetch guild roles
      async profile(profile, tokens) {
        // Start with standard profile data
        const profileData: Record<string, unknown> = {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${profile.avatar.startsWith("a_") ? "gif" : "png"}`
            : `https://cdn.discordapp.com/embed/avatars/${(BigInt(profile.id) >> 22n) % 6n}.png`,
        };

        // Fetch guild member roles if we have a guild ID and access token
        if (DISCORD_GUILD_ID && tokens.access_token) {
          try {
            // Fetch user's guild member info
            const memberResponse = await fetch(
              `https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
              {
                headers: {
                  Authorization: `Bearer ${tokens.access_token}`,
                },
              }
            );

            if (memberResponse.ok) {
              const memberData: DiscordGuildMember = await memberResponse.json();
              // Store role IDs for potential later use
              profileData.discordRoleIds = memberData.roles;
            }
          } catch (error) {
            console.error("Failed to fetch Discord guild member data:", error);
          }
        }

        return profileData;
      },
    }),
  ],
});
