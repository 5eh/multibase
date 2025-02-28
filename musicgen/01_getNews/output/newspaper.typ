#import "newspaper_data.typ" : title, subtitle, date, headlines, conclusion

// Page setup - optimized for better flow and reduced page count
#set page(
  paper: "a4",
  margin: (x: 0.8cm, y: 1.2cm), // Increased bottom margin for better footer visibility
  fill: rgb("#fffdf5"), // Off-white for traditional newspaper
  header: none,
  footer: context {
    // Only one footer with all relevant information
    v(0.3cm) // Add extra space before footer
    line(length: 100%, stroke: 0.2pt + gray)
    v(0.2cm) // Add more space after the line
    grid(
      columns: (1fr, 1fr, 1fr),
      gutter: 0pt,
      [#set text(size: 7pt, fill: rgb("#444444"))
       #align(left)[Editor: Multibase Team]],
      [#set text(size: 7pt, fill: rgb("#444444"))
       #align(center)[The Blockchain Times · Volume 1, Issue 1]],
      [#set text(size: 7pt, fill: rgb("#444444"))
       #align(right)[Page #counter(page).display()]]
    )
    v(0.2cm) // Add extra space at the bottom of footer
  }
)

// Text settings - optimized for 2.0-2.5 columns of content
#set text(font: "New Computer Modern", size: 8.2pt, fill: black)
#set par(justify: true, leading: 0.68em, first-line-indent: 0.2em)
// Fine-tune column setting for better flow
#set columns(
  gutter: 0.6cm
)
#set heading(numbering: none)

// Define styles for headlines with newspaper styling
#let headline-style(content) = {
  set text(font: "New Computer Modern", weight: "bold", size: 14pt)
  content
}

#let subheadline-style(content) = {
  set text(font: "New Computer Modern", weight: "bold", size: 9.5pt)
  content
}

#let byline-style(content) = {
  set text(font: "New Computer Modern", style: "italic", size: 7pt)
  grid(
    columns: (1fr),
    rows: (auto),
    align(right)[#content]
  )
}

// Newspaper header with traditional masthead
#align(center)[
  #set text(font: "New Computer Modern", weight: "bold")
  
  // Top bar with location and date
  #grid(
    columns: (1fr, 1fr),
    [#set text(size: 8pt, style: "italic")
     #align(left)[Web3 Blockchain Edition]],
    [#set text(size: 8pt, style: "italic")
     #align(right)[#date]]
  )
  
  // Main masthead - traditional newspaper style
  #v(0.2cm)
  #text(size: 32pt)[The Blockchain Times]
  #v(-6pt)
  #line(length: 100%, stroke: 1pt + black)
  #v(-2pt)
  #text(size: 10pt, style: "italic")[#emph["All the Crypto News That's Fit to Print"]]
]

#v(0.2cm)
#line(length: 100%, stroke: 1pt + black)
#v(0.2cm)

// Main headline with date as banner across full width
#grid(
  columns: (auto),
  rows: (auto),
  gutter: 0pt,
  [
    #headline-style(headlines.at(0).title)
    #v(0.1cm)
    #align(left)[
      #text(style: "italic", weight: "regular", size: 9pt)[KUSAMA NEWS - JANUARY 2023]
    ]
  ]
)
#v(0.3cm)

// Convert headlines to articles and use bylines from our data
#let articles = headlines.slice(1)
#let numArticles = articles.len()

// Instead of using grid, use columns for proper text flow
#columns(3, gutter: 0.4cm)[
  // Main lead paragraph
  #text(weight: "medium", size: 8.5pt)[
    #headlines.at(0).content
  ]
  
  #v(0.2cm)
  #line(length: 100%, stroke: 0.2pt + gray)
  #v(0.2cm)
  
  // First article
  #if numArticles >= 1 [
    #subheadline-style(articles.at(0).title)
    #byline-style[#articles.at(0).byline]
    #v(0.1cm)
    #text[#articles.at(0).content]
  ]
  
  // If we have more articles, continue flowing
  #if numArticles >= 2 [
    #v(0.2cm)
    #line(length: 100%, stroke: 0.2pt + gray)
    #v(0.2cm)
    
    #subheadline-style(articles.at(1).title)
    #byline-style[#articles.at(1).byline]
    #v(0.1cm)
    #text[#articles.at(1).content]
  ]
  
  // Third article
  #if numArticles >= 3 [
    #v(0.2cm)
    #line(length: 100%, stroke: 0.2pt + gray)
    #v(0.2cm)
    
    #subheadline-style(articles.at(2).title)
    #byline-style[#articles.at(2).byline]
    #v(0.1cm)
    #text[#articles.at(2).content]
  ]
  
  // Fourth article if we have it
  #if numArticles >= 4 [
    #v(0.2cm)
    #line(length: 100%, stroke: 0.2pt + gray)
    #v(0.2cm)
    
    #subheadline-style(articles.at(3).title)
    #byline-style[#articles.at(3).byline]
    #v(0.1cm)
    #text[#articles.at(3).content]
  ]
  
  // Add "Looking Forward" section at the end
  #v(0.2cm)
  #line(length: 100%, stroke: 0.2pt + gray)
  #v(0.2cm)
  
  #subheadline-style("Looking Forward")
  #byline-style[Editorial Team]
  #v(0.1cm)
  #text[#conclusion]
  
  // Add a "quote" box for visual interest
  #v(0.2cm)
  #block(
    width: 100%,
    fill: rgb("#f0f0f0"),
    radius: 4pt,
    inset: 6pt,
    [
      #text(style: "italic", weight: "medium", size: 8pt)[
        "Kusama continues to serve as the innovation hub for the Polkadot ecosystem, embracing chaos to drive blockchain evolution forward."
      ]
      #v(0.1cm)
      #align(right)[— Blockchain Observer]
    ]
  )
]