import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // User profiles with extended information
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    // Leadership role (e.g., "President", "Vice President", etc.) - legacy field
    role: v.optional(v.string()),
    // Discord roles from the BobaLUG server
    discordRoles: v.optional(
      v.array(
        v.object({
          id: v.string(), // Discord role ID
          name: v.string(), // Role name
          color: v.number(), // Role color as integer (Discord format)
          position: v.number(), // Role position in hierarchy
        })
      )
    ),
    // When Discord roles were last synced
    discordRolesSyncedAt: v.optional(v.number()),
    // Badges earned by the user
    badges: v.optional(v.array(v.string())),
    // Privacy settings
    profileVisible: v.optional(v.boolean()),
    showOnlineStatus: v.optional(v.boolean()),
    // Notification settings
    notifyEvents: v.optional(v.boolean()),
    notifyBuildComments: v.optional(v.boolean()),
    notifyMentions: v.optional(v.boolean()),
    notifyNewsletter: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_username", ["username"]),

  // Contact form submissions
  contactSubmissions: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    submittedAt: v.number(),
    // Optional: link to user if they're signed in
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()), // "pending", "reviewed", "resolved"
  }).index("by_status", ["status"]),

  // Events
  events: defineTable({
    title: v.string(),
    description: v.string(),
    date: v.number(), // timestamp
    endDate: v.optional(v.number()), // optional end timestamp for multi-day events
    location: v.string(),
    locationUrl: v.optional(v.string()), // Google Maps or similar link
    imageUrl: v.optional(v.string()),
    category: v.string(), // "meetup", "convention", "workshop", "social"
    capacity: v.optional(v.number()),
    attendees: v.optional(v.array(v.id("users"))),
    createdBy: v.id("users"),
    createdAt: v.number(),
    isPublished: v.boolean(),
  })
    .index("by_date", ["date"])
    .index("by_category", ["category"])
    .index("by_published", ["isPublished"]),

  // About page content (editable sections)
  aboutContent: defineTable({
    sectionId: v.string(), // e.g., "mission", "history", "values", "faq"
    title: v.string(),
    content: v.string(), // supports markdown
    order: v.number(),
    isVisible: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
  }).index("by_section", ["sectionId"]),

  // Pending (draft) applications - auto-saved as users fill out the form
  pendingApplications: defineTable({
    userId: v.id("users"),
    lastUpdatedAt: v.number(),

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
    mocImageIds: v.optional(v.array(v.id("_storage"))), // Convex storage IDs
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
  }).index("by_user", ["userId"]),

  // Membership applications
  applications: defineTable({
    userId: v.id("users"),
    submittedAt: v.number(),
    status: v.string(), // "pending", "reviewing", "accepted", "rejected"

    // Section 1: About You (some pulled from profile/auth)
    age: v.number(),
    location: v.string(),
    appliedBefore: v.boolean(),
    previousApplications: v.optional(v.number()),

    // Section 2: Social Media
    instagramUsername: v.optional(v.string()),
    flickrUsername: v.optional(v.string()),
    youtubeChannel: v.optional(v.string()),
    youtubeExperience: v.optional(v.string()),
    otherSocialMedia: v.optional(v.string()),

    // Section 3: Building Experience
    yearsBuilding: v.string(), // "1-2", "2-3", "3-5", "5+"
    selfRating: v.number(), // 1-10
    mocsPerMonth: v.number(), // 1, 2, 3, 5
    mocSize: v.string(), // "vignette", "minimoc", "medium", "large"

    // Section 4: Your Work
    mocImageIds: v.array(v.id("_storage")), // Convex storage IDs for MOC images
    activityLevel: v.number(), // 1-5

    // Section 5: Deep Dive Questions
    aboutYourself: v.string(),
    communityThrive: v.string(),
    collaborationExample: v.string(),
    handleDisagreements: v.string(),
    buildStrengths: v.string(),
    challengeOvercome: v.string(),
    favoriteTheme: v.string(),
    conventions: v.optional(v.string()),

    // Section 6: Motivation & Goals
    communityMotivation: v.string(),
    legoAmbitions: v.string(),
    improvementArea: v.string(),
    whyJoin: v.string(),
    questionsForUs: v.optional(v.string()),

    // Review information (filled in by admin)
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
    reviewNotes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});

export default schema;
