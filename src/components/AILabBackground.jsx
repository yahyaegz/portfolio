import { PerspectiveCamera } from '@react-three/drei';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const NeuralNetwork = () => {
    const groupRef = useRef();
    const count = 40;

    const [positions, lines] = useMemo(() => {
        const pos = [];
        for (let i = 0; i < count; i++) {
            pos.push(new THREE.Vector3(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 10 - 5
            ));
        }

        const lns = [];
        for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
                if (pos[i].distanceTo(pos[j]) < 7) {
                    lns.push(pos[i], pos[j]);
                }
            }
        }
        return [pos, lns];
    }, [count]);

    const lineGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints(lines);
        return geometry;
    }, [lines]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        groupRef.current.rotation.y += delta * 0.08;
        groupRef.current.rotation.x += delta * 0.04;
    });

    return (
        <group ref={groupRef}>
            {positions.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.15, 8, 8]} />
                    <meshBasicMaterial color="#ec4899" />
                </mesh>
            ))}
            <lineSegments geometry={lineGeometry}>
                <lineBasicMaterial color="#06b6d4" transparent opacity={0.3} />
            </lineSegments>
        </group>
    );
};

export default function AILabBackground() {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={60} />
            
            <color attach="background" args={['#03050a']} />
            <fog attach="fog" args={['#03050a', 10, 25]} />
            <NeuralNetwork />
        </>
    );
}
