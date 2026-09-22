---
name: TripWise V2
description: 安静、个性化、以真实旅程为中心的旅行工作台
colors:
  journey-teal: "#176b75"
  moss-ink: "#17201e"
  mist-paper: "#f4f6f5"
  raised-paper: "#ffffff"
  sunset-coral: "#d9654f"
  muted-ink: "#5f6c68"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, PingFang SC, sans-serif"
    fontWeight: 720
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, sans-serif"
    fontSize: "16px"
rounded:
  control: "10px"
  surface: "12px"
  feature: "16px"
spacing:
  unit: "4px"
  control: "8px"
  section: "48px"
---

# Overview

**Creative North Star: “A quiet travel desk beside an open window.”** TripWise uses photographic travel moments as the emotional anchor and keeps the surrounding interface restrained. The product should feel personal and calm, never like an AI feature showroom.

**Key Characteristics:** real destination imagery, mist-white surfaces, lake teal actions, strong editorial scale, thin dividers, minimal elevation, and motion that explains state changes.

# Colors

Journey teal marks orientation and travel actions. Moss ink supplies primary contrast; mist paper keeps long planning sessions comfortable. Sunset coral is reserved for exceptional emphasis, never as a page-wide theme.

**The Scenic Color Rule.** Let photography carry visual variety; interface color remains quiet and functional.

# Typography

- **Display** (720, responsive 48–88px, .98 line height): first-viewport statements only.
- **Title** (710, responsive 32–54px, 1.05 line height): tool titles.
- **Body** (400, 16–19px, 1.55–1.6 line height): instructions and content, generally below 65ch.
- **Label** (620, 10–14px): controls and compact navigation.

**The System-Native Rule.** Use the platform font stack so Chinese and Latin text retain native metrics and fast rendering.

# Layout

Content uses a 1320px maximum canvas with fluid 16–56px gutters. Desktop navigation is a centered compact tool strip; below 768px it becomes a horizontally scrollable top rail. Spacing follows a 4/8px rhythm, with 48–88px between major groups.

# Elevation & Depth

Most hierarchy comes from tonal layering and dividers. Use the low ambient shadow only for functional raised surfaces such as maps, chat, modals, and toasts; content sections remain flat.

**The Flat-by-Default Rule.** A surface earns elevation only when it floats, overlays, or contains an independent tool.

# Shapes

Controls use 9–12px corners. Large photographic features stop at 16px. Pills are reserved for compact status or segmented controls; page sections are never floating rounded containers.

# Components

## Buttons

Primary buttons use moss ink with inverse text and 10px corners. Press feedback scales to .97 within 120ms. Focus uses a visible teal ring; hover is only applied on fine pointers.

## Inputs / Fields

Fields use a raised surface, 1px neutral border, 10px corners, and a 3px translucent teal focus ring. Mobile inputs remain at least 16px to prevent viewport zoom.

## Navigation

Lucide outline icons and short labels share a 44px minimum target. Active state uses a raised paper surface rather than a bright brand fill. The mobile rail scrolls horizontally without trapping vertical scrolling.

## Scenic Hero

The scenic hero is TripWise's signature component: a real travel image, a readable directional shade, one literal planning action, and a small destination cue. It is never placed inside another card.

# Do's and Don'ts

## Do

- **Do** use real travel imagery to carry atmosphere.
- **Do** preserve 44px touch targets, visible focus, safe areas, and reduced-motion behavior.
- **Do** keep each tool screen focused on one primary action.

## Don't

- **Don't** return to purple gradients, decorative blobs, or emoji navigation.
- **Don't** nest cards or turn every section into a rounded floating panel.
- **Don't** animate content without a state or spatial relationship to explain.
