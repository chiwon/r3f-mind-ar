import { useRef, useState } from 'react';
import { Environment, Trail, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Color, Group, Mesh } from 'three';
import { ARView, ARAnchor } from 'r3f-mind-ar';
import type { ARViewHandle } from 'r3f-mind-ar';

/**
 * VideoTexture background example with atom trail effects.
 */
export function App() {
  const arRef = useRef<ARViewHandle>(null);
  const [started, setStarted] = useState(false);
  const [found, setFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleStart() {
    setStarted(true);
    setErrorMessage(null);
    arRef.current?.startTracking().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setStarted(false);
    });
  }

  return (
		<div style={{ width: "100vw", height: "100vh", position: "relative" }}>
			<ARView
				ref={arRef}
				imageTargets="/targets.mind"
				maxTrack={1}
				autoplay={false}
				onReady={() => {
					console.log("[AR] Ready");
					setErrorMessage(null);
				}}
				onError={(err) => {
					console.error("[AR] Error:", err);
					setErrorMessage(err.message);
					setStarted(false);
				}}
			>
				<ambientLight intensity={0.9} />
				<directionalLight position={[4, 6, 4]} intensity={1.2} />
				<pointLight position={[5, 5, 5]} intensity={0.8} />
				<Environment preset="studio" background={false} />

				<ARAnchor
					target={0}
					lerp={0.15}
					onAnchorFound={() => {
						console.log("[AR] Target found!");
						setFound(true);
					}}
					onAnchorLost={() => {
						console.log("[AR] Target lost");
						setFound(false);
					}}
				>
					<BitcoinModel />

					{/* Atoms only appear once the target is found */}
					{found && (
						<>
							<Atom
								radius={0.35}
								speed={1.2}
								phase={0}
								color="#60a5fa"
								axisX={[1, 0, 0]}
								axisY={[0, 1, 0]}
							/>
							<Atom
								radius={0.38}
								speed={0.9}
								phase={Math.PI / 3}
								color="#f97316"
								axisX={[1, 0, 0]}
								axisY={[0, 0, 1]}
							/>
							<Atom
								radius={0.33}
								speed={1.5}
								phase={(Math.PI * 2) / 3}
								color="#4ade80"
								axisX={[0, 1, 0]}
								axisY={[0, 0, 1]}
							/>
							<Atom
								radius={0.4}
								speed={1.0}
								phase={Math.PI}
								color="#c084fc"
								axisX={[1, 0, 0]}
								axisY={[0, 0.707, 0.707]}
							/>
							<Atom
								radius={0.36}
								speed={1.3}
								phase={(Math.PI * 4) / 3}
								color="#fbbf24"
								axisX={[0.707, 0, 0.707]}
								axisY={[0, 1, 0]}
							/>
						</>
					)}
				</ARAnchor>

				{/* Bloom makes the emissive atom spheres and trails glow */}
				<EffectComposer>
					<Bloom mipmapBlur luminanceThreshold={1} radius={0.7} />
				</EffectComposer>
			</ARView>

			{/* Start button */}
			{!started && !errorMessage && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						zIndex: 1000,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						background: "rgba(0,0,0,0.7)",
						gap: 12,
					}}
				>
					<p
						style={{
							color: "#fff",
							fontFamily: "system-ui, sans-serif",
							fontSize: 15,
							margin: 0,
							opacity: 0.8,
						}}
					>
						Point your camera at the target card
					</p>
					<button
						type="button"
						onClick={handleStart}
						style={{
							padding: "14px 36px",
							fontSize: 17,
							fontFamily: "system-ui, sans-serif",
							fontWeight: 600,
							background: "#6366f1",
							color: "#fff",
							border: "none",
							borderRadius: 12,
							cursor: "pointer",
						}}
					>
						Start AR
					</button>
				</div>
			)}

			{/* Status hint */}
			{started && !errorMessage && (
				<div
					style={{
						position: "absolute",
						bottom: 24,
						left: "50%",
						transform: "translateX(-50%)",
						zIndex: 1000,
						color: "#fff",
						fontFamily: "system-ui, sans-serif",
						fontSize: 14,
						background: "rgba(0,0,0,0.5)",
						padding: "8px 16px",
						borderRadius: 8,
						pointerEvents: "none",
						whiteSpace: "nowrap",
					}}
				>
					{found ? "✓ Target detected!" : "Point camera at the target image…"}
				</div>
			)}

			{/* Error banner */}
			{errorMessage && (
				<div
					style={{
						position: "absolute",
						top: 16,
						left: "50%",
						transform: "translateX(-50%)",
						zIndex: 1000,
						color: "#fff",
						fontFamily: "system-ui, sans-serif",
						fontSize: 13,
						background: "rgba(185, 28, 28, 0.9)",
						padding: "10px 16px",
						borderRadius: 8,
						maxWidth: "90vw",
						textAlign: "center",
					}}
				>
					<div style={{ marginBottom: 8 }}>{errorMessage}</div>
					<button
						type="button"
						onClick={handleStart}
						style={{
							padding: "6px 16px",
							fontSize: 13,
							fontFamily: "system-ui, sans-serif",
							background: "rgba(255,255,255,0.2)",
							color: "#fff",
							border: "1px solid rgba(255,255,255,0.4)",
							borderRadius: 6,
							cursor: "pointer",
						}}
					>
						Retry
					</button>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Atom — a small sphere that orbits in a given plane, leaving a Trail behind.
// axisX and axisY define the orbital plane (should be perpendicular unit vectors).
// ---------------------------------------------------------------------------
type Vec3 = [number, number, number];

interface AtomProps {
  radius: number;
  speed: number;
  phase: number;
  color: string;
  axisX: Vec3;
  axisY: Vec3;
}

function Atom({ radius, speed, phase, color, axisX, axisY }: AtomProps) {
  const ref = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + phase;
    if (ref.current) {
      ref.current.position.set(
        (Math.cos(t) * axisX[0] + Math.sin(t) * axisY[0]) * radius,
        (Math.cos(t) * axisX[1] + Math.sin(t) * axisY[1]) * radius,
        (Math.cos(t) * axisX[2] + Math.sin(t) * axisY[2]) * radius,
      );
    }
  });

  return (
		<Trail
			local
			width={500}
			length={200}
			color={new Color(2, 1, 10)}
			attenuation={(t) => t * t}
		>
			<mesh ref={ref}>
				<sphereGeometry args={[0.02]} />
				<meshBasicMaterial color={[10, 1, 10]} toneMapped={false} />
			</mesh>
		</Trail>
	);
}

// ---------------------------------------------------------------------------
// Bitcoin model
// ---------------------------------------------------------------------------
function BitcoinModel() {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF('/bitcoin.glb');

  return (
    <group
      ref={groupRef}
      scale={0.35}
      rotation={[-Math.PI / 2, 0, 0]}
      onBeforeRender={() => {
        if (groupRef.current) {
          groupRef.current.rotation.z += 0.02;
        }
      }}
    >
      <primitive object={scene} rotation={[-Math.PI / 3, 0, 0]} />
    </group>
  );
}

useGLTF.preload('/bitcoin.glb');
