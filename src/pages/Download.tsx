import { motion } from "framer-motion";
import { Download, FileArchive, Github, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background font-mono flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div
          className="relative p-8"
          style={{
            background: "rgba(0,0,0,0.95)",
            border: "1.5px solid rgba(0,255,65,0.35)",
            boxShadow: "0 0 40px rgba(0,255,65,0.08)",
          }}
        >
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/assets/gitm0n.jpg"
              alt="GITM0N"
              className="h-8 w-8 rounded object-cover"
              style={{ border: "1px solid rgba(0,255,65,0.3)" }}
            />
            <div>
              <div className="text-primary font-black tracking-[0.2em] text-sm leading-none">GITM0N</div>
              <div className="text-muted-foreground text-[9px] tracking-widest">SOURCE CODE DOWNLOAD</div>
            </div>
          </div>

          {/* File info */}
          <div
            className="flex items-center gap-4 p-4 mb-6"
            style={{ background: "rgba(0,255,65,0.05)", border: "1px solid rgba(0,255,65,0.15)" }}
          >
            <FileArchive size={28} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-bold text-foreground">gitm0n-source.tar.gz</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Complete source code · All files included
              </div>
              <div className="text-[10px] text-primary/70 mt-0.5">
                Excludes: node_modules, .git, dist, .env.local
              </div>
            </div>
          </div>

          {/* What's included */}
          <div className="mb-6 space-y-1.5">
            <div className="text-[9px] tracking-widest text-muted-foreground mb-2">INCLUDES</div>
            {[
              "src/ — All React components & pages",
              "src/convex/ — Full backend (schema, actions, queries)",
              "public/ — Assets, logos, manifest",
              "package.json, vite.config.ts, tsconfig",
              ".github/workflows/ — CI/CD pipeline",
              "README.md — Deployment instructions",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <span className="text-primary mt-0.5">›</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Download button */}
          <a
            href="/gitm0n-source.tar.gz"
            download="gitm0n-source.tar.gz"
            className="flex items-center justify-center gap-2 w-full py-3 text-xs font-black tracking-widest transition-all mb-3 cursor-pointer"
            style={{
              background: "rgba(0,255,65,0.15)",
              border: "1.5px solid rgba(0,255,65,0.6)",
              color: "#00ff41",
            }}
          >
            <Download size={14} />
            DOWNLOAD SOURCE CODE
          </a>

          {/* Extract instructions */}
          <div
            className="p-3 mb-4 text-[10px] text-muted-foreground"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="text-[9px] tracking-widest mb-1.5 text-foreground/60">EXTRACT & RUN</div>
            <code className="text-primary/80 block">tar -xzf gitm0n-source.tar.gz</code>
            <code className="text-primary/80 block">bun install</code>
            <code className="text-primary/80 block">npx convex dev &amp;&amp; bun run dev</code>
          </div>

          {/* Back link */}
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors tracking-widest"
          >
            <ArrowLeft size={10} />
            BACK TO HOME
          </Link>
        </div>

        <div className="mt-4 text-center text-[9px] text-muted-foreground tracking-widest">
          See README.md inside the archive for full deployment instructions
        </div>
      </motion.div>
    </div>
  );
}
