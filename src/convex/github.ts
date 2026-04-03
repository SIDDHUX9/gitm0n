"use node";
import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", "C#": "#178600", Go: "#00ADD8", Rust: "#dea584",
  Ruby: "#701516", PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF", Scala: "#c22d40",
  HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Dockerfile: "#384d54", Vue: "#41b883",
  Svelte: "#ff3e00", Dart: "#00B4AB", Lua: "#000080", R: "#198CE7", MATLAB: "#e16737",
  Perl: "#0298c3", Haskell: "#5e5086", Elixir: "#6e4a7e", Clojure: "#db5855", Erlang: "#B83998",
  OCaml: "#3be133", "F#": "#b845fc", Nix: "#7e7eff", Zig: "#ec915c", Assembly: "#6E4C13",
  Makefile: "#427819", Jupyter: "#DA5B0B", Terraform: "#7B42BC", YAML: "#cb171e",
  JSON: "#292929", Markdown: "#083fa1", SQL: "#e38c00", GraphQL: "#e10098",
  Protobuf: "#4285f4", TOML: "#9c4221", XML: "#0060ac", Sass: "#a53b70", Less: "#1d365d",
  CoffeeScript: "#244776", Elm: "#60B5CC", Nim: "#ffc200", Crystal: "#000100",
  Julia: "#a270ba", Groovy: "#4298b8", Other: "#8b949e",
};

const BYTES_PER_LINE: Record<string, number> = {
  JavaScript: 45, TypeScript: 48, Python: 40, Java: 55, "C++": 50, C: 48, "C#": 55,
  Go: 42, Rust: 45, Ruby: 38, PHP: 50, Swift: 48, Kotlin: 50, Scala: 52, HTML: 60,
  CSS: 35, Shell: 38, Dockerfile: 30, Vue: 50, Svelte: 48, Dart: 45, Lua: 38, R: 40,
  MATLAB: 42, Perl: 42, Haskell: 45, Elixir: 40, Clojure: 42, Erlang: 45, OCaml: 45,
  "F#": 48, Nix: 40, Zig: 45, Assembly: 35, Makefile: 30, Jupyter: 80, Terraform: 40,
  YAML: 30, JSON: 25, Markdown: 50, SQL: 45, GraphQL: 35, Protobuf: 35, TOML: 28,
  XML: 55, Sass: 32, Less: 32, CoffeeScript: 38, Elm: 42, Groovy: 50, Julia: 42,
  Crystal: 40, Nim: 40,
};

function bytesToLines(bytes: number, language: string): number {
  const bpl = BYTES_PER_LINE[language] || 45;
  return Math.round(bytes / bpl);
}

function getLanguageColor(lang: string): string {
  return LANGUAGE_COLORS[lang] || LANGUAGE_COLORS["Other"];
}

// Get the best available token: user-provided > server env var
function resolveToken(userToken?: string): string | undefined {
  if (userToken?.trim()) return userToken.trim();
  // Server-side env var — set GITHUB_TOKEN in Convex environment variables
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken?.trim()) return envToken.trim();
  return undefined;
}

async function fetchGitHub(url: string, token?: string): Promise<any> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "GITM0N/2.4",
  };
  if (token) headers["Authorization"] = `token ${token}`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 403) {
      // Check if it's a rate limit vs auth issue
      const remaining = res.headers.get("x-ratelimit-remaining");
      const resetTs = res.headers.get("x-ratelimit-reset");
      if (remaining === "0" || res.headers.get("x-ratelimit-limit")) {
        const resetTime = resetTs ? new Date(parseInt(resetTs) * 1000).toLocaleTimeString() : "soon";
        throw new Error(`RATE_LIMIT:${resetTime}`);
      }
      throw new Error("RATE_LIMIT:soon");
    }
    if (res.status === 404) throw new Error("USER_NOT_FOUND");
    if (res.status === 409) return null; // Empty repo
    if (res.status === 202) return null; // Stats being computed
    throw new Error(`GitHub API error: ${res.status}`);
  }
  return res.json();
}

// Fetch contributor stats — only for repos worth analyzing (size > 0)
async function fetchContributorStats(
  owner: string,
  repoName: string,
  targetLogin: string,
  token?: string
): Promise<{ additions: number; deletions: number } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GITM0N/2.4",
      };
      if (token) headers["Authorization"] = `token ${token}`;

      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/stats/contributors`,
        { headers }
      );

      if (res.status === 202) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      if (res.status === 204 || res.status === 404 || res.status === 409) return null;
      if (res.status === 403) return null; // Rate limited — skip, use fallback
      if (!res.ok) return null;

      const stats: any[] = await res.json();
      if (!Array.isArray(stats)) return null;

      const userStats = stats.find(
        (s: any) => s.author?.login?.toLowerCase() === targetLogin.toLowerCase()
      );
      if (!userStats) return null;

      let additions = 0;
      let deletions = 0;
      for (const week of userStats.weeks || []) {
        additions += week.a || 0;
        deletions += week.d || 0;
      }

      return { additions, deletions };
    } catch {
      return null;
    }
  }
  return null;
}

interface RepoResult {
  name: string;
  url: string;
  description?: string;
  language?: string;
  stars: number;
  lines: number;
  additions: number;
  deletions: number;
  isForked: boolean;
  langBytes: Record<string, number>;
}

export const analyzeUser = action({
  args: {
    username: v.string(),
    githubToken: v.optional(v.string()),
    forceRefresh: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<string> => {
    const { username, forceRefresh } = args;
    // Resolve best available token
    const token = resolveToken(args.githubToken);

    if (!forceRefresh) {
      const cached = await ctx.runQuery(internal.githubDb.getCachedAnalysis, {
        username: username.toLowerCase(),
      });
      if (cached) return cached._id;
    }

    // Fetch user profile
    const user = await fetchGitHub(
      `https://api.github.com/users/${username}`,
      token
    );

    // Fetch all repos (paginated, up to 300)
    const allRepos: any[] = [];
    for (let page = 1; page <= 10; page++) {
      const repos = await fetchGitHub(
        `https://api.github.com/users/${username}/repos?per_page=30&page=${page}&sort=pushed`,
        token
      );
      if (!Array.isArray(repos) || repos.length === 0) break;
      allRepos.push(...repos);
      if (repos.length < 30) break;
    }

    // Only analyze non-forked repos
    const ownRepos = allRepos.filter((r: any) => !r.fork);
    ownRepos.sort((a: any, b: any) => (b.size || 0) - (a.size || 0));

    // With a token: analyze up to 50 repos; without: limit to 30 to stay within rate limits
    const maxRepos = token ? 50 : 30;
    const reposToAnalyze = ownRepos.slice(0, maxRepos);

    const repoResults: RepoResult[] = [];

    for (const repo of reposToAnalyze) {
      const repoName = repo.name;

      const result: RepoResult = {
        name: repoName,
        url: repo.html_url,
        description: repo.description || undefined,
        language: repo.language || undefined,
        stars: repo.stargazers_count || 0,
        lines: 0,
        additions: 0,
        deletions: 0,
        isForked: false,
        langBytes: {},
      };

      // Fetch language bytes
      try {
        const langs = await fetchGitHub(
          `https://api.github.com/repos/${username}/${repoName}/languages`,
          token
        );
        if (langs && typeof langs === "object") {
          result.langBytes = langs as Record<string, number>;
        }
      } catch {
        // ignore
      }

      // Only fetch contributor stats for repos with meaningful size (> 5KB)
      // This avoids wasting API calls on empty/tiny repos
      const repoSizeKb = repo.size || 0;
      if (repoSizeKb > 5) {
        const stats = await fetchContributorStats(username, repoName, username, token);
        if (stats !== null) {
          result.additions = stats.additions;
          result.deletions = stats.deletions;
          result.lines = Math.max(0, stats.additions - stats.deletions);
        }
      }

      // Fallback: estimate from language bytes if no contributor stats
      if (result.lines === 0) {
        let totalLines = 0;
        for (const [lang, bytes] of Object.entries(result.langBytes)) {
          totalLines += bytesToLines(bytes, lang);
        }
        result.lines = totalLines;
        result.additions = totalLines;
        result.deletions = 0;
      }

      repoResults.push(result);
    }

    // Aggregate language stats
    const languageBytes: Record<string, number> = {};
    for (const repo of repoResults) {
      for (const [lang, bytes] of Object.entries(repo.langBytes)) {
        languageBytes[lang] = (languageBytes[lang] || 0) + bytes;
      }
    }

    const totalLines = repoResults.reduce((s, r) => s + r.lines, 0);
    const totalAdditions = repoResults.reduce((s, r) => s + r.additions, 0);
    const codeLines = Math.round(totalLines * 0.65);
    const commentLines = Math.round(totalLines * 0.15);
    const blankLines = Math.round(totalLines * 0.20);

    const totalLangBytes = Object.values(languageBytes).reduce((s, v) => s + v, 0);
    const languages = Object.entries(languageBytes)
      .map(([name, bytes]) => ({
        name,
        lines: bytesToLines(bytes, name),
        percentage: totalLangBytes > 0 ? Math.round((bytes / totalLangBytes) * 1000) / 10 : 0,
        color: getLanguageColor(name),
      }))
      .filter(l => l.lines > 0)
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 15);

    repoResults.sort((a, b) => b.lines - a.lines);
    const topRepos = repoResults.slice(0, 20).map(r => ({
      name: r.name,
      url: r.url,
      description: r.description,
      language: r.language,
      stars: r.stars,
      lines: r.lines,
      isForked: r.isForked,
    }));

    const estimatedHours = Math.round(totalAdditions / 10);

    let percentileRank = 50;
    if (totalLines > 1000000) percentileRank = 99;
    else if (totalLines > 500000) percentileRank = 97;
    else if (totalLines > 200000) percentileRank = 95;
    else if (totalLines > 100000) percentileRank = 90;
    else if (totalLines > 50000) percentileRank = 80;
    else if (totalLines > 20000) percentileRank = 70;
    else if (totalLines > 10000) percentileRank = 60;
    else if (totalLines > 5000) percentileRank = 50;
    else if (totalLines > 1000) percentileRank = 35;
    else percentileRank = 20;

    const id = await ctx.runMutation(internal.githubDb.saveAnalysis, {
      username: username.toLowerCase(),
      avatarUrl: user.avatar_url || "",
      profileUrl: user.html_url || `https://github.com/${username}`,
      name: user.name || undefined,
      bio: user.bio || undefined,
      followers: user.followers || 0,
      following: user.following || 0,
      publicRepos: user.public_repos || 0,
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      languages,
      repositories: topRepos,
      estimatedHours,
      percentileRank,
      analyzedAt: Date.now(),
      reposAnalyzed: reposToAnalyze.length,
    });

    return id;
  },
});

export const getAnalysisById = action({
  args: { id: v.string() },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runQuery(internal.githubDb.getAnalysisByIdQuery, { id: args.id });
  },
});

export const getAnalysisByUsername = action({
  args: { username: v.string() },
  handler: async (ctx, args): Promise<any> => {
    return await ctx.runQuery(internal.githubDb.getAnalysisByUsernameQuery, {
      username: args.username.toLowerCase(),
    });
  },
});

export const getLeaderboard = action({
  args: {},
  handler: async (ctx): Promise<any[]> => {
    return await ctx.runQuery(internal.githubDb.getLeaderboard, {});
  },
});

export const adminGetAllAnalyses = action({
  args: {},
  handler: async (ctx): Promise<any[]> => {
    return await ctx.runQuery(internal.githubDb.getAllAnalyses, {});
  },
});

export const adminDeleteAnalysis = action({
  args: { id: v.string() },
  handler: async (ctx, args): Promise<void> => {
    await ctx.runMutation(internal.githubDb.deleteAnalysis, { id: args.id });
  },
});