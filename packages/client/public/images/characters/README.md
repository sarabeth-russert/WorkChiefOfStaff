# Character Illustrations

This directory contains the character illustrations for your 6 AI agents.

## Required Files

Place your generated character images here:

- `explorer.png` - Explorer agent (🗺️ curious code discoverer)
- `trader.png` - Trader agent (💰 pragmatic dependency manager)
- `navigator.png` - Navigator agent (🧭 precise Git operations)
- `archaeologist.png` - Archaeologist agent (🏺 patient knowledge retriever)
- `scout.png` - Scout agent (🔭 alert testing specialist)
- `guide.png` - Guide agent (📖 friendly onboarding mentor)

## Image Specifications

- **Format:** PNG (transparent background preferred) or JPG
- **Size:** 512x512px minimum (square/1:1 aspect ratio)
- **Style:** Vintage SEA (Society of Explorers and Adventurers) aesthetic
- **Color palette:** Warm earth tones matching the Adventureland theme

## How It Works

The system will:
1. ✅ Try to load the image from `/images/characters/{agent-type}.png`
2. ✅ Show the emoji icon if the image doesn't exist or fails to load
3. ✅ Display images at 80x80px (w-20 h-20) on agent cards

## Generation Prompts

See `/CHARACTER_IMAGES_SETUP.md` in the root directory for detailed AI image generation prompts for each character.

## Testing

After adding images:
1. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)
2. Visit http://localhost:5555/expedition
3. Agent cards should show your illustrations
4. Check browser console for any 404 errors

## Current Status

🎨 System is ready - just add your PNG files here!

Until you add images, the emoji icons will display as fallbacks.
