import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// Serve images from storage
http.route({
  path: "/getImage",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.searchParams.get("storageId");
    
    if (!storageId) {
      return new Response("Missing storageId", { status: 400 });
    }
    
    try {
      const blob = await ctx.storage.get(storageId as Id<"_storage">);
      
      if (!blob) {
        return new Response("Image not found", { status: 404 });
      }
      
      return new Response(blob, {
        headers: {
          "Content-Type": blob.type || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (error) {
      console.error("Error fetching image:", error);
      return new Response("Error fetching image", { status: 500 });
    }
  }),
});

export default http;
