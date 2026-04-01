import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import CodeWorld from "./CodeWorld";
import Achievements from "./Achievements";
import Leaderboard from "./Leaderboard";

interface Language {
  name: string;
  lines: number;
  percentage: number;
  color: string;
}

interface Repository {
  name: string;
  url: string;
  description?: string;
  language?: string;
  stars: number;
  lines: number;
  isForked: boolean;
}

interface AnalysisData {
  _id: string;
  username: string;
  avatarUrl: string;
  profileUrl: string;
  name?: string;
  bio?: string;
  followers: number;
  following: number;
  publicRepos: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  languages: Language[];
  repositories: Repository[];
  estimatedHours: number;
  percentileRank: number;
  analyzedAt: number;
  reposAnalyzed: number;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatHours(h: number): string {
  if (h >= 8760) return `${(h / 8760).toFixed(1)} years`;
  if (h >= 720) return `${(h / 720).toFixed(1)} months`;
  if (h >= 168) return `${(h / 168).toFixed(1)} weeks`;
  if (h >= 24) return `${(h / 24).toFixed(1)} days`;
  return `${h} hours`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border p-2 text-xs font-mono">
        <p className="text-primary">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || "#00ff41" }}>
            {p.name}: {formatNumber(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalysisDashboard({
  data,
  onReset,
  onRescan,
  isRescanning,
}: {
  data: AnalysisData;
  onReset: () => void;
  onRescan?: () => void;
  isRescanning?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "languages" | "repos" | "world" | "achievements" | "leaderboard">("overview");

  const getLeaderboard = useAction(api.github.getLeaderboard);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);

  const loadLeaderboard = async () => {
    if (leaderboardLoaded) return;
    try {
      const data = await getLeaderboard({});
      setLeaderboardData(data);
      setLeaderboardLoaded(true);
    } catch {
      // ignore
    }
  };

  const shareUrl = `${window.location.origin}?user=${data.username}`;

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("[OK] Share URL copied to clipboard");
  };

  const topLangs = data.languages.slice(0, 8);
  const topRepos = data.repositories.slice(0, 10);

  const currentUserForWorld = {
    username: data.username,
    avatarUrl: data.avatarUrl,
    name: data.name,
    totalLines: data.totalLines,
    languages: data.languages,
    percentileRank: data.percentileRank,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-border bg-card p-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img
            src={data.avatarUrl}
            alt={data.username}
            className="w-16 h-16 border-2 border-primary"
            style={{ imageRendering: "pixelated", filter: "grayscale(30%) sepia(20%) hue-rotate(90deg)" }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-primary terminal-glow">
                {data.name || data.username}
              </h2>
              <span className="text-muted-foreground text-sm">@{data.username}</span>
              <span className="text-xs border border-primary text-primary px-2 py-0.5">
                TOP {100 - data.percentileRank}%
              </span>
            </div>
            {data.bio && (
              <p className="text-muted-foreground text-xs mt-1 max-w-lg">{data.bio}</p>
            )}
            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span>FOLLOWERS: <span className="text-primary">{formatNumber(data.followers)}</span></span>
              <span>FOLLOWING: <span className="text-primary">{formatNumber(data.following)}</span></span>
              <span>REPOS: <span className="text-primary">{data.publicRepos}</span></span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleCopyShare}
              className="text-xs border border-border px-3 py-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-all font-mono"
            >
              &gt; SHARE
            </button>
            {onRescan && (
              <button
                onClick={onRescan}
                disabled={isRescanning}
                className="text-xs border border-border px-3 py-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-all font-mono disabled:opacity-40"
              >
                {isRescanning ? "&gt; SCANNING..." : "&gt; RESCAN"}
              </button>
            )}
            <a
              href={data.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-border px-3 py-1.5 text-muted-foreground hover:border-primary hover:text-primary transition-all font-mono"
            >
              &gt; GITHUB
            </a>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          { label: "TOTAL_LINES", value: formatNumber(data.totalLines), sub: "all files" },
          { label: "CODE_LINES", value: formatNumber(data.codeLines), sub: "~65% of total" },
          { label: "EST_HOURS", value: formatHours(data.estimatedHours), sub: "@10 LOC/hr" },
          { label: "REPOS_SCANNED", value: data.reposAnalyzed.toString(), sub: `of ${data.publicRepos} public` },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="terminal-border bg-card p-4"
          >
            <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-primary terminal-glow">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Line breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="terminal-border bg-card p-4"
      >
        <div className="text-xs text-muted-foreground mb-3">LINE_BREAKDOWN</div>
        <div className="space-y-2">
          {[
            { label: "CODE", value: data.codeLines, total: data.totalLines, color: "#00ff41" },
            { label: "BLANK", value: data.blankLines, total: data.totalLines, color: "#ffb300" },
            { label: "COMMENT", value: data.commentLines, total: data.totalLines, color: "#00ccff" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs w-16 text-muted-foreground">{item.label}</span>
              <div className="flex-1 bg-muted h-3 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / item.total) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-3 absolute top-0 left-0"
                  style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}80` }}
                />
              </div>
              <span className="text-xs w-20 text-right" style={{ color: item.color }}>
                {formatNumber(item.value)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {(["overview", "languages", "repos", "world", "achievements", "leaderboard"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "leaderboard" || tab === "world") loadLeaderboard();
            }}
            className={`px-4 py-2 text-xs font-mono uppercase transition-all whitespace-nowrap ${
              activeTab === tab
                ? "text-primary border-b-2 border-primary bg-card"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {tab === "world" ? "◈ WORLD" : tab === "achievements" ? "★ ACHIEVEMENTS" : tab === "leaderboard" ? "▲ LEADERBOARD" : tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Pie chart */}
            <div className="terminal-border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-3">LANGUAGE_DISTRIBUTION</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={topLangs}
                    dataKey="percentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    strokeWidth={1}
                    stroke="#0a0a0a"
                  >
                    {topLangs.map((lang, i) => (
                      <Cell key={i} fill={lang.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground font-mono">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Percentile + coding time */}
            <div className="space-y-4">
              <div className="terminal-border bg-card p-4">
                <div className="text-xs text-muted-foreground mb-2">DEVELOPER_PERCENTILE</div>
                <div className="text-4xl font-bold text-primary terminal-glow mb-1">
                  TOP {100 - data.percentileRank}%
                </div>
                <div className="text-xs text-muted-foreground">
                  You've written more code than{" "}
                  <span className="text-primary">{data.percentileRank}%</span> of GitHub developers
                </div>
                <div className="mt-3 w-full bg-muted h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.percentileRank}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-2 bg-primary"
                    style={{ boxShadow: "0 0 8px rgba(0,255,65,0.8)" }}
                  />
                </div>
              </div>

              <div className="terminal-border bg-card p-4">
                <div className="text-xs text-muted-foreground mb-2">LIFETIME_CODING_ESTIMATE</div>
                <div className="text-2xl font-bold text-terminal-amber terminal-glow-amber">
                  {formatHours(data.estimatedHours)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Based on industry avg of 10 LOC/hour
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted p-2">
                    <div className="text-muted-foreground">Coffee cups</div>
                    <div className="text-primary">{formatNumber(Math.round(data.estimatedHours * 2.5))}</div>
                  </div>
                  <div className="bg-muted p-2">
                    <div className="text-muted-foreground">Stack Overflows</div>
                    <div className="text-primary">{formatNumber(Math.round(data.codeLines / 50))}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "languages" && (
          <motion.div
            key="languages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="terminal-border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-4">LANGUAGE_LINES_OF_CODE</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topLangs} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" tick={{ fill: "#006622", fontSize: 10, fontFamily: "monospace" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#00ff41", fontSize: 11, fontFamily: "monospace" }}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="lines" radius={0}>
                    {topLangs.map((lang, i) => (
                      <Cell key={i} fill={lang.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.languages.map((lang, i) => (
                <motion.div
                  key={lang.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="terminal-border bg-card p-3 flex items-center gap-3"
                >
                  <div
                    className="w-3 h-3 shrink-0"
                    style={{ backgroundColor: lang.color, boxShadow: `0 0 6px ${lang.color}80` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary font-mono">{lang.name}</span>
                      <span className="text-xs text-muted-foreground">{lang.percentage}%</span>
                    </div>
                    <div className="w-full bg-muted h-1 mt-1">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${lang.percentage}%` }}
                        transition={{ duration: 0.6, delay: i * 0.03 }}
                        className="h-1"
                        style={{ backgroundColor: lang.color }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatNumber(lang.lines)} lines
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "repos" && (
          <motion.div
            key="repos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="terminal-border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-4">TOP_REPOS_BY_LOC</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topRepos} margin={{ left: 0, right: 20, bottom: 40 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#006622", fontSize: 9, fontFamily: "monospace" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fill: "#006622", fontSize: 10, fontFamily: "monospace" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="lines" fill="#00ff41" radius={0}>
                    {topRepos.map((_, i) => (
                      <Cell
                        key={i}
                        fill={`rgba(0, 255, 65, ${1 - i * 0.07})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {data.repositories.map((repo, i) => (
                <motion.div
                  key={repo.name}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="terminal-border bg-card p-3 flex items-start gap-3 hover:border-primary transition-colors group"
                >
                  <span className="text-muted-foreground text-xs w-6 shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm font-mono hover:underline group-hover:terminal-glow"
                      >
                        {repo.name}
                      </a>
                      {repo.isForked && (
                        <span className="text-xs text-muted-foreground border border-border px-1">FORK</span>
                      )}
                      {repo.language && (
                        <span className="text-xs text-muted-foreground">[{repo.language}]</span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{repo.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-primary text-sm font-bold">{formatNumber(repo.lines)}</div>
                    <div className="text-xs text-muted-foreground">lines</div>
                    {repo.stars > 0 && (
                      <div className="text-xs text-terminal-amber">★ {repo.stars}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "world" && (
          <motion.div
            key="world"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CodeWorld
              currentUser={currentUserForWorld}
              leaderboardUsers={leaderboardData}
            />
            <div className="mt-3 text-xs text-muted-foreground text-center font-mono">
              Your base is highlighted in green · Other developers appear as you scan more users
            </div>
          </motion.div>
        )}

        {activeTab === "achievements" && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Achievements data={data} />
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="terminal-border bg-card p-3 mb-4">
              <div className="text-xs text-muted-foreground">
                GLOBAL_LEADERBOARD — Top developers by total lines of code analyzed on GitStat
              </div>
            </div>
            <Leaderboard
              entries={leaderboardData}
              currentUsername={data.username}
            />
            {!leaderboardLoaded && (
              <div className="text-center text-xs text-muted-foreground py-4 font-mono animate-pulse">
                Loading leaderboard...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground py-4 border-t border-border">
        <span>Analyzed {data.reposAnalyzed} repos · </span>
        <span>Last scan: {new Date(data.analyzedAt).toLocaleString()} · </span>
        <button onClick={handleCopyShare} className="text-primary hover:underline">
          Share this report
        </button>
      </div>
    </div>
  );
}