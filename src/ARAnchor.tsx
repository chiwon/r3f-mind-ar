import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Matrix4, Group, Vector3, Quaternion } from 'three';
import { useAR } from './ARContext';
import type { ARAnchorProps } from './types';

/**
 * ARAnchor — attaches children to a tracked image target.
 *
 * ```tsx
 * <ARAnchor target={0} lerp={0.15} onAnchorFound={() => console.log('found!')}>
 *   <mesh><boxGeometry /><meshNormalMaterial /></mesh>
 * </ARAnchor>
 * ```
 */
export function ARAnchor({
  children,
  target = 0,
  lerp = 1,
  onAnchorFound,
  onAnchorLost,
  ...groupProps
}: ARAnchorProps) {
  const groupRef = useRef<Group>(null);
  const { anchors } = useAR();
  const wasVisibleRef = useRef(false);
  const hasInitRef = useRef(false);

  // Smoothed pose (reused each frame — no GC)
  const curPos   = useRef(new Vector3());
  const curQuat  = useRef(new Quaternion());
  const curScale = useRef(new Vector3(1, 1, 1));

  // Scratch objects for decompose target
  const _tgtPos   = useRef(new Vector3());
  const _tgtQuat  = useRef(new Quaternion());
  const _tgtScale = useRef(new Vector3());
  const _tgtMat   = useRef(new Matrix4());

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const anchor = anchors.get(target);

    if (anchor?.visible && anchor.matrix) {
      if (!wasVisibleRef.current) {
        wasVisibleRef.current = true;
        onAnchorFound?.();
      }
      group.visible = true;

      _tgtMat.current.fromArray(anchor.matrix);
      _tgtMat.current.decompose(_tgtPos.current, _tgtQuat.current, _tgtScale.current);

      if (!hasInitRef.current || lerp >= 1) {
        // First frame visible — snap directly to avoid initial lerp from origin
        curPos.current.copy(_tgtPos.current);
        curQuat.current.copy(_tgtQuat.current);
        curScale.current.copy(_tgtScale.current);
        hasInitRef.current = true;
      } else {
        // Frame-rate-independent exponential smoothing
        const t = 1 - Math.pow(1 - lerp, delta * 60);
        curPos.current.lerp(_tgtPos.current, t);
        curQuat.current.slerp(_tgtQuat.current, t);
        curScale.current.lerp(_tgtScale.current, t);
      }

      group.matrix.compose(curPos.current, curQuat.current, curScale.current);
    } else {
      if (wasVisibleRef.current) {
        wasVisibleRef.current = false;
        hasInitRef.current = false; // reset so next appearance snaps first
        onAnchorLost?.();
      }
      group.visible = false;
    }
  });

  useEffect(() => {
    return () => {
      wasVisibleRef.current = false;
    };
  }, []);

  return (
    <group
      ref={groupRef}
      visible={false}
      matrixAutoUpdate={false}
      {...groupProps}
    >
      {children}
    </group>
  );
}
