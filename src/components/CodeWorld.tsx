import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Stars, Float, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";

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

// Avatar plane that loads a texture from a URL
function AvatarPlane({
  avatarUrl,
  position,
  size,
}: {
  avatarUrl: string;
  position: [number, number, number];
  size: number;
}) {
  const texture = useTexture(avatarUrl);
  return (
    <mesh position={position}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

// Town Hall — central landmark, scales with user prestige
function TownHall({
  totalLines,
  percentileRank,
  username,
  avatarUrl,
  isCurrentUser,
  color,
}: {
  totalLines: number;
  percentileRank: number;
  username: string;
  avatarUrl: string;
  isCurrentUser: boolean;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const spireRef = useRef<THREE.Mesh>(null);

  // Prestige score: 0–1 based on percentile and LOC
  const prestige = Math.min(1, (percentileRank / 100) * 0.6 + Math.min(totalLines / 1000000, 1) * 0.4);
  const baseH = 1.5 + prestige * 6.0;   // 1.5 → 7.5
  const baseW = 1.2 + prestige * 1.8;   // 1.2 → 3.0
  const towerH = baseH * 0.6;
  const spireH = baseH * 0.5;
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const glowColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.8), [color]);

  useFrame((state) => {
    if (spireRef.current) {
      spireRef.current.rotation.y = state.clock.elapsedTime * 0.8;
    }
  });

  const windowRows = Math.floor(baseH * 1.5);
  const windowCols = 3;

  // Avatar panel sits on the upper tower face
  const avatarY = baseH + 0.3 + towerH * 0.5;
  const avatarZ = (baseW * 0.65) / 2 + 0.02;
  const avatarSize = Math.min(baseW * 0.55, 1.2);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Foundation steps */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[baseW + 0.8, 0.16, baseW + 0.8]} />
        <meshStandardMaterial color="#111122" emissive="#0a0a20" emissiveIntensity={0.3} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[baseW + 0.4, 0.14, baseW + 0.4]} />
        <meshStandardMaterial color="#151530" emissive="#0d0d28" emissiveIntensity={0.3} roughness={0.8} />
      </mesh>

      {/* Main body */}
      <mesh position={[0, baseH / 2 + 0.3, 0]} castShadow>
        <boxGeometry args={[baseW, baseH, baseW]} />
        <meshStandardMaterial
          color={threeColor}
          emissive={glowColor}
          emissiveIntensity={isCurrentUser ? 0.7 : 0.4}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>

      {/* Horizontal floor bands */}
      {Array.from({ length: Math.floor(baseH / 1.5) }).map((_, i) => (
        <mesh key={i} position={[0, 0.3 + (i + 1) * 1.5, 0]}>
          <boxGeometry args={[baseW + 0.08, 0.08, baseW + 0.08]} />
          <meshStandardMaterial
            color={threeColor}
            emissive={threeColor}
            emissiveIntensity={1.2}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}

      {/* Windows grid on main body */}
      {Array.from({ length: windowRows }).map((_, row) =>
        Array.from({ length: windowCols }).map((_, col) => {
          const wx = (col - (windowCols - 1) / 2) * (baseW / windowCols);
          const wy = 0.3 + (row + 0.5) * (baseH / windowRows);
          const warm = (row + col) % 3 !== 0;
          return (
            <mesh key={`${row}-${col}`} position={[wx, wy, baseW / 2 + 0.01]}>
              <planeGeometry args={[0.14, 0.1]} />
              <meshStandardMaterial
                color={warm ? "#ffffaa" : "#aaddff"}
                emissive={warm ? "#ffff44" : "#88ccff"}
                emissiveIntensity={1.5}
              />
            </mesh>
          );
        })
      )}

      {/* Upper tower */}
      <mesh position={[0, baseH + 0.3 + towerH / 2, 0]} castShadow>
        <boxGeometry args={[baseW * 0.65, towerH, baseW * 0.65]} />
        <meshStandardMaterial
          color={threeColor}
          emissive={glowColor}
          emissiveIntensity={isCurrentUser ? 1.0 : 0.6}
          roughness={0.1}
          metalness={0.95}
        />
      </mesh>

      {/* Avatar on upper tower face — wrapped in Suspense to handle async texture loading */}
      <Suspense fallback={null}>
        <AvatarPlane
          avatarUrl={avatarUrl}
          position={[0, avatarY, avatarZ]}
          size={avatarSize}
        />
      </Suspense>

      {/* Spire */}
      <mesh ref={spireRef} position={[0, baseH + 0.3 + towerH + spireH / 2, 0]} castShadow>
        <coneGeometry args={[baseW * 0.25, spireH, 8]} />
        <meshStandardMaterial
          color={isCurrentUser ? "#00ff41" : color}
          emissive={isCurrentUser ? "#00ff41" : color}
          emissiveIntensity={isCurrentUser ? 3.0 : 1.8}
          roughness={0.0}
          metalness={1.0}
        />
      </mesh>

      {/* Spire tip glow orb */}
      <mesh position={[0, baseH + 0.3 + towerH + spireH + 0.2, 0]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial
          color={isCurrentUser ? "#00ff41" : color}
          emissive={isCurrentUser ? "#00ff41" : color}
          emissiveIntensity={isCurrentUser ? 5.0 : 3.0}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Corner pillars */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (baseW / 2 + 0.05), baseH * 0.4, sz * (baseW / 2 + 0.05)]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, baseH * 0.8, 6]} />
          <meshStandardMaterial
            color={threeColor}
            emissive={threeColor}
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      ))}

      {/* Username label above spire */}
      <Text
        position={[0, baseH + 0.3 + towerH + spireH + 0.8, 0]}
        fontSize={0.3}
        color={isCurrentUser ? "#00ff41" : "#aaaacc"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
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

  // Width varies by type
  const w = buildingType === 0 ? 0.75 : buildingType === 1 ? 0.6 : 0.85;
  const windowRows = Math.max(2, Math.floor(height * 1.8));

  return (
    <group position={position}>
      {/* Base podium */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[w + 0.25, 0.2, w + 0.25]} />
        <meshStandardMaterial color="#0d0d1a" emissive="#080818" emissiveIntensity={0.2} roughness={0.9} />
      </mesh>

      {/* Main tower */}
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
        <meshStandardMaterial
          color={threeColor}
          emissive={emissiveColor}
          emissiveIntensity={active ? 1.0 : 0.45}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>

      {/* Setback upper section (for type 0 — stepped skyscraper) */}
      {buildingType === 0 && height > 3 && (
        <mesh position={[0, height * 0.65 + 0.2, 0]} castShadow>
          <boxGeometry args={[w * 0.7, height * 0.35, w * 0.7]} />
          <meshStandardMaterial
            color={threeColor}
            emissive={emissiveColor}
            emissiveIntensity={active ? 1.2 : 0.6}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      )}

      {/* Floor bands */}
      {Array.from({ length: Math.floor(height / 1.8) }).map((_, i) => (
        <mesh key={i} position={[0, 0.2 + (i + 1) * 1.8, 0]}>
          <boxGeometry args={[w + 0.06, 0.06, w + 0.06]} />
          <meshStandardMaterial
            color={threeColor}
            emissive={threeColor}
            emissiveIntensity={0.9}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}

      {/* Windows */}
      {Array.from({ length: windowRows }).map((_, row) => {
        const wy = 0.2 + (row + 0.5) * (height / windowRows);
        const warm = row % 3 !== 2;
        return (
          <mesh key={row} position={[w / 2 + 0.01, wy, 0]}>
            <planeGeometry args={[0.08, 0.07]} />
            <meshStandardMaterial
              color={warm ? "#ffffaa" : "#aaddff"}
              emissive={warm ? "#ffff44" : "#88ccff"}
              emissiveIntensity={1.3}
            />
          </mesh>
        );
      })}

      {/* Rooftop cap */}
      <mesh position={[0, height + 0.2 + 0.08, 0]}>
        <boxGeometry args={[w + 0.05, 0.16, w + 0.05]} />
        <meshStandardMaterial
          color={threeColor}
          emissive={threeColor}
          emissiveIntensity={active ? 3.5 : 2.0}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Antenna on tall buildings */}
      {height > 4 && (
        <mesh position={[0, height + 0.2 + 0.16 + 0.5, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.0, 4]} />
          <meshStandardMaterial
            color={threeColor}
            emissive={threeColor}
            emissiveIntensity={2.0}
          />
        </mesh>
      )}

      {/* Hover label */}
      {active && (
        <Text
          position={[0, height + 1.8, 0]}
          fontSize={0.26}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
        >
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
  onClick,
}: {
  user: WorldUser;
  position: [number, number, number];
  isCurrentUser: boolean;
  onClick: () => void;
}) {
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && isCurrentUser) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.04;
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

  const baseSize = Math.min(langs.length * 1.4 + 3, 12) + prestige * 2;
  const townHallColor = langs[0]?.color || "#00ff41";

  const buildingPositions = useMemo(() => {
    return langs.map((lang, i) => {
      const angle = (i / langs.length) * Math.PI * 2;
      const ringRadius = baseSize * 0.32;
      return {
        x: Math.cos(angle) * ringRadius,
        z: Math.sin(angle) * ringRadius,
        lang,
        height: heights[i],
        type: i % 3,
      };
    });
  }, [langs, heights, baseSize]);

  // Primary language color for platform accent
  const platformAccentColor = langs[0]?.color || (isCurrentUser ? "#00ff41" : "#2244cc");

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      {/* Base platform — outer ring — brighter, more visible */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <cylinderGeometry args={[baseSize / 2 + 0.5, baseSize / 2 + 0.5, 0.24, 32]} />
        <meshStandardMaterial
          color={isCurrentUser ? "#003318" : "#0d0d2a"}
          emissive={isCurrentUser ? "#002210" : "#080820"}
          emissiveIntensity={1.2}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>

      {/* Platform border glow ring — brighter */}
      <mesh position={[0, -0.04, 0]}>
        <torusGeometry args={[baseSize / 2 + 0.5, 0.12, 8, 48]} />
        <meshStandardMaterial
          color={isCurrentUser ? "#00ff41" : platformAccentColor}
          emissive={isCurrentUser ? "#00ff41" : platformAccentColor}
          emissiveIntensity={isCurrentUser ? 5.0 : 2.5}
          transparent
          opacity={1.0}
        />
      </mesh>

      {/* Inner platform — slightly lighter */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[baseSize / 2, baseSize / 2, 0.12, 32]} />
        <meshStandardMaterial
          color={isCurrentUser ? "#004420" : "#111130"}
          emissive={isCurrentUser ? "#002210" : "#0a0a28"}
          emissiveIntensity={0.8}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Platform surface grid lines — visible accent lines */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const r = baseSize / 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * r * 0.5, -0.04, Math.sin(angle) * r * 0.5]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[r, 0.02, 0.04]} />
            <meshStandardMaterial
              color={isCurrentUser ? "#00ff41" : platformAccentColor}
              emissive={isCurrentUser ? "#00ff41" : platformAccentColor}
              emissiveIntensity={1.5}
              transparent
              opacity={0.5}
            />
          </mesh>
        );
      })}

      {/* Road lines radiating from center — brighter */}
      {buildingPositions.map(({ x, z }, i) => {
        const angle = Math.atan2(z, x);
        const dist = Math.sqrt(x * x + z * z);
        return (
          <mesh
            key={i}
            position={[x / 2, -0.03, z / 2]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[dist, 0.03, 0.1]} />
            <meshStandardMaterial
              color={isCurrentUser ? "#00aa33" : platformAccentColor}
              emissive={isCurrentUser ? "#00aa33" : platformAccentColor}
              emissiveIntensity={isCurrentUser ? 1.5 : 1.0}
              transparent
              opacity={0.7}
            />
          </mesh>
        );
      })}

      {/* Town Hall at center */}
      <TownHall
        totalLines={user.totalLines}
        percentileRank={user.percentileRank}
        username={user.username}
        avatarUrl={user.avatarUrl}
        isCurrentUser={isCurrentUser}
        color={townHallColor}
      />

      {/* Language buildings in ring */}
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

      {/* Username label — larger, brighter, with background plate */}
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

      {/* LOC label below username */}
      <Text
        position={[0, -0.25, baseSize / 2 + 0.8]}
        fontSize={0.32}
        color={isCurrentUser ? "#88ffaa" : "#aaaacc"}
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

      {/* Crown for current user */}
      {isCurrentUser && (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
          <Text
            position={[0, 14, 0]}
            fontSize={0.7}
            color="#ffb300"
            anchorX="center"
            anchorY="middle"
          >
            ★
          </Text>
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
    camera.position.set(0, 20, 32);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  const userPositions = useMemo(() => {
    return users.slice(0, 12).map((user, i) => {
      const angle = (i / Math.min(users.length, 12)) * Math.PI * 2;
      const radius = users.length === 1 ? 0 : Math.min(users.length * 3.5, 24);
      return {
        user,
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number],
      };
    });
  }, [users]);

  return (
    <>
      <color attach="background" args={["#030308"]} />
      {/* Boosted ambient for base detail visibility */}
      <ambientLight intensity={0.7} color="#ffffff" />
      <directionalLight position={[5, 25, 5]} intensity={2.2} color="#ffffff" castShadow />
      <directionalLight position={[-10, 12, -10]} intensity={0.8} color="#6688ff" />
      {/* Low-angle fill light to illuminate base platforms */}
      <directionalLight position={[0, 2, 20]} intensity={1.0} color="#ffffff" />
      <directionalLight position={[0, 2, -20]} intensity={0.6} color="#aaccff" />
      <pointLight position={[0, 18, 0]} intensity={3.0} color="#00ff41" distance={80} decay={1} />
      <pointLight position={[20, 6, 20]} intensity={1.5} color="#ff6600" distance={60} decay={1.5} />
      <pointLight position={[-20, 6, -20]} intensity={1.5} color="#0066ff" distance={60} decay={1.5} />
      {/* Ground-level fill lights */}
      <pointLight position={[0, 1, 0]} intensity={1.5} color="#ffffff" distance={40} decay={2} />
      <Stars radius={120} depth={60} count={5000} factor={5} saturation={0} fade speed={0.3} />
      {/* Ground plane — slightly lighter for contrast */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#070714" roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Grid — more visible */}
      <gridHelper args={[120, 60, "#003318", "#001a0c"]} position={[0, -0.33, 0]} />
      {userPositions.map(({ user, position }) => (
        <UserBase
          key={user.username}
          user={user}
          position={position}
          isCurrentUser={user.username === currentUsername}
          onClick={() => onSelectUser(user.username)}
        />
      ))}
      {/* Push fog further out so base details are visible */}
      <fog attach="fog" args={["#030308", 60, 120]} />
    </>
  );
}

export default function CodeWorld({
  currentUser,
  leaderboardUsers,
  onUserSelect,
}: {
  currentUser?: WorldUser;
  leaderboardUsers: WorldUser[];
  onUserSelect?: (username: string | null) => void;
}) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
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

  const selectedUserData = allUsers.find((u) => u.username === selectedUser);
  const legendUser = currentUser || allUsers[0];

  return (
    <div
      ref={containerRef}
      className="relative w-full terminal-border bg-[#030308] overflow-hidden"
      style={{ height: isFullscreen ? "100vh" : "580px" }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm border-b border-border">
        <div className="text-xs text-primary font-mono terminal-glow">◈ CODEWORLD — NIGHT CITY</div>
        <div className="text-xs text-muted-foreground font-mono hidden sm:block">
          {allUsers.length} developer{allUsers.length !== 1 ? "s" : ""} · Town Hall = prestige · Ring = languages · Click to explore
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono flex items-center gap-1"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span className="hidden sm:inline">{isFullscreen ? "[exit]" : "[full]"}</span>
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
          >
            [?]
          </button>
        </div>
      </div>

      {/* Info overlay */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 right-4 z-20 bg-card border border-border p-3 text-xs font-mono max-w-xs"
        >
          <div className="text-primary mb-2">HOW IT WORKS</div>
          <div className="text-muted-foreground space-y-1">
            <div>• Center tower = Town Hall (scales with prestige)</div>
            <div>• Ring buildings = languages used</div>
            <div>• Building height = √LOC</div>
            <div>• Taller Town Hall = more repos + LOC</div>
            <div>• Green border = your base</div>
            <div>• Drag to rotate · Scroll to zoom</div>
          </div>
          <button onClick={() => setShowInfo(false)} className="mt-2 text-muted-foreground hover:text-primary">
            [close]
          </button>
        </motion.div>
      )}

      {/* Selected user info — high contrast, bright panel */}
      <AnimatePresence>
        {selectedUserData && (
          <motion.div
            key={selectedUserData.username}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="absolute top-12 left-4 z-30 font-mono w-64"
            style={{
              background: "rgba(0,0,0,0.97)",
              border: "1.5px solid rgba(0,255,65,0.8)",
              boxShadow: "0 0 32px rgba(0,255,65,0.35), 0 0 8px rgba(0,255,65,0.15), inset 0 0 24px rgba(0,0,0,0.6)",
              padding: "14px",
            }}
          >
            {/* Header bar */}
            <div className="flex items-center gap-1.5 mb-3 pb-2" style={{ borderBottom: "1px solid rgba(0,255,65,0.3)" }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#00ff41" }} />
              <span className="text-[9px] tracking-[0.3em]" style={{ color: "#00ff41" }}>DEVELOPER PROFILE</span>
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
        style={{ background: "#030308", paddingTop: "36px" }}
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
}