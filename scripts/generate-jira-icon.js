#!/usr/bin/env node

/**
 * Generate Vintage Jira Ticket Icon (SVG)
 * Creates a vintage 1950s travel ticket style icon
 */

const fs = require('fs');
const path = require('path');

// Adventureland color palette
const colors = {
  sand: '#E8D4A8',
  terracotta: '#D4735E',
  jungle: '#4A7859',
  teal: '#479B99',
  mustard: '#DAA520',
  cream: '#FFF8E7',
  vintageText: '#3A3226'
};

// SVG vintage ticket icon
const ticketSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background/Paper -->
  <rect x="64" y="128" width="384" height="256"
    fill="${colors.cream}"
    stroke="${colors.terracotta}"
    stroke-width="6"
    rx="8"/>

  <!-- Decorative Border -->
  <rect x="80" y="144" width="352" height="224"
    fill="none"
    stroke="${colors.mustard}"
    stroke-width="3"
    stroke-dasharray="8,4"/>

  <!-- Perforated Edge (Left) -->
  <circle cx="68" cy="160" r="8" fill="${colors.sand}" stroke="${colors.terracotta}" stroke-width="2"/>
  <circle cx="68" cy="196" r="8" fill="${colors.sand}" stroke="${colors.terracotta}" stroke-width="2"/>
  <circle cx="68" cy="232" r="8" fill="${colors.sand}" stroke="${colors.terracotta}" stroke-width="2"/>
  <circle cx="68" cy="268" r="8" fill="${colors.sand}" stroke="${colors.terracotta}" stroke-width="2"/>
  <circle cx="68" cy="304" r="8" fill="${colors.sand}" stroke="${colors.terracotta}" stroke-width="2"/>
  <circle cx="68" cy="340" r="8" fill="${colors.sand}" stroke="${colors.terracotta}" stroke-width="2"/>
  <circle cx="68" cy="376" r="8" fill="${colors.sand}" stroke="${colors.terracotta}" stroke-width="2"/>

  <!-- Top Text: JIRA -->
  <text x="256" y="210"
    font-family="Arial, sans-serif"
    font-size="72"
    font-weight="bold"
    fill="${colors.vintageText}"
    text-anchor="middle"
    letter-spacing="8">JIRA</text>

  <!-- Middle Text: EXPEDITION PASS -->
  <text x="256" y="260"
    font-family="Arial, sans-serif"
    font-size="24"
    fill="${colors.jungle}"
    text-anchor="middle"
    letter-spacing="4">EXPEDITION PASS</text>

  <!-- Decorative Line -->
  <line x1="120" y1="280" x2="392" y2="280"
    stroke="${colors.terracotta}"
    stroke-width="2"
    stroke-dasharray="4,4"/>

  <!-- Bottom Text: ADMIT ONE -->
  <text x="256" y="320"
    font-family="Arial, sans-serif"
    font-size="36"
    font-weight="bold"
    fill="${colors.terracotta}"
    text-anchor="middle"
    letter-spacing="6">ADMIT ONE</text>

  <!-- Serial Number -->
  <text x="256" y="355"
    font-family="Courier, monospace"
    font-size="18"
    fill="${colors.vintageText}"
    text-anchor="middle"
    opacity="0.7">No. CONTECH-001</text>

  <!-- Small Decorative Elements -->
  <circle cx="120" cy="175" r="6" fill="${colors.teal}" opacity="0.6"/>
  <circle cx="392" cy="175" r="6" fill="${colors.teal}" opacity="0.6"/>
  <circle cx="120" cy="360" r="6" fill="${colors.teal}" opacity="0.6"/>
  <circle cx="392" cy="360" r="6" fill="${colors.teal}" opacity="0.6"/>

  <!-- Subtle Texture Overlay -->
  <rect x="64" y="128" width="384" height="256"
    fill="url(#paperTexture)"
    opacity="0.15"
    rx="8"/>

  <!-- Texture Pattern Definition -->
  <defs>
    <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="4" fill="${colors.sand}"/>
      <circle cx="1" cy="1" r="0.5" fill="${colors.vintageText}" opacity="0.1"/>
      <circle cx="3" cy="3" r="0.5" fill="${colors.vintageText}" opacity="0.1"/>
    </pattern>
  </defs>
</svg>`;

// Output path
const outputDir = path.join(__dirname, '..', 'packages', 'client', 'public', 'images');
const outputPath = path.join(outputDir, 'jira-ticket.svg');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write SVG file
fs.writeFileSync(outputPath, ticketSVG, 'utf8');

console.log('✅ Vintage Jira ticket icon generated!');
console.log(`📁 Location: ${outputPath}`);
console.log('🎨 Style: 1950s Adventureland vintage travel ticket');
console.log('');
console.log('Usage:');
console.log('  - Automatically used in navigation (if you update Navigation.jsx)');
console.log('  - Can be used in Jira page header');
console.log('  - Scales cleanly at any size (vector format)');
console.log('');
console.log('To use in your app:');
console.log('  <img src="/images/jira-ticket.svg" alt="Jira" className="w-8 h-8" />');
