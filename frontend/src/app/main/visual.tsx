"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

interface VisualProps {
  audioUrl: string;
  isPlaying: boolean;
  onAudioReady: () => void;
}

const Visual = ({ audioUrl, isPlaying, onAudioReady }: VisualProps) => {
  // Refs for Three.js elements
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const bloomComposerRef = useRef<EffectComposer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Refs for audio analysis
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const prevBassRef = useRef<number>(0);
  const currentBassRef = useRef<number>(0);
  const audioSetupCompletedRef = useRef<boolean>(false);

  // State to track if audio is ready
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);

  // Visualization uniforms
  const uniformsRef = useRef({
    u_time: { type: "f", value: 0.0 },
    u_frequency: { type: "f", value: 0.0 },
    u_bass: { type: "f", value: 0.0 },
    u_red: { type: "f", value: 1.0 },
    u_green: { type: "f", value: 1.0 },
    u_blue: { type: "f", value: 1.0 },
  });

  // Visualization parameters
  const paramsRef = useRef({
    red: 1.0,
    green: 1.0,
    blue: 1.0,
    threshold: 0.5,
    strength: 0.5,
    radius: 0.8,
    bassImpact: 0.5,
    smoothing: 0.1,
  });

  // Setup audio context and analyzer
  useEffect(() => {
    let audioContext = null;
    let analyser = null;
    let source = null;
    const audioElementToUse = new Audio();

    const setupAudio = async () => {
      try {
        // Clean up previous audio connections if they exist
        if (sourceRef.current) {
          try {
            sourceRef.current.disconnect();
          } catch (err) {
            console.log("Error disconnecting source:", err);
          }
          sourceRef.current = null;
        }

        // Properly close previous audio context if it exists and is not already closed
        if (audioContextRef.current) {
          const state = audioContextRef.current.state;
          if (state !== "closed") {
            try {
              await audioContextRef.current.close();
              console.log("Successfully closed previous audio context");
            } catch (error) {
              console.error("Error closing previous audio context:", error);
            }
          } else {
            console.log("Previous audio context was already closed");
          }
          audioContextRef.current = null;
          analyserRef.current = null;
        }

        // Create new audio context
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        console.log("Created new audio context, state:", audioContext.state);

        // Create analyzer
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyserRef.current = analyser;

        // Set audio source
        audioElementToUse.src = audioUrl;
        audioElementToUse.crossOrigin = "anonymous";
        audioRef.current = audioElementToUse;
        audioElementToUse.load();

        // Create source when audio is ready
        const handleCanPlay = () => {
          if (!audioContext) return;

          try {
            // Connect audio to analyzer
            source = audioContext.createMediaElementSource(audioElementToUse);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            sourceRef.current = source;

            // Reset bass values
            prevBassRef.current = 0;
            currentBassRef.current = 0;

            // Update state and notify parent
            setIsAudioReady(true);
            onAudioReady();
            console.log("Audio setup complete");
          } catch (error) {
            console.error("Error connecting audio:", error);
          }
        };

        audioElementToUse.addEventListener("canplaythrough", handleCanPlay);

        // Handle errors
        const handleError = (error) => {
          console.error("Audio error:", error);
          setIsAudioReady(false);
        };

        audioElementToUse.addEventListener("error", handleError);

        return () => {
          audioElementToUse.removeEventListener(
            "canplaythrough",
            handleCanPlay,
          );
          audioElementToUse.removeEventListener("error", handleError);
        };
      } catch (error) {
        console.error("Error setting up audio analyzer:", error);
      }
    };

    if (audioUrl) {
      const cleanup = setupAudio();

      return () => {
        // Execute cleanup function if it was returned
        if (cleanup && typeof cleanup === "function") {
          cleanup();
        }

        // Clean up audio element
        if (audioElementToUse) {
          audioElementToUse.pause();
          audioElementToUse.src = "";
        }

        // Clean up audio source
        if (source) {
          try {
            source.disconnect();
          } catch (error) {
            console.log("Error disconnecting source during cleanup:", error);
          }
        }

        // Clean up audio context only if not already closed
        if (audioContext && audioContext.state !== "closed") {
          try {
            audioContext.close().catch((error) => {
              console.log("Error closing audio context during cleanup:", error);
            });
          } catch (error) {
            console.log("Error closing audio context:", error);
          }
        }
      };
    }
  }, [audioUrl, onAudioReady]);

  // Control audio playback based on isPlaying prop
  useEffect(() => {
    if (!audioRef.current || !isAudioReady) return;

    if (isPlaying) {
      // Resume audio context if suspended
      if (
        audioContextRef.current &&
        audioContextRef.current.state === "suspended"
      ) {
        try {
          audioContextRef.current.resume().catch((err) => {
            console.error("Error resuming audio context:", err);
          });
        } catch (error) {
          console.error("Error with audio context:", error);
        }
      }

      audioRef.current.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isAudioReady]);

  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js components
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, -2, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup post-processing
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      ),
      paramsRef.current.strength,
      paramsRef.current.radius,
      paramsRef.current.threshold,
    );
    bloomPass.threshold = paramsRef.current.threshold;
    bloomPass.strength = paramsRef.current.strength;
    bloomPass.radius = paramsRef.current.radius;

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);
    const outputPass = new OutputPass();
    bloomComposer.addPass(outputPass);
    bloomComposerRef.current = bloomComposer;

    const vertexShader = `
      uniform float u_time;
      uniform float u_frequency;
      uniform float u_bass;

      vec3 mod289(vec3 x)
      {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 mod289(vec4 x)
      {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 permute(vec4 x)
      {
        return mod289(((x*34.0)+10.0)*x);
      }

      vec4 taylorInvSqrt(vec4 r)
      {
        return 1.79284291400159 - 0.85373472095314 * r;
      }

      vec3 fade(vec3 t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
      }

      // Classic Perlin noise, periodic variant
      float pnoise(vec3 P, vec3 rep)
      {
        vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
        vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P); // Fractional part for interpolation
        vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
        return 2.2 * n_xyz;
      }

      void main() {
          float noise = 3.0 * pnoise(position + u_time, vec3(10.0));

          // Bass-driven displacement with smooth noise modulation
          float displacement = (u_frequency / 30.0) * (noise / 10.0) + (u_bass / 15.0);

          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_red;
      uniform float u_green;
      uniform float u_blue;
      uniform float u_bass;

      void main() {
          // Make the color slightly responsive to bass
          float bassIntensity = u_bass / 255.0;
          vec3 color = vec3(
              u_red + (bassIntensity * 0.3),
              u_green + (bassIntensity * 0.1),
              u_blue + (bassIntensity * 0.2)
          );

          gl_FragColor = vec4(color, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: uniformsRef.current,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    // Create mesh
    const geometry = new THREE.IcosahedronGeometry(4, 12); // Lower complexity for better performance
    const mesh = new THREE.Mesh(geometry, material);
    mesh.material.wireframe = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Mouse movement handling
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const windowHalfX = containerRef.current.clientWidth / 2;
      const windowHalfY = containerRef.current.clientHeight / 2;
      mouseX = (e.clientX - windowHalfX) / 100;
      mouseY = (e.clientY - windowHalfY) / 100;
    };

    document.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = () => {
      if (
        cameraRef.current &&
        meshRef.current &&
        sceneRef.current &&
        bloomComposerRef.current
      ) {
        cameraRef.current.position.x +=
          (mouseX - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.y +=
          (-mouseY - cameraRef.current.position.y) * 0.05;
        cameraRef.current.lookAt(sceneRef.current.position);

        uniformsRef.current.u_time.value = clockRef.current.getElapsedTime();

        // Update frequency from audio analyzer if available
        if (analyserRef.current) {
          try {
            const frequencyData = new Uint8Array(
              analyserRef.current.frequencyBinCount,
            );
            analyserRef.current.getByteFrequencyData(frequencyData);

            // Calculate overall average frequency
            const averageFrequency =
              frequencyData.reduce((acc, val) => acc + val, 0) /
              frequencyData.length;

            // Get just the bass frequencies (typically the lower 10% of frequency bins)
            const bassRange = Math.max(
              3,
              Math.floor(frequencyData.length * 0.1),
            );
            const bassFrequencies = frequencyData.slice(0, bassRange);
            const bassAverage =
              bassFrequencies.reduce((acc, val) => acc + val, 0) /
              bassFrequencies.length;

            // Smooth bass transitions
            const smoothingFactor = paramsRef.current.smoothing;
            const targetBass = bassAverage * paramsRef.current.bassImpact;

            // Smooth the transition between current and target bass values
            currentBassRef.current =
              currentBassRef.current +
              (targetBass - currentBassRef.current) * smoothingFactor;

            // Detect beats by comparing with previous value
            if (bassAverage > prevBassRef.current * 1.2 && bassAverage > 80) {
              // Boost the response on beats
              currentBassRef.current += 20;
            }

            // Update uniform values
            uniformsRef.current.u_frequency.value = averageFrequency;
            uniformsRef.current.u_bass.value = currentBassRef.current;

            // Store current bass for next frame comparison
            prevBassRef.current = bassAverage;
          } catch (error) {
            console.error("Error processing audio data:", error);
          }
        } else {
          // Gentle default animation when no audio is playing
          const time = clockRef.current.getElapsedTime();
          uniformsRef.current.u_frequency.value = 50 + Math.sin(time) * 20;
          uniformsRef.current.u_bass.value = 40 + Math.sin(time * 0.5) * 30;
        }

        bloomComposerRef.current.render();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (
        !containerRef.current ||
        !cameraRef.current ||
        !rendererRef.current ||
        !bloomComposerRef.current
      )
        return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
      bloomComposerRef.current.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("mousemove", handleMouseMove);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (containerRef.current && rendererRef.current) {
        try {
          containerRef.current.removeChild(rendererRef.current.domElement);
        } catch (error) {
          console.error("Error removing renderer:", error);
        }
      }

      // Audio cleanup happens in the audio effect
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-64 rounded-lg overflow-hidden border border-gray-700 bg-black"
    />
  );
};

export default Visual;
