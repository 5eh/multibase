// analyze_thresholds.js - A temporary script to analyze transaction data and find optimal thresholds
import analysisData from "./output/analysis.json" with { type: "json" };

// Load the MUSIC_STYLES from the main index file
const MUSIC_STYLES = [
  { name: "Ambient", description: "Slow, atmospheric ambient music", minBpm: 60, maxBpm: 80 },
  { name: "Chillout", description: "Relaxed electronic music", minBpm: 80, maxBpm: 100 },
  { name: "Downtempo", description: "Mellow electronic beats", minBpm: 90, maxBpm: 110 },
  { name: "Trip Hop", description: "Moody, atmospheric beats", minBpm: 90, maxBpm: 110 },
  { name: "Lo-Fi", description: "Relaxed beats with vinyl crackle", minBpm: 70, maxBpm: 90 },
  { name: "Jazz", description: "Smooth jazz with piano", minBpm: 80, maxBpm: 120 },
  { name: "Folk", description: "Acoustic folk music", minBpm: 90, maxBpm: 120 },
  { name: "Pop", description: "Catchy pop music", minBpm: 100, maxBpm: 130 },
  { name: "Indie Rock", description: "Alternative rock with indie vibes", minBpm: 110, maxBpm: 140 },
  { name: "Rock", description: "Energetic rock music", minBpm: 120, maxBpm: 150 },
  { name: "Dance", description: "Upbeat dance music", minBpm: 120, maxBpm: 140 },
  { name: "House", description: "Electronic house music", minBpm: 120, maxBpm: 130 },
  { name: "Techno", description: "Driving electronic beats", minBpm: 120, maxBpm: 150 },
  { name: "Drum and Bass", description: "Fast-paced electronic music", minBpm: 160, maxBpm: 180 },
  { name: "Hardstyle", description: "Hard-hitting electronic music", minBpm: 150, maxBpm: 160 },
  { name: "Speedcore", description: "Extremely fast electronic music", minBpm: 180, maxBpm: 300 }
];

function analyzeData() {
  try {
    // Use the imported analysis.json data
    const monthlyData = analysisData.monthlyData;

    // Extract all transaction counts
    const counts = monthlyData.map(item => item.count);

    // Sort counts in ascending order
    counts.sort((a, b) => a - b);

    // Remove the extreme outlier (November 2024)
    const regularCounts = counts.filter(count => count < 1000000);

    console.log("Total months:", counts.length);
    console.log("Range (excluding outlier):", Math.min(...regularCounts), "to", Math.max(...regularCounts));
    console.log("Extreme value:", Math.max(...counts));

    // Calculate count distribution (excluding the extreme outlier)
    const quartiles = calculateQuartiles(regularCounts);
    console.log("Quartiles (excluding outlier):", quartiles);

    // Find natural clusters in the data
    const clusters = findClusters(regularCounts);
    console.log("Natural clusters found:", clusters.length);
    clusters.forEach((cluster, i) => {
      console.log(`Cluster ${i + 1}: Range ${cluster.min} to ${cluster.max}, ${cluster.count} months`);
    });

    // Generate suggested thresholds to get good style variety
    const thresholds = generateThresholds(regularCounts, MUSIC_STYLES.length - 1); // Reserve speedcore for extreme outlier

    console.log("\nSuggested transaction thresholds for music styles:");
    thresholds.forEach((threshold, i) => {
      console.log(`${MUSIC_STYLES[i].name}: ${i === 0 ? "0" : thresholds[i - 1]} to ${threshold}`);
    });

    // For the highest style (Speedcore), use the extreme outlier
    console.log(`${MUSIC_STYLES[MUSIC_STYLES.length - 1].name}: > ${thresholds[thresholds.length - 1]}`);

    // Create code for the thresholds
    console.log("\nCopy-paste ready thresholds for index.js:");
    console.log("const TRANSACTION_THRESHOLDS = [");
    thresholds.forEach((threshold, i) => {
      console.log(`  { max: ${threshold}, styleIndex: ${i} },${i < thresholds.length - 1 ? "" : " // " + MUSIC_STYLES[i].name}`);
    });
    console.log(`  { max: Infinity, styleIndex: ${MUSIC_STYLES.length - 1} } // ${MUSIC_STYLES[MUSIC_STYLES.length - 1].name}`);
    console.log("];");

    // Distribution check - verify how many months would fall into each category
    const distribution = calculateDistribution(regularCounts, thresholds);
    console.log("\nDistribution of months across styles:");
    distribution.forEach((count, i) => {
      console.log(`${MUSIC_STYLES[i].name}: ${count} months`);
    });

  } catch (error) {
    console.error("Error analyzing data:", error);
  }
}

// Calculate quartiles of the data
function calculateQuartiles(data) {
  const q1Index = Math.floor(data.length * 0.25);
  const q2Index = Math.floor(data.length * 0.5);
  const q3Index = Math.floor(data.length * 0.75);

  return {
    min: data[0],
    q1: data[q1Index],
    median: data[q2Index],
    q3: data[q3Index],
    max: data[data.length - 1]
  };
}

// Find natural clusters in the data
function findClusters(data) {
  // Simple clustering algorithm
  // Look for significant gaps in the data
  const clusters = [];
  let currentCluster = { min: data[0], max: data[0], count: 1 };

  for (let i = 1; i < data.length; i++) {
    const current = data[i];
    const previous = data[i - 1];

    // If there's a significant gap (more than 30% increase), start a new cluster
    if (current > previous * 1.3) {
      currentCluster.max = previous;
      clusters.push(currentCluster);
      currentCluster = { min: current, max: current, count: 1 };
    } else {
      currentCluster.max = current;
      currentCluster.count++;
    }
  }

  // Add the last cluster
  clusters.push(currentCluster);

  return clusters;
}

// Generate thresholds that would distribute the data well across music styles
function generateThresholds(data, numStyles) {
  const thresholds = [];

  // Find the max value
  const maxVal = data[data.length - 1];

  // Calculate using log scale for better distribution
  for (let i = 1; i <= numStyles; i++) {
    // Use an exponential function to distribute thresholds
    // This gives more styles to lower counts and fewer to higher counts
    const factor = Math.pow(i / numStyles, 2);
    const threshold = Math.round(maxVal * factor);
    thresholds.push(threshold);
  }

  return thresholds;
}

// Calculate how many months would fall into each style category
function calculateDistribution(data, thresholds) {
  const distribution = new Array(thresholds.length + 1).fill(0);

  for (const count of data) {
    let styleIndex = thresholds.findIndex(t => count <= t);
    if (styleIndex === -1) styleIndex = thresholds.length;
    distribution[styleIndex]++;
  }

  return distribution;
}

// Run the analysis
analyzeData();
