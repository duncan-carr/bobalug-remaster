import { convexAuth } from "@convex-dev/auth/server";
import Discord from "@auth/core/providers/discord";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
      // Request scopes for guild member information (used by syncMyDiscordRoles action)
      authorization: {
        params: {
          scope: "identify email guilds guilds.members.read",
        },
      },
      // Custom profile function to properly format Discord avatar
      profile(profile) {
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${profile.avatar.startsWith("a_") ? "gif" : "png"}`
            : `https://cdn.discordapp.com/embed/avatars/${(BigInt(profile.id) >> 22n) % 6n}.png`,
        };
      },
    }),
  ],
});
