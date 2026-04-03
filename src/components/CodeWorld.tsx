import { useRef, useMemo, useState, useEffect, forwardRef, useImperativeHandle, Component } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Stars, Float } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";

interface Language {
  name: string;
  lines: number;
  percentage: number;
  color: string;
}

interface WorldUser {
  username: string;
  avatarUrl: string;
  name?: string;
  totalLines: number;
  languages: Language[];
  percentileRank: number;
}

function normalizeHeights(languages: Language[]): number[] {
  if (languages.length === 0) return [];
  const sqrtValues = languages.map((l) => Math.sqrt(l.lines));
  const maxSqrt = Math.max(...sqrtValues, 1);
  return sqrtValues.map((v) => 1.2 + (v / maxSqrt) * 8.0);
}

// WebGL capability check
function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!ctx;
  } catch {
    return false;
  }
}

// Error boundary for Canvas
class CanvasErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// CSS fallback when WebGL is unavailable
function WorldFallback({ users }: { users: WorldUser[] }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#030308] relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(rgba(0,255,65,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)",
        }}
      />
      <div className="relative z-10 text-center px-8">
        <div className="text-primary terminal-glow text-4xl font-black tracking-[0.3em] mb-2">GITM0N</div>
        <div className="text-muted-foreground text-xs tracking-[0.2em] mb-8">GITHUB CODE MONITOR</div>
        {/* User cards */}
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
          {users.slice(0, 6).map((u, i) => (
            <motion.div
              key={u.username}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2 px-3 py-2 font-mono text-xs"
              style={{
                background: "rgba(0,20,8,0.9)",
                border: "1px solid rgba(0,255,65,0.3)",
                boxShadow: "0 0 10px rgba(0,255,65,0.1)",
              }}
            >
              <img src={u.avatarUrl} alt={u.username} className="w-6 h-6 rounded-sm" />
              <div>
                <div className="text-primary text-[10px] font-bold">@{u.username}</div>
                <div className="text-muted-foreground text-[9px]">
                  {u.totalLines >= 1000000 ? `${(u.totalLines / 1000000).toFixed(1)}M` : `${(u.totalLines / 1000).toFixed(0)}K`} lines
                </div>
              </div>
              <div className="flex gap-0.5">
                {u.languages.slice(0, 3).map((l) => (
                  <div key={l.name} className="w-1.5 h-6" style={{ backgroundColor: l.color, opacity: 0.8 }} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 text-[10px] text-muted-foreground tracking-widest">
          3D WORLD VIEW REQUIRES WEBGL
        </div>
      </div>
    </div>
  );
}

// Avatar plane using canvas-loaded texture to handle CORS
function AvatarPlane({
  avatarUrl,
  position,
  size,
}: {
  avatarUrl: string;
  position: [number, number, number];
  size: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, 128, 128);
        const tex = new THREE.CanvasTexture(canvas);
        setTexture(tex);
      }
    };
    img.onerror = () => {}; // silently fail
    img.src = avatarUrl;
    return () => { img.onload = null; img.onerror = null; };
  }, [avatarUrl]);

  if (!texture) return null;

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

// Classy multi-tiered skyscraper Town Hall
function TownHall({
  totalLines,
  percentileRank,
  username,
  avatarUrl,
  isCurrentUser,
  isCreator,
  color,
}: {
  totalLines: number;
  percentileRank: number;
  username: string;
  avatarUrl: string;
  isCurrentUser: boolean;
  isCreator: boolean;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const crownRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  const prestige = Math.min(1, (percentileRank / 100) * 0.6 + Math.min(totalLines / 1000000, 1) * 0.4);

  // Tiered skyscraper dimensions
  const tier1W = 2.2 + prestige * 2.0;
  const tier1H = 2.0 + prestige * 3.5;
  const tier2W = tier1W * 0.72;
  const tier2H = tier1H * 0.65;
  const tier3W = tier2W * 0.65;
  const tier3H = tier2H * 0.55;
  const spireH = 1.5 + prestige * 2.5;
  const totalH = tier1H + tier2H + tier3H;

  // Avatar sits on top of tier 3 (penthouse roof)
  const avatarY = 0.22 + tier1H + 0.16 + tier2H + 0.14 + tier3H + 0.22;
  const avatarZ = tier3W / 2 + 0.02;
  const avatarSize = Math.min(tier3W * 0.8, 1.0);

  // Creator uses their natural language color — no gold override on the building
  const effectiveColor = color;

  // Batman theme for creator: dark obsidian building with yellow accents
  const batmanYellow = "#f0c000";
  const batmanDark = "#0a0a0a";
  const effectiveBuildingColor = isCreator ? batmanDark : color;
  const effectiveAccentColor = isCreator ? batmanYellow : (isCurrentUser ? "#00ff41" : color);

  const threeColor = useMemo(() => new THREE.Color(effectiveBuildingColor), [effectiveBuildingColor]);
  const glassColor = useMemo(() => new THREE.Color(effectiveBuildingColor).lerp(new THREE.Color(isCreator ? "#1a1400" : "#88ccff"), 0.4), [effectiveBuildingColor, isCreator]);
  const accentColor = useMemo(() => new THREE.Color(effectiveAccentColor).multiplyScalar(1.2), [effectiveAccentColor]);

  useFrame((state) => {
    if (crownRef.current) {
      crownRef.current.rotation.y = state.clock.elapsedTime * (isCreator ? 0.3 : 0.6);
    }
    if (beaconRef.current) {
      // Creator gets a slow yellow bat-beacon pulse, others get normal pulse
      if (isCreator) {
        beaconRef.current.intensity = 2.5 + Math.sin(state.clock.elapsedTime * 0.5) * 0.8;
      } else {
        beaconRef.current.intensity = 2.0 + Math.sin(state.clock.elapsedTime * 2.0) * 1.0;
      }
    }
  });

  const makeWindows = (w: number, h: number, yBase: number, cols: number) => {
    const rows = Math.max(2, Math.floor(h * 2));
    return Array.from({ length: rows }).flatMap((_, row) =>
      Array.from({ length: cols }).map((_, col) => {
        const wx = (col - (cols - 1) / 2) * (w / cols) * 0.75;
        const wy = yBase + (row + 0.5) * (h / rows);
        // Batman: yellow-tinted windows
        const lit = (row + col) % 4 !== 3;
        const winColor = isCreator ? (lit ? "#ffe066" : "#1a1200") : (lit ? "#ffffcc" : "#334455");
        const winEmissive = isCreator ? (lit ? "#f0c000" : "#0a0800") : (lit ? "#ffff88" : "#112233");
        return (
          <mesh key={`w-${row}-${col}`} position={[wx, wy, w / 2 + 0.015]}>
            <planeGeometry args={[0.12, 0.09]} />
            <meshStandardMaterial
              color={winColor}
              emissive={winEmissive}
              emissiveIntensity={lit ? 2.0 : 0.3}
              transparent
              opacity={0.95}
            />
          </mesh>
        );
      })
    );
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Grand plaza / foundation */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[tier1W + 1.6, 0.12, tier1W + 1.6]} />
        <meshStandardMaterial color={isCreator ? "#080808" : "#0a0a18"} emissive={isCreator ? "#0a0800" : "#050510"} emissiveIntensity={0.4} roughness={0.8} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <boxGeometry args={[tier1W + 1.0, 0.1, tier1W + 1.0]} />
        <meshStandardMaterial color={isCreator ? "#0d0d00" : "#0d0d22"} emissive={isCreator ? "#0a0900" : "#080818"} emissiveIntensity={0.3} roughness={0.7} metalness={0.5} />
      </mesh>
      {/* Plaza accent lines — yellow for batman, language color for others */}
      {[0, 90, 180, 270].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const r = (tier1W + 0.6) / 2;
        return (
          <mesh key={i} position={[Math.cos(rad) * r * 0.5, 0.21, Math.sin(rad) * r * 0.5]} rotation={[0, -rad, 0]}>
            <boxGeometry args={[r, 0.02, 0.06]} />
            <meshStandardMaterial color={isCurrentUser ? "#00ff41" : effectiveAccentColor} emissive={isCurrentUser ? "#00ff41" : effectiveAccentColor} emissiveIntensity={isCreator ? 4.0 : 2.0} transparent opacity={0.7} />
          </mesh>
        );
      })}

      {/* TIER 1 — Batman: near-black obsidian */}
      <mesh position={[0, 0.22 + tier1H / 2, 0]} castShadow>
        <boxGeometry args={[tier1W, tier1H, tier1W]} />
        <meshStandardMaterial color={threeColor} emissive={isCreator ? "#0a0800" : glassColor} emissiveIntensity={isCurrentUser ? 0.5 : isCreator ? 0.15 : 0.25} roughness={isCreator ? 0.2 : 0.05} metalness={isCreator ? 0.98 : 0.95} />
      </mesh>
      {/* Batman: yellow ledge rings on tier 1 */}
      {Array.from({ length: Math.floor(tier1H / 1.2) }).map((_, i) => (
        <mesh key={i} position={[0, 0.22 + (i + 1) * 1.2, 0]}>
          <boxGeometry args={[tier1W + 0.06, 0.05, tier1W + 0.06]} />
          <meshStandardMaterial color={isCreator ? batmanYellow : threeColor} emissive={isCreator ? batmanYellow : threeColor} emissiveIntensity={isCreator ? 3.0 : 1.5} transparent opacity={isCreator ? 0.9 : 0.8} />
        </mesh>
      ))}
      {makeWindows(tier1W, tier1H, 0.22, 4)}

      {/* Tier 1 → 2 ledge */}
      <mesh position={[0, 0.22 + tier1H + 0.08, 0]}>
        <boxGeometry args={[tier1W + 0.15, 0.16, tier1W + 0.15]} />
        <meshStandardMaterial color={isCreator ? batmanYellow : threeColor} emissive={isCreator ? batmanYellow : accentColor} emissiveIntensity={isCreator ? 5.0 : 2.5} transparent opacity={0.95} />
      </mesh>

      {/* TIER 2 */}
      <mesh position={[0, 0.22 + tier1H + 0.16 + tier2H / 2, 0]} castShadow>
        <boxGeometry args={[tier2W, tier2H, tier2W]} />
        <meshStandardMaterial color={threeColor} emissive={isCreator ? "#0a0800" : glassColor} emissiveIntensity={isCurrentUser ? 0.65 : isCreator ? 0.15 : 0.35} roughness={isCreator ? 0.2 : 0.05} metalness={isCreator ? 0.98 : 0.95} />
      </mesh>
      {Array.from({ length: Math.floor(tier2H / 1.0) }).map((_, i) => (
        <mesh key={i} position={[0, 0.22 + tier1H + 0.16 + (i + 1) * 1.0, 0]}>
          <boxGeometry args={[tier2W + 0.05, 0.04, tier2W + 0.05]} />
          <meshStandardMaterial color={isCreator ? batmanYellow : threeColor} emissive={isCreator ? batmanYellow : threeColor} emissiveIntensity={isCreator ? 3.0 : 1.5} transparent opacity={isCreator ? 0.9 : 0.8} />
        </mesh>
      ))}
      {makeWindows(tier2W, tier2H, 0.22 + tier1H + 0.16, 3)}

      {/* Tier 2 → 3 ledge */}
      <mesh position={[0, 0.22 + tier1H + 0.16 + tier2H + 0.08, 0]}>
        <boxGeometry args={[tier2W + 0.12, 0.14, tier2W + 0.12]} />
        <meshStandardMaterial color={isCreator ? batmanYellow : threeColor} emissive={isCreator ? batmanYellow : accentColor} emissiveIntensity={isCreator ? 5.0 : 2.5} transparent opacity={0.95} />
      </mesh>

      {/* TIER 3 — penthouse */}
      <mesh position={[0, 0.22 + tier1H + 0.16 + tier2H + 0.14 + tier3H / 2, 0]} castShadow>
        <boxGeometry args={[tier3W, tier3H, tier3W]} />
        <meshStandardMaterial color={threeColor} emissive={isCreator ? "#0a0800" : glassColor} emissiveIntensity={isCurrentUser ? 0.9 : isCreator ? 0.2 : 0.5} roughness={isCreator ? 0.15 : 0.02} metalness={isCreator ? 0.99 : 1.0} />
      </mesh>
      {makeWindows(tier3W, tier3H, 0.22 + tier1H + 0.16 + tier2H + 0.14, 2)}

      {/* Avatar on penthouse roof face */}
      <AvatarPlane
        avatarUrl={avatarUrl}
        position={[0, avatarY, avatarZ]}
        size={avatarSize}
      />

      {/* Crown ring — yellow for batman */}
      <mesh position={[0, 0.22 + tier1H + 0.16 + tier2H + 0.14 + tier3H + 0.1, 0]}>
        <torusGeometry args={[tier3W * 0.55, 0.08, 8, 24]} />
        <meshStandardMaterial color={isCurrentUser ? "#00ff41" : isCreator ? batmanYellow : color} emissive={isCurrentUser ? "#00ff41" : isCreator ? batmanYellow : color} emissiveIntensity={isCurrentUser ? 6.0 : isCreator ? 8.0 : 3.5} transparent opacity={1.0} />
      </mesh>

      {/* Spire base */}
      <mesh position={[0, 0.22 + totalH + 0.3 + 0.3, 0]}>
        <cylinderGeometry args={[tier3W * 0.18, tier3W * 0.22, 0.6, 8]} />
        <meshStandardMaterial color={isCreator ? batmanYellow : threeColor} emissive={isCreator ? batmanYellow : accentColor} emissiveIntensity={isCreator ? 6.0 : 3.0} metalness={1.0} roughness={0.0} />
      </mesh>

      {/* Spire needle — Batman: sharp dark spire */}
      <mesh ref={crownRef} position={[0, 0.22 + totalH + 0.3 + 0.6 + spireH / 2, 0]}>
        <coneGeometry args={[tier3W * 0.14, spireH, isCreator ? 4 : 6]} />
        <meshStandardMaterial color={isCurrentUser ? "#00ff41" : isCreator ? batmanDark : color} emissive={isCurrentUser ? "#00ff41" : isCreator ? batmanYellow : color} emissiveIntensity={isCurrentUser ? 4.0 : isCreator ? 2.0 : 2.5} roughness={isCreator ? 0.1 : 0.0} metalness={1.0} />
      </mesh>

      {/* Beacon — yellow for batman */}
      <pointLight ref={beaconRef} position={[0, 0.22 + totalH + 0.3 + 0.6 + spireH + 0.3, 0]} color={isCurrentUser ? "#00ff41" : isCreator ? batmanYellow : color} intensity={isCreator ? 3.0 : 2.5} distance={isCreator ? 20 : 12} />

      {/* Spire tip orb — yellow for batman */}
      <mesh position={[0, 0.22 + totalH + 0.3 + 0.6 + spireH + 0.25, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color={isCurrentUser ? "#00ff41" : isCreator ? batmanYellow : color} emissive={isCurrentUser ? "#00ff41" : isCreator ? batmanYellow : color} emissiveIntensity={isCurrentUser ? 8.0 : isCreator ? 10.0 : 5.0} transparent opacity={0.95} />
      </mesh>

      {/* Corner buttresses — Batman: dark with yellow tips */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <group key={i}>
          <mesh position={[sx * (tier1W / 2 + 0.08), tier1H * 0.45, sz * (tier1W / 2 + 0.08)]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, tier1H * 0.9, isCreator ? 4 : 6]} />
            <meshStandardMaterial color={isCreator ? batmanDark : threeColor} emissive={isCreator ? "#0a0800" : threeColor} emissiveIntensity={isCreator ? 0.1 : 0.9} roughness={isCreator ? 0.2 : 0.1} metalness={0.9} />
          </mesh>
          <mesh position={[sx * (tier1W / 2 + 0.08), tier1H * 0.9 + 0.22, sz * (tier1W / 2 + 0.08)]}>
            <coneGeometry args={[0.14, 0.4, isCreator ? 4 : 6]} />
            <meshStandardMaterial color={isCreator ? batmanYellow : threeColor} emissive={isCreator ? batmanYellow : accentColor} emissiveIntensity={isCreator ? 5.0 : 2.0} metalness={1.0} roughness={0.0} />
          </mesh>
        </group>
      ))}

      {/* Username label — yellow for batman */}
      <Text
        position={[0, 0.22 + totalH + 0.3 + 0.6 + spireH + 1.0, 0]}
        fontSize={0.32}
        color={isCurrentUser ? "#00ff41" : isCreator ? batmanYellow : "#ccddff"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {`@${username}`}
      </Text>
    </group>
  );
}

// Architectural building — varied shapes, not just boxes
function Building({
  position,
  height,
  color,
  name,
  lines,
  isHighlighted,
  onClick,
  buildingType,
}: {
  position: [number, number, number];
  height: number;
  color: string;
  name: string;
  lines: number;
  isHighlighted: boolean;
  onClick: () => void;
  buildingType: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      const target = hovered || isHighlighted ? 1.1 : 1.0;
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, target, 0.08);
    }
  });

  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const emissiveColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.5), [color]);
  const active = hovered || isHighlighted;

  const formatLines = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const w = buildingType === 0 ? 0.75 : buildingType === 1 ? 0.6 : 0.85;
  const windowRows = Math.max(2, Math.floor(height * 1.8));

  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[w + 0.25, 0.2, w + 0.25]} />
        <meshStandardMaterial color="#0d0d1a" emissive="#080818" emissiveIntensity={0.2} roughness={0.9} />
      </mesh>
      <mesh
        ref={meshRef}
        position={[0, height / 2 + 0.2, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        {buildingType === 2 ? (
          <cylinderGeometry args={[w / 2, w / 2 + 0.1, height, 8]} />
        ) : (
          <boxGeometry args={[w, height, w]} />
        )}
        <meshStandardMaterial color={threeColor} emissive={emissiveColor} emissiveIntensity={active ? 1.0 : 0.45} roughness={0.15} metalness={0.85} />
      </mesh>
      {buildingType === 0 && height > 3 && (
        <mesh position={[0, height * 0.65 + 0.2, 0]} castShadow>
          <boxGeometry args={[w * 0.7, height * 0.35, w * 0.7]} />
          <meshStandardMaterial color={threeColor} emissive={emissiveColor} emissiveIntensity={active ? 1.2 : 0.6} roughness={0.1} metalness={0.9} />
        </mesh>
      )}
      {Array.from({ length: Math.floor(height / 1.8) }).map((_, i) => (
        <mesh key={i} position={[0, 0.2 + (i + 1) * 1.8, 0]}>
          <boxGeometry args={[w + 0.06, 0.06, w + 0.06]} />
          <meshStandardMaterial color={threeColor} emissive={threeColor} emissiveIntensity={0.9} transparent opacity={0.85} />
        </mesh>
      ))}
      {Array.from({ length: windowRows }).map((_, row) => {
        const wy = 0.2 + (row + 0.5) * (height / windowRows);
        const warm = row % 3 !== 2;
        return (
          <mesh key={row} position={[w / 2 + 0.01, wy, 0]}>
            <planeGeometry args={[0.08, 0.07]} />
            <meshStandardMaterial color={warm ? "#ffffaa" : "#aaddff"} emissive={warm ? "#ffff44" : "#88ccff"} emissiveIntensity={1.3} />
          </mesh>
        );
      })}
      <mesh position={[0, height + 0.2 + 0.08, 0]}>
        <boxGeometry args={[w + 0.05, 0.16, w + 0.05]} />
        <meshStandardMaterial color={threeColor} emissive={threeColor} emissiveIntensity={active ? 3.5 : 2.0} transparent opacity={0.95} />
      </mesh>
      {height > 4 && (
        <mesh position={[0, height + 0.2 + 0.16 + 0.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.0, 4]} />
          <meshStandardMaterial color={threeColor} emissive={threeColor} emissiveIntensity={2.0} />
        </mesh>
      )}
      {active && (
        <Text position={[0, height + 1.8, 0]} fontSize={0.26} color={color} anchorX="center" anchorY="middle" outlineWidth={0.04} outlineColor="#000000">
          {`${name}\n${formatLines(lines)} lines`}
        </Text>
      )}
    </group>
  );
}

function UserBase({
  user,
  position,
  isCurrentUser,
  isCreator,
  onClick,
}: {
  user: WorldUser;
  position: [number, number, number];
  isCurrentUser: boolean;
  isCreator: boolean;
  onClick: () => void;
}) {
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const creatorGlowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (groupRef.current && isCurrentUser) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.04;
    }
    if (creatorGlowRef.current && isCreator) {
      // Batman bat-signal slow pulse
      creatorGlowRef.current.intensity = 1.2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.4;
    }
  });

  const langs = user.languages.slice(0, 10);
  const prestige = Math.min(1, (user.percentileRank / 100) * 0.6 + Math.min(user.totalLines / 1000000, 1) * 0.4);
  const townHallBaseH = 1.5 + prestige * 6.0;
  const townHallTowerH = townHallBaseH * 0.6;
  const townHallSpireH = townHallBaseH * 0.5;
  const townHallTotalH = townHallBaseH + 0.3 + townHallTowerH + townHallSpireH;
  const maxBuildingHeight = townHallTotalH * 0.75;

  const heights = useMemo(() => {
    const raw = normalizeHeights(langs);
    const rawMax = Math.max(...raw, 1);
    return raw.map((h) => (h / rawMax) * maxBuildingHeight);
  }, [langs, maxBuildingHeight]);

  // Fixed base size — compact enough to look dense, large enough to hold all buildings
  const baseSize = 10 + prestige * 2;
  const townHallColor = langs[0]?.color || "#00ff41";
  const platformAccentColor = langs[0]?.color || (isCurrentUser ? "#00ff41" : "#2244cc");

  // Circular ring layout — all buildings placed on a ring around the TownHall
  const buildingPositions = useMemo(() => {
    const n = langs.length;
    // Ring radius: tight enough to stay well within the base
    const ringRadius = Math.min(baseSize * 0.35, 3.2 + n * 0.18);
    return langs.map((lang, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.cos(angle) * ringRadius,
        z: Math.sin(angle) * ringRadius,
        lang,
        height: heights[i],
        type: i % 3,
      };
    });
  }, [langs, heights, baseSize]);

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Batman bat-signal glow light beneath the base — SIDDHUX9 only */}
      {isCreator && (
        <pointLight
          ref={creatorGlowRef}
          position={[0, -0.5, 0]}
          color="#f0c000"
          intensity={1.0}
          distance={14}
        />
      )}
      {/* Batman bat-signal glow plane under the platform — SIDDHUX9 only */}
      {isCreator && (
        <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[baseSize + 3, baseSize + 3]} />
          <meshStandardMaterial
            color="#f0c000"
            emissive="#f0c000"
            emissiveIntensity={0.3}
            transparent
            opacity={0.05}
          />
        </mesh>
      )}

      {/* Square base platform */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <boxGeometry args={[baseSize + 1.0, 0.24, baseSize + 1.0]} />
        <meshStandardMaterial
          color={isCurrentUser ? "#001a0d" : isCreator ? "#080808" : "#080810"}
          emissive={isCurrentUser ? "#001208" : isCreator ? "#0a0800" : "#040408"}
          emissiveIntensity={0.5}
          roughness={isCreator ? 0.3 : 0.7}
          metalness={isCreator ? 0.8 : 0.3}
        />
      </mesh>

      {/* Platform border — yellow for batman, green for current user, dim blue for others */}
      {[
        { pos: [0, -0.02, (baseSize + 1.0) / 2] as [number, number, number], rot: [0, 0, 0] as [number, number, number], len: baseSize + 1.0 },
        { pos: [0, -0.02, -(baseSize + 1.0) / 2] as [number, number, number], rot: [0, 0, 0] as [number, number, number], len: baseSize + 1.0 },
        { pos: [(baseSize + 1.0) / 2, -0.02, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], len: baseSize + 1.0 },
        { pos: [-(baseSize + 1.0) / 2, -0.02, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], len: baseSize + 1.0 },
      ].map((edge, i) => (
        <mesh key={i} position={edge.pos} rotation={edge.rot}>
          <boxGeometry args={[edge.len, 0.06, 0.12]} />
          <meshStandardMaterial
            color={isCurrentUser ? "#00ff41" : isCreator ? "#f0c000" : "#1e2040"}
            emissive={isCurrentUser ? "#00ff41" : isCreator ? "#f0c000" : "#0e1020"}
            emissiveIntensity={isCurrentUser ? 5.0 : isCreator ? 3.5 : 0.6}
            transparent
            opacity={isCurrentUser ? 1.0 : isCreator ? 0.85 : 0.45}
          />
        </mesh>
      ))}

      {/* Grid lines on platform surface — only for creator and current user */}
      {(isCurrentUser || isCreator) && Array.from({ length: 3 }).map((_, i) => {
        const offset = ((i - 1) / 2) * (baseSize * 0.5);
        const gridColor = isCurrentUser ? "#00ff41" : "#f0c000";
        return (
          <group key={i}>
            <mesh position={[offset, -0.04, 0]}>
              <boxGeometry args={[0.04, 0.02, baseSize + 0.8]} />
              <meshStandardMaterial color={gridColor} emissive={gridColor} emissiveIntensity={0.8} transparent opacity={0.2} />
            </mesh>
            <mesh position={[0, -0.04, offset]}>
              <boxGeometry args={[baseSize + 0.8, 0.02, 0.04]} />
              <meshStandardMaterial color={gridColor} emissive={gridColor} emissiveIntensity={0.8} transparent opacity={0.2} />
            </mesh>
          </group>
        );
      })}

      {/* Town Hall at center */}
      <TownHall
        totalLines={user.totalLines}
        percentileRank={user.percentileRank}
        username={user.username}
        avatarUrl={user.avatarUrl}
        isCurrentUser={isCurrentUser}
        isCreator={isCreator}
        color={townHallColor}
      />

      {/* Language buildings */}
      {buildingPositions.map(({ x, z, lang, height, type }) => (
        <Building
          key={lang.name}
          position={[x, 0, z]}
          height={height}
          color={lang.color}
          name={lang.name}
          lines={lang.lines}
          isHighlighted={selectedLang === lang.name}
          onClick={() => setSelectedLang(selectedLang === lang.name ? null : lang.name)}
          buildingType={type}
        />
      ))}

      {/* Username label */}
      <Text
        position={[0, 0.3, baseSize / 2 + 0.8]}
        fontSize={0.5}
        color={isCurrentUser ? "#00ff41" : "#ffffff"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.06}
        outlineColor="#000000"
        fontWeight="bold"
      >
        @{user.username}
      </Text>

      {/* LOC label */}
      <Text
        position={[0, -0.25, baseSize / 2 + 0.8]}
        fontSize={0.32}
        color={isCurrentUser ? "#88ffaa" : isCreator ? "#ffd060" : "#aaaacc"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000000"
      >
        {user.totalLines >= 1000000
          ? `${(user.totalLines / 1000000).toFixed(1)}M lines`
          : user.totalLines >= 1000
          ? `${(user.totalLines / 1000).toFixed(0)}K lines`
          : `${user.totalLines} lines`}
      </Text>

      {isCurrentUser && (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
          <Text position={[0, 14, 0]} fontSize={0.7} color="#ffb300" anchorX="center" anchorY="middle">★</Text>
        </Float>
      )}
    </group>
  );
}

function WorldScene({
  users,
  currentUsername,
  onSelectUser,
}: {
  users: WorldUser[];
  currentUsername?: string;
  onSelectUser: (username: string) => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 22, 36);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const userPositions = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      if (a.username === currentUsername) return -1;
      if (b.username === currentUsername) return 1;
      return b.totalLines - a.totalLines;
    });

    const SPACING = 16;
    const positions: { user: WorldUser; position: [number, number, number] }[] = [];

    // N×N grid layout expanding equally in all directions from center.
    // For N users, compute the smallest odd grid size that fits them all.
    // Center cell = most prominent user; remaining cells fill outward in
    // reading order (row by row, left-to-right, top-to-bottom).
    const n = sorted.length;
    const gridSize = Math.ceil(Math.sqrt(n)); // e.g. 12 users → 4×4 grid
    // Make gridSize odd so there is a true center cell
    const gs = gridSize % 2 === 0 ? gridSize + 1 : gridSize;
    const half = Math.floor(gs / 2); // e.g. gs=5 → half=2

    // Build all grid cells sorted by Manhattan distance from center,
    // then by row then col so the layout is deterministic and symmetric.
    const cells: [number, number][] = [];
    for (let row = -half; row <= half; row++) {
      for (let col = -half; col <= half; col++) {
        cells.push([col, row]);
      }
    }
    cells.sort((a, b) => {
      const da = Math.abs(a[0]) + Math.abs(a[1]);
      const db = Math.abs(b[0]) + Math.abs(b[1]);
      if (da !== db) return da - db;
      if (a[1] !== b[1]) return a[1] - b[1];
      return a[0] - b[0];
    });

    sorted.forEach((user, i) => {
      const [col, row] = cells[i] ?? [i, 0];
      positions.push({ user, position: [col * SPACING, 0, row * SPACING] });
    });

    return positions;
  }, [users, currentUsername]);

  return (
    <>
      <color attach="background" args={["#030308"]} />
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight position={[10, 30, 10]} intensity={2.5} color="#ffffff" castShadow />
      <directionalLight position={[-15, 15, -15]} intensity={0.8} color="#6688ff" />
      <directionalLight position={[0, 3, 25]} intensity={1.0} color="#ffffff" />
      <directionalLight position={[0, 3, -25]} intensity={0.6} color="#aaccff" />
      <pointLight position={[0, 20, 0]} intensity={1.5} color="#ffffff" distance={80} />
      <Stars radius={120} depth={60} count={3000} factor={4} saturation={0} fade speed={0.5} />

      {/* City ground base — large dark plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.36, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#050510" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* City grid overlay */}
      <gridHelper args={[200, 80, "#001a0d", "#000d06"]} position={[0, -0.34, 0]} />
      {/* Secondary finer grid */}
      <gridHelper args={[200, 200, "#001208", "#000a04"]} position={[0, -0.33, 0]} />

      {userPositions.map(({ user, position }) => (
        <UserBase
          key={user.username}
          user={user}
          position={position}
          isCurrentUser={user.username === currentUsername}
          isCreator={user.username.toLowerCase() === "siddhux9"}
          onClick={() => onSelectUser(user.username)}
        />
      ))}
      <fog attach="fog" args={["#030308", 70, 140]} />
    </>
  );
}

export interface CodeWorldHandle {
  toggleFullscreen: () => void;
  searchUser: (username: string) => void;
  allUsers: WorldUser[];
}

export default forwardRef<CodeWorldHandle, {
  currentUser?: WorldUser;
  leaderboardUsers: WorldUser[];
  onUserSelect?: (username: string | null) => void;
}>(function CodeWorld({ currentUser, leaderboardUsers, onUserSelect }, ref) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectUser = (username: string | null) => {
    setSelectedUser(username);
    onUserSelect?.(username);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const allUsers = useMemo(() => {
    const map = new Map<string, WorldUser>();
    if (currentUser) map.set(currentUser.username, currentUser);
    for (const u of leaderboardUsers) {
      if (!map.has(u.username)) map.set(u.username, u);
    }
    return Array.from(map.values()).slice(0, 12);
  }, [currentUser, leaderboardUsers]);

  useImperativeHandle(ref, () => ({
    toggleFullscreen,
    searchUser: (username: string) => {
      const match = allUsers.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (match) handleSelectUser(match.username);
    },
    allUsers,
  }));

  const selectedUserData = allUsers.find((u) => u.username === selectedUser);
  const legendUser = currentUser || allUsers[0];

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#030308] overflow-hidden"
      style={{ height: isFullscreen ? "100vh" : "100%" }}
    >
      {/* Selected user info panel */}
      <AnimatePresence>
        {selectedUserData && (
          <motion.div
            key={selectedUserData.username}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="absolute top-16 left-4 z-10 font-mono w-64"
            style={{
              background: "rgba(2, 28, 12, 0.98)",
              border: "2px solid rgba(0,255,65,1)",
              boxShadow: "0 0 0 1px rgba(0,255,65,0.3), 0 0 40px rgba(0,255,65,0.5), 0 0 80px rgba(0,255,65,0.15)",
              padding: "14px",
            }}
          >
            {/* Header bar */}
            <div className="flex items-center gap-1.5 mb-3 pb-2" style={{ borderBottom: "1px solid rgba(0,255,65,0.5)", background: "rgba(0,255,65,0.08)", margin: "-14px -14px 12px -14px", padding: "8px 14px" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#00ff41", boxShadow: "0 0 6px #00ff41" }} />
              <span className="text-[10px] tracking-[0.3em] font-black" style={{ color: "#00ff41", textShadow: "0 0 8px rgba(0,255,65,0.8)" }}>DEVELOPER PROFILE</span>
              <button
                onClick={() => handleSelectUser(null)}
                className="ml-auto text-[11px] font-bold transition-colors"
                style={{ color: "rgba(0,255,65,0.7)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#00ff41")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0,255,65,0.7)")}
              >
                ✕
              </button>
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-3">
              <img
                src={selectedUserData.avatarUrl}
                alt={selectedUserData.username}
                className="w-12 h-12 rounded-sm shrink-0"
                style={{ border: "2px solid rgba(0,255,65,0.8)", boxShadow: "0 0 10px rgba(0,255,65,0.3)" }}
              />
              <div>
                <div className="text-sm font-black" style={{ color: "#00ff41", textShadow: "0 0 8px rgba(0,255,65,0.6)" }}>
                  @{selectedUserData.username}
                </div>
                <div className="text-xs mt-0.5 font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {selectedUserData.totalLines >= 1000000
                    ? `${(selectedUserData.totalLines / 1000000).toFixed(2)}M lines`
                    : selectedUserData.totalLines >= 1000
                    ? `${(selectedUserData.totalLines / 1000).toFixed(0)}K lines`
                    : `${selectedUserData.totalLines} lines`}
                </div>
                <div className="text-[10px] mt-0.5 font-medium" style={{ color: "rgba(0,255,65,0.7)" }}>
                  TOP {Math.round(100 - selectedUserData.percentileRank)}% globally
                </div>
              </div>
            </div>

            {/* Language bars */}
            <div className="space-y-2">
              {selectedUserData.languages.slice(0, 5).map((l) => (
                <div key={l.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: l.color, boxShadow: `0 0 4px ${l.color}` }} />
                      <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>{l.name}</span>
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {l.lines >= 1000 ? `${(l.lines / 1000).toFixed(0)}K` : l.lines}
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${l.percentage}%`, backgroundColor: l.color, boxShadow: `0 0 6px ${l.color}` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 20, 32], fov: 55 }}
        style={{ background: "#030308", width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: false }}
      >
        <WorldScene
          users={allUsers}
          currentUsername={currentUser?.username}
          onSelectUser={(u) => handleSelectUser(selectedUser === u ? null : u)}
        />
        <OrbitControls
          enablePan={false}
          minDistance={10}
          maxDistance={70}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.4}
        />
      </Canvas>

      {/* Legend */}
      {legendUser && (
        <div className="absolute bottom-4 right-4 z-10 bg-black/70 border border-border p-2 text-xs font-mono">
          <div className="text-muted-foreground mb-1">LANGUAGES</div>
          {legendUser.languages.slice(0, 6).map((l) => (
            <div key={l.name} className="flex items-center gap-2">
              <div className="w-2 h-2" style={{ backgroundColor: l.color }} />
              <span style={{ color: l.color }}>{l.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});