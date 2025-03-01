import file from "./output/analysis.json" with { type: "json" };
const simplifiedData = file.monthlyData.map((item) => ({
  month: item.month,
  year: item.year,
  count: item.count,
}));

// Sort by count in descending order
const sortedData = [...simplifiedData].sort((a, b) => b.count - a.count);

// Divide into 5 quantiles (quintiles)
const totalItems = sortedData.length;
const itemsPerQuantile = Math.ceil(totalItems / 5);

// Define musical styles and BPM ranges for each quantile
const musicStyles = [
  {
    style: "Speedcore",
    bpmRange: "300+ BPM",
    description: "Ultra-fast and chaotic electronic music",
  },
  {
    style: "Rock",
    bpmRange: "100-140 BPM",
    description:
      "Generally faster than Pop, especially in Punk and Metal variations",
  },
  {
    style: "Hip-Hop",
    bpmRange: "80-120 BPM",
    description: "Can be slow and groovy or mid-tempo, but rarely very fast",
  },
  {
    style: "Reggae",
    bpmRange: "60-90 BPM",
    description: "Relaxed groove with emphasis on offbeat rhythms",
  },
  {
    style: "Drone Ambient",
    bpmRange: "20-40 BPM",
    description: "Extremely slow, focusing on atmosphere over rhythm",
  },
];

// Assign styles and log results by quantile
for (let i = 0; i < 5; i++) {
  const start = i * itemsPerQuantile;
  const end = Math.min((i + 1) * itemsPerQuantile, totalItems);
  const quantileData = sortedData.slice(start, end);
  const style = musicStyles[i];

  console.log(
    `\n== ${style.style} (${style.bpmRange}) - ${style.description} ==`,
  );

  quantileData.forEach((item) => {
    console.log(`${item.month} ${item.year}: ${item.count.toLocaleString()}`);
  });
}
