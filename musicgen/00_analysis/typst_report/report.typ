#import "data.typ" : totalTransactions, highestMonth, lowestMonth, monthlyData, yearlyData

#set page(
  margin: (x: 2.5cm, y: 2.5cm),
  fill: rgb("#fffef0"),
  header: [
    #set text(size: 9pt, style: "italic", fill: rgb("#666666"))
    #align(right)[Multibase Analysis · 2025]
    #line(length: 100%, stroke: 0.5pt + rgb("#cccccc"))
  ],
  footer: [
    #line(length: 100%, stroke: 0.5pt + rgb("#cccccc"))
    #grid(
      columns: (1fr, 1fr),
      gutter: 0pt,
      [#set text(size: 9pt, fill: rgb("#666666"), style: "italic")
       #align(left)[Multibase]],
      [#set text(size: 9pt, fill: rgb("#666666"), style: "italic")
       #align(right)[February 2025]]
    )
  ]
)
#set text(font: "New Computer Modern", fill: rgb("#333333"))
#set heading(numbering: "1.") 
#show heading: it => {
  set text(fill: rgb("#333333"))
  block(
    width: 100%,
    inset: (left: 0pt, top: 0pt, bottom: 0pt),
    it
  )
  v(0.3cm)
}

#align(center)[
  #block(
    width: 100%,
    height: 3cm,
    inset: 20pt,
    {
      align(center)[
        #text(size: 48pt, weight: "bold", fill: rgb("#48301a"))[Multibase Analysis]
      ]
    }
  )
]

#v(2cm)

= Executive Summary

This report analyzes the temporal patterns of blockchain transactions from November 2019 to February 2025. The analysis shows that there have been *#totalTransactions* total transactions during this period, with significant variations in transaction volume over time.

The highest transaction volume was observed in *#highestMonth.period* with *#highestMonth.count* transactions, while the lowest volume was in *#lowestMonth.period* with only *#lowestMonth.count* transactions. This represents a growth of over *#calc.round(highestMonth.count / lowestMonth.count)x* from the lowest to the highest month.

= Transaction Volume Over Time

The transaction volume has shown significant fluctuations over the analyzed period. Several notable peaks and patterns can be observed:

- A major spike in November 2024
- Significant activity during mid-2021
- A general upward trend from 2019 to 2021
- More stabilized transaction volumes from 2022 to early 2024

#let getCount = (month, year) => {
  let found = monthlyData.find(m => m.month == month and m.year == year)
  if found == none { 
    return [-] 
  } else { 
    return [#found.count] 
  }
}

#let months = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
#let shortMonthToFull = (short) => {
  let idx = months.position(m => m == short)
  if idx == none { return short }
  return ("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December").at(idx)
}

#figure(
  caption: [Monthly Transaction Volume (excluding Nov 2024 outlier)],
  table(
    columns: (1fr, 0.7fr, 0.7fr, 0.7fr, 0.7fr, 0.7fr, 0.7fr, 0.7fr),
    fill: (row, col) => {
        if row == 0 { rgb("#f5b041") } 
        else if col == 0 { rgb("#f8c471") }
        else if calc.rem(row, 2) == 1 { rgb("#fef9e7") } 
        else { none }
      },
    align: (left, center, center, center, center, center, center, center),
    stroke: 0.5pt + rgb("#48301a"),
    inset: 5pt,
    [*Month*], [*2019*], [*2020*], [*2021*], [*2022*], [*2023*], [*2024*], [*2025*],
    ..months.map(m => ([*#m*], getCount(shortMonthToFull(m), 2019), getCount(shortMonthToFull(m), 2020), getCount(shortMonthToFull(m), 2021), getCount(shortMonthToFull(m), 2022), getCount(shortMonthToFull(m), 2023), getCount(shortMonthToFull(m), 2024), getCount(shortMonthToFull(m), 2025))).flatten(),
  )
)

= Yearly Comparison

The yearly transaction patterns show the evolution of blockchain adoption:

#let yearlyData = (
  (year: 2019, count: 8617),
  (year: 2020, count: 120726),
  (year: 2021, count: 1158282),
  (year: 2022, count: 740417),
  (year: 2023, count: 520966),
  (year: 2024, count: 4784740),
  (year: 2025, count: 65368)
)

#let maxYearlyCount = yearlyData.map(y => y.count).fold(0, calc.max)
#let getBoxWidth = (count) => {
  let maxWidth = 8cm
  return maxWidth * count / maxYearlyCount
}

#figure(
  caption: [Transaction Volume by Year],
  table(
    columns: (1fr, 1fr, 3fr),
    fill: (row, col) => {
        if row == 0 { rgb("#f5b041") } 
        else if col == 0 { rgb("#f8c471") }
        else if calc.rem(row, 2) == 1 { rgb("#fef9e7") } 
        else { none }
      },
    align: (auto, right, left),
    stroke: 0.5pt + rgb("#48301a"),
    inset: 8pt,
    [*Year*], [*Transaction Count*], [*Visualization*],
    ..yearlyData.map(y => {
      let yearName = if y.year == 2025 { [2025 (partial)] } else { [#y.year] }
      let boxColor = if y.year == 2024 { rgb("#d35400") } 
                     else if y.year == 2021 { rgb("#f39c12") }
                     else if y.year == 2025 { rgb("#edbb99") }
                     else if y.year == 2019 { rgb("#d35400") }
                     else if y.year == 2020 { rgb("#e67e22") }
                     else if y.year == 2022 { rgb("#f5b041") }
                     else { rgb("#f8c471") }
      return (
        yearName, 
        [#y.count], 
        [#box(width: getBoxWidth(y.count), height: 0.6cm, fill: boxColor, radius: 2pt)]
      )
    }).flatten(),
  )
)

= Musical Representation Analysis

As part of our innovative approach, we've mapped transaction data to musical characteristics:

#let musicData = monthlyData.filter(m => "musicStyle" in m)

#figure(
  caption: [Musical Representation of Transaction Volume],
  table(
    columns: (1.5fr, 1fr, 1fr, 0.5fr),
    fill: (row, col) => {
        if row == 0 { rgb("#f5b041") } 
        else if calc.rem(row, 2) == 1 { rgb("#fef9e7") } 
        else { none }
      },
    align: (left, right, center, center),
    stroke: 0.5pt + rgb("#48301a"),
    inset: 8pt,
    [*Period*], [*Transaction Count*], [*Music Style*], [*BPM*],
    ..musicData.map(m => ([#m.month #m.year], [#m.count], [#m.musicStyle], [#m.bpm])).flatten(),
  )
)

This data shows a clear correlation between transaction volume and musical intensity, with higher volumes being represented by faster and more energetic music styles.


= Key Insights and Recommendations

1. *Anomaly Detection*: The extreme spike in November 2024 warrants further investigation to understand if this represents legitimate growth or potential anomalies in the data.

2. *Growth Patterns*: The significant growth in transaction volume from 2019 to 2021 suggests increased adoption and usage during this period.

3. *Cyclical Patterns*: Some seasonal patterns can be observed, with certain quarters showing consistently higher activity across years.

4. *Musical Mapping*: The correlation between transaction volume and musical characteristics provides an innovative way to represent blockchain activity as auditory experiences.

= Conclusion

This analysis demonstrates that blockchain transaction volumes have experienced significant fluctuations over time, with an overall growth trend. The data suggests both organic growth periods and potential anomalies that deserve further investigation.

The musical representation of this data provides a unique perspective on blockchain activity, allowing for alternative interpretations of transaction patterns beyond traditional visual analytics.


#v(2cm)

#align(right)[
  #text(style: "italic")[
    Analysis produced by Blockchain Analytics Division
    \
    Contact: analytics at example.com
  ]
]
