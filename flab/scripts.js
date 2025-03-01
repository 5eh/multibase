import * as THREE from 'three';
import { GUI } from 'dat.gui';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

// Timeline configuration
const timelineConfig = {
  startDate: new Date(2019, 10, 1), // November 2019
  endDate: new Date(2025, 1, 28),  // February 2025
  currentMonth: null,
  activePoint: null
};

// Track if we're currently using the default music
let currentMusicIsDefault = true;

// Declare global variables that need to be accessed across scopes
let sound, params, uniforms, bloomPass, analyser, bloomComposer;

// Create timeline points
function createTimeline() {
  const timeline = document.getElementById('timeline');
  const startYear = timelineConfig.startDate.getFullYear();
  const startMonth = timelineConfig.startDate.getMonth();
  const endYear = timelineConfig.endDate.getFullYear();
  const endMonth = timelineConfig.endDate.getMonth();
  
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  
  for (let i = 0; i < totalMonths; i++) {
    const date = new Date(startYear, startMonth + i, 1);
    const marker = document.createElement('div');
    marker.classList.add('timeline-marker');
    marker.dataset.month = i;
    marker.dataset.date = date.toISOString();
    
    // Add month/year label to every marker
    const label = document.createElement('div');
    label.classList.add('timeline-label');
    label.textContent = date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    marker.appendChild(label);
    
    marker.addEventListener('click', () => selectMonth(i, marker));
    timeline.appendChild(marker);
  }
}

// Select a month in the timeline
function selectMonth(monthIndex, marker) {
  if (timelineConfig.activePoint) {
    timelineConfig.activePoint.classList.remove('active');
  }
  
  marker.classList.add('active');
  timelineConfig.activePoint = marker;
  timelineConfig.currentMonth = monthIndex;
  
  const dateString = marker.dataset.date;
  
  // Update month display
  updateMonthDisplay(dateString);
  
  // Update download links
  updateDownloadLinks(dateString);
  
  // Play the appropriate audio
  playAudio();
}

// Update the month display at the top
function updateMonthDisplay(dateString) {
  const date = new Date(dateString);
  const monthDisplay = document.getElementById('month-display');
  
  // Format: "NOVEMBER 2019"
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  }).toUpperCase();
  
  monthDisplay.textContent = formattedDate;
}

// Play audio based on current month
function playAudio() {
  // Get the current month info
  if (!timelineConfig.activePoint) return;
  
  const dateString = timelineConfig.activePoint.dataset.date;
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  const year = date.getFullYear();
  
  // Fix path to ensure it's relative to the current URL
  const musicFilePath = `./output/kusama_${month}_${year}_music.mp3`;
  
  // Check if sound is available (WebGL might have failed)
  if (!sound) {
    console.warn("Audio system not initialized");
    return;
  }
  
  // Check if the month-specific file exists by trying to load it
  const audioLoader = new THREE.AudioLoader();
  
  audioLoader.load(
    musicFilePath,
    function(buffer) {
      // Success - stop any current sound and play the new one
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.setBuffer(buffer);
      sound.play();
      currentMusicIsDefault = false;
    },
    function(progress) {
      // Loading progress
    },
    function(error) {
      // Error - fall back to Beats.mp3
      console.log("Could not load month-specific music, falling back to default", error);
      
      // Only reload Beats.mp3 if it's not already the active buffer
      if (!currentMusicIsDefault) {
        audioLoader.load(
          './Beats.mp3',
          function(buffer) {
            if (sound.isPlaying) {
              sound.stop();
            }
            sound.setBuffer(buffer);
            sound.play();
            currentMusicIsDefault = true;
          }
        );
      } else if (sound && sound.buffer) {
        // We already have Beats.mp3 loaded, just play it
        if (sound.isPlaying) {
          sound.stop();
        }
        sound.play();
      }
    }
  );
}

// Update download links based on current month
function updateDownloadLinks(dateString) {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  const year = date.getFullYear();
  
  // All files are now in the output folder - use relative path
  const basePath = `./output/kusama_${month}_${year}`;
  
  // Update newspaper link
  const newspaperLink = document.getElementById('newspaper-link');
  newspaperLink.href = `${basePath}_newspaper.pdf`;
  
  // Update lyrics link
  const lyricsLink = document.getElementById('lyrics-link');
  lyricsLink.href = `${basePath}_lyrics.pdf`;
  
  // Update music link
  const musicLink = document.getElementById('music-link');
  musicLink.href = `${basePath}_music.mp3`;
  
  // Update thumbnail and its link
  const thumbnailLink = document.getElementById('thumbnail-link');
  thumbnailLink.href = `${basePath}_cover.png`; // Download the cover image
  thumbnailLink.setAttribute('download', ''); // Ensure it downloads
  
  // Set the cover image
  const thumbnailImg = document.getElementById('thumbnail-img');
  thumbnailImg.src = `${basePath}_cover.png`;
}

// Delay WebGL initialization until after the page has loaded
// This helps prevent context loss issues
let renderer;

// Function to create the WebGL renderer
function initWebGL() {
  try {
    // Try with extremely basic settings first
    const canvas = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: false,
      alpha: true,
      powerPreference: "default",
      failIfMajorPerformanceCaveat: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    });
    
    // Add canvas to page with absolute positioning behind everything else
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1';
    document.body.appendChild(canvas);
    
    // Set size after adding to DOM
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Set clear color to black
    renderer.setClearColor(0x000000);
    
    // Disable all unnecessary features
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    console.log("WebGL initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize WebGL renderer:", error);
    
    // Display fallback message if rendering fails
    const fallbackMsg = document.createElement('div');
    fallbackMsg.style.position = 'absolute';
    fallbackMsg.style.top = '50%';
    fallbackMsg.style.left = '50%';
    fallbackMsg.style.transform = 'translate(-50%, -50%)';
    fallbackMsg.style.color = 'white';
    fallbackMsg.style.fontFamily = "'Unbounded', sans-serif";
    fallbackMsg.style.textAlign = 'center';
    fallbackMsg.innerHTML = '<h2>WebGL not supported by your browser</h2><p>Please try a different browser or device</p>';
    document.body.appendChild(fallbackMsg);
    return false;
  }
}

// Initialize WebGL after a short delay to let the page fully load
setTimeout(() => {
  const success = initWebGL();
  if (success) {
    initScene();
  }
}, 100);

// Create scene and camera global variables
let scene, camera;

// Function to initialize the 3D scene after WebGL is ready
function initScene() {
  // Create the scene
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  
  // Initialize parameters
  params = {
    // Polkadot Pink: #FF2670 converted to 0-1 RGB values
    red: 1.0,
    green: 0.15,
    blue: 0.44,
    threshold: 0.1,    // Lower threshold makes more elements bloom
    strength: 0.5,     // Bloom intensity
    radius: 0.5        // Bloom spread
  };

  const renderScene = new RenderPass(scene, camera);
  
  bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight));
  bloomPass.threshold = params.threshold;
  bloomPass.strength = params.strength;
  bloomPass.radius = params.radius;
  
  bloomComposer = new EffectComposer(renderer);
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);
  
  const outputPass = new OutputPass();
  bloomComposer.addPass(outputPass);
  
  camera.position.set(0, -2, 14);
  camera.lookAt(0, 0, 0);
  
  uniforms = {
    u_time: { type: 'f', value: 0.0 },
    u_frequency: { type: 'f', value: 0.0 },
    u_red: { type: 'f', value: 1.0 },
    u_green: { type: 'f', value: 1.0 },
    u_blue: { type: 'f', value: 1.0 }
  }
  
  // Initialize with Polkadot Pink values
  uniforms.u_red.value = params.red;
  uniforms.u_green.value = params.green;
  uniforms.u_blue.value = params.blue;
  
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent,
    transparent: true,
    opacity: 0.9
  });
  
  // Use a simpler geometry for better performance
  const geo = new THREE.IcosahedronGeometry(4, 10); // Even more reduced complexity
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  mesh.material.wireframe = true;
  mesh.material.emissive = new THREE.Color(0xFF2670);
  mesh.material.emissiveIntensity = 0.5;

  const listener = new THREE.AudioListener();
  camera.add(listener);
  
  // Initialize the global sound variable
  sound = new THREE.Audio(listener);
  sound.setLoop(false);
  
  analyser = new THREE.AudioAnalyser(sound, 32);
  
  // Start animation
  const clock = new THREE.Clock();
  
  function animate() {
    camera.position.x += (mouseX - camera.position.x) * .05;
    camera.position.y += (-mouseY - camera.position.y) * 0.5;
    camera.lookAt(scene.position);
    if (uniforms && uniforms.u_time) {
      uniforms.u_time.value = clock.getElapsedTime();
    }
    
    if (analyser && sound && sound.isPlaying && uniforms && uniforms.u_frequency) {
      uniforms.u_frequency.value = analyser.getAverageFrequency();
    }
    
    if (bloomComposer) {
      bloomComposer.render();
    }
    requestAnimationFrame(animate);
  }
  
  // Start animation
  animate();
  
  // Handle window resize
  window.addEventListener('resize', function() {
    if (camera && renderer && bloomComposer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      bloomComposer.setSize(window.innerWidth, window.innerHeight);
    }
  });
  
  console.log("Scene initialized successfully");
}

// Always initialize audio, even without WebGL
const listener = new THREE.AudioListener();
sound = new THREE.Audio(listener);
sound.setLoop(false);

// Initialize default parameters even if renderer fails
params = {
  red: 1.0,
  green: 0.15,
  blue: 0.44,
  threshold: 0.1,
  strength: 0.5,
  radius: 0.5
};

// Add a click event listener to enable audio context
document.addEventListener('click', function() {
  if (sound && sound.context && sound.context.state === 'suspended') {
    sound.context.resume().then(() => {
      console.log('AudioContext resumed successfully');
    });
  }
}, { once: true });

// Audio handling is independent of WebGL renderer
const audioLoader = new THREE.AudioLoader();

// Create and initialize the timeline first
createTimeline();

// Set a placeholder image for the thumbnail
const thumbnailImg = document.getElementById('thumbnail-img');
thumbnailImg.onerror = function() {
  // If image fails to load, show a placeholder
  this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
  console.log("Failed to load image:", this.src);
};

// Display a message to the user to click for audio
const audioMessage = document.createElement('div');
audioMessage.style.position = 'fixed';
audioMessage.style.bottom = '10px';
audioMessage.style.left = '50%';
audioMessage.style.transform = 'translateX(-50%)';
audioMessage.style.padding = '10px 20px';
audioMessage.style.backgroundColor = 'rgba(0,0,0,0.7)';
audioMessage.style.color = 'white';
audioMessage.style.borderRadius = '5px';
audioMessage.style.fontFamily = "'Unbounded', sans-serif";
audioMessage.style.fontSize = '14px';
audioMessage.style.zIndex = '1000';
audioMessage.style.transition = 'opacity 0.5s ease';
audioMessage.textContent = 'Click anywhere to enable audio';
document.body.appendChild(audioMessage);

// Remove the message after a click
document.addEventListener('click', function() {
  audioMessage.style.opacity = '0';
  setTimeout(() => {
    audioMessage.remove();
  }, 500);
}, { once: true });

// Load the default Beats.mp3
audioLoader.load('./Beats.mp3', function (buffer) {
  if (sound) {
    sound.setBuffer(buffer);
    currentMusicIsDefault = true;
    
    // Select the first month by default
    const firstMarker = document.querySelector('.timeline-marker');
    if (firstMarker) {
      selectMonth(0, firstMarker);
    }
  }
});

// This code was moved inside the renderer block

// Only create GUI if renderer is available and working
let gui;
try {
  if (renderer && params && typeof GUI === 'function') {
    // Set up GUI but keep it hidden
    gui = new GUI();
    gui.hide(); // Hide the GUI by default
    
    // Keep GUI code in case we need to debug later
    if (uniforms) {
      const colorsFolder = gui.addFolder('Colors');
      colorsFolder.add(params, 'red', 0, 1).name('Red').onChange(function (value) {
        if (uniforms && uniforms.u_red) {
          uniforms.u_red.value = Number(value);
        }
      });
      colorsFolder.add(params, 'green', 0, 1).name('Green').onChange(function (value) {
        if (uniforms && uniforms.u_green) {
          uniforms.u_green.value = Number(value);
        }
      });
      colorsFolder.add(params, 'blue', 0, 1).name('Blue').onChange(function (value) {
        if (uniforms && uniforms.u_blue) {
          uniforms.u_blue.value = Number(value);
        }
      });
    }
    
    if (bloomPass) {
      const bloomFolder = gui.addFolder('Bloom');
      bloomFolder.add(params, 'threshold', 0, 1).name('Threshold').onChange(function (value) {
        if (bloomPass) {
          bloomPass.threshold = Number(value);
        }
      });
      bloomFolder.add(params, 'strength', 0, 5).name('Strength').onChange(function (value) {
        if (bloomPass) {
          bloomPass.strength = Number(value);
        }
      });
      bloomFolder.add(params, 'radius', 0, 2).name('Radius').onChange(function (value) {
        if (bloomPass) {
          bloomPass.radius = Number(value);
        }
      });
    }
  }
} catch (e) {
  console.error("Error initializing GUI:", e);
}

// Mouse tracking
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', function (e) {
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  mouseX = (e.clientX - windowHalfX) / 100;
  mouseY = (e.clientY - windowHalfY) / 100;
});

// Handle scroll to change timeline
document.addEventListener('wheel', function(e) {
  const timeline = document.getElementById('timeline');
  const markers = timeline.querySelectorAll('.timeline-marker');
  
  if (!markers.length) return;
  
  let currentIndex = timelineConfig.currentMonth !== null ? 
    timelineConfig.currentMonth : 0;
    
  // Scroll down = next month, scroll up = previous month
  if (e.deltaY > 0 && currentIndex < markers.length - 1) {
    currentIndex++;
  } else if (e.deltaY < 0 && currentIndex > 0) {
    currentIndex--;
  }
  
  selectMonth(currentIndex, markers[currentIndex]);
}, { passive: true });

// This animation code was moved to the initScene function
