import { useState, useEffect, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import CodeWorld from "@/components/CodeWorld";
import Leaderboard from "@/components/Leaderboard";
import { Github, BarChart3, Globe, Zap, Lock, TrendingUp, ChevronDown, Users, Code2, Activity } from "lucide-react";

const DEMO_USERS = [
  {
    username: "torvalds",
    avatarUrl: "https://avatars.githubusercontent.com/u/1024025?v=4",
    name: "Linus Torvalds",
    totalLines: 4200000,
    percentileRank: 99,
    languages: [
      { name: "C", lines: 2800000, percentage: 67, color: "#555555" },
      { name: "Shell", lines: 700000, percentage: 17, color: "#89e051" },
      { name: "Makefile", lines: 350000, percentage: 8, color: "#427819" },
      { name: "Python", lines: 200000, percentage: 5, color: "#3572A5" },
      { name: "Perl", lines: 150000, percentage: 3, color: "#0298c3" },
    ],
  },
  {
    username: "gaearon",
    avatarUrl: "https://avatars.githubusercontent.com/u/810438?v=4",
    name: "Dan Abramov",
    totalLines: 890000,
    percentileRank: 96,
    languages: [
      { name: "JavaScript", lines: 450000, percentage: 51, color: "#f1e05a" },
      { name: "TypeScript", lines: 280000, percentage: 31, color: "#3178c6" },
      { name: "CSS", lines: 100000, percentage: 11, color: "#563d7c" },
      { name: "HTML", lines: 60000, percentage: 7, color: "#e34c26" },
    ],
  },
  {
    username: "antirez",
    avatarUrl: "https://avatars.githubusercontent.com/u/65632?v=4",
    name: "Salvatore Sanfilippo",
    totalLines: 1650000,
    percentileRank: 98,
    languages: [
      { name: "C", lines: 1200000, percentage: 73, color: "#555555" },
      { name: "Tcl", lines: 200000, percentage: 12, color: "#e4cc98" },
      { name: "Shell", lines: 150000, percentage: 9, color: "#89e051" },
      { name: "Python", lines: 100000, percentage: 6, color: "#3572A5" },
    ],
  },
];

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

const FEATURES = [
  { icon: BarChart3, title: "Real Line Counts", desc: "File-level parsing. Code, comments, blanks — all separated." },
  { icon: Globe, title: "Language Breakdown", desc: "Full distribution across all languages with visual charts." },
  { icon: TrendingUp, title: "Global Percentile", desc: "See how your LOC compares to every developer analyzed." },
  { icon: Zap, title: "Fast & Cached", desc: "Results cached 1 hour. Deep scans in under 30 seconds." },
  { icon: Lock, title: "Private Repos", desc: "Add a GitHub token to include private repositories." },
  { icon: Github, title: "Any Public Profile", desc: "Analyze any GitHub user — no account required." },
];

// Floating HUD panel component
function HudPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`backdrop-blur-xl ${className}`}
      style={{
        background: "rgba(8, 18, 10, 0.97)",
        border: "1.5px solid rgba(0,255,65,0.55)",
        boxShadow: "0 0 40px rgba(0,0,0,0.95), 0 0 20px rgba(0,255,65,0.12), inset 0 0 0 1px rgba(0,255,65,0.08)",
      }}>
      {children}
    </div>
  );
}

// Corner bracket decoration
function CornerBrackets({ color = "rgba(0,255,65,0.3)" }: { color?: string }) {
  const s = { borderColor: color };
  return (
    <>
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={s} />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={s} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={s} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={s} />
    </>
  );
}

export default function Landing() {
  const [bootDone, setBootDone] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activeTab, setActiveTab] = useState<"scan" | "world" | "board">("scan");
  const [worldUserSelected, setWorldUserSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Typewriter
  const PHRASES = [
    "have you written?",
    "did you ship today?",
    "is in production?",
    "defines your career?",
    "makes you a developer?",
    "outlasts your job title?",
    "proves you're a builder?",
    "separates you from the rest?",
    "earns you the top 1%?",
  ];
  const [twPhrase, setTwPhrase] = useState(0);
  const [twDisplayed, setTwDisplayed] = useState("");
  const [twDeleting, setTwDeleting] = useState(false);
  const [twPaused, setTwPaused] = useState(false);

  useEffect(() => {
    if (twPaused) {
      const t = setTimeout(() => { setTwPaused(false); setTwDeleting(true); }, 2200);
      return () => clearTimeout(t);
    }
    const target = PHRASES[twPhrase];
    if (!twDeleting) {
      if (twDisplayed.length < target.length) {
        const t = setTimeout(() => setTwDisplayed(target.slice(0, twDisplayed.length + 1)), 55);
        return () => clearTimeout(t);
      } else { setTwPaused(true); }
    } else {
      if (twDisplayed.length > 0) {
        const t = setTimeout(() => setTwDisplayed(twDisplayed.slice(0, -1)), 28);
        return () => clearTimeout(t);
      } else { setTwDeleting(false); setTwPhrase((p) => (p + 1) % PHRASES.length); }
    }
  }, [twDisplayed, twDeleting, twPaused, twPhrase]);

  const analyzeUser = useAction(api.github.analyzeUser);
  const getAnalysisById = useAction(api.github.getAnalysisById);
  const realLeaderboard = useQuery(api.githubDb.getLeaderboardPublic);

  const codeWorldUsers = (realLeaderboard && realLeaderboard.length > 0) ? realLeaderboard : DEMO_USERS;
  const codeWorldCurrentUser = analysisData ? {
    username: analysisData.username,
    avatarUrl: analysisData.avatarUrl,
    name: analysisData.name,
    totalLines: analysisData.totalLines,
    languages: analysisData.languages,
    percentileRank: analysisData.percentileRank,
  } : undefined;

  const leaderboardEntries = (realLeaderboard || []).map((u: any, i: number) => ({
    rank: i + 1,
    username: u.username,
    avatarUrl: u.avatarUrl,
    name: u.name,
    totalLines: u.totalLines,
    languages: u.languages,
    percentileRank: u.percentileRank,
    reposAnalyzed: u.reposAnalyzed || 0,
    analyzedAt: u.analyzedAt || Date.now(),
  }));

  const BOOT_LINES = [
    "GITM0N v2.4.1 — initializing...",
    "Loading analysis engine...",
    "Connecting to GitHub API...",
    "System ready.",
  ];

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < BOOT_LINES.length) {
        setBootLines((prev) => [...prev, BOOT_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setBootDone(true), 300);
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("user");
    if (uid) { setUsername(uid); handleAnalyze(uid, false); }
  }, []);

  const handleAnalyze = async (uname?: string, forceRefresh = false) => {
    const target = (uname || username).trim();
    if (!target) return;
    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisData(null);
    const progressSteps = [
      { pct: 8, msg: "Fetching user profile..." },
      { pct: 18, msg: "Enumerating repositories..." },
      { pct: 30, msg: "Fetching file trees..." },
      { pct: 50, msg: "Parsing lines of code..." },
      { pct: 70, msg: "Counting code / comments / blanks..." },
      { pct: 85, msg: "Aggregating language stats..." },
      { pct: 93, msg: "Generating report card..." },
    ];
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      if (stepIdx < progressSteps.length) {
        setProgress(progressSteps[stepIdx].pct);
        setProgressMsg(progressSteps[stepIdx].msg);
        stepIdx++;
      }
    }, 2000);
    try {
      const id = await analyzeUser({ username: target, githubToken: githubToken.trim() || undefined, forceRefresh });
      clearInterval(progressInterval);
      setProgress(100);
      setProgressMsg("Analysis complete!");
      const data = await getAnalysisById({ id });
      setAnalysisData(data);
      const url = new URL(window.location.href);
      url.searchParams.set("user", target);
      window.history.pushState({}, "", url.toString());
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setProgress(0);
      if (err.message?.includes("USER_NOT_FOUND")) toast.error(`User '${target}' not found on GitHub`);
      else if (err.message?.includes("RATE_LIMIT")) toast.error("GitHub API rate limit exceeded. Add a token for higher limits.");
      else toast.error(err.message || "Analysis failed");
      return;
    }
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setAnalysisData(null);
    setUsername("");
    setProgress(0);
    const url = new URL(window.location.href);
    url.searchParams.delete("user");
    window.history.pushState({}, "", url.toString());
  };

  const handleForceRefresh = () => handleAnalyze(username, true);

  return (
    <div className="min-h-screen bg-background font-mono overflow-x-hidden">
      <AnimatePresence mode="wait">
        {/* ── BOOT ── */}
        {!bootDone ? (
          <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="fixed inset-0 bg-background flex items-center justify-center z-50"
          >
            <div className="space-y-2 px-8 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-6">
                <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-8 w-8 rounded object-cover" />
                <span className="text-primary terminal-glow font-black tracking-[0.2em] text-sm">GITM0N</span>
              </div>
              {bootLines.map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12 }}
                  className={`text-xs tracking-wide flex items-center gap-2 ${i === bootLines.length - 1 ? "text-primary" : "text-muted-foreground/60"}`}>
                  <span className="text-primary/40">{i === bootLines.length - 1 ? "▶" : "·"}</span>
                  {line}
                </motion.div>
              ))}
            </div>
          </motion.div>

        ) : analysisData ? (
          /* ── DASHBOARD ── */
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <nav className="border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-50 bg-background/98 backdrop-blur-sm">
              <button onClick={handleReset} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-7 w-7 rounded object-cover" />
                <span className="text-primary terminal-glow text-sm font-bold tracking-[0.2em]">GITM0N</span>
              </button>
              <div className="flex gap-2 text-xs">
                <button onClick={handleForceRefresh} disabled={isAnalyzing}
                  className="text-muted-foreground hover:text-primary border border-border hover:border-primary/50 px-3 py-1.5 transition-all disabled:opacity-40">
                  RESCAN
                </button>
                <button onClick={handleReset} className="text-primary-foreground bg-primary px-3 py-1.5 hover:bg-primary/90 transition-all font-bold">
                  NEW SCAN
                </button>
              </div>
            </nav>
            <div className="max-w-6xl mx-auto px-4 py-8">
              <AnalysisDashboard data={analysisData} onReset={handleReset} onRescan={handleForceRefresh} isRescanning={isAnalyzing} />
            </div>
          </motion.div>

        ) : (
          /* ── LANDING ── */
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

            {/* ══════════════════════════════════════════
                IMMERSIVE HERO — CodeWorld fills viewport
            ══════════════════════════════════════════ */}
            <div className="relative w-full" style={{ height: "100vh", minHeight: 600 }}>

              {/* CodeWorld fills the entire background */}
              <div className="absolute inset-0 z-0">
                <CodeWorld
                  leaderboardUsers={codeWorldUsers}
                  currentUser={codeWorldCurrentUser}
                  onUserSelect={(u) => setWorldUserSelected(u !== null)}
                />
              </div>

              {/* Vignette overlay — darkens edges for readability */}
              <div className="absolute inset-0 z-10 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,10,0.7) 100%)" }} />
              {/* Bottom fade into content below */}
              <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, transparent, #0a0a0a)" }} />

              {/* ── TOP NAV (floating) ── */}
              <nav className="absolute top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between">
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="flex items-center gap-3">
                  <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-8 w-8 rounded object-cover border border-primary/30" />
                  <div>
                    <div className="text-primary terminal-glow font-black tracking-[0.2em] text-sm leading-none">GITM0N</div>
                    <div className="text-muted-foreground text-[9px] tracking-widest mt-0.5">GITHUB CODE MONITOR</div>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="flex items-center gap-1">
                  {/* Tab switcher */}
                  {[
                    { id: "scan" as const, label: "SCAN", icon: Code2 },
                    { id: "world" as const, label: "WORLD", icon: Globe },
                    { id: "board" as const, label: "BOARD", icon: Users },
                  ].map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest transition-all border ${
                        activeTab === id
                          ? "border-primary/60 text-primary bg-background/60 backdrop-blur-sm"
                          : "border-transparent text-muted-foreground hover:text-primary hover:border-border/60"
                      }`}>
                      <Icon size={10} />
                      {label}
                    </button>
                  ))}
                </motion.div>
              </nav>

              {/* ── HERO COPY — top-left floating panel ── */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: worldUserSelected ? 0 : 1, x: worldUserSelected ? -24 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 max-w-sm hidden lg:block"
                style={{ pointerEvents: worldUserSelected ? "none" : "auto" }}
              >
                <div className="relative p-6">
                  <CornerBrackets />
                  <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-4 uppercase">// code intelligence</div>
                  <h1 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight mb-3">
                    <span className="text-foreground block">How much code</span>
                    <span className="text-primary terminal-glow block min-h-[1.2em]">
                      {twDisplayed}<span className="animate-pulse">█</span>
                    </span>
                  </h1>
                  <p className="text-xs leading-relaxed mb-5" style={{ color: "rgba(0,255,65,0.5)" }}>
                    Deep-scan every repo. Count every line. Rank globally.
                  </p>
                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { v: "100%", l: "Accuracy" },
                      { v: "30s", l: "Avg scan" },
                      { v: "∞", l: "Profiles" },
                    ].map((s) => (
                      <div key={s.l} className="border border-border/40 bg-background/40 backdrop-blur-sm p-2 text-center">
                        <div className="text-primary font-black text-sm terminal-glow">{s.v}</div>
                        <div className="text-muted-foreground text-[9px] mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setActiveTab("scan"); inputRef.current?.focus(); }}
                    className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-black tracking-widest hover:bg-primary/90 transition-all"
                    style={{ boxShadow: "0 0 20px rgba(0,255,65,0.3)" }}
                  >
                    START SCAN →
                  </button>
                </div>
              </motion.div>

              {/* ── SCAN PANEL — right side floating terminal ── */}
              <AnimatePresence>
                {activeTab === "scan" && (
                  <motion.div
                    key="scan-panel"
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 32 }}
                    transition={{ duration: 0.35 }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-full max-w-sm"
                  >
                    <HudPanel className="overflow-hidden">
                      <CornerBrackets color="rgba(0,255,65,0.5)" />
                      {/* Panel header */}
                      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b" style={{ borderColor: "rgba(0,255,65,0.3)", background: "rgba(0,255,65,0.06)" }}>
                        <div className="w-2 h-2 rounded-full bg-red-500/80" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
                        <div className="w-2 h-2 rounded-full bg-primary/80" />
                        <span className="text-[10px] ml-2 tracking-wider font-bold" style={{ color: "rgba(0,255,65,0.7)" }}>gitm0n — bash</span>
                        <div className="ml-auto flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-[9px] font-bold" style={{ color: "rgba(0,255,65,0.8)" }}>LIVE</span>
                        </div>
                      </div>

                      {/* Input row */}
                      <div className="flex items-center gap-2 px-4 py-4">
                        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                          className="text-primary text-sm shrink-0 font-bold select-none">$</motion.span>
                        <span className="text-sm shrink-0 font-mono select-none" style={{ color: "rgba(0,255,65,0.55)" }}>gitm0n scan</span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !isAnalyzing && handleAnalyze()}
                          placeholder="github-username"
                          disabled={isAnalyzing}
                          className="flex-1 bg-transparent text-primary outline-none text-sm font-mono min-w-0 caret-primary"
                          style={{ "--tw-placeholder-color": "rgba(0,255,65,0.3)" } as any}
                          autoFocus
                        />
                        <AnimatePresence>
                          {username && !isAnalyzing && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                              onClick={() => handleAnalyze()}
                              className="shrink-0 bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-1.5 hover:bg-primary/90 transition-all tracking-wide"
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            >RUN →</motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Token row */}
                      <AnimatePresence>
                        {showTokenInput && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden" style={{ borderTop: "1px solid rgba(0,255,65,0.2)" }}>
                            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(0,255,65,0.04)" }}>
                              <span className="text-xs shrink-0 font-mono font-bold" style={{ color: "rgba(0,255,65,0.6)" }}>--token</span>
                              <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)}
                                placeholder="ghp_xxxx  (optional — private repos)"
                                disabled={isAnalyzing}
                                className="flex-1 bg-transparent text-primary outline-none text-xs font-mono"
                                style={{ "--tw-placeholder-color": "rgba(0,255,65,0.3)" } as any} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Progress */}
                      <AnimatePresence>
                        {isAnalyzing && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="border-t border-border/60 px-4 py-3 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span style={{ color: "rgba(0,255,65,0.65)" }}>{progressMsg}</span>
                              <span className="text-primary font-bold">{progress}%</span>
                            </div>
                            <div className="w-full h-px" style={{ background: "rgba(0,255,65,0.15)" }}>
                              <motion.div className="h-px bg-primary" style={{ boxShadow: "0 0 6px rgba(0,255,65,0.8)" }}
                                animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                            </div>
                            <div className="text-[10px] text-muted-foreground/40">
                              scanning <span className="text-primary">{username}</span><span className="animate-pulse">_</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions */}
                      <div className="px-4 pb-4 pt-2 flex gap-2">
                        <button onClick={() => setShowTokenInput(!showTokenInput)} disabled={isAnalyzing}
                          className="text-[10px] font-bold px-3 py-2 transition-all disabled:opacity-30 shrink-0"
                          style={{ color: "rgba(0,255,65,0.7)", border: "1px solid rgba(0,255,65,0.35)" }}>
                          {showTokenInput ? "Hide token" : "+ Token"}
                        </button>
                        <button onClick={() => handleAnalyze()} disabled={isAnalyzing || !username.trim()}
                          className="flex-1 py-2 bg-primary text-primary-foreground text-xs font-black hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed tracking-widest"
                          style={{ boxShadow: username.trim() ? "0 0 16px rgba(0,255,65,0.25)" : "none" }}>
                          {isAnalyzing ? "SCANNING..." : "ANALYZE →"}
                        </button>
                      </div>

                      <div className="px-4 pb-3 text-center text-[9px] tracking-wide" style={{ color: "rgba(0,255,65,0.45)" }}>
                        Enter · Cached 1hr · Token = 5,000 req/hr
                      </div>
                    </HudPanel>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── LEADERBOARD PANEL — slides in from right ── */}
              <AnimatePresence>
                {activeTab === "board" && (
                  <motion.div
                    key="board-panel"
                    initial={{ opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 32 }}
                    transition={{ duration: 0.35 }}
                    className="absolute right-6 top-20 bottom-6 z-20 w-full max-w-sm overflow-hidden"
                  >
                    <HudPanel className="h-full flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
                        <div className="flex items-center gap-2">
                          <Users size={12} className="text-primary" />
                          <span className="text-xs font-bold tracking-widest text-primary">LEADERBOARD</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground/50">{leaderboardEntries.length} developers</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3">
                        {leaderboardEntries.length > 0 ? (
                          <Leaderboard entries={leaderboardEntries} />
                        ) : (
                          <div className="space-y-2">
                            {DEMO_USERS.map((u, i) => (
                              <div key={u.username} className="flex items-center gap-3 p-2 border border-border/30 bg-muted/10">
                                <span className="text-muted-foreground/40 text-xs w-5 text-center font-bold">#{i + 1}</span>
                                <img src={u.avatarUrl} alt={u.username} className="w-7 h-7 rounded-sm grayscale opacity-60" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-primary/70 font-bold truncate">@{u.username}</div>
                                  <div className="flex gap-1 mt-0.5">
                                    {u.languages.slice(0, 4).map((l) => (
                                      <div key={l.name} className="w-1.5 h-1.5 rounded-full opacity-60" style={{ backgroundColor: l.color }} />
                                    ))}
                                  </div>
                                </div>
                                <div className="text-xs font-bold text-muted-foreground/60">{formatNumber(u.totalLines)}</div>
                              </div>
                            ))}
                            <div className="text-center text-[9px] text-muted-foreground/30 pt-2">Demo data · Scan to join</div>
                          </div>
                        )}
                      </div>
                    </HudPanel>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── WORLD INFO PANEL ── */}
              <AnimatePresence>
                {activeTab === "world" && (
                  <motion.div
                    key="world-panel"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.3 }}
                    className="absolute right-6 top-20 z-20 w-full max-w-xs"
                  >
                    <HudPanel className="p-4">
                      <CornerBrackets />
                      <div className="text-[9px] text-primary/50 tracking-[0.3em] mb-3">// CODEWORLD</div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        Each building represents a developer. Height = total LOC. Colors = primary language.
                        Rotate and explore the city.
                      </p>
                      <div className="space-y-1.5">
                        {codeWorldUsers.slice(0, 4).map((u: any) => (
                          <div key={u.username} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: u.languages[0]?.color || "#00ff41" }} />
                            <span className="text-[10px] text-muted-foreground/70">@{u.username}</span>
                            <span className="text-[10px] text-primary/60 ml-auto">{formatNumber(u.totalLines)}</span>
                          </div>
                        ))}
                      </div>
                    </HudPanel>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── BOTTOM STATUS BAR ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6 lg:hidden"
              >
                {/* Mobile: show headline + CTA */}
                <div className="text-center">
                  <div className="text-lg font-black text-foreground leading-tight">How much code</div>
                  <div className="text-primary terminal-glow font-black text-lg min-h-[1.3em]">
                    {twDisplayed}<span className="animate-pulse">█</span>
                  </div>
                  <button
                    onClick={() => { setActiveTab("scan"); inputRef.current?.focus(); }}
                    className="mt-3 px-6 py-2.5 bg-primary text-primary-foreground text-xs font-black tracking-widest hover:bg-primary/90 transition-all"
                    style={{ boxShadow: "0 0 20px rgba(0,255,65,0.3)" }}
                  >
                    START SCAN →
                  </button>
                </div>
              </motion.div>

              {/* ── COORDINATE DISPLAY (decorative) ── */}
              <div className="absolute bottom-4 left-6 z-20 text-[9px] text-muted-foreground/20 font-mono hidden lg:block">
                <div>SYS: ONLINE</div>
                <div>NODES: {codeWorldUsers.length}</div>
                <div>MODE: LIVE</div>
              </div>

              {/* ── SCROLL HINT ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden lg:flex flex-col items-center gap-1 text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors cursor-pointer"
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                <span className="text-[9px] tracking-[0.3em]">SCROLL</span>
                <ChevronDown size={12} className="animate-bounce" />
              </motion.div>
            </div>

            {/* ══════════════════════════════════════════
                BELOW THE FOLD — Features + How it works
            ══════════════════════════════════════════ */}
            <div ref={featuresRef}>

              {/* ── TICKER BAR ── */}
              <div className="border-y border-border bg-card/20 overflow-hidden">
                <div className="flex items-center divide-x divide-border">
                  {[
                    { v: "100%", l: "File-level accuracy" },
                    { v: "30s", l: "Average scan time" },
                    { v: "1hr", l: "Result cache" },
                    { v: "∞", l: "Public profiles" },
                    { v: "6+", l: "Languages tracked" },
                    { v: "0", l: "Account required" },
                  ].map((s, i) => (
                    <motion.div key={s.l}
                      initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                      className="flex-1 text-center py-5 px-4 min-w-[120px]">
                      <div className="text-xl font-black text-primary terminal-glow">{s.v}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">{s.l}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── FEATURES — asymmetric grid ── */}
              <section className="border-b border-border">
                <div className="max-w-6xl mx-auto px-6 py-20">
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="mb-12">
                    <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-2">// CAPABILITIES</div>
                    <h2 className="text-3xl md:text-4xl font-black text-foreground">
                      Everything you need to<br />
                      <span className="text-primary terminal-glow">understand your code.</span>
                    </h2>
                  </motion.div>

                  {/* Asymmetric: 1 large + 5 small */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/30">
                    {/* Large feature */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      className="md:col-span-1 md:row-span-2 bg-card p-8 flex flex-col justify-between group hover:bg-muted/20 transition-colors"
                    >
                      <div>
                        <div className="w-10 h-10 border border-primary/30 flex items-center justify-center mb-6 group-hover:border-primary/60 transition-colors">
                          <BarChart3 size={18} className="text-primary" />
                        </div>
                        <div className="text-[10px] text-primary/40 tracking-widest mb-2">01</div>
                        <h3 className="text-lg font-black text-foreground mb-3">Real Line Counts</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          File-level parsing across every repository. Code, comments, and blanks — all separated and attributed to the correct language.
                          No estimates. No shortcuts.
                        </p>
                      </div>
                      <div className="mt-8 pt-6 border-t border-border/40">
                        <div className="text-[10px] text-muted-foreground/40 tracking-wide">ACCURACY LEVEL</div>
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(10)].map((_, i) => (
                            <div key={i} className={`h-1.5 flex-1 ${i < 9 ? "bg-primary" : "bg-primary/30"}`}
                              style={{ boxShadow: i < 9 ? "0 0 4px rgba(0,255,65,0.5)" : "none" }} />
                          ))}
                        </div>
                        <div className="text-primary text-xs font-bold mt-1">98% accurate</div>
                      </div>
                    </motion.div>

                    {/* 5 smaller features */}
                    {FEATURES.slice(1).map((f, i) => (
                      <motion.div key={f.title}
                        initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                        className="bg-card p-6 group hover:bg-muted/20 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 border border-border/60 flex items-center justify-center shrink-0 group-hover:border-primary/40 transition-colors mt-0.5">
                            <f.icon size={14} className="text-primary/70 group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <div className="text-[9px] text-primary/30 tracking-widest mb-1">0{i + 2}</div>
                            <h3 className="text-sm font-bold text-foreground mb-1.5">{f.title}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── HOW IT WORKS — horizontal timeline ── */}
              <section className="border-b border-border bg-card/10">
                <div className="max-w-6xl mx-auto px-6 py-20">
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
                    <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-2">// PROCESS</div>
                    <h2 className="text-3xl font-black text-foreground">Three steps.<br /><span className="text-primary terminal-glow">Thirty seconds.</span></h2>
                  </motion.div>

                  <div className="relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-border/60" />
                    <div className="grid md:grid-cols-3 gap-8">
                      {[
                        { n: "01", title: "Enter a username", body: "Any public GitHub handle. Optionally add a personal access token for higher rate limits and private repo access." },
                        { n: "02", title: "Deep repository scan", body: "We fetch every repo, traverse every file tree, and count real lines — split into code, comments, and blanks per language." },
                        { n: "03", title: "Get your report", body: "Language breakdown, top repos by LOC, global percentile rank, estimated coding hours, and a shareable URL." },
                      ].map((item, i) => (
                        <motion.div key={item.n}
                          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                          className="relative">
                          <div className="w-16 h-16 border border-border bg-background flex items-center justify-center mb-6 relative z-10">
                            <span className="text-primary font-black text-lg terminal-glow">{item.n}</span>
                          </div>
                          <h3 className="text-sm font-bold text-foreground mb-2">{item.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── CTA ── */}
              <section className="border-b border-border">
                <div className="max-w-6xl mx-auto px-6 py-24">
                  <div className="grid md:grid-cols-2 gap-12 items-center">
                    <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                      <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-3">// START NOW</div>
                      <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
                        Ready to see your<br />
                        <span className="text-primary terminal-glow">line count?</span>
                      </h2>
                      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                        Takes under 30 seconds. No account required.<br />Just your GitHub username.
                      </p>
                      <button
                        onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => { setActiveTab("scan"); inputRef.current?.focus(); }, 600); }}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-sm font-black hover:bg-primary/90 transition-all tracking-widest"
                        style={{ boxShadow: "0 0 30px rgba(0,255,65,0.25)" }}
                      >
                        <Github size={16} />
                        ANALYZE YOUR GITHUB →
                      </button>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                      className="space-y-3">
                      {[
                        { icon: Activity, label: "Real-time analysis", sub: "Live progress as we scan your repos" },
                        { icon: TrendingUp, label: "Global ranking", sub: "See your percentile among all developers" },
                        { icon: Globe, label: "Shareable report", sub: "Share your code stats with a unique URL" },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-4 p-4 border border-border/40 bg-card/30 hover:border-primary/30 transition-colors">
                          <div className="w-8 h-8 border border-border/60 flex items-center justify-center shrink-0">
                            <item.icon size={14} className="text-primary/60" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">{item.label}</div>
                            <div className="text-xs text-muted-foreground">{item.sub}</div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </section>

              {/* ── FOOTER ── */}
              <footer className="border-t border-border">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/30">
                  <div className="flex items-center gap-3">
                    <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-5 w-5 rounded object-cover opacity-60" />
                    <span className="text-primary/60 font-black tracking-widest">GITM0N</span>
                    <span>GitHub Code Monitor</span>
                    <span className="border border-border/30 px-1.5 py-0.5">v2.4.1</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                    <span>Results cached 1 hour</span>
                    <span>·</span>
                    <span>Public repos by default</span>
                    <span>·</span>
                    <span>No data stored without scan</span>
                  </div>
                </div>
              </footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}