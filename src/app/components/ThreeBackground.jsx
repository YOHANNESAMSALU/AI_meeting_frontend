 "use client";

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;

    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      positions[offset] = (Math.random() - 0.5) * 14;
      positions[offset + 1] = (Math.random() - 0.5) * 12;
      positions[offset + 2] = (Math.random() - 0.5) * 10;

      velocities[offset] = (Math.random() - 0.5) * 0.0035;
      velocities[offset + 1] = (Math.random() - 0.5) * 0.0035;
      velocities[offset + 2] = (Math.random() - 0.5) * 0.002;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

   // 1. Create a circular glow texture using a Canvas (no external assets needed)
const createGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
};

// 2. Apply it to the material
const pointsMaterial = new THREE.PointsMaterial({
  color: '#ffffff',
  size: 0.12,              // Increased size to make the glow visible
  map: createGlowTexture(), // Adds the soft glow texture
  transparent: true,
  opacity: 1.0,            // Full opacity for the center of the glow
  alphaTest: 0.01,         // Ensures the glow edges blend correctly
  blending: THREE.AdditiveBlending, // Makes bubbles "brighten" when they overlap
  depthWrite: false,
});


    const points = new THREE.Points(geometry, pointsMaterial);
    scene.add(points);

  const lineMaterial = new THREE.LineBasicMaterial({
  color: '#cccccc',
  transparent: true,
  opacity: 0.15, // Slightly more visible
  blending: THREE.AdditiveBlending, // Matches the bubble glow
  depthWrite: false,
});


    let lineGeometry = new THREE.BufferGeometry();
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    const maxDistance = 2.2;
    let animationFrameId;

    const resize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const animate = () => {
      animationFrameId = window.requestAnimationFrame(animate);

      const positionArray = geometry.attributes.position.array;

      for (let index = 0; index < particleCount; index += 1) {
        const offset = index * 3;
        positionArray[offset] += velocities[offset];
        positionArray[offset + 1] += velocities[offset + 1];
        positionArray[offset + 2] += velocities[offset + 2];

        for (let axis = 0; axis < 3; axis += 1) {
          const limit = axis === 2 ? 5 : 6;
          const valueIndex = offset + axis;

          if (Math.abs(positionArray[valueIndex]) > limit) {
            velocities[valueIndex] *= -1;
          }
        }
      }

      geometry.attributes.position.needsUpdate = true;
      points.rotation.y += 0.0008;
      points.rotation.x += 0.0002;

      const linePositions = [];

      for (let first = 0; first < particleCount; first += 1) {
        for (let second = first + 1; second < particleCount; second += 1) {
          const firstOffset = first * 3;
          const secondOffset = second * 3;
          const dx = positionArray[firstOffset] - positionArray[secondOffset];
          const dy = positionArray[firstOffset + 1] - positionArray[secondOffset + 1];
          const dz = positionArray[firstOffset + 2] - positionArray[secondOffset + 2];
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < maxDistance) {
            linePositions.push(
              positionArray[firstOffset],
              positionArray[firstOffset + 1],
              positionArray[firstOffset + 2],
              positionArray[secondOffset],
              positionArray[secondOffset + 1],
              positionArray[secondOffset + 2]
            );
          }
        }
      }

      lineGeometry.dispose();
      lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      lines.geometry = lineGeometry;

      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationFrameId);
      lineGeometry.dispose();
      geometry.dispose();
      pointsMaterial.dispose();
      lineMaterial.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-black"/>
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
}
