import { forwardRef, Suspense, useEffect, useImperativeHandle, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { ARProvider } from './ARProvider';
import { useAR } from './ARContext';
import type { ARViewProps } from './types';

export interface ARViewHandle {
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  switchCamera: () => void;
}

/** Imperative handle bridge — exposes ARContext methods via ref */
function ARHandleBridge({
  onRef,
}: {
  onRef: (handle: ARViewHandle) => void;
}) {
  const ar = useAR();

  useEffect(() => {
    onRef({
      startTracking: ar.startTracking,
      stopTracking: ar.stopTracking,
      switchCamera: ar.switchCamera,
    });
  }, [ar.startTracking, ar.stopTracking, ar.switchCamera, onRef]);

  return null;
}

/**
 * ARView — drop-in R3F Canvas with MindAR image tracking.
 *
 * Wraps `<Canvas>` and `<ARProvider>` so you can use
 * `<ARAnchor>` children directly.
 *
 * ```tsx
 * <ARView imageTargets="/targets.mind">
 *   <ARAnchor target={0}>
 *     <mesh><boxGeometry /><meshNormalMaterial /></mesh>
 *   </ARAnchor>
 * </ARView>
 * ```
 */
export const ARView = forwardRef<ARViewHandle, ARViewProps>(
  (
    {
      children,
      imageTargets,
      maxTrack,
      filterMinCF,
      filterBeta,
      warmupTolerance,
      missTolerance,
      autoplay,
      flipUserCamera,
      onReady,
      onError,
      canvasProps,
    },
    ref
  ) => {
    const handleRef = useRef<ARViewHandle | null>(null);

    useImperativeHandle(ref, () => ({
      startTracking: () =>
        handleRef.current?.startTracking() ?? Promise.resolve(),
      stopTracking: () => handleRef.current?.stopTracking(),
      switchCamera: () => handleRef.current?.switchCamera(),
    }));

    return (
      <Canvas
        gl={{ alpha: true, antialias: true }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'transparent',
        }}
        {...canvasProps}
      >
        <Suspense fallback={null}>
          <ARProvider
            imageTargets={imageTargets}
            maxTrack={maxTrack}
            filterMinCF={filterMinCF}
            filterBeta={filterBeta}
            warmupTolerance={warmupTolerance}
            missTolerance={missTolerance}
            autoplay={autoplay}
            flipUserCamera={flipUserCamera}
            onReady={onReady}
            onError={onError}
          >
            <ARHandleBridge
              onRef={(h) => {
                handleRef.current = h;
              }}
            />
            {children}
          </ARProvider>
        </Suspense>
      </Canvas>
    );
  }
);

ARView.displayName = 'ARView';
