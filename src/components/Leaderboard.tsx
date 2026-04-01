import { motion } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  username: string;
  avatarUrl: string;
  name?: string;
  totalLines: number;
  languages: { name: string; lines: number; percentage: number; color: string }[];
  percentileRank: number;
  reposAnalyzed: number;
  analyzedAt: number;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

const RANK_COLORS: Record<number, string> = {
  1: "#ffd700",
  2: "#c0c0c0",
  3: "#cd7f32",
};

export default function Leaderboard({
  entries,
  currentUsername,
  onSelectUser,
}: {
  entries: LeaderboardEntry[];
  currentUsername?: string;
  onSelectUser?: (username: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="terminal-border bg-card p-8 text-center">
        <div className="text-muted-foreground text-sm font-mono">
          No developers scanned yet. Be the first!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => {
        const isCurrentUser = entry.username === currentUsername;
        const rankColor = RANK_COLORS[entry.rank] || "#006622";

        return (
          <motion.div
            key={entry.username}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelectUser?.(entry.username)}
            className={`terminal-border bg-card p-3 flex items-center gap-3 cursor-pointer transition-all hover:border-primary ${
              isCurrentUser ? "border-primary bg-accent/20" : ""
            }`}
          >
            {/* Rank */}
            <div
              className="text-lg font-bold w-8 text-center shrink-0 font-mono"
              style={{ color: rankColor }}
            >
              {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
            </div>

            {/* Avatar */}
            <img
              src={entry.avatarUrl}
              alt={entry.username}
              className="w-10 h-10 border border-border shrink-0"
              style={
                isCurrentUser
                  ? { borderColor: "#00ff41", filter: "hue-rotate(90deg) saturate(0.5)" }
                  : { filter: "grayscale(50%)" }
              }
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: isCurrentUser ? "#00ff41" : "#00cc33" }}
                >
                  @{entry.username}
                </span>
                {isCurrentUser && (
                  <span className="text-xs border border-primary text-primary px-1 font-mono">
                    YOU
                  </span>
                )}
                {entry.name && (
                  <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
                )}
              </div>
              {/* Language dots */}
              <div className="flex items-center gap-1 mt-1">
                {entry.languages.slice(0, 5).map((l) => (
                  <div
                    key={l.name}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: l.color }}
                    title={l.name}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  {entry.reposAnalyzed} repos
                </span>
              </div>
            </div>

            {/* LOC */}
            <div className="text-right shrink-0">
              <div
                className="text-lg font-bold font-mono"
                style={{ color: rankColor, textShadow: `0 0 8px ${rankColor}80` }}
              >
                {formatNumber(entry.totalLines)}
              </div>
              <div className="text-xs text-muted-foreground">lines</div>
            </div>

            {/* Bar */}
            <div className="hidden sm:block w-20 shrink-0">
              <div className="w-full bg-muted h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(entry.totalLines / (entries[0]?.totalLines || 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.8, delay: i * 0.03 }}
                  className="h-1.5"
                  style={{
                    backgroundColor: rankColor,
                    boxShadow: `0 0 4px ${rankColor}80`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
