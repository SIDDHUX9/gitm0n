import { motion } from "framer-motion";

interface AnalysisData {
  totalLines: number;
  codeLines: number;
  languages: { name: string; lines: number; percentage: number; color: string }[];
  repositories: { name: string; stars: number; lines: number }[];
  estimatedHours: number;
  percentileRank: number;
  reposAnalyzed: number;
  followers: number;
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
  xp: number;
}

const RARITY_COLORS = {
  common: "#006622",
  rare: "#0066ff",
  epic: "#9900ff",
  legendary: "#ffd700",
};

function getAchievements(data: AnalysisData): Achievement[] {
  const langCount = data.languages.length;
  const topRepo = data.repositories[0];
  const hasStarredRepo = data.repositories.some((r) => r.stars >= 100);

  return [
    {
      id: "first_scan",
      icon: "◈",
      title: "FIRST SCAN",
      description: "Analyzed your GitHub profile",
      unlocked: true,
      rarity: "common",
      xp: 50,
    },
    {
      id: "code_apprentice",
      icon: "◉",
      title: "CODE APPRENTICE",
      description: "Written 1,000+ lines of code",
      unlocked: data.totalLines >= 1000,
      rarity: "common",
      xp: 100,
    },
    {
      id: "code_journeyman",
      icon: "◆",
      title: "CODE JOURNEYMAN",
      description: "Written 10,000+ lines of code",
      unlocked: data.totalLines >= 10000,
      rarity: "common",
      xp: 250,
    },
    {
      id: "code_veteran",
      icon: "◇",
      title: "CODE VETERAN",
      description: "Written 50,000+ lines of code",
      unlocked: data.totalLines >= 50000,
      rarity: "rare",
      xp: 500,
    },
    {
      id: "code_master",
      icon: "★",
      title: "CODE MASTER",
      description: "Written 100,000+ lines of code",
      unlocked: data.totalLines >= 100000,
      rarity: "rare",
      xp: 1000,
    },
    {
      id: "code_legend",
      icon: "⬡",
      title: "CODE LEGEND",
      description: "Written 500,000+ lines of code",
      unlocked: data.totalLines >= 500000,
      rarity: "epic",
      xp: 2500,
    },
    {
      id: "code_god",
      icon: "⬢",
      title: "CODE GOD",
      description: "Written 1,000,000+ lines of code",
      unlocked: data.totalLines >= 1000000,
      rarity: "legendary",
      xp: 10000,
    },
    {
      id: "polyglot",
      icon: "◎",
      title: "POLYGLOT",
      description: "Used 5+ programming languages",
      unlocked: langCount >= 5,
      rarity: "common",
      xp: 200,
    },
    {
      id: "language_collector",
      icon: "◐",
      title: "LANGUAGE COLLECTOR",
      description: "Used 10+ programming languages",
      unlocked: langCount >= 10,
      rarity: "rare",
      xp: 500,
    },
    {
      id: "time_lord",
      icon: "⊕",
      title: "TIME LORD",
      description: "Estimated 1,000+ hours of coding",
      unlocked: data.estimatedHours >= 1000,
      rarity: "rare",
      xp: 750,
    },
    {
      id: "star_gazer",
      icon: "✦",
      title: "STAR GAZER",
      description: "Have a repo with 100+ stars",
      unlocked: hasStarredRepo,
      rarity: "epic",
      xp: 1500,
    },
    {
      id: "top_10",
      icon: "▲",
      title: "ELITE CODER",
      description: "In the top 10% of all developers",
      unlocked: data.percentileRank >= 90,
      rarity: "epic",
      xp: 2000,
    },
    {
      id: "top_1",
      icon: "▲▲",
      title: "LEGENDARY CODER",
      description: "In the top 1% of all developers",
      unlocked: data.percentileRank >= 99,
      rarity: "legendary",
      xp: 5000,
    },
    {
      id: "repo_hoarder",
      icon: "▣",
      title: "REPO HOARDER",
      description: "Analyzed 30+ repositories",
      unlocked: data.reposAnalyzed >= 30,
      rarity: "common",
      xp: 150,
    },
    {
      id: "influencer",
      icon: "◑",
      title: "INFLUENCER",
      description: "500+ GitHub followers",
      unlocked: data.followers >= 500,
      rarity: "rare",
      xp: 600,
    },
  ];
}

function getLevelFromXP(xp: number): { level: number; title: string; nextXP: number } {
  const levels = [
    { xp: 0, title: "SCRIPT KIDDIE" },
    { xp: 200, title: "JUNIOR DEV" },
    { xp: 500, title: "DEVELOPER" },
    { xp: 1000, title: "SENIOR DEV" },
    { xp: 2000, title: "TECH LEAD" },
    { xp: 4000, title: "ARCHITECT" },
    { xp: 7000, title: "PRINCIPAL" },
    { xp: 12000, title: "DISTINGUISHED" },
    { xp: 20000, title: "FELLOW" },
    { xp: 35000, title: "CODE DEITY" },
  ];

  let level = 1;
  let title = levels[0].title;
  let nextXP = levels[1].xp;

  for (let i = 0; i < levels.length; i++) {
    if (xp >= levels[i].xp) {
      level = i + 1;
      title = levels[i].title;
      nextXP = levels[i + 1]?.xp || levels[i].xp;
    }
  }

  return { level, title, nextXP };
}

export default function Achievements({ data }: { data: AnalysisData }) {
  const achievements = getAchievements(data);
  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const totalXP = unlockedAchievements.reduce((s, a) => s + a.xp, 0);
  const { level, title, nextXP } = getLevelFromXP(totalXP);
  const prevLevelXP = getLevelFromXP(totalXP - 1).nextXP;
  const xpProgress = ((totalXP - prevLevelXP) / (nextXP - prevLevelXP)) * 100;

  return (
    <div className="space-y-6">
      {/* XP / Level Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="terminal-border bg-card p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">DEVELOPER_LEVEL</div>
            <div className="text-3xl font-bold text-primary terminal-glow">LVL {level}</div>
            <div className="text-sm text-terminal-amber font-mono">{title}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">TOTAL_XP</div>
            <div className="text-2xl font-bold text-primary">{totalXP.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {unlockedAchievements.length}/{achievements.length} achievements
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>XP Progress to Level {level + 1}</span>
            <span className="text-primary">{totalXP} / {nextXP} XP</span>
          </div>
          <div className="w-full bg-muted h-3 relative overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(xpProgress, 100)}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-3 bg-primary absolute top-0 left-0"
              style={{ boxShadow: "0 0 10px rgba(0,255,65,0.8)" }}
            />
            {/* Shimmer */}
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 h-3 w-8 bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <div>
        <div className="text-xs text-muted-foreground mb-3 font-mono">ACHIEVEMENTS</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {achievements.map((achievement, i) => {
            const rarityColor = RARITY_COLORS[achievement.rarity];
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`terminal-border bg-card p-3 text-center transition-all ${
                  achievement.unlocked
                    ? "hover:scale-105 cursor-default"
                    : "opacity-30 grayscale"
                }`}
                style={
                  achievement.unlocked
                    ? {
                        borderColor: rarityColor,
                        boxShadow: `0 0 10px ${rarityColor}40`,
                      }
                    : {}
                }
              >
                <div
                  className="text-2xl mb-1 font-mono"
                  style={{ color: achievement.unlocked ? rarityColor : "#333" }}
                >
                  {achievement.icon}
                </div>
                <div
                  className="text-xs font-bold font-mono mb-1"
                  style={{ color: achievement.unlocked ? rarityColor : "#333" }}
                >
                  {achievement.title}
                </div>
                <div className="text-xs text-muted-foreground leading-tight">
                  {achievement.description}
                </div>
                {achievement.unlocked && (
                  <div
                    className="text-xs mt-1 font-mono font-bold"
                    style={{ color: rarityColor }}
                  >
                    +{achievement.xp} XP
                  </div>
                )}
                <div
                  className="text-xs mt-1 uppercase font-mono"
                  style={{ color: rarityColor, opacity: 0.7 }}
                >
                  {achievement.rarity}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
