
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Trail, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const TerrainGrid = () => {
    const gridRef = useRef();
    
    useFrame((state, delta) => {
        if (!gridRef.current) return;
        // Move the grid towards the camera
        gridRef.current.position.z += delta * 15;
        // Loop the grid to create infinite scrolling effect
        if (gridRef.current.position.z > 10) {
            gridRef.current.position.z -= 10;
        }
    });

    return (
        <group ref={gridRef} position={[0, -3, -40]}>
            <gridHelper args={[120, 120, '#ff007f', '#00e5ff']} position={[0, 0, 0]} />
        </group>
    );
};

const OutrunSun = () => {
    return (
        <mesh position={[0, 2, -60]}>
            <circleGeometry args={[20, 64]} />
            <meshBasicMaterial color="#ff2a6d" fog={false} />
        </mesh>
    );
};

export default function RetroBackground() {
    return (
        <>

            <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={60} />
            
                <color attach="background" args={['#050710']} />
                <fog attach="fog" args={['#050710', 20, 80]} />
                
                <Stars radius={60} depth={30} count={3000} factor={4} saturation={1} fade speed={1.5} />
                <OutrunSun />
                <TerrainGrid />
                
                {/* Ambient glow */}
                <ambientLight intensity={0.5} />
                <pointLight position={[0, 5, -50]} intensity={2} color="#ff2a6d" />
            
        </>
    );
}
