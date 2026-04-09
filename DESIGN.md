# Design System Documentation

## Theme Overview

This document outlines the core design principles and token values that define the aesthetic and functional characteristics of our digital products.

### Color Palette

Our color palette is built on a `light` mode foundation, using a `monochrome` variant derived from a `#000000` seed color.

- **Primary Color:** `#000000` - Used for primary actions, critical information, and main branding elements.
- **Secondary Color:** `#1f2937` - Supports the primary color for less prominent actions, secondary navigation, and important data.
- **Tertiary Color:** `#4b5563` - Provides an additional accent for highlights, badges, or decorative elements.
- **Neutral Color:** `#f3f4f6` - The foundational color for backgrounds, surfaces, and non-chromatic UI components.

### Typography

Our typography system uses a carefully selected set of fonts to ensure readability and maintain brand consistency across all touchpoints.

- **Headlines:** `manrope` - Chosen for its modern and clean appearance, ideal for impactful headlines.
- **Body Text:** `inter` - A highly legible and versatile font, perfect for general body text.
- **Labels:** `inter` - Consistent with body text for clarity in UI labels and interactive elements.

### Shape and Form

The visual characteristics of our UI components are defined by their roundedness and spacing.

- **Roundedness:** `1` (Subtle roundedness) - Applies a subtle level of corner rounding, giving UI elements a softer, yet still defined appearance.
- **Spacing:** `2` (Normal) - Establishes a comfortable and standard amount of whitespace within and between UI elements, ensuring good readability and visual organization.
- **Shadows:** `None` - We do not use box-shadows or drop-shadows. Depth is achieved through glassmorphism and contrasting borders.

### Effects & Glassmorphism

Our interface uses pure glassmorphism to create a premium, futuristic feel.

- **Glass Panels:** White background at `40%` opacity with a `24px` backdrop blur.
- **Borders:** Subtle `1px` solid borders with variable opacity (`10%` to `40%`) provide definition without artificial depth.
- **Transitions:** All decorative elements use smooth, light-based interactions.
