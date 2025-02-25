'use client'

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

export default function AudioVisualizer() {
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [file, setFile] = useState(null);
  const [visualStyle, setVisualStyle] = useState('line');
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const meshRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const uniformsRef = useRef({
    u_time: { type: 'f', value: 0.0 },
    u_frequency: { type: 'f', value: 0.0 },
    u_red: { type: 'f', value: 1.0 },
    u_green: { type: 'f', value: 1.0 },
    u_blue: { type: 'f', value: 1.0 }
  });
  const clockRef = useRef(null);
  const bloomComposerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const paramsRef = useRef({
    red: 1.0,
    green: 1.0,
    blue: 1.0,
    threshold: 0.5,
    strength: 0.5,
    radius: 0.8
  });

  // Format time in MM:SS format
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle file upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'audio/mpeg') {
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
        alert('Please select an MP3 file');
      }
    }
  };

  // Setup Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Three.js components
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, -2, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Setup post-processing
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(containerRef.current.clientWidth, containerRef.current.clientHeight)
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

    // Create shader material
    const vertexShader = `
      uniform float u_time;

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

      uniform float u_frequency;

      void main() {
          float noise = 3.0 * pnoise(position + u_time, vec3(10.0));
          float displacement = (u_frequency / 30.) * (noise / 10.);
          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_red;
      uniform float u_green;
      uniform float u_blue;
      void main() {
          gl_FragColor = vec4(vec3(u_red, u_green, u_blue), 1.);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms: uniformsRef.current,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    // Create mesh
    const geometry = new THREE.IcosahedronGeometry(4, 30);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.material.wireframe = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Setup clock
    clockRef.current = new THREE.Clock();

    // Setup GUI
    const gui = new GUI();
    const colorsFolder = gui.addFolder('Colors');
    colorsFolder.add(paramsRef.current, 'red', 0, 1).onChange((value) => {
      uniformsRef.current.u_red.value = Number(value);
    });
    colorsFolder.add(paramsRef.current, 'green', 0, 1).onChange((value) => {
      uniformsRef.current.u_green.value = Number(value);
    });
    colorsFolder.add(paramsRef.current, 'blue', 0, 1).onChange((value) => {
      uniformsRef.current.u_blue.value = Number(value);
    });

    const bloomFolder = gui.addFolder('Bloom');
    bloomFolder.add(paramsRef.current, 'threshold', 0, 1).onChange((value) => {
      bloomPass.threshold = Number(value);
    });
    bloomFolder.add(paramsRef.current, 'strength', 0, 3).onChange((value) => {
      bloomPass.strength = Number(value);
    });
    bloomFolder.add(paramsRef.current, 'radius', 0, 1).onChange((value) => {
      bloomPass.radius = Number(value);
    });

    // Mouse movement handling
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const windowHalfX = containerRef.current.clientWidth / 2;
      const windowHalfY = containerRef.current.clientHeight / 2;
      mouseX = (e.clientX - windowHalfX) / 100;
      mouseY = (e.clientY - windowHalfY) / 100;
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      if (cameraRef.current && meshRef.current) {
        cameraRef.current.position.x += (mouseX - cameraRef.current.position.x) * 0.05;
        cameraRef.current.position.y += (-mouseY - cameraRef.current.position.y) * 0.05;
        cameraRef.current.lookAt(sceneRef.current.position);

        uniformsRef.current.u_time.value = clockRef.current.getElapsedTime();

        // Update frequency from audio analyzer if available
        if (analyserRef.current) {
          const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(frequencyData);

          // Calculate average frequency
          const averageFrequency = frequencyData.reduce((acc, val) => acc + val, 0) /
                                 frequencyData.length;

          uniformsRef.current.u_frequency.value = averageFrequency;
        }

        bloomComposerRef.current.render();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current && bloomComposerRef.current) {
        cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        bloomComposerRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      gui.destroy();

      // Cleanup audio
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Setup audio analyzer
  const setupAudioAnalyzer = (audioUrl) => {
    // Close previous audio context if it exists
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    // Create new audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    // Create analyzer
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    analyzerRef.current = analyzer;

    // Load audio
    fetch(audioUrl)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        // Create source
        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyzer);
        analyzer.connect(audioContext.destination);
        sourceRef.current = source;

        // Play when audio element plays
        audioRef.current.addEventListener('play', () => {
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }
          source.start(0, audioRef.current.currentTime);
        });

        audioRef.current.addEventListener('pause', () => {
          source.stop();
        });
      })
      .catch(error => {
        console.error('Error setting up audio analyzer:', error);
      });
  };

  // Handle play/pause
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle seeking
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  // Update time display during playback
  useEffect(() => {
    const audio = audioRef.current;

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

    if (audio) {
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
    }

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      {/* Three.js Container */}
      <div
        ref={containerRef}
        className="w-full flex-grow"
        style={{ height: 'calc(100vh - 200px)' }}
      />

      {/* Audio Player Controls */}
      <div className="w-full bg-gray-800 p-6">
        <div className="max-w-3xl mx-auto">
          {/* File Input */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Select MP3 File</label>
            <input
              type="file"
              accept="audio/mpeg"
              onChange={handleFileChange}
              className="w-full p-2 border rounded bg-gray-700 text-gray-300 border-gray-600"
            />
          </div>

          {/* Audio Element (hidden) */}
          <audio ref={audioRef} className="hidden" />

          {file && (
            <div className="space-y-3">
              {/* File Info */}
              <div className="text-center">
                <p className="font-medium text-gray-300">{file.name}</p>
                <p className="text-gray-400 text-sm">
                  Total Length: {formatTime(duration)}
                </p>
              </div>

              {/* Time Display */}
              <div className="flex justify-between text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Visual Timeline Representation */}
              <div className="font-mono text-center my-2 text-blue-400">
                {duration > 0 && (
                  <>
                    {visualStyle === 'line' && (
                      <pre className="text-sm">
                        {'-'.repeat(Math.floor((currentTime / duration) * 30))}|{'-'.repeat(Math.floor(((duration - currentTime) / duration) * 30))}
                      </pre>
                    )}

                    {visualStyle === 'arrow' && (
                      <pre className="text-sm">
                        {'='.repeat(Math.floor((currentTime / duration) * 30))}>{'='.repeat(Math.floor(((duration - currentTime) / duration) * 30))}
                      </pre>
                    )}

                    {visualStyle === 'fill' && (
                      <pre className="text-sm">
                        {'█'.repeat(Math.floor((currentTime / duration) * 30))}{'░'.repeat(Math.floor(((duration - currentTime) / duration) * 30))}
                      </pre>
                    )}
                  </>
                )}
              </div>

              {/* Visual Style Selector */}
              <div className="flex justify-center space-x-2 mb-2">
                <button
                  onClick={() => setVisualStyle('line')}
                  className={`px-2 py-1 text-xs rounded ${visualStyle === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                >
                  Line
                </button>
                <button
                  onClick={() => setVisualStyle('arrow')}
                  className={`px-2 py-1 text-xs rounded ${visualStyle === 'arrow' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                >
                  Arrow
                </button>
                <button
                  onClick={() => setVisualStyle('fill')}
                  className={`px-2 py-1 text-xs rounded ${visualStyle === 'fill' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                >
                  Fill
                </button>
              </div>

              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-blue-500"
                disabled={!file}
              />

              {/* Playback Controls */}
              <div className="flex justify-center">
                <button
                  onClick={togglePlay}
                  disabled={!file}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
