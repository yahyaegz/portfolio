import WebGLDisposer from './WebGLDisposer';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const OrbitingSpheres = () => {
    const groupRef = useRef();

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        groupRef.current.rotation.y += delta * 0.15;
    });

    return (
        <group ref={groupRef} position={[0, -1, -8]} rotation={[0.2, 0, 0]}>
            <mesh>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.4} />
            </mesh>
            
            <group position={[7, 0, 0]}>
                <mesh>
                    <sphereGeometry args={[0.8, 16, 16]} />
                    <meshBasicMaterial color="#06b6d4" wireframe />
                </mesh>
            </group>
            
            <group position={[-8, 0, 4]}>
                <mesh>
                    <sphereGeometry args={[1.2, 16, 16]} />
                    <meshBasicMaterial color="#ec4899" wireframe />
                </mesh>
            </group>
            
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <ringGeometry args={[6.8, 7.2, 64]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
            
            <mesh rotation={[Math.PI/2, 0, 0]}>
                <ringGeometry args={[8.8, 9.2, 64]} />
                <meshBasicMaterial color="#ec4899" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

export default function ObservatoryBackground() {
    return (
        <Canvas camera={{ position: [0, 2, 10], fov: 60 }} gl={{ antialias: true }}>
            <WebGLDisposer />
            <color attach="background" args={['#050810']} />
            <fog attach="fog" args={['#050810', 5, 20]} />
            <OrbitingSpheres />
        </Canvas>
    );
}
