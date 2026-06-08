import WebGLDisposer from './WebGLDisposer';
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const IsometricGrid = () => {
    const groupRef = useRef();

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5 - 2;
    });

    return (
        <group ref={groupRef} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            {[...Array(9)].map((_, i) => {
                const x = (i % 3) * 4 - 4;
                const z = Math.floor(i / 3) * 4 - 4;
                return (
                    <mesh key={i} position={[x, 0, z]}>
                        <boxGeometry args={[3, 0.5, 3]} />
                        <meshStandardMaterial color="#06b6d4" transparent opacity={0.3} wireframe />
                    </mesh>
                );
            })}
        </group>
    );
};

export default function ProjectsBackground() {
    return (
        <Canvas camera={{ position: [0, 5, 15], fov: 40 }} gl={{ antialias: true }}>
            <WebGLDisposer />
            <color attach="background" args={['#050810']} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
            <IsometricGrid />
        </Canvas>
    );
}
