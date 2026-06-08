import { PerspectiveCamera } from '@react-three/drei';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

const DataBlocks = () => {
    const groupRef = useRef();
    const count = 60;

    const blocks = useMemo(() => {
        return new Array(count).fill().map(() => ({
            position: [
                (Math.random() - 0.5) * 25,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 15 - 5
            ],
            speed: Math.random() * 2 + 0.5,
            scale: Math.random() * 0.6 + 0.2,
            color: Math.random() > 0.5 ? '#10b981' : '#06b6d4'
        }));
    }, [count]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        groupRef.current.children.forEach((child, i) => {
            child.position.y -= blocks[i].speed * delta;
            if (child.position.y < -10) child.position.y = 10;
            child.rotation.x += delta * 0.5;
            child.rotation.y += delta * 0.5;
        });
    });

    return (
        <group ref={groupRef}>
            {blocks.map((props, i) => (
                <mesh key={i} position={props.position} scale={props.scale}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color={props.color} wireframe />
                </mesh>
            ))}
        </group>
    );
};

export default function CodeCanvasBackground() {
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={60} />
            
            <color attach="background" args={['#040914']} />
            <fog attach="fog" args={['#040914', 5, 18]} />
            <DataBlocks />
        </>
    );
}
