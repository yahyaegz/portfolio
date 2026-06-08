import { PerspectiveCamera } from '@react-three/drei';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const DigitalRoad = () => {
    const gridRef = useRef();

    useFrame((state, delta) => {
        if (!gridRef.current) return;
        gridRef.current.position.z += delta * 12;
        if (gridRef.current.position.z > 10) gridRef.current.position.z -= 10;
    });

    return (
        <group ref={gridRef} position={[0, -2, -30]}>
            <gridHelper args={[60, 60, '#10b981', '#06b6d4']} position={[0, 0, 0]} />
        </group>
    );
};

export default function InteractiveCVBackground() {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={60} />
            
            <color attach="background" args={['#040914']} />
            <fog attach="fog" args={['#040914', 5, 25]} />
            <DigitalRoad />
            <ambientLight intensity={0.5} />
            <pointLight position={[0, 5, 0]} intensity={1} color="#10b981" />
        </>
    );
}
