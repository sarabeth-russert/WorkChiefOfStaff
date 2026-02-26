# Quick Start: Jira Banner

## 🎯 Goal

Add a SEA-style vintage banner to match your existing Expedition/Trading Post/Map Room/Outpost page banners.

---

## ⚡ Quick Steps (5-10 min)

### Step 1: Generate Banner Image

Use **the same AI tool** you used for your other banners (Midjourney/DALL-E).

**Copy this prompt:**

```
Vintage 1950s expedition permit office and ticketing station illustration in SEA Society of Explorers and Adventurers style. Wide panoramic scene showing administrative office with wooden desk, expedition permits and tickets on desk, brass stamps and approval seals, clipboard with expedition roster, vintage typewriter, filing cabinets with labeled expedition folders. Warm color palette with teal, terracotta, and sand tones. Retro illustrated poster aesthetic, hand-drawn style, organized professional atmosphere. Background shows wooden paneled walls with expedition maps and permits posted. Art style: vintage Disney Adventureland attraction poster, clean lines, warm lighting, professional illustration. Landscape banner format, 1920x600 pixels.
```

**For Midjourney:** Add `--ar 16:5` at the end

**Size:** 1920x600px (landscape banner)

### Step 2: Save the Image

1. Download your generated banner
2. Rename to: `jira-header.png`
3. Save to: `/packages/client/public/images/pages/jira-header.png`

### Step 3: Run the Script

```bash
node scripts/add-jira-banner.js
```

This automatically updates Jira.jsx to use the banner!

### Step 4: Refresh Browser

Go to Jira page - banner is live! 🎉

---

## 🎨 Style Guide

**MUST match your existing banners:**
- ✅ SEA Society of Explorers and Adventurers style
- ✅ Vintage 1950s Disney Adventureland poster aesthetic
- ✅ Teal + Terracotta color palette
- ✅ Clean lines, warm lighting
- ✅ Professional illustration style
- ✅ 1920x600px landscape format

**Theme:** Expedition permit office (administrative, organized, professional)

---

## 📖 Need More Details?

See **JIRA_BANNER_GENERATION.md** for:
- Alternative prompts
- Color specifications
- Style consistency tips
- Troubleshooting

---

## 🆘 Quick Troubleshooting

**Style doesn't match:**
- Use the SAME AI service as your other banners
- Generate in same session if possible
- Emphasize "SEA style" in prompt

**Script says "Banner image not found":**
- Check file location: `packages/client/public/images/pages/jira-header.png`
- Must be exact spelling (lowercase)

**Banner doesn't show:**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check browser console for errors

---

## 🎯 What You'll Get

A banner that matches your existing style with:
- Expedition permit office scene
- Wooden desk with tickets and stamps
- Teal + terracotta colors
- SEA vintage poster aesthetic
- "CONTECH Tickets" text overlaid at bottom

Perfect consistency with your Expedition, Trading Post, Map Room, and Outpost banners! 🎫✨
