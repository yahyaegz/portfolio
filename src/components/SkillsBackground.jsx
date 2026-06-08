import { PerspectiveCamera } from '@react-three/drei';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ParticleGalaxy = () => {
    const pointsRef = useRef();
    const count = 2000;

    const [positions, colors] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const col = new Float32Array(count * 3);
        const color1 = new THREE.Color('#06b6d4');
        const color2 = new THREE.Color('#10b981');
        
        for (let i = 0; i < count; i++) {
            const r = 12 * Math.sqrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const y = (Math.random() - 0.5) * 2; 
            
            const swirl = r * 0.5;
            pos[i * 3] = r * Math.cos(theta + swirl);
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = r * Math.sin(theta + swirl);
            
            const mixedColor = color1.clone().lerp(color2, Math.random());
            col[i * 3] = mixedColor.r;
            col[i * 3 + 1] = mixedColor.g;
            col[i * 3 + 2] = mixedColor.b;
        }
        return [pos, col];
    }, [count]);

    useFrame((state, delta) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y += delta * 0.05;
        }
    });

    return (
        <points ref={pointsRef} position={[0, -2, -5]} rotation={[0.4, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.06} vertexColors transparent opacity={0.8} sizeAttenuation />
        </points>
    );
};

export default function SkillsBackground() {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={60} />
            
            <color attach="background" args={['#050810']} />
            <ParticleGalaxy />
            <fog attach="fog" args={['#050810', 4, 14]} />
        </>
    );
}
