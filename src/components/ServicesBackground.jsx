import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

const Shape = ({ position, color, scale }) => {
    const mesh = useRef();
    useFrame((state, delta) => {
        if (!mesh.current) return;
        mesh.current.rotation.x += delta * 0.2;
        mesh.current.rotation.y += delta * 0.3;
    });
    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={2} position={position}>
            <mesh ref={mesh} scale={scale}>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color={color} wireframe />
            </mesh>
        </Float>
    );
};

export default function ServicesBackground() {
    return (
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }} gl={{ antialias: true }}>
            <color attach="background" args={['#050810']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Shape position={[-6, 2, -5]} color="#06b6d4" scale={2.5} />
            <Shape position={[6, -2, -8]} color="#3b82f6" scale={3.5} />
            <Shape position={[-3, -5, -4]} color="#ec4899" scale={1.5} />
            <Shape position={[5, 4, -6]} color="#8b5cf6" scale={2.2} />
            <fog attach="fog" args={['#050810', 5, 15]} />
        </Canvas>
    );
}
