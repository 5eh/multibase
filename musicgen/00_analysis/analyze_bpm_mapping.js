// analyze_bpm_mapping.js - Script to analyze transaction counts and map to BPM values
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

function analyzeBpmMapping() {
  try {
    const monthlyData = analysisData.monthlyData;
    
    // Extract all transaction counts excluding the extreme outlier
    const counts = monthlyData
      .filter(item => item.count < 1000000) // Filter out extreme outliers
      .map(item => item.count)
      .sort((a, b) => a - b);
    
    // Add the extreme outlier back but separate
    const extremeOutlier = monthlyData.find(item => item.count >= 1000000);
    
    // Calculate the BPM range we want to cover (excluding Speedcore for the outlier)
    const minBpm = MUSIC_STYLES[0].minBpm;  // Ambient minBpm (60)
    const maxBpm = MUSIC_STYLES[14].maxBpm; // Hardstyle maxBpm (160)
    const bpmRange = maxBpm - minBpm;
    
    // Log information about the data
    console.log("Transaction Count Analysis:");
    console.log("--------------------------");
    console.log(`Min count: ${Math.min(...counts)}`);
    console.log(`Max count (excluding outlier): ${Math.max(...counts)}`);
    if (extremeOutlier) {
      console.log(`Extreme outlier: ${extremeOutlier.count} (${extremeOutlier.month} ${extremeOutlier.year})`);
    }
    
    // Create a mapping function that maps transaction counts to BPM values
    function countToBpm(count) {
      // Logarithmic mapping function to distribute BPM values
      // ln(count) scales better with exponential data
      const logMin = Math.log(Math.min(...counts));
      const logMax = Math.log(Math.max(...counts));
      const logCount = Math.log(count);
      
      // Normalized position (0 to 1) in log scale
      const normalizedPosition = (logCount - logMin) / (logMax - logMin);
      
      // Map to BPM range (60 to 160)
      return Math.round(minBpm + normalizedPosition * bpmRange);
    }
    
    // Function to find the style based on BPM
    function findMusicStyle(bpm) {
      // Find all styles that include this BPM in their range
      const matchingStyles = MUSIC_STYLES.filter(
        style => bpm >= style.minBpm && bpm <= style.maxBpm
      );
      
      // If multiple styles match, choose the one with the narrowest range
      // This prioritizes more specific styles over general ones
      if (matchingStyles.length > 0) {
        return matchingStyles.sort((a, b) => 
          (a.maxBpm - a.minBpm) - (b.maxBpm - b.minBpm)
        )[0];
      }
      
      // Fallback - find closest style
      return MUSIC_STYLES.sort((a, b) => {
        const aDist = Math.min(
          Math.abs(a.minBpm - bpm),
          Math.abs(a.maxBpm - bpm)
        );
        const bDist = Math.min(
          Math.abs(b.minBpm - bpm),
          Math.abs(b.maxBpm - bpm)
        );
        return aDist - bDist;
      })[0];
    }
    
    // Generate sample mappings for various transaction counts
    console.log("\nSample BPM Mappings:");
    console.log("-----------------");
    
    // Create a more comprehensive distribution of count samples
    const sampleCounts = [];
    // Add the min and max
    sampleCounts.push(Math.min(...counts));
    sampleCounts.push(Math.max(...counts));
    
    // Add some samples in between
    const countRange = Math.max(...counts) - Math.min(...counts);
    for (let i = 1; i < 10; i++) {
      const sampleCount = Math.min(...counts) + (countRange * i / 10);
      sampleCounts.push(Math.round(sampleCount));
    }
    
    // Sort and deduplicate
    const uniqueSamples = [...new Set(sampleCounts)].sort((a, b) => a - b);
    
    // Show mappings for the sample counts
    uniqueSamples.forEach(count => {
      const bpm = countToBpm(count);
      const style = findMusicStyle(bpm);
      console.log(`Count: ${count.toLocaleString()} → BPM: ${bpm} → Style: ${style.name}`);
    });
    
    // For the extreme outlier, always use Speedcore
    if (extremeOutlier) {
      const speedcore = MUSIC_STYLES[MUSIC_STYLES.length - 1];
      const outlierBpm = Math.round((speedcore.minBpm + speedcore.maxBpm) / 2);
      console.log(`Count: ${extremeOutlier.count.toLocaleString()} → BPM: ${outlierBpm} → Style: ${speedcore.name}`);
    }
    
    // Generate BPM brackets for each music style
    console.log("\nRecommended Count to BPM Mapping for index.js:");
    console.log("----------------------------------------------");
    
    // Create thresholds for the mappings
    const countThresholds = [];
    for (let bpm = minBpm; bpm <= maxBpm; bpm += 5) {
      // Reverse the mapping function to get count thresholds for specific BPMs
      const logMin = Math.log(Math.min(...counts));
      const logMax = Math.log(Math.max(...counts));
      const normalizedPosition = (bpm - minBpm) / bpmRange;
      const logCount = logMin + normalizedPosition * (logMax - logMin);
      const count = Math.round(Math.exp(logCount));
      
      countThresholds.push({ bpm, count });
    }
    
    // Add special case for Speedcore (for extreme outliers)
    if (extremeOutlier) {
      countThresholds.push({
        bpm: MUSIC_STYLES[MUSIC_STYLES.length - 1].minBpm,
        count: Math.max(...counts) * 2 // Set a threshold well above the normal maximum
      });
    }
    
    // Generate code for the mapping function
    console.log("function mapTransactionCountToBpm(count) {");
    console.log("  // Handle special case for extreme outliers");
    if (extremeOutlier) {
      console.log(`  if (count > ${Math.max(...counts) * 1.5}) {`);
      console.log(`    return ${MUSIC_STYLES[MUSIC_STYLES.length - 1].minBpm + 40}; // Speedcore`);
      console.log("  }");
    }
    console.log("");
    console.log("  // Map count to BPM using thresholds");
    console.log("  switch (true) {");
    
    // Generate case statements for each threshold
    countThresholds.forEach((threshold, index) => {
      if (index === 0) {
        console.log(`    case count <= ${threshold.count}:`);
      } else {
        console.log(`    case count <= ${threshold.count}:  // ${MUSIC_STYLES.find(s => threshold.bpm >= s.minBpm && threshold.bpm <= s.maxBpm)?.name || 'Unknown'}`);
      }
      console.log(`      return ${threshold.bpm};`);
    });
    
    console.log("    default:");
    console.log(`      return ${maxBpm};`);
    console.log("  }");
    console.log("}");
    
    // Generate function to find music style based on BPM
    console.log("\nfunction findMusicStyleByBpm(bpm) {");
    console.log("  switch (true) {");
    
    // Generate case statements for each style's BPM range
    MUSIC_STYLES.forEach(style => {
      console.log(`    case bpm >= ${style.minBpm} && bpm <= ${style.maxBpm}:`);
      console.log(`      return { name: "${style.name}", description: "${style.description}" };`);
    });
    
    console.log("    default:");
    console.log(`      return { name: "${MUSIC_STYLES[0].name}", description: "${MUSIC_STYLES[0].description}" };`);
    console.log("  }");
    console.log("}");
    
  } catch (error) {
    console.error("Error analyzing data:", error);
  }
}

// Run the analysis
analyzeBpmMapping();