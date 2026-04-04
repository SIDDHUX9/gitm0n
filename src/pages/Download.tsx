import { motion } from "framer-motion";
import { Download, Terminal, Github, ChevronRight, Code2, BarChart3, Globe, Zap, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CLI_SCRIPT = `#!/usr/bin/env python3
"""
GITM0N CLI — Local Code Scanner
Scans your local directory and gives the same analysis as gitm0n.
Usage: python gitm0n.py [path]
"""

import os
import sys
import json
from pathlib import Path
from collections import defaultdict

# Language definitions: extension -> (name, color)
LANGUAGES = {
    ".py": ("Python", "#3572A5"),
    ".js": ("JavaScript", "#f1e05a"),
    ".ts": ("TypeScript", "#3178c6"),
    ".tsx": ("TypeScript", "#3178c6"),
    ".jsx": ("JavaScript", "#f1e05a"),
    ".java": ("Java", "#b07219"),
    ".c": ("C", "#555555"),
    ".cpp": ("C++", "#f34b7d"),
    ".cc": ("C++", "#f34b7d"),
    ".cxx": ("C++", "#f34b7d"),
    ".h": ("C", "#555555"),
    ".hpp": ("C++", "#f34b7d"),
    ".cs": ("C#", "#178600"),
    ".go": ("Go", "#00ADD8"),
    ".rs": ("Rust", "#dea584"),
    ".rb": ("Ruby", "#701516"),
    ".php": ("PHP", "#4F5D95"),
    ".swift": ("Swift", "#ffac45"),
    ".kt": ("Kotlin", "#A97BFF"),
    ".scala": ("Scala", "#c22d40"),
    ".r": ("R", "#198CE7"),
    ".m": ("Objective-C", "#438eff"),
    ".sh": ("Shell", "#89e051"),
    ".bash": ("Shell", "#89e051"),
    ".zsh": ("Shell", "#89e051"),
    ".html": ("HTML", "#e34c26"),
    ".htm": ("HTML", "#e34c26"),
    ".css": ("CSS", "#563d7c"),
    ".scss": ("SCSS", "#c6538c"),
    ".sass": ("Sass", "#a53b70"),
    ".less": ("Less", "#1d365d"),
    ".vue": ("Vue", "#41b883"),
    ".svelte": ("Svelte", "#ff3e00"),
    ".dart": ("Dart", "#00B4AB"),
    ".lua": ("Lua", "#000080"),
    ".pl": ("Perl", "#0298c3"),
    ".ex": ("Elixir", "#6e4a7e"),
    ".exs": ("Elixir", "#6e4a7e"),
    ".clj": ("Clojure", "#db5855"),
    ".hs": ("Haskell", "#5e5086"),
    ".ml": ("OCaml", "#3be133"),
    ".fs": ("F#", "#b845fc"),
    ".sql": ("SQL", "#e38c00"),
    ".json": ("JSON", "#292929"),
    ".yaml": ("YAML", "#cb171e"),
    ".yml": ("YAML", "#cb171e"),
    ".toml": ("TOML", "#9c4221"),
    ".md": ("Markdown", "#083fa1"),
    ".tf": ("Terraform", "#7b42bc"),
    ".dockerfile": ("Dockerfile", "#384d54"),
}

IGNORE_DIRS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv", "env",
    ".env", "dist", "build", "target", ".next", ".nuxt", "out",
    "coverage", ".coverage", ".pytest_cache", ".mypy_cache",
    "vendor", "bower_components", ".idea", ".vscode", ".DS_Store",
    "*.egg-info", ".tox", "htmlcov",
}

COMMENT_PREFIXES = {
    "Python": ["#"],
    "JavaScript": ["//", "/*", "*", "*/"],
    "TypeScript": ["//", "/*", "*", "*/"],
    "Java": ["//", "/*", "*", "*/"],
    "C": ["//", "/*", "*", "*/"],
    "C++": ["//", "/*", "*", "*/"],
    "C#": ["//", "/*", "*", "*/"],
    "Go": ["//", "/*", "*", "*/"],
    "Rust": ["//", "/*", "*", "*/"],
    "Ruby": ["#"],
    "PHP": ["//", "#", "/*", "*", "*/"],
    "Swift": ["//", "/*", "*", "*/"],
    "Kotlin": ["//", "/*", "*", "*/"],
    "Shell": ["#"],
    "HTML": ["<!--", "-->", "<!"],
    "CSS": ["/*", "*", "*/"],
    "SCSS": ["//", "/*", "*", "*/"],
    "SQL": ["--", "/*", "*", "*/"],
}


def count_lines(filepath: str, lang: str) -> tuple[int, int, int]:
    """Returns (code_lines, comment_lines, blank_lines)"""
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
    except (OSError, PermissionError):
        return 0, 0, 0

    code, comments, blanks = 0, 0, 0
    prefixes = COMMENT_PREFIXES.get(lang, ["#", "//"])

    for line in lines:
        stripped = line.strip()
        if not stripped:
            blanks += 1
        elif any(stripped.startswith(p) for p in prefixes):
            comments += 1
        else:
            code += 1

    return code, comments, blanks


def scan_directory(root: str) -> dict:
    lang_stats = defaultdict(lambda: {"code": 0, "comments": 0, "blanks": 0, "color": ""})
    file_count = 0
    skipped = 0

    root_path = Path(root).resolve()

    for dirpath, dirnames, filenames in os.walk(root_path):
        # Prune ignored directories in-place
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not d.startswith(".")]

        for filename in filenames:
            ext = Path(filename).suffix.lower()
            if ext not in LANGUAGES:
                skipped += 1
                continue

            lang_name, lang_color = LANGUAGES[ext]
            filepath = os.path.join(dirpath, filename)
            code, comments, blanks = count_lines(filepath, lang_name)

            if code + comments + blanks == 0:
                continue

            lang_stats[lang_name]["code"] += code
            lang_stats[lang_name]["comments"] += comments
            lang_stats[lang_name]["blanks"] += blanks
            lang_stats[lang_name]["color"] = lang_color
            file_count += 1

    return dict(lang_stats), file_count


def format_number(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


def bar(pct: float, width: int = 30) -> str:
    filled = int(pct / 100 * width)
    return "█" * filled + "░" * (width - filled)


def print_report(lang_stats: dict, file_count: int, root: str):
    total_code = sum(v["code"] for v in lang_stats.values())
    total_comments = sum(v["comments"] for v in lang_stats.values())
    total_blanks = sum(v["blanks"] for v in lang_stats.values())
    total_lines = total_code + total_comments + total_blanks

    sorted_langs = sorted(lang_stats.items(), key=lambda x: x[1]["code"] + x[1]["comments"], reverse=True)

    GREEN = "\\033[92m"
    CYAN = "\\033[96m"
    YELLOW = "\\033[93m"
    WHITE = "\\033[97m"
    DIM = "\\033[2m"
    BOLD = "\\033[1m"
    RESET = "\\033[0m"

    print()
    print(f"{GREEN}{BOLD}  ██████╗ ██╗████████╗███╗   ███╗ ██████╗ ███╗   ██╗{RESET}")
    print(f"{GREEN}{BOLD}  ██╔════╝ ██║╚══██╔══╝████╗ ████║██╔═████╗████╗  ██║{RESET}")
    print(f"{GREEN}{BOLD}  ██║  ███╗██║   ██║   ██╔████╔██║██║██╔██║██╔██╗ ██║{RESET}")
    print(f"{GREEN}{BOLD}  ██║   ██║██║   ██║   ██║╚██╔╝██║████╔╝██║██║╚██╗██║{RESET}")
    print(f"{GREEN}{BOLD}  ╚██████╔╝██║   ██║   ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║{RESET}")
    print(f"{GREEN}{BOLD}   ╚═════╝ ╚═╝   ╚═╝   ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝{RESET}")
    print(f"{DIM}  GitHub Code Monitor — Local CLI v1.0{RESET}")
    print()
    print(f"{DIM}  Scanning: {root}{RESET}")
    print(f"{DIM}  {'─' * 56}{RESET}")
    print()

    print(f"  {BOLD}{WHITE}SUMMARY{RESET}")
    print(f"  {'─' * 40}")
    print(f"  Files analyzed   {CYAN}{BOLD}{file_count:>10,}{RESET}")
    print(f"  Total lines      {GREEN}{BOLD}{total_lines:>10,}{RESET}")
    print(f"  Code lines       {WHITE}{total_code:>10,}{RESET}")
    print(f"  Comment lines    {DIM}{total_comments:>10,}{RESET}")
    print(f"  Blank lines      {DIM}{total_blanks:>10,}{RESET}")
    print()

    if not sorted_langs:
        print(f"  {YELLOW}No supported source files found.{RESET}")
        return

    print(f"  {BOLD}{WHITE}LANGUAGE BREAKDOWN{RESET}")
    print(f"  {'─' * 40}")

    for lang, stats in sorted_langs[:15]:
        lang_total = stats["code"] + stats["comments"] + stats["blanks"]
        pct = (lang_total / total_lines * 100) if total_lines > 0 else 0
        b = bar(pct, 20)
        print(f"  {lang:<18} {GREEN}{b}{RESET}  {pct:5.1f}%  {format_number(lang_total):>7}")

    print()
    print(f"  {BOLD}{WHITE}TOP LANGUAGES BY CODE LINES{RESET}")
    print(f"  {'─' * 40}")
    for lang, stats in sorted_langs[:10]:
        print(f"  {lang:<18} {CYAN}{format_number(stats['code']):>8}{RESET} code  "
              f"{DIM}{format_number(stats['comments']):>6} comments{RESET}")

    print()
    print(f"  {DIM}Scan your GitHub profile at: https://gitm0n.vercel.app{RESET}")
    print()


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    root = os.path.abspath(root)

    if not os.path.isdir(root):
        print(f"Error: '{root}' is not a directory.")
        sys.exit(1)

    print(f"\\033[2m  Scanning {root} ...\\033[0m", end="\\r")

    lang_stats, file_count = scan_directory(root)
    print_report(lang_stats, file_count, root)


if __name__ == "__main__":
    main()
`;

const INSTALL_STEPS = [
  { cmd: "python gitm0n.py", desc: "Scan current directory" },
  { cmd: "python gitm0n.py /path/to/project", desc: "Scan a specific path" },
  { cmd: "python gitm0n.py ~/my-project", desc: "Scan with absolute path" },
];

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group font-mono text-xs rounded-none border border-border/40 bg-card/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-card/50">
        <span className="text-muted-foreground text-[10px] tracking-widest uppercase">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors text-[10px]">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-foreground/80 leading-relaxed">{code}</pre>
    </div>
  );
}

export default function DownloadPage() {
  const handleDownload = () => {
    const blob = new Blob([CLI_SCRIPT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gitm0n.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("gitm0n.py downloaded!");
  };

  return (
    <div className="min-h-screen bg-background font-mono text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-border/40 px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-7 w-7 rounded object-cover" />
          <span className="text-primary font-black tracking-[0.2em] text-sm" style={{ textShadow: "0 0 10px rgba(0,255,65,0.4)" }}>GITM0N</span>
        </a>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <a href="/" className="hover:text-foreground transition-colors">← Back to Scanner</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-4">// CLI TOOL</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground mb-4 leading-tight">
            GITM0N<br />
            <span className="text-primary" style={{ textShadow: "0 0 20px rgba(0,255,65,0.3)" }}>CLI</span>
          </h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-xl leading-relaxed">
            Scan any local directory and get the same deep analysis as the web app — language breakdown, line counts, code vs comments vs blanks. No internet required.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-sm font-black hover:bg-primary/90 transition-all tracking-widest"
              style={{ boxShadow: "0 0 30px rgba(0,255,65,0.25)" }}
            >
              <Download size={16} />
              DOWNLOAD gitm0n.py
            </motion.button>
            <a
              href="/"
              className="inline-flex items-center gap-2 border border-border/60 text-muted-foreground px-6 py-3 text-sm font-bold hover:border-primary/40 hover:text-foreground transition-all tracking-widest"
            >
              <Globe size={16} />
              WEB VERSION
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 max-w-sm">
            {[
              { label: "Python 3.6+", sub: "No dependencies" },
              { label: "40+ Languages", sub: "Auto-detected" },
              { label: "Offline", sub: "No internet needed" },
            ].map((s) => (
              <div key={s.label} className="border border-border/30 p-3 bg-card/20">
                <div className="text-foreground font-bold text-xs">{s.label}</div>
                <div className="text-muted-foreground text-[10px] mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Usage */}
      <section className="border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-3">// USAGE</div>
            <h2 className="text-2xl font-black text-foreground mb-8">Run it in seconds</h2>

            <div className="space-y-4 mb-8">
              {INSTALL_STEPS.map((step, i) => (
                <motion.div key={step.cmd} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <div className="text-[10px] text-muted-foreground mb-1.5 tracking-widest">{step.desc}</div>
                  <CodeBlock code={step.cmd} language="terminal" />
                </motion.div>
              ))}
            </div>

            <div className="border border-border/30 bg-card/20 p-4 text-xs text-muted-foreground leading-relaxed">
              <span className="text-primary font-bold">Requirements:</span> Python 3.6 or higher. No pip installs needed — uses only the standard library.
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-3">// FEATURES</div>
            <h2 className="text-2xl font-black text-foreground mb-8">What it analyzes</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Code2, title: "40+ Languages", desc: "Python, JS, TS, Go, Rust, Java, C/C++, Ruby, PHP, Swift, Kotlin, and more." },
                { icon: BarChart3, title: "Line Breakdown", desc: "Separates code lines, comment lines, and blank lines per language." },
                { icon: Terminal, title: "Terminal Output", desc: "Color-coded ASCII report with progress bars and formatted numbers." },
                { icon: Zap, title: "Fast Scanning", desc: "Skips node_modules, .git, build dirs, and other noise automatically." },
                { icon: Globe, title: "Any Directory", desc: "Pass any local path as an argument, or run in the current directory." },
                { icon: Github, title: "Same as Web", desc: "Identical analysis methodology to the GITM0N web scanner." },
              ].map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  className="flex gap-4 p-4 border border-border/30 bg-card/20 hover:border-primary/20 transition-colors">
                  <div className="w-8 h-8 border border-border/50 flex items-center justify-center shrink-0">
                    <f.icon size={14} className="text-primary/60" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground mb-1">{f.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Preview */}
      <section className="border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-3">// OUTPUT PREVIEW</div>
            <h2 className="text-2xl font-black text-foreground mb-8">Sample output</h2>
            <div className="border border-border/40 bg-[#020208] p-6 font-mono text-xs leading-relaxed overflow-x-auto">
              <div className="text-green-400 font-bold mb-1">  ██████╗ ██╗████████╗███╗   ███╗ ██████╗ ███╗   ██╗</div>
              <div className="text-green-400 font-bold mb-3">  GITM0N CLI — Local Code Scanner v1.0</div>
              <div className="text-muted-foreground mb-4">  Scanning: /home/user/my-project</div>
              <div className="text-foreground font-bold mb-1">  SUMMARY</div>
              <div className="text-muted-foreground">  ────────────────────────────────────────</div>
              <div className="text-muted-foreground">  Files analyzed   <span className="text-cyan-400 font-bold">       247</span></div>
              <div className="text-muted-foreground">  Total lines      <span className="text-green-400 font-bold">    84,312</span></div>
              <div className="text-muted-foreground">  Code lines              62,441</div>
              <div className="text-muted-foreground">  Comment lines           12,890</div>
              <div className="text-muted-foreground mb-4">  Blank lines              8,981</div>
              <div className="text-foreground font-bold mb-1">  LANGUAGE BREAKDOWN</div>
              <div className="text-muted-foreground">  ────────────────────────────────────────</div>
              <div className="text-muted-foreground">  TypeScript         <span className="text-green-400">████████████░░░░░░░░</span>  44.2%   37.3K</div>
              <div className="text-muted-foreground">  JavaScript         <span className="text-green-400">██████░░░░░░░░░░░░░░░</span>  24.8%   20.9K</div>
              <div className="text-muted-foreground">  Python             <span className="text-green-400">████░░░░░░░░░░░░░░░░░</span>  17.1%   14.4K</div>
              <div className="text-muted-foreground">  CSS                <span className="text-green-400">██░░░░░░░░░░░░░░░░░░░</span>   9.3%    7.8K</div>
              <div className="text-muted-foreground mb-4">  HTML               <span className="text-green-400">█░░░░░░░░░░░░░░░░░░░░</span>   4.6%    3.9K</div>
              <div className="text-muted-foreground text-[10px]">  Scan your GitHub profile at: https://gitm0n.vercel.app</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-[10px] text-primary/50 tracking-[0.3em] mb-3">// GET STARTED</div>
            <h2 className="text-3xl font-black text-foreground mb-4">
              Ready to scan your<br />
              <span className="text-primary" style={{ textShadow: "0 0 20px rgba(0,255,65,0.3)" }}>local codebase?</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              Download the script, drop it anywhere, and run it. No setup, no dependencies.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-sm font-black hover:bg-primary/90 transition-all tracking-widest"
              style={{ boxShadow: "0 0 30px rgba(0,255,65,0.25)" }}
            >
              <Download size={16} />
              DOWNLOAD gitm0n.py
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/40">
          <div className="flex items-center gap-3">
            <img src="/assets/gitm0n.jpg" alt="GITM0N" className="h-5 w-5 rounded object-cover opacity-60" />
            <span className="text-primary/60 font-black tracking-widest">GITM0N</span>
            <span className="border border-border/30 px-1.5 py-0.5">CLI v1.0</span>
          </div>
          <div className="text-[10px]">Python 3.6+ · No dependencies · MIT License</div>
        </div>
      </footer>
    </div>
  );
}