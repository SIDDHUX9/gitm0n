import { useState, useEffect, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import CodeWorld, { type CodeWorldHandle } from "@/components/CodeWorld";
import Leaderboard from "@/components/Leaderboard";
import { Github, BarChart3, Globe, Zap, Lock, TrendingUp, ChevronDown, Users, Code2, Activity, Maximize2, Minimize2, Search, Linkedin, ExternalLink, Download } from "lucide-react";
import { Link } from "react-router";

const CREATOR_USERNAME = "SIDDHUX9";

const DEMO_USERS = [
  {
    username: "SIDDHUX9",
    avatarUrl: "https://avatars.githubusercontent.com/SIDDHUX9",
    name: "Siddhu Singh",
    totalLines: 320000,
    percentileRank: 88,
    isCreator: true,
    languages: [
      { name: "TypeScript", lines: 140000, percentage: 44, color: "#3178c6" },
      { name: "JavaScript", lines: 80000, percentage: 25, color: "#f1e05a" },
      { name: "Python", lines: 55000, percentage: 17, color: "#3572A5" },
      { name: "CSS", lines: 30000, percentage: 9, color: "#563d7c" },
      { name: "HTML", lines: 15000, percentage: 5, color: "#e34c26" },
    ],
  },
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
function HudPanel({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`backdrop-blur-xl ${className}`}
      style={{
        background: "rgba(0, 20, 8, 0.96)",
        border: "2px solid #00ff41",
        boxShadow: "0 0 0 1px rgba(0,255,65,0.15), 0 0 30px rgba(0,255,65,0.35), 0 8px 40px rgba(0,0,0,0.9)",
        ...style,
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

// Controls hint shown for 2s when entering world mode
function WorldControlsHint({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), 2000);
    } else {
      setVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="world-controls"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 pointer-events-none"
          style={{ background: "rgba(0,10,4,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(0,255,65,0.15)", padding: "10px 20px" }}
        >
          {[["Drag","Rotate"],["Scroll","Zoom"],["Tap","Inspect"],["Esc","Exit"]].map(([k, v]) => (
            <span key={k} className="text-[10px] font-mono" style={{ color: "rgba(0,255,65,0.5)" }}>
              <span style={{ color: "rgba(0,255,65,0.8)" }}>{k}</span> {v}
            </span>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Social links for the creator
const SOCIAL_LINKS = [
  { href: "https://www.linkedin.com/in/siddhu-singh/", icon: Linkedin, label: "LinkedIn", color: "#0a66c2" },
  { href: "https://github.com/SIDDHUX9", icon: Github, label: "GitHub", color: "#e6edf3" },
  { href: "https://www.siddhu.info/", icon: ExternalLink, label: "Portfolio", color: "#00ff41" },
];

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
  const [worldPanelHidden, setWorldPanelHidden] = useState(false);
  const [boardPanelHidden, setBoardPanelHidden] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const codeWorldRef = useRef<CodeWorldHandle>(null);
  const [worldSearch, setWorldSearch] = useState("");
  const [worldSearchFocused, setWorldSearchFocused] = useState(false);
  const [isWorldFullscreen, setIsWorldFullscreen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

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

  // Keyboard shortcut: press "/" to focus scan input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setActiveTab("scan");
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape" && activeTab === "world") {
        setActiveTab("scan");
        document.body.style.overflow = "";
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab]);

  // Lock body scroll when world tab is active; reset info bar when entering world
  useEffect(() => {
    if (activeTab === "world") {
      document.body.style.overflow = "hidden";
      setWorldPanelHidden(false);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [activeTab]);

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
      else if (err.message?.includes("RATE_LIMIT")) {
        const resetTime = err.message.split(":")[1];
        toast.error(`GitHub rate limit hit. Resets at ${resetTime || "soon"}. Add a token in the "+ Token" field for 5,000 req/hr.`, { duration: 8000 });
      }
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

  const worldSearchSuggestions = (codeWorldRef.current?.allUsers || []).filter(
    (u) => worldSearch.trim() && u.username.toLowerCase().includes(worldSearch.toLowerCase())
  ).slice(0, 5);

  const handleWorldSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (worldSearch.trim()) {
      codeWorldRef.current?.searchUser(worldSearch.trim());
      setWorldSearchFocused(false);
    }
  };

  const handleWorldSearchSelect = (username: string) => {
    setWorldSearch(username);
    setWorldSearchFocused(false);
    codeWorldRef.current?.searchUser(username);
  };

  const toggleWorldFullscreen = () => {
    if (!document.fullscreenElement) {
      heroRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsWorldFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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
            <nav className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-background/98 backdrop-blur-sm">
              <button onClick={handleReset} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-7 w-7 rounded object-cover" />
                <span className="text-primary terminal-glow text-sm font-bold tracking-[0.2em]">GITM0N</span>
              </button>
              <div className="flex items-center gap-2">
                {/* Social links */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {SOCIAL_LINKS.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                      title={s.label}
                      className="w-7 h-7 flex items-center justify-center border border-border/40 hover:border-primary/50 transition-all hover:bg-primary/5"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = s.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                    >
                      <s.icon size={12} />
                    </a>
                  ))}
                </div>
                <div className="flex gap-1.5 text-xs items-center">
                  <Link to="/download"
                    className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-primary border border-border/40 hover:border-primary/50 px-2 py-1.5 transition-all text-[10px]">
                    <Download size={10} />
                    CLI
                  </Link>
                  <button onClick={handleForceRefresh} disabled={isAnalyzing}
                    className="text-muted-foreground hover:text-primary border border-border hover:border-primary/50 px-2 py-1.5 transition-all disabled:opacity-40 text-[10px]">
                    RESCAN
                  </button>
                  <button onClick={handleReset} className="text-primary-foreground bg-primary px-2 py-1.5 hover:bg-primary/90 transition-all font-bold text-[10px]">
                    NEW SCAN
                  </button>
                </div>
              </div>
            </nav>
            <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
              <AnalysisDashboard data={analysisData} onReset={handleReset} onRescan={handleForceRefresh} isRescanning={isAnalyzing} />
            </div>
          </motion.div>

        ) : (
          /* ── LANDING ── */
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>

            {/* ══════════════════════════════════════════
                IMMERSIVE HERO — CodeWorld fills viewport
            ══════════════════════════════════════════ */}
            <div ref={heroRef} className="relative w-full" style={{ height: "100vh", minHeight: 560 }}>

              {/* CodeWorld fills the entire background */}
              <div className="absolute inset-0 z-0">
                <CodeWorld
                  ref={codeWorldRef}
                  leaderboardUsers={codeWorldUsers}
                  currentUser={codeWorldCurrentUser}
                  onUserSelect={(u) => {
                    setWorldUserSelected(u !== null);
                    if (u !== null) setActiveTab("world");
                  }}
                />
              </div>

              {/* Vignette overlay */}
              <div className="absolute inset-0 z-10 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,10,0.7) 100%)" }} />
              {/* Bottom fade */}
              {activeTab !== "world" && (
                <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
                  style={{ background: "linear-gradient(to bottom, transparent, #0a0a0a)" }} />
              )}

              {/* ── TOP NAV (floating) ── */}
              <nav className="absolute top-0 left-0 right-0 z-30 px-3 sm:px-4 py-3 flex items-center gap-2">
                {/* Logo */}
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 shrink-0">
                  <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-7 w-7 rounded object-cover border border-primary/30" />
                  <div className="hidden sm:block">
                    <div className="text-primary terminal-glow font-black tracking-[0.2em] text-xs leading-none">GITM0N</div>
                    <div className="text-muted-foreground text-[8px] tracking-widest mt-0.5">CODE MONITOR</div>
                  </div>
                </motion.div>

                {/* Tab switcher */}
                <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                  className="flex items-center gap-0.5 sm:gap-1">
                  {[
                    { id: "scan" as const, label: "SCAN", icon: Code2 },
                    { id: "world" as const, label: "WORLD", icon: Globe },
                    { id: "board" as const, label: "BOARD", icon: Users },
                  ].map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 text-[9px] sm:text-[10px] tracking-widest transition-all border ${
                        activeTab === id
                          ? id === "world"
                            ? "border-primary text-primary bg-primary/10 backdrop-blur-sm"
                            : "border-primary/60 text-primary bg-background/60 backdrop-blur-sm"
                          : id === "world"
                            ? "border-primary/30 text-primary/70 hover:text-primary hover:border-primary/60 hover:bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-primary hover:border-border/60"
                      }`}
                      style={id === "world" && activeTab !== "world" ? { boxShadow: "0 0 8px rgba(0,255,65,0.15)" } : undefined}
                    >
                      <Icon size={9} />
                      <span className={id === "world" ? "inline" : "hidden xs:inline sm:inline"}>{label}</span>
                    </button>
                  ))}
                </motion.div>

                {/* World search — only visible on world tab */}
                <AnimatePresence>
                  {activeTab === "world" && (
                    <motion.form
                      key="world-search"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleWorldSearch}
                      className="relative flex-1 max-w-[160px] sm:max-w-[200px]"
                    >
                      <div className="relative flex items-center">
                        <Search size={10} className="absolute left-2 text-muted-foreground/50 pointer-events-none" />
                        <input
                          type="text"
                          value={worldSearch}
                          onChange={(e) => { setWorldSearch(e.target.value); setWorldSearchFocused(true); }}
                          onFocus={() => setWorldSearchFocused(true)}
                          onBlur={() => setTimeout(() => setWorldSearchFocused(false), 150)}
                          placeholder="find user..."
                          className="w-full bg-black/70 border border-border/60 text-[10px] font-mono text-foreground placeholder:text-muted-foreground/40 pl-6 pr-2 py-1.5 focus:outline-none focus:border-primary/60 transition-colors backdrop-blur-sm"
                        />
                      </div>
                      {worldSearchFocused && worldSearchSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-0.5 bg-black/95 border border-border z-50">
                          {worldSearchSuggestions.map((u) => (
                            <button
                              key={u.username}
                              type="button"
                              onMouseDown={() => handleWorldSearchSelect(u.username)}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono hover:bg-primary/10 transition-colors text-left"
                            >
                              <img src={u.avatarUrl} alt={u.username} className="w-4 h-4 rounded-sm shrink-0" />
                              <span className="text-foreground">@{u.username}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Fullscreen button — only on world tab, hidden on mobile */}
                <AnimatePresence>
                  {activeTab === "world" && (
                    <motion.button
                      key="fullscreen-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={toggleWorldFullscreen}
                      className="hidden sm:flex shrink-0 items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-primary border border-border/40 hover:border-primary/40 px-2 py-1.5 transition-all backdrop-blur-sm bg-black/40"
                      title={isWorldFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                      {isWorldFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                      <span className="hidden sm:inline">{isWorldFullscreen ? "EXIT" : "FULL"}</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Social links — top right */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="ml-auto flex items-center gap-1 shrink-0"
                >
                  {SOCIAL_LINKS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={s.label}
                      className="w-7 h-7 flex items-center justify-center border border-transparent hover:border-primary/40 transition-all hover:bg-primary/5 backdrop-blur-sm"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = s.color; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
                    >
                      <s.icon size={13} />
                    </a>
                  ))}
                  {/* CLI download link */}
                  <Link to="/download"
                    className="hidden sm:flex items-center gap-1 px-2 py-1.5 text-[9px] tracking-widest border border-primary/30 text-primary/70 hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-all backdrop-blur-sm ml-1"
                  >
                    <Download size={9} />
                    CLI
                  </Link>
                  {/* Keyboard hint — desktop only */}
                  <div className="hidden lg:flex items-center gap-1 ml-2 text-[9px] text-muted-foreground/25 font-mono">
                    <kbd className="border border-border/30 px-1 py-0.5 rounded-sm">/</kbd>
                    <span>scan</span>
                  </div>
                </motion.div>
              </nav>

              {/* ── HERO COPY — desktop: top-left floating panel, mobile: hidden (shown below) ── */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: worldUserSelected || activeTab === "world" ? 0 : 1, x: worldUserSelected || activeTab === "world" ? -24 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 max-w-sm hidden lg:block"
                style={{ pointerEvents: worldUserSelected || activeTab === "world" ? "none" : "auto" }}
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setActiveTab("scan"); inputRef.current?.focus(); }}
                      className="flex-1 py-2.5 bg-primary text-primary-foreground text-xs font-black tracking-widest hover:bg-primary/90 transition-all"
                      style={{ boxShadow: "0 0 20px rgba(0,255,65,0.3)" }}
                    >
                      START SCAN →
                    </button>
                    <button
                      onClick={() => setActiveTab("world")}
                      className="px-3 py-2.5 text-xs font-black tracking-widest transition-all border border-primary/40 text-primary hover:bg-primary/10"
                      title="Enter CodeWorld"
                    >
                      <Globe size={14} />
                    </button>
                  </div>
                  {/* Creator badge */}
                  <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border/30">
                    <img src="https://avatars.githubusercontent.com/SIDDHUX9" alt="SIDDHUX9" className="w-5 h-5 rounded-sm" style={{ border: "1px solid rgba(255,180,0,0.6)" }} />
                    <span className="text-[9px] text-muted-foreground/40">Built by</span>
                    <a href="https://www.siddhu.info/" target="_blank" rel="noopener noreferrer"
                      className="text-[9px] font-bold transition-colors hover:text-primary"
                      style={{ color: "rgba(255,180,0,0.7)" }}>
                      @SIDDHUX9
                    </a>
                    <div className="flex items-center gap-1 ml-auto">
                      {SOCIAL_LINKS.map((s) => (
                        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                          className="opacity-30 hover:opacity-80 transition-opacity"
                          style={{ color: s.color }}>
                          <s.icon size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── SCAN PANEL — desktop: right side; mobile: bottom-center ── */}
              <AnimatePresence>
                {activeTab === "scan" && (
                  <motion.div
                    key="scan-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.35 }}
                    className="absolute z-20 w-full px-3 sm:px-0
                      bottom-4 left-0 right-0
                      sm:bottom-auto sm:left-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2 sm:max-w-sm sm:w-auto"
                  >
                    <HudPanel className="overflow-hidden">
                      <CornerBrackets color="rgba(0,255,65,0.5)" />
                      {/* Panel header */}
                      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b" style={{ borderColor: "#00ff41", background: "rgba(0,255,65,0.12)" }}>
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full" style={{ background: "#00ff41" }} />
                        <span className="text-[10px] ml-2 tracking-wider font-bold" style={{ color: "#00ff41" }}>gitm0n — bash</span>
                        <div className="ml-auto flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00ff41" }} />
                          <span className="text-[9px] font-bold" style={{ color: "#00ff41" }}>LIVE</span>
                        </div>
                      </div>

                      {/* Mobile hero headline — only on mobile */}
                      <div className="lg:hidden px-4 pt-3 pb-1">
                        <div className="text-sm font-black text-foreground leading-tight">How much code</div>
                        <div className="text-primary terminal-glow font-black text-sm min-h-[1.2em]">
                          {twDisplayed}<span className="animate-pulse">█</span>
                        </div>
                      </div>

                      {/* Input row */}
                      <div className="flex items-center gap-2 px-4 py-3">
                        <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                          className="text-sm shrink-0 font-bold select-none" style={{ color: "#00ff41" }}>$</motion.span>
                        <span className="text-sm shrink-0 font-mono select-none font-bold hidden sm:inline" style={{ color: "rgba(0,255,65,0.75)" }}>gitm0n scan</span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !isAnalyzing && handleAnalyze()}
                          placeholder="github-username"
                          disabled={isAnalyzing}
                          className="flex-1 bg-transparent outline-none text-sm font-mono min-w-0"
                          style={{ color: "#00ff41", caretColor: "#00ff41" }}
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

                      {/* Quick scan */}
                      <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] text-muted-foreground/30">Try:</span>
                        {["SIDDHUX9", "torvalds", "gaearon"].map((u) => (
                          <button
                            key={u}
                            onClick={() => { setUsername(u); setTimeout(() => handleAnalyze(u), 50); }}
                            disabled={isAnalyzing}
                            className="text-[9px] font-mono px-2 py-0.5 border transition-all disabled:opacity-30"
                            style={u === "SIDDHUX9"
                              ? { borderColor: "rgba(255,180,0,0.5)", color: "rgba(255,180,0,0.8)", background: "rgba(255,180,0,0.05)" }
                              : { borderColor: "rgba(0,255,65,0.2)", color: "rgba(0,255,65,0.5)" }
                            }
                          >
                            {u === "SIDDHUX9" ? "★ " : ""}{u}
                          </button>
                        ))}
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

                      <div className="px-4 pb-3 text-center text-[9px] tracking-wide font-bold" style={{ color: "rgba(0,255,65,0.7)" }}>
                        Enter · Cached 1hr · Token = 5,000 req/hr
                      </div>
                    </HudPanel>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── LEADERBOARD PANEL — desktop: right side; mobile: bottom overlay ── */}
              <AnimatePresence>
                {activeTab === "board" && (
                  <motion.div
                    key="board-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.35 }}
                    className="absolute z-20 w-full px-3
                      bottom-0 left-0 right-0 max-h-[60vh]
                      sm:bottom-auto sm:left-auto sm:right-6 sm:top-20 sm:bottom-6 sm:w-auto sm:max-w-sm sm:max-h-none sm:px-0 overflow-hidden"
                  >
                    <HudPanel className="h-full flex flex-col overflow-hidden" style={{ maxHeight: "inherit" }}>
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
                              <div key={u.username} className="flex items-center gap-3 p-2 border transition-colors"
                                style={u.username === CREATOR_USERNAME
                                  ? { borderColor: "rgba(255,180,0,0.4)", background: "rgba(255,180,0,0.04)" }
                                  : { borderColor: "rgba(255,255,255,0.06)", background: "transparent" }
                                }>
                                <span className="text-muted-foreground/40 text-xs w-5 text-center font-bold">#{i + 1}</span>
                                <img src={u.avatarUrl} alt={u.username} className="w-7 h-7 rounded-sm"
                                  style={u.username === CREATOR_USERNAME ? { border: "1px solid rgba(255,180,0,0.6)", opacity: 1 } : { opacity: 0.6, filter: "grayscale(1)" }} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold truncate flex items-center gap-1"
                                    style={{ color: u.username === CREATOR_USERNAME ? "rgba(255,180,0,0.9)" : "rgba(0,255,65,0.7)" }}>
                                    {u.username === CREATOR_USERNAME && <span className="text-[8px]">★</span>}
                                    @{u.username}
                                  </div>
                                  <div className="flex gap-1 mt-0.5">
                                    {u.languages.slice(0, 4).map((l) => (
                                      <div key={l.name} className="w-1.5 h-1.5 rounded-full opacity-60" style={{ backgroundColor: l.color }} />
                                    ))}
                                  </div>
                                </div>
                                <div className="text-xs font-bold" style={{ color: u.username === CREATOR_USERNAME ? "rgba(255,180,0,0.7)" : "rgba(255,255,255,0.4)" }}>
                                  {formatNumber(u.totalLines)}
                                </div>
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

              {/* Controls hint — shown for 2s when entering world, then fades out */}
              <WorldControlsHint active={activeTab === "world"} />

              {/* ── COORDINATE DISPLAY (decorative) — desktop only ── */}
              <div className="absolute bottom-4 left-6 z-20 text-[9px] text-muted-foreground/20 font-mono hidden lg:block">
                <div>SYS: ONLINE</div>
                <div>NODES: {codeWorldUsers.length}</div>
                <div>MODE: LIVE</div>
              </div>

              {/* ── SCROLL HINT (non-world) — desktop only ── */}
              {activeTab !== "world" && (
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
              )}

              {/* ── WORLD MODE: EXIT BUTTON + INFO BAR stacked at bottom ── */}
              <AnimatePresence>
                {activeTab === "world" && (
                  <motion.div
                    key="world-bottom-stack"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="absolute bottom-0 left-0 right-0 z-30 flex flex-col items-center"
                  >
                    {/* Exit button floats just above the info bar */}
                    <button
                      onClick={() => {
                        setActiveTab("scan");
                        document.body.style.overflow = "";
                        featuresRef.current?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="mb-0 flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest transition-all"
                      style={{
                        background: "rgba(0, 20, 8, 0.95)",
                        border: "1px solid rgba(0,255,65,0.5)",
                        borderBottom: "none",
                        color: "rgba(0,255,65,0.85)",
                        boxShadow: "0 -4px 12px rgba(0,255,65,0.15)",
                      }}
                      title="Exit World"
                    >
                      <ChevronDown size={11} />
                      ↓ EXIT
                    </button>
                    {/* Info bar — closeable */}
                    <AnimatePresence>
                      {!worldPanelHidden && (
                        <motion.div
                          key="world-info-bar"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="w-full flex items-center gap-3 px-4 py-2.5"
                          style={{ background: "rgba(0,8,3,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(0,255,65,0.35)" }}
                        >
                          <span className="text-xs text-center font-mono flex-1 leading-relaxed" style={{ color: "#00ff41", textShadow: "0 0 6px rgba(0,255,65,0.4)" }}>
                            Each building represents a developer. Height = total LOC. Colors = primary language. Rotate and explore the city.
                          </span>
                          <button
                            onClick={() => setWorldPanelHidden(true)}
                            className="shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
                            style={{ color: "rgba(0,255,65,0.5)", border: "1px solid rgba(0,255,65,0.25)" }}
                            title="Dismiss"
                          >✕</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ══════════════════════════════════════════
                BELOW THE FOLD — Features + How it works
            ══════════════════════════════════════════ */}
            <div ref={featuresRef}>

              {/* ── TICKER BAR ── */}
              <div className="border-y border-border bg-card/20 overflow-x-auto">
                <div className="flex items-center divide-x divide-border min-w-max sm:min-w-0 sm:flex-wrap">
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
                      className="flex-1 text-center py-4 px-4 min-w-[100px]">
                      <div className="text-lg sm:text-xl font-black text-primary terminal-glow">{s.v}</div>
                      <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 tracking-wide">{s.l}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── FEATURES ── */}
              <section className="border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="mb-8 sm:mb-12">
                    <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-2">// CAPABILITIES</div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground">
                      Everything you need to<br />
                      <span className="text-primary terminal-glow">understand your code.</span>
                    </h2>
                  </motion.div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-border/30">
                    {/* Large feature — first one spans full width on mobile */}
                    {FEATURES.map((f, i) => (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.07 }}
                        className={`bg-background p-6 sm:p-8 ${i === 0 ? "sm:col-span-2 md:col-span-1" : ""}`}
                      >
                        <f.icon size={20} className="text-primary mb-4 opacity-70" />
                        <h3 className="text-sm font-bold text-foreground mb-2">{f.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── HOW IT WORKS ── */}
              <section className="border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
                  <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 sm:mb-12">
                    <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-2">// PROCESS</div>
                    <h2 className="text-2xl sm:text-3xl font-black text-foreground">Three steps.<br /><span className="text-primary terminal-glow">Thirty seconds.</span></h2>
                  </motion.div>

                  <div className="relative">
                    <div className="hidden md:block absolute top-8 left-0 right-0 h-px bg-border/60" />
                    <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                      {[
                        { n: "01", title: "Enter a username", body: "Any public GitHub handle. Optionally add a personal access token for higher rate limits and private repo access." },
                        { n: "02", title: "Deep repository scan", body: "We fetch every repo, traverse every file tree, and count real lines — split into code, comments, and blanks per language." },
                        { n: "03", title: "Get your report", body: "Language breakdown, top repos by LOC, global percentile rank, estimated coding hours, and a shareable URL." },
                      ].map((item, i) => (
                        <motion.div key={item.n}
                          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                          className="relative">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 border border-border bg-background flex items-center justify-center mb-4 sm:mb-6 relative z-10">
                            <span className="text-primary font-black text-base sm:text-lg terminal-glow">{item.n}</span>
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
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
                  <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
                    <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                      <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-3">// START NOW</div>
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-4">
                        Ready to see your<br />
                        <span className="text-primary terminal-glow">line count?</span>
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                        Takes under 30 seconds. No account required.<br />Just your GitHub username.
                      </p>
                      <button
                        onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => { setActiveTab("scan"); inputRef.current?.focus(); }, 600); }}
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 sm:px-8 py-3 sm:py-4 text-sm font-black hover:bg-primary/90 transition-all tracking-widest"
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
                        <div key={item.label} className="flex items-center gap-4 p-3 sm:p-4 border border-border/40 bg-card/30 hover:border-primary/30 transition-colors">
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
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-muted-foreground/30">
                  <div className="flex items-center gap-3">
                    <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-5 w-5 rounded object-cover opacity-60" />
                    <span className="text-primary/60 font-black tracking-widest">GITM0N</span>
                    <span className="hidden sm:inline">GitHub Code Monitor</span>
                    <span className="border border-border/30 px-1.5 py-0.5">v2.4.1</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
                    <span>Results cached 1 hour</span>
                    <span className="hidden sm:inline">·</span>
                    <span>Public repos by default</span>
                    <span className="hidden sm:inline">·</span>
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