"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface VisualProps {
  analyser: AnalyserNode;
}

const Visual: React.FC<VisualProps> = ({ analyser }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const colorTransitionRef = useRef({
    currentColor: new THREE.Color(0x3498db),
    targetColor: new THREE.Color(0x3498db),
    transitionProgress: 0,
  });

  // Smooth color interpolation function
  const interpolateColor = (
    color1: THREE.Color,
    color2: THREE.Color,
    factor: number,
  ) => {
    const r = color1.r + factor * (color2.r - color1.r);
    const g = color1.g + factor * (color2.g - color1.g);
    const b = color1.b + factor * (color2.b - color1.b);
    return new THREE.Color(r, g, b);
  };

  // Set up Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 30;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Make renderer's canvas not interfere with other interactions
    renderer.domElement.style.position = "fixed";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "-1";
    renderer.domElement.style.pointerEvents = "none";

    // Create particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 10000; // Increased for fuller effect

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Position particles in a sphere
      const radius = 20; // Slightly larger radius
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);

      // Initial random colors
      colors[i] = Math.random();
      colors[i + 1] = Math.random();
      colors[i + 2] = Math.random();
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3),
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1, // Slightly smaller for fuller effect
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (particlesRef.current && analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        // Focus on bass frequencies (first few bins)
        const bassFrequencies = dataArray.slice(0, 4);
        const bassIntensity = bassFrequencies.reduce((a, b) => a + b, 0) /
          (4 * 255);

        const positions = particlesRef.current.geometry.attributes.position
          .array as Float32Array;
        const colors = particlesRef.current.geometry.attributes.color
          .array as Float32Array;

        // Smooth color transition based on bass
        const colorTransition = colorTransitionRef.current;

        // Define color palette for smooth transition
        const baseColor = new THREE.Color(0x2c3e50); // Dark blue-gray
        const peakColor = new THREE.Color(0xe74c3c); // Red
        const midColor = new THREE.Color(0xf39c12); // Orange

        // Determine target color based on bass intensity
        if (bassIntensity > 0.7) {
          colorTransition.targetColor = peakColor;
        } else if (bassIntensity > 0.3) {
          colorTransition.targetColor = midColor;
        } else {
          colorTransition.targetColor = baseColor;
        }

        // Smooth transition
        colorTransition.transitionProgress = Math.min(
          1,
          colorTransition.transitionProgress + 0.03,
        );
        const currentColor = interpolateColor(
          colorTransition.currentColor,
          colorTransition.targetColor,
          colorTransition.transitionProgress,
        );

        // Reset transition progress if colors match
        if (currentColor.equals(colorTransition.targetColor)) {
          colorTransition.transitionProgress = 0;
          colorTransition.currentColor.copy(colorTransition.targetColor);
        }

        // Update particles based on audio data
        let audioIndex = 0;
        for (let i = 0; i < positions.length; i += 3) {
          // Get audio data for this particle
          const audioValue = dataArray[audioIndex % dataArray.length] / 255.0;
          audioIndex += 7; // Skip some values for variety

          // Original position (assuming spherical distribution)
          const originalX = positions[i];
          const originalY = positions[i + 1];
          const originalZ = positions[i + 2];

          // Get normalized direction vector
          const length = Math.sqrt(
            originalX * originalX +
              originalY * originalY +
              originalZ * originalZ,
          );

          // Apply audio data to move particles
          const scale = 1 + audioValue * 2;
          positions[i] = (originalX / length) * scale * 20;
          positions[i + 1] = (originalY / length) * scale * 20;
          positions[i + 2] = (originalZ / length) * scale * 20;

          // Update color based on audio and smooth transition
          colors[i] = currentColor.r * (0.5 + audioValue * 0.5);
          colors[i + 1] = currentColor.g * (0.5 + audioValue * 0.5);
          colors[i + 2] = currentColor.b * (0.5 + audioValue * 0.5);
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.color.needsUpdate = true;

        // Rotate the entire particle system
        particlesRef.current.rotation.y += 0.002;
        particlesRef.current.rotation.x += 0.001;
      } else {
        // Gentle rotation when no audio is playing
        if (particlesRef.current) {
          particlesRef.current.rotation.y += 0.001;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    // Store current ref values to avoid React hooks exhaustive-deps warning
    const currentContainer = containerRef.current;

    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);

      if (currentContainer && rendererRef.current) {
        currentContainer.removeChild(rendererRef.current.domElement);
      }

      if (sceneRef.current && particlesRef.current) {
        sceneRef.current.remove(particlesRef.current);
      }

      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        (particlesRef.current.material as THREE.Material).dispose();
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [analyser]);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-full z-[-1]"
    >
    </div>
  );
};

export default Visual;
