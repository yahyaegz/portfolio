import WebGLDisposer from './WebGLDisposer';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RadarScanner = () => {
    const scanRef = useRef();

    useFrame((state, delta) => {
        if (!scanRef.current) return;
        scanRef.current.rotation.z -= delta * 1.5;
    });

    return (
        <group position={[0, 0, -8]} rotation={[-Math.PI / 3, 0, 0]}>
            {[2, 4, 6, 8, 10].map((r) => (
                <mesh key={r}>
                    <ringGeometry args={[r - 0.05, r + 0.05, 64]} />
                    <meshBasicMaterial color="#10b981" transparent opacity={0.2} side={THREE.DoubleSide} />
                </mesh>
            ))}
            <mesh ref={scanRef}>
                <circleGeometry args={[10, 64, 0, Math.PI / 4]} />
                <meshBasicMaterial color="#10b981" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

export default function DevOpsBackground() {
    return (
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ antialias: true }}>
            <WebGLDisposer />
            <color attach="background" args={['#020617']} />
            <fog attach="fog" args={['#020617', 5, 20]} />
            <RadarScanner />
        </Canvas>
    );
}
