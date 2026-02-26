#!/usr/bin/env node

/**
 * Add Jira Banner to Jira Page
 * Updates the Jira.jsx component to use a banner image instead of icon
 */

const fs = require('fs');
const path = require('path');

const jiraPagePath = path.join(__dirname, '..', 'packages', 'client', 'src', 'pages', 'Jira.jsx');
const bannerPath = path.join(__dirname, '..', 'packages', 'client', 'public', 'images', 'pages', 'jira-header.png');

console.log('🎫 Adding Jira Banner to Jira Page...\n');

// Check if banner image exists
if (!fs.existsSync(bannerPath)) {
  console.error('❌ Error: Banner image not found!');
  console.error(`Expected location: ${bannerPath}`);
  console.error('\nPlease generate the banner image first:');
  console.error('  1. Follow instructions in JIRA_BANNER_GENERATION.md');
  console.error('  2. Save as: packages/client/public/images/pages/jira-header.png');
  console.error('  3. Run this script again');
  process.exit(1);
}

console.log('✅ Banner image found!');

// Read the current Jira page
let jiraContent = fs.readFileSync(jiraPagePath, 'utf8');

// Check if banner is already added
if (jiraContent.includes('jira-header.png')) {
  console.log('ℹ️  Banner already added to Jira page.');
  process.exit(0);
}

// Old header section with icon (multiple possible formats)
const oldHeaderPatterns = [
  // Pattern 1: With icon
  /\{\/\* Hero Header \*\/\}\s*<div className="text-center py-8">[\s\S]*?<\/div>/,

  // Pattern 2: Simple center header
  /<div className="text-center py-8">[\s\S]*?<h1[\s\S]*?>[\s\S]*?CONTECH Tickets[\s\S]*?<\/h1>[\s\S]*?<p[\s\S]*?>[\s\S]*?<\/p>[\s\S]*?<\/div>/
];

// New banner header
const newBannerHeader = `{/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden shadow-vintage mb-8">
        <img
          src="/images/pages/jira-header.png"
          alt="CONTECH Tickets"
          className="w-full h-48 md:h-64 object-cover"
          onError={(e) => e.target.style.display = 'none'}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cream opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <h1 className="text-5xl md:text-6xl font-poster text-vintage-text text-letterpress drop-shadow-lg mb-2">
            CONTECH Tickets
          </h1>
          <p className="text-lg text-vintage-text drop-shadow-md">
            Your active CONTECH tickets (excluding Done)
          </p>
        </div>
      </div>`;

// Try each pattern
let replaced = false;
for (const pattern of oldHeaderPatterns) {
  if (pattern.test(jiraContent)) {
    jiraContent = jiraContent.replace(pattern, newBannerHeader);
    replaced = true;
    console.log('✅ Header section replaced with banner!');
    break;
  }
}

if (!replaced) {
  console.error('❌ Error: Could not find header section to replace.');
  console.error('The Jira page structure may have changed.');
  console.error('\nManual steps:');
  console.error('  1. Open: packages/client/src/pages/Jira.jsx');
  console.error('  2. Find the "Hero Header" section');
  console.error('  3. Replace it with the banner code from JIRA_BANNER_GENERATION.md');
  process.exit(1);
}

// Write the updated file
fs.writeFileSync(jiraPagePath, jiraContent, 'utf8');

console.log('✅ Jira page updated successfully!\n');
console.log('📁 Updated file:', jiraPagePath);
console.log('🖼️  Banner image:', bannerPath);
console.log('\n🎉 Done! Refresh your browser to see the new banner.');
console.log('\nThe banner will display:');
console.log('  - Full-width landscape image (1920x600px)');
console.log('  - Responsive height (h-48 on mobile, h-64 on desktop)');
console.log('  - Text overlay at the bottom');
console.log('  - Gradient fade for better text readability');
