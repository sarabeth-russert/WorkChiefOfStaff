# Morning Briefing Icons - AI Generation Guide

## Overview

This guide provides prompts for generating 3 new vintage-style icon illustrations for the redesigned Dashboard morning briefing. These icons fill gaps in the existing dashboard icon set.

---

## Image Specifications

- **Format**: PNG with transparent background
- **Size**: 512x512 pixels (square)
- **Style**: Vintage 1950s-60s Disney Adventureland / SEA (Society of Explorers and Adventurers)
- **Color Palette**: Warm earth tones matching the Adventureland theme
  - Sand: `#E8D4A8`
  - Terracotta: `#D4735E`
  - Jungle: `#4A7859`
  - Sunset: `#E87144`
  - Teal: `#479B99`
  - Mustard: `#DAA520`
  - Burgundy: `#8B3A3A`
  - Cream: `#FFF8E7`

---

## New Icons (3 Icons)

### 1. Trail Notes Icon (`trail-notes.png`)

**Purpose**: Represents carry-forward notes from evening retro, today's plan, and recent accomplishments
**Section**: "Trail Notes" card in the right column of the morning briefing
**Emoji Fallback**: Notebook

**Prompt**:
```
Create a vintage 1950s-60s icon showing a worn leather-bound explorer's field journal with a pencil tucked into the spine, a bookmark ribbon hanging from the bottom, and a pressed tropical leaf visible between the pages. The journal has a compass rose embossed on the cover and sits on a weathered wooden surface with a few loose handwritten notes beside it. Vintage Disney Adventureland poster style with warm earth tones (mustard, terracotta, jungle green, cream). Flat illustration, hand-drawn aesthetic, retro poster art. Square format 512x512px with transparent background. Style: SEA (Society of Explorers and Adventurers) expedition journal emblem.
```

**Alternative Prompt** (Simpler):
```
Vintage 1950s icon of a leather explorer's journal with a pencil and bookmark ribbon. A pressed leaf peeks from the pages. Warm earth tones (mustard #DAA520, terracotta #D4735E, jungle green #4A7859, cream #FFF8E7). Retro illustrated style, hand-drawn appearance, flat colors. Square 512x512px, transparent background. Field journal emblem inspired by Disney Adventureland and Indiana Jones.
```

---

### 2. Medic Icon (`medic.png`)

**Purpose**: Quick action link to the Medic Station (detailed wellness vitals page)
**Section**: "Base Camp" quick actions card in the morning briefing
**Emoji Fallback**: Hospital

**Prompt**:
```
Create a vintage 1950s-60s icon showing an expedition first-aid kit or field medic's bag in worn leather with a red cross emblem on the front. Around the bag, include vintage apothecary bottles with cork stoppers, rolled bandages, and a small brass mortar and pestle. The scene evokes a 1930s jungle expedition medical station. Vintage Disney Adventureland poster style with warm earth tones (burgundy, terracotta, teal, cream). Flat illustration, hand-drawn aesthetic, retro poster art. Square format 512x512px with transparent background. Style: SEA (Society of Explorers and Adventurers) medic station emblem.
```

**Alternative Prompt** (Simpler):
```
Vintage 1950s icon of a leather expedition first-aid bag with a red cross, surrounded by small apothecary bottles and bandages. Warm earth tones (burgundy #8B3A3A, terracotta #D4735E, teal #479B99, cream #FFF8E7). Retro illustrated style, hand-drawn appearance, flat colors. Square 512x512px, transparent background. Safari medic emblem inspired by Disney's Society of Explorers.
```

---

### 3. Morning Standup Icon (`morning-standup.png`)

**Purpose**: Highlighted action link prompting the user to start their morning standup session
**Section**: "Base Camp" quick actions card, shown when standup hasn't been completed yet
**Emoji Fallback**: Sunrise

**Prompt**:
```
Create a vintage 1950s-60s icon showing a golden sunrise breaking over a jungle treeline with the warm glow illuminating an expedition camp below. In the foreground, a steaming enamel coffee cup sits on a wooden supply crate next to an unrolled map and a lit brass lantern. The mood is dawn anticipation, the start of a new day's adventure. Vintage Disney Adventureland poster style with warm earth tones (sunset orange, mustard gold, jungle green, cream). Flat illustration, hand-drawn aesthetic, retro poster art. Square format 512x512px with transparent background. Style: SEA (Society of Explorers and Adventurers) morning briefing emblem.
```

**Alternative Prompt** (Simpler):
```
Vintage 1950s icon of a golden sunrise over a jungle camp with a steaming coffee cup on a crate and a brass lantern glowing beside it. Warm earth tones (sunset orange #E87144, mustard #DAA520, jungle green #4A7859, cream #FFF8E7). Retro illustrated style, hand-drawn appearance, flat colors. Square 512x512px, transparent background. Morning adventure emblem inspired by Disney Adventureland.
```

---

## Generation Tips

### For Best Results:
1. **Use both prompts**: Try both the detailed and simplified versions
2. **Iterate**: Generate multiple variations and pick the best
3. **Consistency**: Compare against existing icons (`wellness.png`, `calendar.png`, `base-camp.png`) to match the visual family
4. **Color harmony**: Use the specified color palette to match the Adventureland theme
5. **Transparent backgrounds**: Ensure PNGs have transparent backgrounds for overlay on cards

### Recommended AI Tools:
- **Midjourney**: Best for vintage poster aesthetics
- **DALL-E 3**: Good for clean, controlled results
- **Stable Diffusion**: More control over style

### Style Keywords to Emphasize:
- "Vintage 1950s-60s"
- "Disney Adventureland poster style"
- "SEA (Society of Explorers and Adventurers)"
- "Hand-drawn aesthetic"
- "Flat illustration"
- "Retro poster art"
- "Warm earth tones"

---

## File Naming Convention

Save all generated icons in `/packages/client/public/images/dashboard/` with these exact names:

- `trail-notes.png` - Trail Notes (retro carry-forward, today's plan, recent wins)
- `medic.png` - Medic Station quick action link
- `morning-standup.png` - Morning Standup prompt action link

**Total**: 3 unique icons to generate

---

## After Generation

Once you've generated all 3 icons:

1. **Save to directory**: Place all PNG files in `/packages/client/public/images/dashboard/`
2. **Verify images**: Ensure all are 512x512px with transparent backgrounds
3. **Test in UI**: The Dashboard `DashIcon` component will automatically display them (emoji fallbacks are already in place)
4. **Optimize** (optional): Use TinyPNG to reduce file sizes while maintaining quality

---

## Implementation

The Dashboard already references these images. The `DashIcon` component shows emoji fallbacks until the images are added:

```javascript
// Trail Notes card header
<DashIcon src="/images/dashboard/trail-notes.png" alt="Trail Notes" fallback="notebook emoji" size="w-10 h-10" />

// Morning Standup action link
<DashIcon src="/images/dashboard/morning-standup.png" alt="Standup" fallback="sunrise emoji" size="w-8 h-8" />

// Medic Station action link
<DashIcon src="/images/dashboard/medic.png" alt="Medic" fallback="hospital emoji" size="w-8 h-8" />
```

Drop the PNGs into the directory and they'll appear immediately on next page load.
