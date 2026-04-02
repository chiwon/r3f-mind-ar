import { useRef, useState } from 'react';
import { ARView, ARAnchor } from 'r3f-mind-ar';
import type { ARViewHandle } from 'r3f-mind-ar';

/**
 * Basic example — place a spinning cube on a tracked image target.
 *
 * 1. Generate a .mind file from https://hiukim.github.io/mind-ar-js-doc/tools/compile
 * 2. Place it in /public/targets.mind
 * 3. Run `npm run dev` and point your camera at the target image
 */
export function App() {
  const arRef = useRef<ARViewHandle>(null);
  const [found, setFound] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ARView
        ref={arRef}
        imageTargets="/targets.mind"
        maxTrack={1}
        autoplay
        onReady={() => console.log('[AR] Ready')}
        onError={(err) => console.error('[AR] Error:', err)}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[5, 5, 5]} intensity={1} />

        <ARAnchor
          target={0}
          onAnchorFound={() => {
            console.log('[AR] Target found!');
            setFound(true);
          }}
          onAnchorLost={() => {
            console.log('[AR] Target lost');
            setFound(false);
          }}
        >
          <SpinningCube />
        </ARAnchor>
      </ARView>

      {/* Simple UI overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          background: 'rgba(0,0,0,0.5)',
          padding: '8px 16px',
          borderRadius: 8,
          pointerEvents: 'none',
        }}
      >
        {found ? 'Target detected!' : 'Point camera at the target image...'}
      </div>
    </div>
  );
}

function SpinningCube() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh
      ref={meshRef}
      scale={0.5}
      onBeforeRender={() => {
        if (meshRef.current) {
          meshRef.current.rotation.y += 0.02;
        }
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f46e5" />
    </mesh>
  );
}
