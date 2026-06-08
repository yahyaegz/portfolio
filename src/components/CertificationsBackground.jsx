import WebGLDisposer from './WebGLDisposer';
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

const FloatingStars = () => {
    const groupRef = useRef();
    const count = 35;

    const stars = useMemo(() => {
        return new Array(count).fill().map(() => ({
            position: [
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 15 - 5
            ],
            speed: Math.random() * 0.5 + 0.2,
            scale: Math.random() * 0.5 + 0.3,
        }));
    }, [count]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child, i) => {
            child.position.y += stars[i].speed * delta;
            if (child.position.y > 10) child.position.y = -10;
            child.rotation.y += delta;
            child.rotation.x += delta * 0.5;
        });
    });

    return (
        <group ref={groupRef}>
            {stars.map((props, i) => (
                <mesh key={i} position={props.position} scale={props.scale}>
                    <octahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color="#facc15" wireframe />
                </mesh>
            ))}
        </group>
    );
};

export default function CertificationsBackground() {
    return (
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
            <WebGLDisposer />
            <color attach="background" args={['#050810']} />
            <fog attach="fog" args={['#050810', 5, 15]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#facc15" />
            <FloatingStars />
        </Canvas>
    );
}
