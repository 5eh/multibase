#import "@preview/tablex:0.0.6": tablex, cellx, rowspanx, colspanx

#let data = json("analysis.json")

#set page(
  paper: "a4",
  margin: (x: 2cm, y: 2cm),
)

#set text(font: "New Computer Modern")
#set heading(numbering: "1.")

= Kusama Transaction Analysis and Music Styles

== Overview

This report analyzes Kusama blockchain transaction data and maps transaction volumes to appropriate music styles.

Total transactions analyzed: #data.totalTransactions

=== Key Findings

- Highest transaction volume: *#data.highestMonth.period* with *#data.highestMonth.count* transactions
- Lowest transaction volume: *#data.lowestMonth.period* with *#data.lowestMonth.count* transactions
- Music styles range from Ambient (low transaction volume) to Speedcore (high volume)

== Monthly Breakdown with Music Styles

#let months = data.monthlyData.sorted(key: m => m.year * 100 + {
  let month_names = ("January", "February", "March", "April", "May", "June", 
                     "July", "August", "September", "October", "November", "December")
  let month_index = 0
  for (i, name) in month_names.enumerate() {
    if (name == m.month) {
      month_index = i
    }
  }
  month_index + 1
})

#figure(
  tablex(
    columns: (auto, auto, auto, auto, auto),
    align: (center, center, right, center, center),
    header-rows: 1,
    cellx(fill: gray.lighten(50%))[*Month*], 
    cellx(fill: gray.lighten(50%))[*Year*], 
    cellx(fill: gray.lighten(50%))[*Transactions*], 
    cellx(fill: gray.lighten(50%))[*Music Style*], 
    cellx(fill: gray.lighten(50%))[*BPM*],
    ..months.map(m => {
      let style = if m.at("musicStyle", default: none) != none {
        m.musicStyle
      } else {
        "Not assigned"
      }
      
      let bpm = if m.at("bpm", default: none) != none {
        str(m.bpm) + " BPM"
      } else {
        "N/A"
      }
      
      (
        cellx[#m.month], 
        cellx[#m.year], 
        cellx[#m.count], 
        cellx[#style], 
        cellx[#bpm]
      )
    }).flatten()
  ),
  caption: [Monthly transaction counts and corresponding music styles]
)

== Music Style Distribution

The following chart shows the distribution of music styles across the analyzed months:

#let style_counts = (:)
#for month in months {
  if month.at("musicStyle", default: none) != none {
    style_counts.insert(
      month.musicStyle, 
      style_counts.at(month.musicStyle, default: 0) + 1
    )
  }
}

#let styles = style_counts.keys().sorted(key: k => style_counts.at(k))

#figure(
  tablex(
    columns: (auto, auto),
    align: (left, right),
    header-rows: 1,
    cellx(fill: gray.lighten(50%))[*Music Style*], 
    cellx(fill: gray.lighten(50%))[*Count*],
    ..styles.map(style => (
      cellx[#style], 
      cellx[#style_counts.at(style)]
    )).flatten()
  ),
  caption: [Distribution of music styles]
)

== Conclusion

This analysis demonstrates how transaction volume can be mapped to music styles, creating a unique auditory representation of blockchain activity. Higher transaction volumes correspond to more energetic music styles with faster BPM, while lower volumes are represented by more ambient, relaxed styles.

The music generation pipeline uses this data to create songs that reflect the activity level of the Kusama blockchain during specific time periods.
