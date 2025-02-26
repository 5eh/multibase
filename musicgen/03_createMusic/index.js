/**
 * Music Generation with APIBox.ai
 * Creates a music task, checks completion status, and downloads the MP3 file
 */

// Configuration
const config = {
  apiUrl: 'https://apibox.erweima.ai/api/v1/generate',
  apiKey: Deno.env.get("APIBOX_API_KEY"),
  callbackUrl: "https://api.example.com/callback", // Required by API but not used
  outputFile: "./generated_music.mp3",
  pollingInterval: 10000, // 10 seconds
  maxAttempts: 30         // 5 minutes total polling time
};

// Ensure API key is available
if (!config.apiKey) {
  console.error("Error: APIBOX_API_KEY environment variable is not set");
  Deno.exit(1);
}

// Parse command line arguments
const args = Deno.args;
const prompt = args.find(arg => arg.startsWith('--prompt='))?.split('=')[1] || 
               "A calm and relaxing piano track with soft melodies";
const style = args.find(arg => arg.startsWith('--style='))?.split('=')[1] || "Classical";
const title = args.find(arg => arg.startsWith('--title='))?.split('=')[1] || "Peaceful Piano Meditation";
const model = args.find(arg => arg.startsWith('--model='))?.split('=')[1] || "V3_5";
const taskId = args.find(arg => arg.startsWith('--task-id='))?.split('=')[1];

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Music Generation Tool

Usage:
  deno run -A index.js [options]

Options:
  --prompt=TEXT     Music description (default: calm piano)
  --style=TEXT      Music style (default: Classical)
  --title=TEXT      Music title (default: Peaceful Piano Meditation)
  --model=TEXT      Model version: V3_5 or V4 (default: V3_5)
  --task-id=ID      Use existing task ID instead of creating new
  -h, --help        Show this help message

Example:
  deno run -A index.js --prompt="Epic space battle music" --style="Cinematic"
`);
  Deno.exit(0);
}

/**
 * Creates a new music generation task
 * @returns {Promise<string>} Task ID
 */
async function createMusicTask() {
  console.log("Creating music generation task with:");
  console.log(`- Prompt: ${prompt}`);
  console.log(`- Style: ${style}`);
  console.log(`- Title: ${title}`);
  console.log(`- Model: ${model}`);

  const requestBody = {
    prompt: prompt,
    style: style,
    title: title,
    customMode: true,
    instrumental: true,
    model: model,
    callBackUrl: config.callbackUrl
  };

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(requestBody)
  };

  try {
    const response = await fetch(config.apiUrl, options);
    const result = await response.json();

    if (result.code === 200 && result.data?.taskId) {
      console.log(`✅ Task created successfully! Task ID: ${result.data.taskId}`);
      return result.data.taskId;
    } else {
      throw new Error(`Error creating task: ${result.msg || JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error(`❌ Failed to create music task: ${error.message}`);
    Deno.exit(1);
  }
}

/**
 * Check if a music URL exists in a response
 * @param {Object} response API response
 * @returns {string|null} Music URL if found, null otherwise
 */
function extractMusicUrl(response) {
  if (!response || !response.data) return null;

  // Handle callback-style response
  if (response.data.data && Array.isArray(response.data.data)) {
    const track = response.data.data[0];
    if (track && track.audio_url) return track.audio_url;
  }

  // Handle direct style response
  if (response.data.music_url) return response.data.music_url;
  
  // Handle other formats
  if (response.data.audioUrl) return response.data.audioUrl;
  if (response.data.url) return response.data.url;
  
  return null;
}

/**
 * Downloads a file from a URL
 * @param {string} url URL to download
 * @param {string} outputPath Local path to save file
 */
async function downloadFile(url, outputPath) {
  console.log(`Downloading music from ${url}...`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`);
    }
    
    const fileBytes = new Uint8Array(await response.arrayBuffer());
    await Deno.writeFile(outputPath, fileBytes);
    
    console.log(`✅ Music saved to ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Download failed: ${error.message}`);
    return false;
  }
}

/**
 * Wait for a music generation task to complete, checking multiple API endpoints
 * @param {string} taskId Task ID to check
 * @returns {Promise<boolean>} True if music was downloaded, false otherwise
 */
async function waitForTaskCompletion(taskId) {
  console.log(`\nWaiting for music generation to complete...`);
  console.log(`This typically takes 1-3 minutes.`);
  
  // List of potential API endpoints to check
  const endpoints = [
    // Try various endpoint formats that might work
    `https://apibox.erweima.ai/api/v1/result/${taskId}`,
    `https://apibox.erweima.ai/api/v1/status/${taskId}`,
    `https://apibox.erweima.ai/api/v1/tasks/${taskId}`,
    `https://apibox.erweima.ai/api/v1/task/${taskId}`,
    `https://apibox.erweima.ai/api/v1/music/${taskId}`,
    `https://apibox.erweima.ai/api/v1/query?taskId=${taskId}`
  ];
  
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    }
  };

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    // Show progress indicator
    Deno.stdout.writeSync(new TextEncoder().encode("."));
    
    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, options);
        const result = await response.json();
        
        // Check for successful completion
        if (result.code === 200) {
          const musicUrl = extractMusicUrl(result);
          
          if (musicUrl) {
            console.log(`\n\n✅ Music generation complete after ${attempt} attempts!`);
            const success = await downloadFile(musicUrl, config.outputFile);
            return success;
          }
        }
      } catch (error) {
        // Silently continue on errors - we'll try other endpoints
      }
    }
    
    // Wait before next polling attempt
    await new Promise(resolve => setTimeout(resolve, config.pollingInterval));
  }
  
  console.log(`\n\n❌ Timed out waiting for music to be ready.`);
  console.log(`The task may still be processing. Try running this command later:`);
  console.log(`deno run -A index.js --task-id=${taskId}`);
  
  return false;
}

/**
 * Main function
 */
async function main() {
  try {
    // Get task ID (either from command line or by creating a new task)
    const id = taskId || await createMusicTask();
    
    // Save to a file for reference
    await Deno.writeTextFile("last_task_id.txt", id);
    
    // Wait for task to complete and download music
    await waitForTaskCompletion(id);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run the main function
await main();