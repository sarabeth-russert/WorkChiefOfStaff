# Character Illustrations Setup Guide

## 🎨 Overview

This guide will help you generate and integrate vintage SEA-style character illustrations for your 6 agents, replacing the emoji icons with custom artwork.

---

## Step 1: Generate the Images

Use an AI image generator (DALL-E, Midjourney, etc.) with the prompts below. Generate images with these specifications:

### Image Specifications
- **Format:** PNG with transparent background (preferred) or JPG
- **Size:** 512x512px minimum (square format)
- **Style:** Consistent across all 6 characters
- **Background:** Either transparent or matching vintage cream/aged paper color

### Generation Prompts

#### Explorer 🗺️
```
Vintage 1950s adventure portrait of a friendly explorer character in SEA Society of Explorers and Adventurers style. Character wearing khaki safari outfit with compass and map tools. Warm color palette with terracotta, sand, and jungle green tones. Retro illustrated poster aesthetic, hand-drawn style, friendly approachable face, standing confidently with hands on hips. Background shows faint map lines. Art style: vintage Disney Adventureland poster, clean lines, warm lighting, professional character design.
```

**Save as:** `explorer.png`

---

#### Trader 💰
```
Vintage 1950s merchant character portrait in SEA Society of Explorers and Adventurers style. Character wearing vest with many pockets, holding ledger book and compass. Warm color palette with mustard, terracotta, and sand tones. Retro illustrated poster aesthetic, hand-drawn style, clever knowing expression, standing with one hand gesturing. Background shows cargo crates and trade goods. Art style: vintage Disney Adventureland poster, clean lines, warm lighting, professional character design.
```

**Save as:** `trader.png`

---

#### Navigator 🧭
```
Vintage 1950s ship navigator character portrait in SEA Society of Explorers and Adventurers style. Character wearing captain's jacket with brass buttons, holding navigation tools and compass. Warm color palette with teal, jungle green, and cream tones. Retro illustrated poster aesthetic, hand-drawn style, confident precise expression, standing at attention with nautical gear. Background shows ship's wheel and navigation charts. Art style: vintage Disney Adventureland poster, clean lines, warm lighting, professional character design.
```

**Save as:** `navigator.png`

---

#### Archaeologist 🏺
```
Vintage 1950s archaeologist character portrait in SEA Society of Explorers and Adventurers style. Character wearing field researcher outfit with brush and magnifying glass, holding ancient artifact. Warm color palette with burgundy, sand, and terracotta tones. Retro illustrated poster aesthetic, hand-drawn style, scholarly patient expression, kneeling examining discoveries. Background shows archaeological dig site with pottery. Art style: vintage Disney Adventureland poster, clean lines, warm lighting, professional character design.
```

**Save as:** `archaeologist.png`

---

#### Scout 🔭
```
Vintage 1950s scout character portrait in SEA Society of Explorers and Adventurers style. Character wearing adventure gear with binoculars and telescope, alert watchful pose. Warm color palette with sunset orange, jungle green, and sand tones. Retro illustrated poster aesthetic, hand-drawn style, keen alert expression, standing with hand shading eyes looking into distance. Background shows mountain peaks and horizon. Art style: vintage Disney Adventureland poster, clean lines, warm lighting, professional character design.
```

**Save as:** `scout.png`

---

#### Guide 📖
```
Vintage 1950s guide character portrait in SEA Society of Explorers and Adventurers style. Character wearing professor's outfit with guidebook and teaching pointer, friendly welcoming gesture. Warm color palette with cream, terracotta, and teal tones. Retro illustrated poster aesthetic, hand-drawn style, warm friendly expression, standing with open arms welcoming. Background shows books and maps. Art style: vintage Disney Adventureland poster, clean lines, warm lighting, professional character design.
```

**Save as:** `guide.png`

---

## Step 2: Place Generated Images

Once you've generated the images, place them in:

```
/packages/client/public/images/characters/
```

File structure should look like:
```
packages/client/public/images/characters/
├── explorer.png
├── trader.png
├── navigator.png
├── archaeologist.png
├── scout.png
└── guide.png
```

---

## Step 3: Code Integration (Already Prepared)

The code has been updated to automatically use these images when available, with emoji fallbacks.

### What's Been Updated:
- ✅ `AgentCard.jsx` - Now displays images with proper styling
- ✅ `AgentFactory.js` - Added image paths to agent data
- ✅ `Expedition.jsx` - Updated to show character images
- ✅ Fallback system - Emojis still work if images aren't present

---

## Image Generation Services

### Option 1: DALL-E 3 (OpenAI)
- Go to: https://platform.openai.com/playground
- Or use ChatGPT Plus: https://chat.openai.com (GPT-4 with DALL-E)
- Paste prompts above
- Download 1024x1024 or 512x512 images

### Option 2: Midjourney
- Join: https://www.midjourney.com
- Use Discord bot
- Format: `/imagine prompt: [paste prompt above]`
- Download square format

### Option 3: Adobe Firefly
- Go to: https://firefly.adobe.com
- Use "Text to Image"
- Paste prompts
- Download PNG

### Option 4: Stable Diffusion
- Use: https://stablediffusionweb.com
- Or install locally
- Paste prompts
- Generate and download

---

## Tips for Best Results

### Consistency Tips:
1. **Generate all 6 at once** in the same session for style consistency
2. **Use the same AI service** for all characters
3. **Keep the same seed** (if your tool supports it)
4. **Request same aspect ratio** (square, 1:1)

### Style Refinements:
- Add `--style raw` (Midjourney) for less stylized results
- Specify `flat color illustration` if too realistic
- Add `no shadows` if backgrounds are too dark
- Try `vintage poster art` or `retro character design` if style isn't matching

### After Generation:
- **Optimize images**: Use https://tinypng.com to reduce file size
- **Remove backgrounds**: Use https://remove.bg if needed
- **Ensure consistency**: All should have similar lighting and color tone

---

## Verification

After adding images, visit:
- **http://localhost:5555/expedition** - See agents with new illustrations
- **http://localhost:5555/** - Dashboard should show character cards

Images should:
- ✅ Load smoothly without delays
- ✅ Match the vintage Adventureland aesthetic
- ✅ Be clearly visible against the cream/canvas backgrounds
- ✅ Have consistent style across all 6 characters

---

## Troubleshooting

### Images not showing?
1. Check file names match exactly: `explorer.png`, `trader.png`, etc.
2. Ensure files are in: `/packages/client/public/images/characters/`
3. Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Check browser console for 404 errors

### Style doesn't match?
- Regenerate with more specific style keywords
- Try adding: "in the style of vintage Disney attraction posters"
- Reference specific Disney parks artwork: "like Jungle Cruise poster art"

### Images too large?
- Optimize at https://tinypng.com
- Or resize to 512x512px using any image editor
- Target: Under 200KB per image

---

## Alternative: Placeholder Images

If you want to test the system before generating final artwork, you can:

1. Use temporary placeholder images from https://placeholder.com
2. Or keep the emoji system (it will fallback automatically)
3. Generate simple shapes in Figma/Canva as placeholders

---

## Need Help?

If you have issues:
1. Check that all 6 image files exist in the correct folder
2. Verify file names are lowercase and match exactly
3. Ensure images are valid PNG/JPG format
4. Try regenerating with adjusted prompts if style doesn't match

The system is set up to gracefully handle missing images - emojis will show until you add the illustrations!

---

Ready to generate your character art! 🎨
