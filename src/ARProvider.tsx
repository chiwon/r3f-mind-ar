import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Matrix4, Vector3, Quaternion, PerspectiveCamera, Color } from 'three';
import { ARContext } from './ARContext';
import type {
  ARProviderProps,
  AnchorState,
  MindARController,
  TrackingUpdateData,
} from './types';

// @ts-expect-error — mind-ar ships no type declarations
import { Controller as ImageTargetController } from 'mind-ar/src/image-target/controller';

export function ARProvider({
  children,
  imageTargets,
  maxTrack = 1,
  filterMinCF = null,
  filterBeta = null,
  warmupTolerance = null,
  missTolerance = null,
  autoplay = true,
  flipUserCamera = false,
  onReady,
  onError,
}: ARProviderProps) {
  const { camera: rawCamera, gl, scene } = useThree();
  const camera = rawCamera as PerspectiveCamera;

  // Ensure renderer + scene are transparent so video shows through
  useEffect(() => {
    gl.setClearColor(new Color(0x000000), 0);
    scene.background = null;
  }, [gl, scene]);
  const controllerRef = useRef<MindARController | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const anchorsRef = useRef<Map<number, AnchorState>>(new Map());
  const postMatricesRef = useRef<Matrix4[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [facingUser, setFacingUser] = useState(flipUserCamera);

  // Mutable ref — consumed directly via context, no React state for anchors
  const anchorsDirtyRef = useRef(false);
  const anchorsVersionRef = useRef(0);
  const [, setAnchorsVersion] = useState(0);

  const setupVideo = useCallback(async (): Promise<HTMLVideoElement> => {
    const video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';

    // DOM order: video first, then canvas — canvas stacks on top naturally
    const container = gl.domElement.parentElement;
    if (container) {
      container.style.position = 'relative';
      container.insertBefore(video, gl.domElement);
      gl.domElement.style.position = 'relative';
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: facingUser ? 'user' : 'environment',
      },
    });

    video.srcObject = stream;

    return new Promise((resolve) => {
      video.addEventListener('loadedmetadata', () => {
        video.setAttribute('width', String(video.videoWidth));
        video.setAttribute('height', String(video.videoHeight));
        resolve(video);
      });
    });
  }, [gl.domElement, facingUser]);

  const startTracking = useCallback(async () => {
    try {
      // Setup video
      const video = await setupVideo();
      videoRef.current = video;

      // Create controller
      const controller: MindARController = new ImageTargetController({
        inputWidth: video.videoWidth,
        inputHeight: video.videoHeight,
        maxTrack,
        filterMinCF,
        filterBeta,
        warmupTolerance,
        missTolerance,
        onUpdate: null,
        debugMode: false,
      });

      // Set projection matrix on R3F camera
      const proj = controller.getProjectionMatrix();
      const fov = (2 * Math.atan(1 / proj[5]) * 180) / Math.PI;
      const near = proj[14] / (proj[10] - 1.0);
      const far = proj[14] / (proj[10] + 1.0);
      camera.fov = fov;
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();

      // Load image targets
      const { dimensions } = await controller.addImageTargets(imageTargets);

      // Build post-transform matrices (same as MindAR original)
      postMatricesRef.current = dimensions.map(
        ([markerWidth, markerHeight]: [number, number]) =>
          new Matrix4().compose(
            new Vector3(
              markerWidth / 2,
              markerWidth / 2 + (markerHeight - markerWidth) / 2,
              0
            ),
            new Quaternion(),
            new Vector3(markerWidth, markerWidth, markerWidth)
          )
      );

      // Reusable matrix for onUpdate — avoids GC pressure (~30 calls/sec)
      const _tmpMat = new Matrix4();

      // Handle tracking updates — write to ref, not state
      controller.onUpdate = (data: TrackingUpdateData) => {
        if (data.type === 'updateMatrix' && data.targetIndex !== undefined) {
          const { targetIndex, worldMatrix } = data;
          const postMatrix = postMatricesRef.current[targetIndex];

          if (worldMatrix !== null && worldMatrix !== undefined && postMatrix) {
            _tmpMat.fromArray(worldMatrix).multiply(postMatrix);

            anchorsRef.current.set(targetIndex, {
              matrix: _tmpMat.toArray(),
              visible: true,
            });
          } else {
            anchorsRef.current.set(targetIndex, {
              matrix: null,
              visible: false,
            });
          }
          anchorsDirtyRef.current = true;
        }
      };

      // Warm-up and start
      await controller.dummyRun(video);
      controller.processVideo(video);
      controllerRef.current = controller;

      setIsTracking(true);
      setIsReady(true);
      onReady?.();
    } catch (err) {
      console.error('[r3f-mind-ar] Failed to start tracking:', err);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [
    setupVideo,
    imageTargets,
    maxTrack,
    filterMinCF,
    filterBeta,
    warmupTolerance,
    missTolerance,
    camera,
    onReady,
    onError,
  ]);

  const stopTracking = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.stopProcessVideo();
      controllerRef.current = null;
    }
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
      videoRef.current.remove();
      videoRef.current = null;
    }
    setIsTracking(false);
  }, []);

  const switchCamera = useCallback(() => {
    const wasTracking = isTracking;
    if (wasTracking) stopTracking();
    setFacingUser((prev) => !prev);
    // Will restart via autoplay effect or manual call
  }, [isTracking, stopTracking]);

  // Bump version counter to notify consumers — no Map copy, no object allocation
  useFrame(() => {
    if (anchorsDirtyRef.current) {
      anchorsDirtyRef.current = false;
      anchorsVersionRef.current += 1;
      setAnchorsVersion(anchorsVersionRef.current);
    }
  });

  // Autoplay
  useEffect(() => {
    if (autoplay) {
      startTracking();
    }
    return () => {
      stopTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, facingUser]);

  return (
    <ARContext.Provider
      value={{
        anchors: anchorsRef.current,
        startTracking,
        stopTracking,
        switchCamera,
        isTracking,
        isReady,
      }}
    >
      {children}
    </ARContext.Provider>
  );
}
