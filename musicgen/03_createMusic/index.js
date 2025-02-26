/**
 * Music Generation with APIBox.ai
 * Creates a music task, checks completion status, and downloads the MP3 file
 */

// Configuration
const config = {
  apiUrl: 'https://apibox.erweima.ai/api/v1/generate',
  statusUrl: 'https://apibox.erweima.ai/api/v1/generate/record-info',
  apiKey: Deno.env.get("APIBOX_API_KEY"),
  callbackUrl: "https://api.example.com/callback", // Required by API but not used
  outputDir: "./",
  pollingInterval: 10000, // 10 seconds
  maxAttempts: 60         // 10 minutes total polling time
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
 * Wait for a music generation task to complete
 * @param {string} taskId Task ID to check
 * @returns {Promise<boolean>} True if music was downloaded, false otherwise
 */
async function waitForTaskCompletion(taskId) {
  console.log(`\nWaiting for music generation to complete...`);
  console.log(`This typically takes 1-3 minutes.`);
  
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    }
  };

  // Construct the status URL with the task ID as a query parameter
  const statusUrl = `${config.statusUrl}?taskId=${taskId}`;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    // Show progress indicator
    Deno.stdout.writeSync(new TextEncoder().encode("."));
    
    try {
      const response = await fetch(statusUrl, options);
      const result = await response.json();
      
      // Debug the response if needed
      // console.log(JSON.stringify(result, null, 2));
      
      // Check for successful completion
      if (result.code === 200) {
        // Check if the task is complete
        if (result.data && (result.data.status === "complete" || result.data.status === "SUCCESS")) {
          console.log(`\n\n✅ Music generation complete after ${attempt} attempts!`);
          
          // Add debug output to see the full response structure
          console.log("Response structure:", JSON.stringify(result.data, null, 2));
          
          // Use our helper function to find all audio URLs in the response
          const foundUrls = [];
          findAudioUrls(result.data, foundUrls);
          
          console.log(`Found ${foundUrls.length} audio URLs in the response`);
          
          // Extract audio URLs from the response
          let downloadSuccess = false;
          
          if (foundUrls.length > 0) {
            // Download each found URL
            for (let i = 0; i < foundUrls.length; i++) {
              const { url, title } = foundUrls[i];
              const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
              const fileName = `${config.outputDir}${safeTitle}_${i+1}.mp3`;
              const success = await downloadFile(url, fileName);
              if (success) {
                downloadSuccess = true;
                console.log(`✅ Track "${title}" saved as ${fileName}`);
              }
            }
          } else {
            // Fallback to the original methods if no URLs found with our helper
            if (result.data.data && Array.isArray(result.data.data)) {
              // First structure: result.data.data is an array of tracks
              for (let i = 0; i < result.data.data.length; i++) {
                const track = result.data.data[i];
                if (track.audio_url) {
                  const fileName = `${config.outputDir}generated_music_${i+1}.mp3`;
                  const success = await downloadFile(track.audio_url, fileName);
                  if (success) {
                    downloadSuccess = true;
                    console.log(`✅ Track ${i+1} saved as ${fileName}`);
                  }
                }
              }
            } else if (result.data.list && Array.isArray(result.data.list)) {
              // Second structure: result.data.list is an array of tracks
              for (let i = 0; i < result.data.list.length; i++) {
                const track = result.data.list[i];
                if (track.audio_url) {
                  const fileName = `${config.outputDir}generated_music_${i+1}.mp3`;
                  const success = await downloadFile(track.audio_url, fileName);
                  if (success) {
                    downloadSuccess = true;
                    console.log(`✅ Track ${i+1} saved as ${fileName}`);
                  }
                }
              }
            } else if (result.data.audio_url) {
              // Third structure: audio_url is directly in result.data
              const fileName = `${config.outputDir}generated_music.mp3`;
              const success = await downloadFile(result.data.audio_url, fileName);
              if (success) {
                downloadSuccess = true;
                console.log(`✅ Track saved as ${fileName}`);
              }
            }
          }
          
          if (downloadSuccess) {
            return true;
          } else {
            console.log("❌ No audio URLs found in the response");
            return false;
          }
        } else if (result.data && result.data.status) {
          // Status is available but not complete
          console.log(`\nStatus: ${result.data.status} (attempt ${attempt})`);
        }
      } else if (result.code !== 200) {
        console.log(`\nAPI returned error code ${result.code}: ${result.msg || "Unknown error"}`);
      }
    } catch (error) {
      console.log(`\nError checking status: ${error.message}`);
    }
    
    // Wait before next polling attempt
    await new Promise(resolve => setTimeout(resolve, config.pollingInterval));
  }
  
  console.log(`\n\n❌ Timed out waiting for music to be ready.`);
  console.log(`The task may still be processing. Try running this command later:`);
  console.log(`deno run -A musicgen/03_createMusic/index.js --task-id=${taskId}`);
  
  return false;
}

/**
 * Helper function to recursively search for audio URLs in an object
 * @param {Object} obj The object to search
 * @param {Array} foundUrls Array to collect found URLs
 */
function findAudioUrls(obj, foundUrls = []) {
  if (!obj || typeof obj !== 'object') return;
  
  // Check if this object has an audio_url property
  if (obj.audio_url && typeof obj.audio_url === 'string') {
    foundUrls.push({
      url: obj.audio_url,
      title: obj.title || 'Unknown'
    });
  }
  
  // Also check for other common URL property names
  if (obj.audioUrl && typeof obj.audioUrl === 'string') {
    foundUrls.push({
      url: obj.audioUrl,
      title: obj.title || 'Unknown'
    });
  }
  
  if (obj.url && typeof obj.url === 'string' && obj.url.endsWith('.mp3')) {
    foundUrls.push({
      url: obj.url,
      title: obj.title || 'Unknown'
    });
  }
  
  // Recursively search arrays
  if (Array.isArray(obj)) {
    for (const item of obj) {
      findAudioUrls(item, foundUrls);
    }
    return;
  }
  
  // Recursively search object properties
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      findAudioUrls(obj[key], foundUrls);
    }
  }
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
    console.log(`Task ID saved to last_task_id.txt`);
    
    // Wait for task to complete and download music
    const success = await waitForTaskCompletion(id);
    
    if (success) {
      console.log(`\n✨ Music generation complete! Check the generated_music_*.mp3 files.`);
    } else {
      console.log(`\nYou can check the status later with:`);
      console.log(`deno run -A musicgen/03_createMusic/index.js --task-id=${id}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Run the main function
await main();
