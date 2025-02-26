"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GUI } from "dat.gui";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import "~~/app/globals.css";

// Define interfaces and types
interface AudioVisualizerUniforms {
  u_time: { type: string; value: number };
  u_frequency: { type: string; value: number };
  u_bass: { type: string; value: number };
  u_red: { type: string; value: number };
  u_green: { type: string; value: number };
  u_blue: { type: string; value: number };
}

interface VisualizerParams {
  red: number;
  green: number;
  blue: number;
  threshold: number;
  strength: number;
  radius: number;
  bassImpact: number;
  smoothing: number;
}

// Define AudioVisualizer component
export default function AudioVisualizer(): JSX.Element {
  // State declarations
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  // Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const bloomComposerRef = useRef<EffectComposer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const prevBassRef = useRef<number>(0);
  const currentBassRef = useRef<number>(0);

  // Uniform refs
  const uniformsRef = useRef<AudioVisualizerUniforms>({
    u_time: { type: "f", value: 0.0 },
    u_frequency: { type: "f", value: 0.0 },
    u_bass: { type: "f", value: 0.0 },
    u_red: { type: "f", value: 1.0 },
    u_green: { type: "f", value: 1.0 },
    u_blue: { type: "f", value: 1.0 },
  });

  // Params ref
  const paramsRef = useRef<VisualizerParams>({
    red: 1.0,
    green: 1.0,
    blue: 1.0,
    threshold: 0.5,
    strength: 0.5,
    radius: 0.8,
    bassImpact: 0.5,
    smoothing: 0.1,
  });

  // Setup audio analyzer
  const setupAudioAnalyzer = (audioUrl: string): void => {
    // Close previous audio context if it exists
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch((err) => {
        console.error("Error closing audio context:", err);
      });
    }

    try {
      // Create new audio context
      const AudioContextClass =
        window.AudioContext || (window as AudioContext).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      // Create analyzer with higher FFT size for better frequency resolution
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; // Increased from 256 for better low-frequency resolution
      analyserRef.current = analyser;

      // Load audio
      fetch(audioUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
        .then((audioBuffer) => {
          // Create source
          if (sourceRef.current) {
            try {
              sourceRef.current.disconnect();
            } catch (error) {
              console.error("Error disconnecting previous source:", error);
            }
          }

          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(analyser);
          analyser.connect(audioContext.destination);
          sourceRef.current = source;

          // Play when audio element plays
          const playHandler = () => {
            if (
              audioContextRef.current &&
              audioContextRef.current.state === "suspended"
            ) {
              audioContextRef.current.resume().catch((err) => {
                console.error("Error resuming audio context:", err);
              });
            }

            // Reset the bass values when starting playback
            prevBassRef.current = 0;
            currentBassRef.current = 0;

            try {
              source.start(0, audioRef.current?.currentTime || 0);
            } catch (error) {
              console.error("Error starting audio source:", error);
            }
          };

          const pauseHandler = () => {
            try {
              source.stop();
            } catch (error) {
              console.error("Error stopping audio source:", error);
            }
          };

          if (audioRef.current) {
            audioRef.current.addEventListener("play", playHandler);
            audioRef.current.addEventListener("pause", pauseHandler);
          }
        })
        .catch((error) => {
          console.error("Error setting up audio analyzer:", error);
        });
    } catch (error) {
      console.error("Error initializing audio context:", error);
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "audio/mpeg") {
        setFile(selectedFile);

        // Reset player state
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);

        // Create object URL for the audio element
        if (audioRef.current) {
          const objectUrl = URL.createObjectURL(selectedFile);
          audioRef.current.src = objectUrl;

          // Setup audio analyzer when file is loaded
          setupAudioAnalyzer(objectUrl);
        }
      } else {
        alert("Please select an MP3 file");
      }
    }
  };

  // Handle play/pause
  const togglePlay = (): void => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

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
    const geometry = new THREE.IcosahedronGeometry(4, 30);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.material.wireframe = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Setup GUI
    let gui: GUI | undefined;
    try {
      gui = new GUI();
      const colorsFolder = gui.addFolder("Colors");
      colorsFolder
        .add(paramsRef.current, "red", 0, 1)
        .onChange((value: number) => {
          uniformsRef.current.u_red.value = Number(value);
        });
      colorsFolder
        .add(paramsRef.current, "green", 0, 1)
        .onChange((value: number) => {
          uniformsRef.current.u_green.value = Number(value);
        });
      colorsFolder
        .add(paramsRef.current, "blue", 0, 1)
        .onChange((value: number) => {
          uniformsRef.current.u_blue.value = Number(value);
        });

      const bloomFolder = gui.addFolder("Bloom");
      bloomFolder
        .add(paramsRef.current, "threshold", 0, 1)
        .onChange((value: number) => {
          if (bloomComposerRef.current) {
            const passes = bloomComposerRef.current.passes;
            const bloomPass = passes.find(
              (pass) => pass instanceof UnrealBloomPass,
            ) as UnrealBloomPass;
            if (bloomPass) {
              bloomPass.threshold = Number(value);
            }
          }
        });
      bloomFolder
        .add(paramsRef.current, "strength", 0, 3)
        .onChange((value: number) => {
          if (bloomComposerRef.current) {
            const passes = bloomComposerRef.current.passes;
            const bloomPass = passes.find(
              (pass) => pass instanceof UnrealBloomPass,
            ) as UnrealBloomPass;
            if (bloomPass) {
              bloomPass.strength = Number(value);
            }
          }
        });
      bloomFolder
        .add(paramsRef.current, "radius", 0, 1)
        .onChange((value: number) => {
          if (bloomComposerRef.current) {
            const passes = bloomComposerRef.current.passes;
            const bloomPass = passes.find(
              (pass) => pass instanceof UnrealBloomPass,
            ) as UnrealBloomPass;
            if (bloomPass) {
              bloomPass.radius = Number(value);
            }
          }
        });

      const audioFolder = gui.addFolder("Audio Response");
      audioFolder
        .add(paramsRef.current, "bassImpact", 0, 2)
        .name("Bass Impact");
      audioFolder
        .add(paramsRef.current, "smoothing", 0.01, 0.5)
        .name("Smoothness");
    } catch (error) {
      console.error("Error initializing GUI:", error);
    }

    // Mouse movement handling
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent): void => {
      if (!containerRef.current) return;
      const windowHalfX = containerRef.current.clientWidth / 2;
      const windowHalfY = containerRef.current.clientHeight / 2;
      mouseX = (e.clientX - windowHalfX) / 100;
      mouseY = (e.clientY - windowHalfY) / 100;
    };

    document.addEventListener("mousemove", handleMouseMove);

    // Animation loop
    const animate = (): void => {
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
        }

        bloomComposerRef.current.render();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = (): void => {
      if (
        !containerRef.current ||
        !cameraRef.current ||
        !rendererRef.current ||
        !bloomComposerRef.current
      )
        return;

      cameraRef.current.aspect =
        containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      );
      bloomComposerRef.current.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      );
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

      if (gui) {
        try {
          gui.destroy();
        } catch (error) {
          console.error("Error destroying GUI:", error);
        }
      }

      // Cleanup audio
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (error) {
          console.error("Error disconnecting audio source:", error);
        }
      }

      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        try {
          audioContextRef.current.close().catch((err) => {
            console.error("Error closing audio context during cleanup:", err);
          });
        } catch (error) {
          console.error("Error closing audio context:", error);
        }
      }
    };
  }, []);

  // Update time display during playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (audio) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio) {
        audio.currentTime = 0;
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Main Container with Three.js visualization */}
      <div className="relative flex-grow">
        {/* Three.js Container */}
        <div
          ref={containerRef}
          className="w-full"
          style={{ height: "calc(100vh - 120px)" }}
        />

        {/* Progress bar overlaid at bottom of visualization */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-900">
          <div
            className="h-full"
            style={{
              width: `${(currentTime / duration) * 100}%`,
              backgroundColor: `rgb(${paramsRef.current.red * 255}, ${paramsRef.current.green * 255}, ${paramsRef.current.blue * 255})`,
            }}
          />
        </div>
      </div>

      {/* Top controls */}
      <div className="bg-black p-4 flex justify-between items-center">
        {/* File input with styled border */}
        <div className="flex items-center gap-4">
          <label className="border border-white rounded px-3 py-2 text-white cursor-pointer">
            <span>Choose File</span>
            <input
              type="file"
              accept="audio/mpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* "I'm feeling lucky" button */}
          <button className="bg-white text-black rounded px-4 py-2 font-medium">
            I'm feeling lucky
          </button>
        </div>

        {/* File name display */}
        {file && <div className="text-white">{file.name}</div>}
      </div>

      {/* Bottom controls */}
      <div className="bg-black p-6 flex justify-center items-center mb-4">
        <div className="flex items-center gap-6 w-full max-w-md">
          {/* Mint button with dynamic border color */}
          <button
            className="flex-1 bg-black text-white rounded px-6 py-3 font-medium border-2"
            style={{
              borderColor: `rgb(${paramsRef.current.red * 255}, ${paramsRef.current.green * 255}, ${paramsRef.current.blue * 255})`,
            }}
          >
            Mint
          </button>

          {/* Play/Pause button */}
          <button
            onClick={togglePlay}
            disabled={!file}
            className="flex-1 bg-white text-black rounded px-6 py-3 font-medium disabled:bg-gray-500 disabled:text-gray-300"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
