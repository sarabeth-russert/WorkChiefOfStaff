# Jira Banner Image Generation Guide

## 🎫 Concept

A vintage 1950s Adventureland-style hero banner for the Jira/CONTECH tickets page in the **SEA (Society of Explorers and Adventurers)** aesthetic, matching your existing page banners.

---

## Image Specifications

### Technical Requirements
- **Format:** PNG with transparent or cream background
- **Size:** 1920x600px (landscape banner format)
- **Alternative:** 1200x400px (for smaller displays)
- **File location:** `/packages/client/public/images/pages/jira-header.png`
- **Style:** **MUST match existing Expedition/Trading Post/Map Room/Outpost banners**

### Visual Style
- **Era:** 1950s SEA Society of Explorers and Adventurers
- **Theme:** Expedition permit office and ticketing station
- **Colors:** Teal + Terracotta (primary) with sand accents
- **Style:** Vintage Disney Adventureland attraction poster, clean lines, warm lighting

---

## 🎨 Main Generation Prompt

### Full Scene (Recommended - Matches Your Other Banners)

```
Vintage 1950s expedition permit office and ticketing station illustration in SEA Society of Explorers and Adventurers style. Wide panoramic scene showing administrative office with wooden desk, expedition permits and tickets on desk, brass stamps and approval seals, clipboard with expedition roster, vintage typewriter, filing cabinets with labeled expedition folders. Warm color palette with teal, terracotta, and sand tones. Retro illustrated poster aesthetic, hand-drawn style, organized professional atmosphere. Background shows wooden paneled walls with expedition maps and permits posted. Art style: vintage Disney Adventureland attraction poster, clean lines, warm lighting, professional illustration. Landscape banner format, 1920x600 pixels.
```

**Save as:** `jira-header.png`

---

## 🎨 Alternative Prompts

### Minimalist Version (Cleaner, Matches Style Guide Alternative)

```
Vintage 1950s expedition tickets and permits still life illustration, SEA style. Wooden desk surface with stacked admission tickets, expedition permits, brass approval stamps, ledger book, vintage fountain pen. Warm teal and terracotta tones. Retro illustrated aesthetic, organized flat lay composition. Art style: vintage administrative poster, clean lines, landscape banner format.
```

### Overhead Desk View

```
Vintage 1950s expedition office desk illustration, SEA style. Top-down view of organized wooden desk with expedition permits, admission tickets with perforated edges, brass stamp reading "APPROVED", clipboard with roster, compass, expedition logs. Warm color palette with teal, terracotta, sand. Retro illustrated aesthetic. Art style: vintage Disney Adventureland poster, clean lines, warm lighting, landscape banner format, 1920x600 pixels.
```

---

## 🎨 Color Palette (Jira Page Theme)

Match this exactly to ensure consistency with other pages:

- **Primary:** Teal `#479B99`
- **Secondary:** Terracotta `#D4735E`
- **Accent:** Sand `#E8D4A8`
- **Background:** Cream `#FFF8E7`
- **Text:** Vintage Brown `#3A3226`

---

## 📁 File Structure

Place generated image in:
```
/packages/client/public/images/pages/
├── expedition-header.png (existing)
├── trading-post-header.png (existing)
├── map-room-header.png (existing)
├── outpost-header.png (existing)
└── jira-header.png (NEW)
```

---

## 🎯 Style Consistency Guidelines

### MUST Include (to match existing banners):
- "SEA Society of Explorers and Adventurers style"
- "vintage 1950s"
- "retro illustrated poster aesthetic"
- "hand-drawn style"
- "vintage Disney Adventureland attraction poster"
- "clean lines, warm lighting"
- "professional illustration"
- "1920x600 pixels" or "landscape banner format"

### Color Guidelines:
- **Jira:** Teal + Terracotta (like Map Room's color scheme)
- Keep warm, inviting atmosphere
- Cream background for consistency
- No bright or neon colors

### Composition Guidelines:
- **Wide panoramic scene** (preferred) OR **organized flat lay**
- Foreground, mid-ground, background depth
- Warm afternoon/golden hour lighting
- No people or faces
- Professional, organized feeling

---

## 🖼️ Generation Steps

### Step 1: Choose AI Service

Use the **same AI service** you used for your other banners:
- **Midjourney** (best for consistency)
- **DALL-E 3** (via ChatGPT Plus)
- **Stable Diffusion** (free option)

### Step 2: Generate Image

1. Copy the main prompt above
2. Paste into your AI service
3. For Midjourney, add: `--ar 16:5` (ensures correct aspect ratio)
4. Generate variations if needed

### Step 3: Select Best Version

Choose the version that:
- ✅ Matches your other banners' style
- ✅ Has correct colors (teal + terracotta)
- ✅ Shows clear depth (foreground/background)
- ✅ Has warm, professional lighting
- ✅ Feels organized and administrative

### Step 4: Save and Install

1. Download as PNG
2. Rename to: `jira-header.png`
3. Save to: `/packages/client/public/images/pages/jira-header.png`
4. Run: `node scripts/add-jira-banner.js`
5. Refresh browser

---

## 💡 Pro Tips for Style Matching

### To Match Your Existing Banners:

1. **Generate in same AI session** as your other banners (if possible)
2. **Use similar prompt structure** - notice how it matches Expedition/Trading Post format
3. **Keep same lighting** - warm afternoon glow
4. **Maintain visual hierarchy** - clear foreground, mid-ground, background
5. **Use teal prominently** - it's the signature color for Jira page

### If First Try Doesn't Match:

**Too cluttered:**
- Add: "organized", "clean composition", "professional"

**Wrong colors:**
- Emphasize: "warm color palette with teal #479B99, terracotta #D4735E, and sand #E8D4A8"

**Too modern:**
- Add: "1950s vintage", "retro illustrated", "SEA style"

**Wrong aspect ratio:**
- For Midjourney: add `--ar 16:5`
- For DALL-E: specify "wide landscape banner, 1920x600 pixels"

---

## 🔍 Visual Comparison

Your existing banners have:
- **Expedition:** Panoramic jungle scene with explorer gear
- **Trading Post:** Marketplace with cargo and trade goods
- **Map Room:** Cartography room with maps and globes
- **Outpost:** Command center with field equipment

**Your Jira banner should have:**
- **Jira:** Administrative office with permits, tickets, stamps
- Same warm lighting and professional illustration style
- Teal + terracotta color scheme (like Map Room)
- Organized, clean composition
- SEA aesthetic throughout

---

## ✅ Quick Checklist

Before using the image:

- [ ] Generated with SEA style keywords
- [ ] Correct dimensions (1920x600px landscape)
- [ ] PNG format with cream/transparent background
- [ ] Colors: Teal + Terracotta + Sand
- [ ] Matches style of existing banners
- [ ] Professional, organized aesthetic
- [ ] No people or modern elements
- [ ] File named: `jira-header.png`
- [ ] Placed in: `/packages/client/public/images/pages/`
- [ ] Optimized file size (under 500KB)

---

## 🚀 Installation

### Automatic (Recommended)

```bash
node scripts/add-jira-banner.js
```

This will automatically update Jira.jsx to use the banner.

### Manual (if script fails)

Edit `/packages/client/src/pages/Jira.jsx`:

Replace the header section with:

```jsx
{/* Hero Banner */}
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
      Jira Tickets
    </h1>
    <p className="text-lg text-vintage-text drop-shadow-md">
      Your active Content Technology tickets
    </p>
  </div>
</div>
```

---

## 📊 Size & Performance

### Recommended:
- Generate at 1920x600px
- Optimize to under 500KB
- Use PNG format

### Optimization:
```bash
# Using ImageMagick (optional)
convert jira-header.png -quality 85 -strip jira-header.png
```

Or use online tools:
- https://tinypng.com
- https://squoosh.app

---

## 🎉 Summary

**Key Points:**
1. Use the **main prompt** for best results
2. Emphasize **SEA style** and **teal + terracotta colors**
3. Match the **style of your existing banners**
4. Save as **jira-header.png** in pages folder
5. Run the **add-jira-banner.js** script

**Result:** Professional expedition permit office banner that perfectly matches your existing page banners! 🎫✨
