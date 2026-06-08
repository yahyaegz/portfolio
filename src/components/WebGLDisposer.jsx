import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export default function WebGLDisposer() {
    const gl = useThree((state) => state.gl);

    useEffect(() => {
        return () => {
            if (gl) {
                // state.gl is the THREE.WebGLRenderer, so we need .getContext()
                const context = gl.getContext();
                if (context) {
                    const ext = context.getExtension('WEBGL_lose_context');
                    if (ext) ext.loseContext();
                }
            }
        };
    }, [gl]);

    return null;
}
