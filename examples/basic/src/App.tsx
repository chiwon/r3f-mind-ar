import { useRef, useState } from 'react';
import { Environment, useGLTF } from '@react-three/drei';
import { Group } from 'three';
import { ARView, ARAnchor } from 'r3f-mind-ar';
import type { ARViewHandle } from 'r3f-mind-ar';

/**
 * Basic example — place a GLB model on a tracked image target.
 *
 * 1. Keep `card.png`, `targets.mind`, and `bitcoin.glb` in /public
 * 2. Run `npm run dev`
 * 3. Tap "Start AR", allow camera, point at card.png
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
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ARView
        ref={arRef}
        imageTargets={`${import.meta.env.BASE_URL}targets.mind`}
        maxTrack={1}
        autoplay={false}
        onReady={() => {
          console.log('[AR] Ready');
          setErrorMessage(null);
        }}
        onError={(err) => {
          console.error('[AR] Error:', err);
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
            console.log('[AR] Target found!');
            setFound(true);
          }}
          onAnchorLost={() => {
            console.log('[AR] Target lost');
            setFound(false);
          }}
        >
          <BitcoinModel />
        </ARAnchor>
      </ARView>

      {/* Start button */}
      {!started && !errorMessage && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            gap: 12,
          }}
        >
          <p style={{ color: '#fff', fontFamily: 'system-ui, sans-serif', fontSize: 15, margin: 0, opacity: 0.8 }}>
            Point your camera at the target card
          </p>
          <button
            type="button"
            onClick={handleStart}
            style={{
              padding: '14px 36px',
              fontSize: 17,
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 600,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
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
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 14,
            background: 'rgba(0,0,0,0.5)',
            padding: '8px 16px',
            borderRadius: 8,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {found ? '✓ Target detected!' : 'Point camera at the target image…'}
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 13,
            background: 'rgba(185, 28, 28, 0.9)',
            padding: '10px 16px',
            borderRadius: 8,
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 8 }}>{errorMessage}</div>
          <button
            type="button"
            onClick={handleStart}
            style={{
              padding: '6px 16px',
              fontSize: 13,
              fontFamily: 'system-ui, sans-serif',
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

function BitcoinModel() {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}bitcoin.glb`);

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
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(`${import.meta.env.BASE_URL}bitcoin.glb`);
