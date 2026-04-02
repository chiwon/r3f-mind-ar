import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Matrix4, Group } from 'three';
import { useAR } from './ARContext';
import type { ARAnchorProps } from './types';

/**
 * ARAnchor — attaches children to a tracked image target.
 *
 * ```tsx
 * <ARAnchor target={0} onAnchorFound={() => console.log('found!')}>
 *   <mesh><boxGeometry /><meshNormalMaterial /></mesh>
 * </ARAnchor>
 * ```
 */
export function ARAnchor({
  children,
  target = 0,
  onAnchorFound,
  onAnchorLost,
  ...groupProps
}: ARAnchorProps) {
  const groupRef = useRef<Group>(null);
  const { anchors } = useAR();
  const wasVisibleRef = useRef(false);

  // Apply matrix every frame for smooth updates
  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const anchor = anchors.get(target);

    if (anchor?.visible && anchor.matrix) {
      // Show and apply matrix
      if (!wasVisibleRef.current) {
        wasVisibleRef.current = true;
        onAnchorFound?.();
      }
      group.visible = true;
      group.matrix.fromArray(anchor.matrix);
    } else {
      // Hide
      if (wasVisibleRef.current) {
        wasVisibleRef.current = false;
        onAnchorLost?.();
      }
      group.visible = false;
    }
  });

  // Cleanup callback refs on unmount
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
