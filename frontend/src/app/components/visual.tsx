"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface VisualProps {
  audioUrl: string;
  isPlaying: boolean;
  onAudioReady: () => void;
}

const Visual: React.FC<VisualProps> = ({
  audioUrl,
  isPlaying,
  onAudioReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

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
    camera.position.z = 20;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 2000;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Position particles in a sphere
      const radius = 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);

      // Random colors
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
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;

      cameraRef.current.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      );
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (particlesRef.current && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const positions = particlesRef.current.geometry.attributes.position
          .array as Float32Array;
        const colors = particlesRef.current.geometry.attributes.color
          .array as Float32Array;

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
          positions[i] = (originalX / length) * scale * 10;
          positions[i + 1] = (originalY / length) * scale * 10;
          positions[i + 2] = (originalZ / length) * scale * 10;

          // Update color based on audio
          colors[i] = 0.5 + audioValue * 0.5;
          colors[i + 1] = 0.2 + audioValue * 0.8;
          colors[i + 2] = 0.5 + audioValue * 0.5;
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
  }, []);

  // Handle audio element
  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.src = audioUrl;
    audioRef.current = audio;

    // Set up audio context and analyzer
    // TypeScript definition for WebKit prefixed AudioContext
    interface WebKitWindow extends Window {
      webkitAudioContext: typeof AudioContext;
    }

    // Use standard AudioContext or WebKit prefixed version without 'any'
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as WebKitWindow).webkitAudioContext;

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Connect audio to analyzer
    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // Audio events
    audio.addEventListener("canplaythrough", () => {
      onAudioReady();
    });

    // Cleanup audio
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      audioContext.close();
    };
  }, [audioUrl, onAudioReady]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  return (
    <div
      ref={containerRef}
      className="w-full h-72 rounded-lg overflow-hidden"
    />
  );
};

export default Visual;
