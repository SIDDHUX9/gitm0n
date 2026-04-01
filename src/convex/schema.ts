import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Cache GitHub analysis results
    githubAnalyses: defineTable({
      username: v.string(),
      avatarUrl: v.string(),
      profileUrl: v.string(),
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      followers: v.number(),
      following: v.number(),
      publicRepos: v.number(),
      totalLines: v.number(),
      codeLines: v.number(),
      commentLines: v.number(),
      blankLines: v.number(),
      languages: v.array(v.object({
        name: v.string(),
        lines: v.number(),
        percentage: v.number(),
        color: v.string(),
      })),
      repositories: v.array(v.object({
        name: v.string(),
        url: v.string(),
        description: v.optional(v.string()),
        language: v.optional(v.string()),
        stars: v.number(),
        lines: v.number(),
        isForked: v.boolean(),
      })),
      estimatedHours: v.number(),
      percentileRank: v.number(),
      analyzedAt: v.number(),
      reposAnalyzed: v.number(),
    })
      .index("by_username", ["username"])
      .index("by_analyzedAt", ["analyzedAt"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;