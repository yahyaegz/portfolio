import { PerspectiveCamera } from '@react-three/drei';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Waveform = () => {
    const meshRef = useRef();
    const width = 40;
    const height = 40;
    
    const [positions, indices] = useMemo(() => {
        const pos = [];
        const ind = [];
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                pos.push((i - width/2) * 0.5, 0, (j - height/2) * 0.5);
            }
        }
        for (let i = 0; i < width - 1; i++) {
            for (let j = 0; j < height - 1; j++) {
                const a = i * height + j;
                const b = i * height + j + 1;
                const c = (i + 1) * height + j;
                const d = (i + 1) * height + j + 1;
                ind.push(a, b, c);
                ind.push(b, d, c);
            }
        }
        return [new Float32Array(pos), new Uint16Array(ind)];
    }, [width, height]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const time = state.clock.elapsedTime;
        const posAttr = meshRef.current.geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const x = posAttr.getX(i);
            const z = posAttr.getZ(i);
            const y = Math.sin(x * 0.4 + time) * Math.cos(z * 0.4 + time) * 1.5;
            posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <mesh ref={meshRef} position={[0, -2, -10]} rotation={[0.3, 0, 0]}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attach="index" array={indices} itemSize={1} />
            </bufferGeometry>
            <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
    );
};

export default function ContactBackground() {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={60} />
            
            <color attach="background" args={['#050810']} />
            <fog attach="fog" args={['#050810', 5, 18]} />
            <Waveform />
        </>
    );
}
