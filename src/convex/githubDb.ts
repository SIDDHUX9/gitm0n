import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

export const getCachedAnalysis = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const analysis = await ctx.db
      .query("githubAnalyses")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!analysis) return null;
    // Cache for 6 hours
    if (Date.now() - analysis.analyzedAt > 21600000) return null;
    return analysis;
  },
});

export const saveAnalysis = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("githubAnalyses")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existing) await ctx.db.delete(existing._id);
    return await ctx.db.insert("githubAnalyses", args);
  },
});

export const getAnalysisByIdQuery = internalQuery({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    try {
      const doc = await ctx.db.get(args.id as any);
      return doc;
    } catch {
      return null;
    }
  },
});

export const getAnalysisByUsernameQuery = internalQuery({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("githubAnalyses")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
  },
});

export const getLeaderboard = internalQuery({
  args: {},
  handler: async (ctx) => {
    const analyses = await ctx.db
      .query("githubAnalyses")
      .order("desc")
      .take(100);
    // Sort by totalLines descending
    return analyses
      .sort((a, b) => b.totalLines - a.totalLines)
      .slice(0, 50)
      .map((a, i) => ({
        rank: i + 1,
        username: a.username,
        avatarUrl: a.avatarUrl,
        name: a.name,
        totalLines: a.totalLines,
        languages: a.languages.slice(0, 3),
        percentileRank: a.percentileRank,
        reposAnalyzed: a.reposAnalyzed,
        analyzedAt: a.analyzedAt,
      }));
  },
});

export const getLeaderboardPublic = query({
  args: {},
  handler: async (ctx) => {
    const analyses = await ctx.db
      .query("githubAnalyses")
      .order("desc")
      .take(100);
    return analyses
      .sort((a, b) => b.totalLines - a.totalLines)
      .slice(0, 20)
      .map((a, i) => ({
        rank: i + 1,
        username: a.username,
        avatarUrl: a.avatarUrl,
        name: a.name,
        totalLines: a.totalLines,
        languages: a.languages,
        percentileRank: a.percentileRank,
        reposAnalyzed: a.reposAnalyzed,
        analyzedAt: a.analyzedAt,
      }));
  },
});

export const deleteAnalysis = internalMutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id as any);
  },
});

export const getAllAnalyses = internalQuery({
  args: {},
  handler: async (ctx) => {
    const analyses = await ctx.db
      .query("githubAnalyses")
      .order("desc")
      .take(500);
    return analyses.map((a) => ({
      id: a._id,
      username: a.username,
      avatarUrl: a.avatarUrl,
      name: a.name,
      totalLines: a.totalLines,
      languages: a.languages.slice(0, 3),
      percentileRank: a.percentileRank,
      reposAnalyzed: a.reposAnalyzed,
      analyzedAt: a.analyzedAt,
    }));
  },
});