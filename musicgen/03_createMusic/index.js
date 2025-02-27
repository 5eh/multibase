/**
 * Music Generation with APIBox.ai
 * Creates a music task, checks completion status, and downloads the MP3 file
 */

import * as colors from "jsr:@std/fmt/colors";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { join } from "jsr:@std/path";

// Configuration
const config = {
  apiUrl: 'https://apibox.erweima.ai/api/v1/generate',
  statusUrl: 'https://apibox.erweima.ai/api/v1/generate/record-info',
  lyricsUrl: 'https://apibox.erweima.ai/api/v1/lyrics',
  apiKey: Deno.env.get("APIBOX_API_KEY"),
  callbackUrl: "https://api.example.com/callback", // Required by API but not used
  outputDir: "./output/",
  pollingInterval: 10000, // 10 seconds
  maxAttempts: 60         // 10 minutes total polling time
};

// Default SpaceX lyrics about the launch on December 3, 2024
const defaultLyrics = `[Verse 1]
Countdown to history, December sky
SpaceX rockets ready to fly
Metal and fire, dreams taking flight
Breaking barriers, reaching new heights

[Chorus]
December third, twenty-twenty-four
Humanity's reaching for something more
Stars are calling, we're answering back
SpaceX leading the way on this cosmic track

[Verse 2]
Engineers and dreamers working as one
Building the future under the sun
From Boca Chica to orbit above
A testament to what humans can love

[Bridge]
The impossible becomes possible today
New frontiers just a rocket away
The stars our destination, the moon just a start
SpaceX mission embedded in our heart

[Outro]
December third, mark the date
SpaceX launch, we can't wait
History written in the stars tonight
As we witness this magnificent flight`;

// Ensure API key is available
if (!config.apiKey) {
  console.error(colors.red("Error: APIBOX_API_KEY environment variable is not set"));
  Deno.exit(1);
}

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["prompt", "style", "title", "model", "task-id", "lyrics", "bpm"],
  boolean: ["help", "instrumental"],
  alias: {
    h: "help",
    p: "prompt",
    s: "style",
    t: "title",
    m: "model",
    i: "task-id",
    l: "lyrics",
    n: "instrumental",
    b: "bpm"
  },
  default: {
    prompt: "A song about Kusama blockchain",
    style: "Rock",
    title: "Kusama Blockchain",
    model: "V3_5",
    instrumental: false
  }
});

// Show help if requested
if (args.help) {
  console.log(colors.cyan(`
Music Generation Tool

Usage:
  deno run -A index.js [options]

Options:
  -p, --prompt=TEXT     Music description (default: SpaceX launch song)
  -s, --style=TEXT      Music style (default: Rock)
  -t, --title=TEXT      Music title (default: SpaceX Launch Day)
  -m, --model=TEXT      Model version: V3_5 or V4 (default: V3_5)
  -i, --task-id=ID      Use existing task ID instead of creating new
  -l, --lyrics=TEXT     Custom lyrics (default: SpaceX launch lyrics)
  -n, --instrumental    Generate instrumental music without lyrics (default: false)
  -h, --help            Show this help message

Example:
  deno run -A index.js --prompt="Epic space battle music" --style="Cinematic" --instrumental
`));
  Deno.exit(0);
}

const { prompt, style, title, model, instrumental } = args;
const customLyrics = args.lyrics || defaultLyrics;
const taskId = args["task-id"];

/**
 * Creates a new music generation task
 * @returns {Promise<string>} Task ID
 */
async function createMusicTask() {
  console.log(colors.blue("Creating music generation task:"));
  console.log(colors.dim(`• Prompt: ${colors.white(prompt)}`));
  console.log(colors.dim(`• Style: ${colors.white(style)}`));
  console.log(colors.dim(`• Title: ${colors.white(title)}`));
  console.log(colors.dim(`• Model: ${colors.white(model)}`));
  console.log(colors.dim(`• Instrumental: ${colors.white(instrumental ? "Yes" : "No")}`));
  
  if (!instrumental) {
    console.log(colors.dim(`• Lyrics: ${colors.white("Custom lyrics included")}`));
    console.log(colors.dim(colors.gray("First few lines:")));
    const previewLines = customLyrics.split('\n').slice(0, 3);
    previewLines.forEach(line => console.log(colors.dim(colors.gray(`  ${line}`))));
    console.log(colors.dim(colors.gray("  ...")));
  }

  // Add BPM to the prompt if specified
  const bpmText = args.bpm ? ` with ${args.bpm} BPM` : "";
  const styleWithBpm = `${style}${bpmText}`;
  
  const requestBody = {
    prompt: instrumental ? `${prompt} in ${styleWithBpm} style` : `${prompt} in ${styleWithBpm} style\n\n${customLyrics}`,
    style: style,
    title: title,
    customMode: true,
    instrumental: instrumental,
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
      console.log(colors.green(`✅ Task created successfully! Task ID: ${colors.white(result.data.taskId)}`));
      return result.data.taskId;
    } else {
      throw new Error(`Error creating task: ${result.msg || JSON.stringify(result)}`);
    }
  } catch (error) {
    console.error(colors.red(`❌ Failed to create music task: ${error.message}`));
    Deno.exit(1);
  }
}


/**
 * Downloads a file from a URL
 * @param {string} url URL to download
 * @param {string} outputPath Local path to save file
 */
async function downloadFile(url, outputPath) {
  console.log(colors.dim(`Downloading music...`));
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`);
    }
    
    // Ensure output directory exists
    try {
      await Deno.mkdir(config.outputDir, { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) {
        throw err;
      }
    }
    
    // Check if we're using the output folder outside of the module
    let finalOutputPath = outputPath;
    
    // If this is being called from the main.js script, adjust the path to be in the root output directory
    if (Deno.cwd().endsWith("musicgen") && !outputPath.includes("03_createMusic")) {
      // Extract just the filename from the path
      const fileName = outputPath.split("/").pop();
      finalOutputPath = `./output/${fileName}`;
    }
    
    const fileBytes = new Uint8Array(await response.arrayBuffer());
    await Deno.writeFile(finalOutputPath, fileBytes);
    
    console.log(colors.green(`✅ Music saved to ${colors.white(finalOutputPath)}`));
    return true;
  } catch (error) {
    console.error(colors.red(`❌ Download failed: ${error.message}`));
    return false;
  }
}

/**
 * Wait for a music generation task to complete
 * @param {string} taskId Task ID to check
 * @returns {Promise<boolean>} True if music was downloaded, false otherwise
 */
async function waitForTaskCompletion(taskId) {
  console.log(colors.blue(`\nWaiting for music generation to complete...`));
  console.log(colors.dim(`This typically takes 1-3 minutes.`));
  
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    }
  };

  // Construct the status URL with the task ID as a query parameter
  const statusUrl = `${config.statusUrl}?taskId=${taskId}`;
  
  // For progress bar
  let lastStatus = "";
  let progressChar = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("");
  let progressIndex = 0;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    // Update spinner
    if (lastStatus) {
      Deno.stdout.writeSync(new TextEncoder().encode(`\r${colors.cyan(progressChar[progressIndex])} ${lastStatus} ${colors.dim(`(${attempt}/${config.maxAttempts})`)}`));
      progressIndex = (progressIndex + 1) % progressChar.length;
    } else {
      Deno.stdout.writeSync(new TextEncoder().encode(`\r${colors.cyan(progressChar[progressIndex])} ${colors.dim(`Checking status (${attempt}/${config.maxAttempts})`)}`));
      progressIndex = (progressIndex + 1) % progressChar.length;
    }
    
    try {
      const response = await fetch(statusUrl, options);
      const result = await response.json();
      
      // Check for successful completion
      if (result.code === 200) {
        // Check if the task is complete
        if (result.data && (result.data.status === "complete" || result.data.status === "SUCCESS")) {
          console.log(`\r${colors.green(`✅ Music generation complete!`)}`);
          
          // Use our helper function to find all audio URLs in the response
          const foundUrls = [];
          findAudioUrls(result.data, foundUrls);
          
          if (foundUrls.length > 0) {
            console.log(colors.dim(`Found ${foundUrls.length} track${foundUrls.length > 1 ? 's' : ''}`));
          }
          
          // Extract audio URLs from the response
          let downloadSuccess = false;
          
          if (foundUrls.length > 0) {
            // Download only the first URL
            const { url, title } = foundUrls[0];
            
            // Extract month and year from title if available, or generate a safe filename
            let fileName;
            
            // Try to match "Kusama January 2021" pattern in title
            const titleMatch = title.match(/kusama\s+([a-z]+)\s+(\d{4})/i);
            if (titleMatch) {
              const [, month, year] = titleMatch;
              fileName = `${config.outputDir}kusama_${month.toLowerCase()}_${year}_music.mp3`;
            } else {
              // Fallback to the safe title if no match
              const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
              fileName = `${config.outputDir}${safeTitle}.mp3`;
            }
            
            const success = await downloadFile(url, fileName);
            if (success) {
              downloadSuccess = true;
              console.log(colors.dim(`Note: Found ${foundUrls.length} tracks, but only downloading the first one`));
            }
          } else {
            // Fallback to the original methods if no URLs found with our helper
            if (result.data.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
              // First structure: result.data.data is an array of tracks - only use the first one
              const track = result.data.data[0];
              if (track.audio_url) {
                // Use a standard format with current date if title doesn't follow our pattern
                const currentDate = new Date();
                const month = currentDate.toLocaleString('en-US', { month: 'long' });
                const year = currentDate.getFullYear();
                const fileName = `${config.outputDir}kusama_${month.toLowerCase()}_${year}_music.mp3`;
                const success = await downloadFile(track.audio_url, fileName);
                if (success) {
                  downloadSuccess = true;
                }
              }
            } else if (result.data.list && Array.isArray(result.data.list) && result.data.list.length > 0) {
              // Second structure: result.data.list is an array of tracks - only use the first one
              const track = result.data.list[0];
              if (track.audio_url) {
                // Use a standard format with current date if title doesn't follow our pattern
                const currentDate = new Date();
                const month = currentDate.toLocaleString('en-US', { month: 'long' });
                const year = currentDate.getFullYear();
                const fileName = `${config.outputDir}kusama_${month.toLowerCase()}_${year}_music.mp3`;
                const success = await downloadFile(track.audio_url, fileName);
                if (success) {
                  downloadSuccess = true;
                }
              }
            } else if (result.data.audio_url) {
              // Third structure: audio_url is directly in result.data
              const currentDate = new Date();
              const month = currentDate.toLocaleString('en-US', { month: 'long' });
              const year = currentDate.getFullYear();
              const fileName = `${config.outputDir}kusama_${month.toLowerCase()}_${year}_music.mp3`;
              const success = await downloadFile(result.data.audio_url, fileName);
              if (success) {
                downloadSuccess = true;
              }
            }
          }
          
          if (downloadSuccess) {
            return true;
          } else {
            console.log(colors.red("❌ No audio URLs found in the response"));
            return false;
          }
        } else if (result.data && result.data.status) {
          // Status is available but not complete
          const statusMap = {
            "PENDING": "Initializing...",
            "TEXT_SUCCESS": "Creating music...",
            "FIRST_SUCCESS": "Finalizing...",
            "SUCCESS": "Complete"
          };
          
          const friendlyStatus = statusMap[result.data.status] || result.data.status;
          lastStatus = `Status: ${friendlyStatus}`;
        }
      } else if (result.code !== 200) {
        console.log(`\r${colors.red(`❌ API error ${result.code}: ${result.msg || "Unknown error"}`)}`);
      }
    } catch (error) {
      console.log(`\r${colors.red(`❌ Error checking status: ${error.message}`)}`);
    }
    
    // Wait before next polling attempt
    await new Promise(resolve => setTimeout(resolve, config.pollingInterval));
  }
  
  console.log(`\n${colors.red(`❌ Timed out waiting for music to be ready.`)}`);
  console.log(colors.yellow(`The task may still be processing. Try running this command later:`));
  console.log(colors.cyan(`deno run -A musicgen/03_createMusic/index.js --task-id=${taskId}`));
  
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
    
    // Ensure output directory exists
    try {
      await Deno.mkdir("./output", { recursive: true });
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) {
        throw err;
      }
    }
    
    // Save to a file for reference
    await Deno.writeTextFile("last_task_id.txt", id);
    console.log(colors.dim(`Task ID saved to last_task_id.txt`));
    
    // Wait for task to complete and download music
    const success = await waitForTaskCompletion(id);
    
    if (success) {
      console.log(colors.green(`\n✨ Music generation complete!`));
    } else {
      console.log(colors.yellow(`\nYou can check the status later with:`));
      console.log(colors.cyan(`deno run -A musicgen/03_createMusic/index.js --task-id=${id}`));
    }
  } catch (error) {
    console.error(colors.red(`Error: ${error.message}`));
  }
}

// Run the main function
await main();
