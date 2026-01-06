# Aesthetic Theme Documentation

## Color Palette

### Primary Colors
- **Primary (Jet Black)**: `#000000` - Absolute black, used for backgrounds and primary elements
- **Secondary/Accent (Orange)**: `#F8981E` - Vibrant orange accent, primary interactive color
- **Accent Gold**: `#FFD700` - Metallic gold for highlights, borders, and premium elements
- **Accent Pink**: `#FF1493` - Hot pink for special accents and gradients

### Text Colors
- **Text Dark**: `#1a1a1a` - Dark charcoal for light backgrounds
- **Text Light**: `#ffffff` - Pure white for dark backgrounds
- **Text Muted**: `rgba(244, 229, 212, 0.8)` - Warm beige/cream for secondary text

### Background Colors
- **Background Light**: `#1a1a1a` - Dark charcoal background
- **Background Dark**: `#000000` - Absolute black background
- **Glass Background**: `rgba(255, 255, 255, 0.1)` - Translucent white for glassmorphism

### Overlay & Glow Effects
- **Velvet Overlay**: `rgba(248, 152, 30, 0.8)` - Orange overlay with 80% opacity
- **Crimson Glow**: `rgba(248, 152, 30, 0.6)` - Orange glow effect
- **Gradient Overlays**: Multi-stop gradients combining black, orange, and gold

## Typography

### Font Families
- **Serif (Headings)**: `'Playfair Display'` - Elegant, sophisticated serif for titles
- **Sans-Serif (Body)**: `'Inter'` - Modern, clean sans-serif for body text
- **Elegant Serif (Forms)**: `'Cormorant Garamond'` - Refined serif for form labels and special text

### Typography Scale
- **Hero Title**: `clamp(3rem, 8vw, 6rem)` - Massive, responsive hero text
- **Section Titles**: `clamp(2rem, 5vw, 3.5rem)` - Large, responsive section headings
- **Body Text**: `1rem` (16px base) with `1.6` line height
- **Subtitle**: `clamp(1.2rem, 3vw, 1.8rem)` - Medium-large responsive text

### Typography Characteristics
- **Letter Spacing**: 
  - Uppercase text: `1-3px`
  - Body text: `0.3-0.5px`
- **Text Transform**: Uppercase for buttons, navigation, and accents
- **Font Weights**: 300 (light), 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)

## Visual Effects & Animations

### Glassmorphism
- **Backdrop Filter**: `blur(10px)` - Frosted glass effect
- **Background**: Semi-transparent overlays with blur
- **Border**: Subtle borders with accent colors

### Gradient Patterns
- **Primary Gradient**: `linear-gradient(135deg, #000000, #F8981E)` - Black to orange diagonal
- **Accent Gradient**: `linear-gradient(90deg, #F8981E, #FFD700)` - Orange to gold horizontal
- **Multi-Color Gradient**: `linear-gradient(45deg, #F8981E, #FF1493, #FFD700)` - Rotating rainbow effect

### Shadow & Glow Effects
- **Box Shadows**: 
  - Standard: `0 4px 15px rgba(248, 152, 30, 0.3)`
  - Hover: `0 6px 20px rgba(248, 152, 30, 0.4)`
  - Deep: `0 20px 60px rgba(248, 152, 30, 0.4)`
- **Text Shadows**: `0 4px 20px rgba(0, 0, 0, 0.5)` for depth
- **Glow Effects**: Rotating and pulsing glows on interactive elements

### Animations
- **Pulse Animation**: `pulse-seductive` - 3s infinite pulse with scale and glow
- **Rotate Glow**: `rotate-glow` - 2s infinite rotation for gradient borders
- **Sparkle Float**: `sparkle-float` - 20s floating particle effect
- **Fade In**: Staggered fade-in animations with delays (0s, 0.3s, 0.6s, 0.9s)
- **Reveal on Scroll**: Elements fade in and slide up when scrolled into view
- **Shimmer Effect**: Shimmer animation on buttons with gradient overlay

## Spacing System

### Spacing Scale
- **XS**: `0.5rem` (8px)
- **SM**: `1rem` (16px)
- **MD**: `2rem` (32px)
- **LG**: `4rem` (64px)
- **XL**: `6rem` (96px)

### Layout Spacing
- **Container Max Width**: `1200px` with `2rem` horizontal padding
- **Section Padding**: `6rem` vertical (top and bottom)
- **Grid Gaps**: `2rem` standard, `1rem` for tighter layouts

## Border Radius & Shapes

- **Buttons**: `50px` - Fully rounded (pill shape)
- **Cards**: `20px` - Large rounded corners
- **Form Inputs**: `16px` - Medium rounded corners
- **Small Elements**: `10px` - Subtle rounding
- **Circular Elements**: `50%` - Perfect circles for icons and buttons

## Interactive Elements

### Buttons
- **Primary Button**:
  - Background: Gradient from black to orange
  - Color: White text
  - Border Radius: 50px (pill shape)
  - Hover: Lift effect (`translateY(-2px)`) with enhanced shadow
  - Shimmer: Animated gradient overlay on hover
  - Pulsing: Continuous subtle pulse animation

- **Magnetic Button**:
  - Rotating gradient border on hover
  - Scale animation (1.05x)
  - Multi-color glow effect

- **Secondary Button**:
  - Transparent background
  - Colored border
  - Fill on hover

### Form Elements
- **Input Fields**:
  - Dark background (`#000000`)
  - Orange/gold border (`rgba(248, 152, 30, 0.4)`)
  - Gold focus glow
  - Lift effect on focus
  - Rounded corners (16px)

- **File Upload**:
  - Gradient background with gold border
  - Icon animation on hover
  - File name display with checkmark

### Cards
- **Platform Cards**:
  - Glassmorphism background
  - Subtle border with gold accent
  - Hover: Lift (`translateY(-10px)`) with enhanced glow
  - Icon scale animation on hover

## Background Patterns

### Image Overlays
- Background images with low opacity (0.2-0.5)
- Gradient overlays on top for depth
- Radial gradients for vignette effects
- Particle/sparkle effects with animated gradients

### Section Backgrounds
- **Hero**: Full viewport height with background image and gradient overlay
- **About**: Dark background with gradient overlay
- **Platforms**: Multi-gradient background with image overlay
- **Gallery**: Dark gradient with subtle image texture
- **Booking**: Orange-to-black gradient with background image

## Transitions

- **Fast**: `0.2s ease` - Quick interactions
- **Normal**: `0.3s ease` - Standard transitions
- **Slow**: `0.5s ease` - Smooth, deliberate animations

## Design Philosophy

### Overall Aesthetic
- **Luxury & Seduction**: Dark, moody backgrounds with vibrant orange/gold accents
- **Elegance**: Serif typography for sophistication
- **Modern**: Clean sans-serif body text and glassmorphism effects
- **Premium**: Gold accents and metallic effects
- **Dramatic**: High contrast, deep shadows, glowing effects

### Visual Hierarchy
1. **Hero Section**: Full viewport, massive typography, dramatic background
2. **Content Sections**: Dark backgrounds with light text, generous spacing
3. **Interactive Elements**: Vibrant orange/gold with hover effects
4. **Forms**: Dark theme with gold accents, elegant typography

### Mood & Atmosphere
- **Mysterious**: Dark backgrounds with selective lighting
- **Luxurious**: Gold accents and premium materials feel
- **Seductive**: Smooth animations and glowing effects
- **Sophisticated**: Elegant typography and refined spacing
- **Modern**: Glassmorphism and contemporary design patterns

## Responsive Design

### Breakpoints
- **Mobile**: `max-width: 480px` - Compact spacing, single column
- **Tablet**: `481px - 768px` - Adjusted layouts, maintained aesthetics
- **Desktop**: `769px+` - Full multi-column layouts

### Responsive Adjustments
- Typography scales with viewport (`clamp()` functions)
- Grid layouts collapse to single column on mobile
- Spacing reduces proportionally
- Carousel controls reposition for mobile
- Forms stack vertically on smaller screens

## Special Effects

### Particle Effects
- Sparkle particles in hero section
- Animated radial gradients
- Floating particle animations

### Lightbox
- Full-screen overlay with blur
- Rotating gradient background
- Gold-accented navigation buttons
- Smooth image transitions

### Navigation
- Transparent to solid on scroll
- Smooth backdrop blur transition
- Underline animation on hover
- Mobile slide-in menu

## Key Visual Patterns

1. **Dark Base**: Black/dark charcoal as foundation
2. **Orange Accent**: Vibrant orange for primary interactions
3. **Gold Highlights**: Metallic gold for premium elements
4. **Gradient Overlays**: Multi-stop gradients for depth
5. **Glass Effects**: Translucent elements with blur
6. **Glow Effects**: Pulsing and rotating glows
7. **Smooth Animations**: Eased transitions throughout
8. **Elegant Typography**: Serif for headings, sans for body
9. **Generous Spacing**: Large padding and margins
10. **Rounded Corners**: Soft, modern shapes



