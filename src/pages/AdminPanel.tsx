import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Trash2, RefreshCw, Shield, LogOut, Users, Code2 } from "lucide-react";

const ADMIN_PASSWORD = "GITMOAN@sid3116";

interface AnalysisEntry {
  id: string;
  username: string;
  avatarUrl: string;
  name?: string;
  totalLines: number;
  languages: { name: string; lines: number; percentage: number; color: string }[];
  percentileRank: number;
  reposAnalyzed: number;
  analyzedAt: number;
}

function formatLines(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const getAllAnalyses = useAction(api.github.adminGetAllAnalyses);
  const deleteAnalysis = useAction(api.github.adminDeleteAnalysis);

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
      loadAnalyses();
    } else {
      setPwError(true);
      setPwInput("");
    }
  };

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const data = await getAllAnalyses({});
      setAnalyses(data.sort((a: AnalysisEntry, b: AnalysisEntry) => b.analyzedAt - a.analyzedAt));
    } catch {
      toast.error("Failed to load analyses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      await deleteAnalysis({ id });
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success(`Deleted @${username}`);
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = analyses.filter(
    (a) =>
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      (a.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!authed) {
    return (
      <div className="min-h-screen bg-background font-mono flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm p-8 relative"
          style={{
            background: "rgba(0,0,0,0.95)",
            border: "1.5px solid rgba(0,255,65,0.4)",
            boxShadow: "0 0 40px rgba(0,255,65,0.1)",
          }}
        >
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

          <div className="flex items-center gap-3 mb-8">
            <Shield size={20} className="text-primary" />
            <div>
              <div className="text-primary font-black tracking-[0.2em] text-sm">ADMIN ACCESS</div>
              <div className="text-muted-foreground text-[10px] tracking-widest">GITM0N CONTROL PANEL</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] text-muted-foreground tracking-widest mb-1.5">PASSWORD</div>
              <input
                type="password"
                value={pwInput}
                onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
                className="w-full bg-transparent border px-3 py-2 text-sm text-foreground outline-none transition-colors"
                style={{
                  borderColor: pwError ? "rgba(255,60,60,0.8)" : "rgba(0,255,65,0.3)",
                  boxShadow: pwError ? "0 0 8px rgba(255,60,60,0.2)" : undefined,
                }}
                autoFocus
              />
              {pwError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] mt-1.5"
                  style={{ color: "rgba(255,80,80,0.9)" }}
                >
                  ACCESS DENIED — incorrect password
                </motion.div>
              )}
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-2.5 text-xs font-black tracking-widest transition-all"
              style={{
                background: "rgba(0,255,65,0.15)",
                border: "1px solid rgba(0,255,65,0.5)",
                color: "#00ff41",
              }}
            >
              AUTHENTICATE →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between border-b"
        style={{ background: "rgba(0,0,0,0.95)", borderColor: "rgba(0,255,65,0.2)" }}
      >
        <div className="flex items-center gap-3">
          <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-7 w-7 rounded object-cover border border-primary/30" />
          <div>
            <div className="text-primary font-black tracking-[0.2em] text-sm leading-none">GITM0N</div>
            <div className="text-muted-foreground text-[9px] tracking-widest">ADMIN PANEL</div>
          </div>
          <div
            className="ml-4 px-2 py-0.5 text-[9px] tracking-widest"
            style={{ background: "rgba(0,255,65,0.1)", border: "1px solid rgba(0,255,65,0.3)", color: "#00ff41" }}
          >
            AUTHENTICATED
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAnalyses}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest transition-all border border-border/40 text-muted-foreground hover:text-primary hover:border-primary/40 disabled:opacity-40"
          >
            <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
            REFRESH
          </button>
          <button
            onClick={() => { setAuthed(false); setPwInput(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest transition-all border border-border/40 text-muted-foreground hover:text-red-400 hover:border-red-400/40"
          >
            <LogOut size={10} />
            LOGOUT
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: "Total Users", value: analyses.length.toString() },
            { icon: Code2, label: "Total LOC", value: formatLines(analyses.reduce((s, a) => s + a.totalLines, 0)) },
            { icon: Shield, label: "Avg Percentile", value: analyses.length ? `${Math.round(analyses.reduce((s, a) => s + a.percentileRank, 0) / analyses.length)}%` : "—" },
            { icon: RefreshCw, label: "Latest Scan", value: analyses.length ? formatDate(Math.max(...analyses.map((a) => a.analyzedAt))).split(",")[0] : "—" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 border"
              style={{ background: "rgba(0,0,0,0.6)", borderColor: "rgba(0,255,65,0.15)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <stat.icon size={12} className="text-primary/60" />
                <span className="text-[9px] tracking-widest text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-lg font-black text-primary">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or name..."
            className="w-full max-w-sm bg-transparent border px-3 py-2 text-sm text-foreground outline-none"
            style={{ borderColor: "rgba(0,255,65,0.25)" }}
          />
        </div>

        {/* Table */}
        <div className="border" style={{ borderColor: "rgba(0,255,65,0.15)" }}>
          {/* Table header */}
          <div
            className="grid grid-cols-12 gap-4 px-4 py-2 text-[9px] tracking-widest text-muted-foreground border-b"
            style={{ borderColor: "rgba(0,255,65,0.1)", background: "rgba(0,255,65,0.03)" }}
          >
            <div className="col-span-4">USER</div>
            <div className="col-span-2">TOTAL LOC</div>
            <div className="col-span-2">REPOS</div>
            <div className="col-span-2">ANALYZED</div>
            <div className="col-span-2 text-right">ACTIONS</div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground text-xs tracking-widest">
              <RefreshCw size={16} className="animate-spin mx-auto mb-3 text-primary/40" />
              LOADING...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-xs tracking-widest">
              {search ? "NO RESULTS FOUND" : "NO ANALYSES YET"}
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b transition-colors hover:bg-white/[0.02]"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  {/* User */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <img
                      src={entry.avatarUrl}
                      alt={entry.username}
                      className="w-8 h-8 rounded-sm shrink-0"
                      style={{ border: "1px solid rgba(0,255,65,0.3)" }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-primary truncate">@{entry.username}</div>
                      {entry.name && (
                        <div className="text-[10px] text-muted-foreground truncate">{entry.name}</div>
                      )}
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {entry.languages.slice(0, 2).map((l) => (
                          <span
                            key={l.name}
                            className="text-[9px] px-1 py-0.5"
                            style={{ backgroundColor: `${l.color}22`, color: l.color, border: `1px solid ${l.color}44` }}
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* LOC */}
                  <div className="col-span-2">
                    <div className="text-sm font-bold text-foreground">{formatLines(entry.totalLines)}</div>
                    <div className="text-[9px] text-muted-foreground">TOP {Math.round(100 - entry.percentileRank)}%</div>
                  </div>

                  {/* Repos */}
                  <div className="col-span-2 text-sm text-foreground">{entry.reposAnalyzed}</div>

                  {/* Date */}
                  <div className="col-span-2 text-[10px] text-muted-foreground">{formatDate(entry.analyzedAt)}</div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => handleDelete(entry.id, entry.username)}
                      disabled={deletingId === entry.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-widest transition-all border disabled:opacity-40"
                      style={
                        confirmDelete === entry.id
                          ? { borderColor: "rgba(255,60,60,0.8)", color: "rgba(255,80,80,0.9)", background: "rgba(255,0,0,0.1)" }
                          : { borderColor: "rgba(255,60,60,0.3)", color: "rgba(255,80,80,0.7)" }
                      }
                    >
                      {deletingId === entry.id ? (
                        <RefreshCw size={10} className="animate-spin" />
                      ) : (
                        <Trash2 size={10} />
                      )}
                      {confirmDelete === entry.id ? "CONFIRM?" : "DELETE"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="mt-4 text-[10px] text-muted-foreground tracking-widest">
            {filtered.length} of {analyses.length} entries
          </div>
        )}
      </div>
    </div>
  );
}
