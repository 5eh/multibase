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
  
  // Set timeline to have a position relative for absolute positioning of markers
  timeline.style.position = 'relative';
  // Clear any existing content
  timeline.innerHTML = '';
  
  // Calculate initial vertical spacing
  const timelineHeight = timeline.clientHeight || window.innerHeight; // Full height
  const markerHeight = 30; // Approximate height with padding
  const verticalSpaceBetweenMarkers = Math.max(30, (timelineHeight - 120) / totalMonths); // Adjust spacing based on available height
  
  for (let i = 0; i < totalMonths; i++) {
    const date = new Date(startYear, startMonth + i, 1);
    const marker = document.createElement('div');
    marker.classList.add('timeline-marker');
    marker.dataset.month = i;
    marker.dataset.date = date.toISOString();
    
    // Set absolute positioning
    marker.style.position = 'absolute';
    marker.style.left = '0';
    // Initial position - will be adjusted later
    marker.style.top = `${i * verticalSpaceBetweenMarkers}px`;
    
    // Add month/year label to every marker
    const label = document.createElement('div');
    label.classList.add('timeline-label');
    label.textContent = date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    marker.appendChild(label);
    
    // Make each marker larger and more visible for better clickability
    marker.style.cursor = 'pointer';
    marker.style.zIndex = '20';
    
    // Add click event with a built-in timeout to prevent accidental double-clicks
    let clickTimeout;
    marker.addEventListener('click', () => {
      // Prevent multiple rapid clicks
      if (clickTimeout) return;
      
      // Show the loading indicator immediately
      showLoading();
      
      // Select the month after a short delay to allow the UI to update
      clickTimeout = setTimeout(() => {
        selectMonth(i, marker);
        clickTimeout = null;
      }, 50);
    });
    
    timeline.appendChild(marker);
  }
  
  // Make timeline overflow hidden and set a fixed height
  timeline.style.overflow = 'hidden';
  
  // Add next/previous navigation buttons at the top and bottom of the timeline
  addNavigationButtons();
  
  // Initial center positioning - center the first marker
  const markers = timeline.querySelectorAll('.timeline-marker');
  if (markers.length > 0) {
    // Position the first month in the center initially
    centerSelectedMarker(markers[0]);
  }
}

// Add navigation buttons for easier month switching
function addNavigationButtons() {
  const timeline = document.getElementById('timeline');
  
  // Create container for navigation buttons (only at the bottom now)
  const navContainer = document.createElement('div');
  navContainer.className = 'timeline-nav-buttons';
  navContainer.style.position = 'absolute';
  navContainer.style.left = '70px'; // Aligned with updated timeline position
  navContainer.style.bottom = '30px'; // Lower position
  navContainer.style.zIndex = '30';
  navContainer.style.display = 'flex';
  navContainer.style.flexDirection = 'row'; // Horizontal layout 
  navContainer.style.gap = '15px';
  navContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
  navContainer.style.backdropFilter = 'blur(5px)';
  navContainer.style.borderRadius = '30px'; // Fully rounded
  navContainer.style.padding = '8px 15px';
  navContainer.style.boxShadow = '0 0 15px rgba(0,0,0,0.7)';
  navContainer.style.border = '1px solid rgba(255,38,112,0.3)'; // Subtle pink border
  
  // Previous month button
  const prevButton = document.createElement('button');
  prevButton.innerHTML = '&larr;'; // Left arrow for horizontal layout
  prevButton.className = 'timeline-nav-button';
  prevButton.style.width = '36px';
  prevButton.style.height = '36px';
  prevButton.style.borderRadius = '50%';
  prevButton.style.border = 'none';
  prevButton.style.background = 'transparent'; // No background by default
  prevButton.style.color = 'white';
  prevButton.style.fontSize = '18px';
  prevButton.style.cursor = 'pointer';
  prevButton.style.display = 'flex';
  prevButton.style.alignItems = 'center';
  prevButton.style.justifyContent = 'center';
  prevButton.style.boxShadow = '0 0 10px rgba(255,38,112,0.3)';
  prevButton.title = 'Previous month';
  
  // Add hover effect
  prevButton.addEventListener('mouseover', () => {
    prevButton.style.backgroundColor = 'rgba(255,38,112,0.3)';
    prevButton.style.boxShadow = '0 0 15px rgba(255,38,112,0.5)';
  });
  
  prevButton.addEventListener('mouseout', () => {
    prevButton.style.backgroundColor = 'transparent';
    prevButton.style.boxShadow = '0 0 10px rgba(255,38,112,0.3)';
  });
  
  // Next month button
  const nextButton = document.createElement('button');
  nextButton.innerHTML = '&rarr;'; // Right arrow for horizontal layout
  nextButton.className = 'timeline-nav-button';
  nextButton.style.width = '36px';
  nextButton.style.height = '36px';
  nextButton.style.borderRadius = '50%';
  nextButton.style.border = 'none';
  nextButton.style.background = 'transparent'; // No background by default
  nextButton.style.color = 'white';
  nextButton.style.fontSize = '18px';
  nextButton.style.cursor = 'pointer';
  nextButton.style.display = 'flex';
  nextButton.style.alignItems = 'center';
  nextButton.style.justifyContent = 'center';
  nextButton.style.boxShadow = '0 0 10px rgba(255,38,112,0.3)';
  nextButton.title = 'Next month';
  
  // Add hover effect
  nextButton.addEventListener('mouseover', () => {
    nextButton.style.backgroundColor = 'rgba(255,38,112,0.3)';
    nextButton.style.boxShadow = '0 0 15px rgba(255,38,112,0.5)';
  });
  
  nextButton.addEventListener('mouseout', () => {
    nextButton.style.backgroundColor = 'transparent';
    nextButton.style.boxShadow = '0 0 10px rgba(255,38,112,0.3)';
  });
  
  // Add click events with throttling
  let navClickTimeout;
  
  prevButton.addEventListener('click', () => {
    if (navClickTimeout) return;
    
    navClickTimeout = setTimeout(() => {
      navigateToPreviousMonth();
      navClickTimeout = null;
    }, 300);
  });
  
  nextButton.addEventListener('click', () => {
    if (navClickTimeout) return;
    
    navClickTimeout = setTimeout(() => {
      navigateToNextMonth();
      navClickTimeout = null;
    }, 300);
  });
  
  // Add buttons to container
  navContainer.appendChild(prevButton);
  navContainer.appendChild(nextButton);
  
  // Add to document
  document.body.appendChild(navContainer);
  
  // We've removed the visible range indicator as it's not needed
}

// Navigate to previous month
function navigateToPreviousMonth() {
  if (timelineConfig.currentMonth === null) return;
  
  const timeline = document.getElementById('timeline');
  const markers = timeline.querySelectorAll('.timeline-marker');
  const prevIndex = timelineConfig.currentMonth - 1;
  
  if (prevIndex >= 0) {
    showLoading();
    setTimeout(() => {
      selectMonth(prevIndex, markers[prevIndex]);
      // No need to update the visible range label as it's been removed
    }, 50);
  }
}

// Navigate to next month
function navigateToNextMonth() {
  if (timelineConfig.currentMonth === null) return;
  
  const timeline = document.getElementById('timeline');
  const markers = timeline.querySelectorAll('.timeline-marker');
  const nextIndex = timelineConfig.currentMonth + 1;
  
  if (nextIndex < markers.length) {
    showLoading();
    setTimeout(() => {
      selectMonth(nextIndex, markers[nextIndex]);
      // No need to update the visible range label as it's been removed
    }, 50);
  }
}

// This function has been removed as the visible range label is no longer needed

// Preload resources for nearby months to improve performance when scrolling
function preloadNearbyMonths(currentIndex) {
  const timeline = document.getElementById('timeline');
  const markers = timeline.querySelectorAll('.timeline-marker');
  const maxPreload = 2; // How many months before/after to preload
  
  // Preload resources for months before and after the current one
  for (let offset = -maxPreload; offset <= maxPreload; offset++) {
    if (offset === 0) continue; // Skip current month (already loaded)
    
    const nearbyIndex = currentIndex + offset;
    if (nearbyIndex >= 0 && nearbyIndex < markers.length) {
      const nearbyMarker = markers[nearbyIndex];
      const nearbyDateString = nearbyMarker.dataset.date;
      const nearbyDate = new Date(nearbyDateString);
      const nearbyMonth = nearbyDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
      const nearbyYear = nearbyDate.getFullYear();
      
      // Construct paths for resources we want to preload
      const basePath = `./output/kusama_${nearbyMonth}_${nearbyYear}`;
      const coverUrl = `${basePath}_cover.png`;
      const musicUrl = `${basePath}_music.mp3`;
      
      // Preload cover image in background
      if (!imageCache.has(coverUrl)) {
        preloadImage(coverUrl).catch(() => {}); // Catch but ignore errors
      }
      
      // Preload audio file in background (only if not already cached)
      if (!audioBufferCache.has(musicUrl)) {
        // Load with low priority - don't block if this fails
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load(
          musicUrl,
          function(buffer) {
            audioBufferCache.set(musicUrl, buffer);
          },
          undefined, // progress
          function() {} // Swallow errors silently
        );
      }
    }
  }
}

// Show loading indicator
function showLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }
}

// Hide loading indicator
function hideLoading() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
}

// Center the selected marker vertically in the timeline
function centerSelectedMarker(marker) {
  const timeline = document.getElementById('timeline');
  const timelineHeight = timeline.clientHeight;
  const markerHeight = marker.offsetHeight;
  const allMarkers = timeline.querySelectorAll('.timeline-marker');
  
  // Get the index of the marker
  let markerIndex = -1;
  allMarkers.forEach((m, index) => {
    if (m === marker) markerIndex = index;
  });
  
  // Calculate how much the marker should be scrolled to be centered
  const markerRect = marker.getBoundingClientRect();
  const timelineRect = timeline.getBoundingClientRect();
  const markerTopRelativeToTimeline = markerRect.top - timelineRect.top;
  
  // The position we want the marker to be at (center of timeline)
  const targetPosition = timelineHeight / 2 - markerHeight / 2;
  
  // The amount we need to scroll
  let scrollAmount = markerTopRelativeToTimeline - targetPosition;
  
  // Calculate the top position of the first marker after adjustment
  const firstMarkerCurrentTop = parseInt(allMarkers[0].style.top || '0', 10);
  const firstMarkerNewTop = firstMarkerCurrentTop - scrollAmount;
  
  // Calculate the bottom position of the last marker after adjustment
  const lastMarker = allMarkers[allMarkers.length - 1];
  const lastMarkerCurrentTop = parseInt(lastMarker.style.top || '0', 10);
  const lastMarkerNewTop = lastMarkerCurrentTop - scrollAmount;
  const lastMarkerBottom = lastMarkerNewTop + markerHeight;
  
  // Handle edge cases - don't center if it would create empty space
  
  // If first few months, don't allow space at the top
  if (firstMarkerNewTop > 0) {
    scrollAmount = firstMarkerCurrentTop; // Just move enough to put first marker at top
  }
  
  // If last few months, don't allow space at the bottom
  if (lastMarkerBottom < timelineHeight && lastMarkerNewTop > targetPosition) {
    // Calculate how much we need to adjust to make the last marker touch the bottom
    const bottomAdjustment = (timelineHeight - lastMarkerBottom);
    scrollAmount -= bottomAdjustment;
  }
  
  // Adjust all markers' positions
  allMarkers.forEach(m => {
    // Get current top position
    const currentTop = parseInt(m.style.top || '0', 10);
    // Adjust position
    m.style.top = `${currentTop - scrollAmount}px`;
    // Make sure it has absolute positioning
    m.style.position = 'absolute';
  });
}

// Select a month in the timeline with loading indicator
function selectMonth(monthIndex, marker) {
  // Show loading indicator
  showLoading();
  
  if (timelineConfig.activePoint) {
    timelineConfig.activePoint.classList.remove('active');
  }
  
  marker.classList.add('active');
  timelineConfig.activePoint = marker;
  timelineConfig.currentMonth = monthIndex;
  
  // Center the selected marker in the timeline
  centerSelectedMarker(marker);
  
  const dateString = marker.dataset.date;
  
  // Update month display
  updateMonthDisplay(dateString);
  
  // Update download links
  updateDownloadLinks(dateString);
  
  // No need to update the visible range label as it's been removed
  
  // Use Promise to track when audio is ready
  const audioPromise = new Promise(resolve => {
    // Create a one-time event listener to detect when audio starts playing
    if (sound) {
      const originalPlay = sound.play;
      sound.play = function() {
        originalPlay.apply(this, arguments);
        sound.play = originalPlay; // Restore original function
        resolve();
      };
    } else {
      // If sound not available, resolve immediately
      resolve();
    }
    
    // Call playAudio which will trigger our modified play function
    playAudio();
    
    // Fallback in case audio fails to play
    setTimeout(resolve, 1000);
  });
  
  // When all resources are loaded, hide loading indicator
  audioPromise.then(() => {
    // Hide loading indicator after a short delay to ensure UI update
    setTimeout(hideLoading, 200);
    
    // Preload resources for nearby months - do this after the current month is loaded
    setTimeout(() => preloadNearbyMonths(monthIndex), 500);
  });
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

// Cache for audio buffers to avoid repeated fetches
const audioBufferCache = new Map();

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
  
  // Check if we already have this audio in cache
  if (audioBufferCache.has(musicFilePath)) {
    playFromCache(musicFilePath);
    return;
  }
  
  // Not in cache, load it
  const audioLoader = new THREE.AudioLoader();
  
  audioLoader.load(
    musicFilePath,
    function(buffer) {
      // Cache the buffer for future use
      audioBufferCache.set(musicFilePath, buffer);
      
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
        // Check if default is in cache
        if (audioBufferCache.has('./Beats.mp3')) {
          playFromCache('./Beats.mp3');
        } else {
          audioLoader.load(
            './Beats.mp3',
            function(buffer) {
              // Cache the default buffer
              audioBufferCache.set('./Beats.mp3', buffer);
              
              if (sound.isPlaying) {
                sound.stop();
              }
              sound.setBuffer(buffer);
              sound.play();
              currentMusicIsDefault = true;
            }
          );
        }
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

// Play audio from the cache
function playFromCache(cacheKey) {
  const buffer = audioBufferCache.get(cacheKey);
  if (buffer) {
    if (sound.isPlaying) {
      sound.stop();
    }
    sound.setBuffer(buffer);
    sound.play();
    currentMusicIsDefault = (cacheKey === './Beats.mp3');
  }
}

// Store preloaded image URLs
const imageCache = new Map();

// Preload an image
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    if (imageCache.has(url)) {
      resolve(imageCache.get(url));
      return;
    }
    
    const img = new Image();
    img.onload = function() {
      imageCache.set(url, url);
      resolve(url);
    };
    img.onerror = function() {
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
}

// Update download links based on current month - with optimized image loading
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
  
  // Set the cover image - use cached version if available
  const coverUrl = `${basePath}_cover.png`;
  const thumbnailImg = document.getElementById('thumbnail-img');
  
  if (imageCache.has(coverUrl)) {
    thumbnailImg.src = imageCache.get(coverUrl);
  } else {
    // Set to loading state while we fetch
    thumbnailImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.41 3.59-8 8-8zm0 14c-3.31 0-6-2.69-6-6H4c0 4.41 3.59 8 8 8v-2zm0-12V4c-3.31 0-6 2.69-6 6h2c0-2.21 1.79-4 4-4zm0 12c2.21 0 4-1.79 4-4h-2c0 1.1-.9 2-2 2v2z"/></svg>';
    
    // Try to preload
    preloadImage(coverUrl)
      .then(url => {
        thumbnailImg.src = url;
      })
      .catch(error => {
        console.error(error);
        // Set fallback icon if the image failed to load
        thumbnailImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
      });
  }
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

// Disable scroll-based navigation completely
// Instead, rely solely on click events for navigation

// This animation code was moved to the initScene function
