import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ScrollAnimationProps {
  scrollProgress: number
  children: React.ReactNode
}

export const ScrollAnimation: React.FC<ScrollAnimationProps> = ({
  scrollProgress,
  children,
}) => {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const targetY = -scrollProgress * 1.4
    const targetScale = Math.max(0.82, 1 - scrollProgress * 0.25)

    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      Math.min(1, delta * 5)
    )
    const s = THREE.MathUtils.lerp(
      groupRef.current.scale.x,
      targetScale,
      Math.min(1, delta * 5)
    )
    groupRef.current.scale.set(s, s, s)
  })

  return <group ref={groupRef}>{children}</group>
}

