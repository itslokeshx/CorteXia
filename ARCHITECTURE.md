# CorteXia Architecture & Design System

## Design Philosophy

CorteXia embodies four core design principles that inform every decision:

1. **Surgical Precision** - Every pixel is intentional and justified. No wasted space, no clutter.
2. **Calm Authority** - Like Claude.ai, sophisticated yet approachable. Professional without intimidation.
3. **Invisible Until Needed** - Information hides until requested. Progressive disclosure of complexity.
4. **Truth Over Decoration** - Colors convey meaning. Data determines design, not aesthetics.

## Visual Hierarchy

### Color System

#### Semantic State Colors
These colors carry meaning across the entire application and remain consistent in light and dark modes:

```
✓ Momentum (Success)     #10B981 (Green)
→ On Track (Neutral)     #3B82F6 (Blue)
◆ Strategic (Planning)   #8B5CF6 (Purple)
⚠ Drifting (Warning)    #F59E0B (Amber)
✗ Overloaded (Danger)   #EF4444 (Red)
⛔ Burnout (Critical)    #DC2626 (Dark Red)
```

#### Domain Colors
Used for categorization and organization:

```
⏱ Time         #F59E0B
🧠 Focus       #8B5CF6
🔄 Habits      #10B981
🎯 Goals       #3B82F6
💸 Money       #EC4899
📚 Study       #06B6D4
📱 Screen      #EF4444
⚡ Energy      #FBBF24
```

#### Neutral Palette

**Light Mode**:
- Background Primary:   `#FFFFFF` (Main canvas)
- Background Secondary: `#F8F9FA` (Cards, inputs)
- Background Tertiary:  `#F0F1F3` (Hover states)
- Border:               `#E5E7EB` (Lines, dividers)
- Text Primary:         `#0A0B0D` (Headlines)
- Text Secondary:       `#4B5563` (Body text)
- Text Tertiary:        `#9CA3AF` (Metadata)

**Dark Mode**:
- Background Primary:   `#0A0B0D` (Main canvas)
- Background Secondary: `#151618` (Cards, inputs)
- Background Tertiary:  `#1F2023` (Hover states)
- Border:               `#2A2B2E` (Lines, dividers)
- Text Primary:         `#F9FAFB` (Headlines)
- Text Secondary:       `#D1D5DB` (Body text)
- Text Tertiary:        `#6B7280` (Metadata)

### Typography

**Font Stack**:
- Headings & Body: Inter Variable (system-ui fallback)
- Monospace: Geist Mono (SF Mono fallback)

**Type Scale**:
```
Text XS:  0.75rem / 12px  (Metadata, labels)
Text SM:  0.875rem / 14px (Body secondary)
Text Base: 1rem / 16px    (Body primary)
Text LG:  1.125rem / 18px (Emphasis, large labels)
Text XL:  1.25rem / 20px  (Section headers)
Text 2XL: 1.5rem / 24px   (Card titles)
Text 3XL: 1.875rem / 30px (Life state label)
Text 4XL: 2.25rem / 36px  (Page headers)
Text 5XL: 3rem / 48px     (Dramatic moments)
```

**Font Weights**:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Spacing System

8px baseline grid ensures consistency and scalability:

```
1x = 8px      (Tight spacing within components)
2x = 16px     (Standard component padding)
3x = 24px     (Between sections)
4x = 32px     (Card padding)
6x = 48px     (Major spacing)
8x = 64px     (Section dividers)
10x = 80px    (Header/footer height)
15x = 120px   (AI Strip height, large sections)
```

### Layout Dimensions

```
Header Height:         64px (fixed top)
Sidebar Width:         240px (collapsible to 64px)
Content Max Width:     1440px
Content Padding:       32px
Card Border Radius:    12px
Button Height:         40px (standard)
Input Height:          44px
Minimum Breathing:     40% empty space
Signal Card Size:      96x96px
Orbital Radius:        200px
```

## Component Architecture

### Layout Layer

**Header** (`/components/layout/header.tsx`)
- Fixed top bar (64px)
- Logo with gradient background
- Quick Add universal input bar
- Theme toggle and settings access
- Responsive collapse behavior

**Sidebar** (`/components/layout/sidebar.tsx`)
- Fixed left navigation (240px collapsible)
- 9 main navigation items with icons
- Active state indication with left border
- Collapse toggle for icon-only view
- Keyboard navigation support

**AppLayout** (`/components/layout/app-layout.tsx`)
- Wraps all main pages
- Manages header + sidebar + main spacing
- Responsive margin adjustments
- Content centering with max-width

### Dashboard Components

**LifeStateCore** (`/components/dashboard/life-state-core.tsx`)
- Central life state display (480px max-width)
- 4 life states with distinct colors
- Breathing animation on idle
- Interactive state switching
- Score display with metadata

**SignalConstellation** (`/components/dashboard/signal-constellation.tsx`)
- 8 signals in orbital layout (200px radius)
- Status indicators (stable/warning/critical)
- Hover interactions with value display
- Smooth positioning animations
- Circular visual organization

**AIReasoningStrip** (`/components/dashboard/ai-reasoning-strip.tsx`)
- Fixed bottom bar (120px height)
- Gradient backdrop blur effect
- Why + What Next sections
- Action button with interaction
- Responsive content layout

### Page Structure

Each page follows a consistent pattern:

```
1. Header (title, description, CTA)
2. Stats Overview Cards (4-column grid)
3. Primary Content Sections
   - Charts and visualizations
   - Data tables and lists
   - Interactive elements
4. Supporting Information
5. Bottom spacing (for AI Strip visibility)
```

## Animation & Interaction

### Speed Tokens

```
--speed-instant:  0.1s   (Micro-interactions)
--speed-fast:     0.2s   (UI feedback)
--speed-base:     0.3s   (Standard animations)
--speed-slow:     0.5s   (Smooth transitions)
--speed-slower:   0.8s   (State changes)
```

### Easing Functions

```
--ease-in:        cubic-bezier(0.4, 0, 1, 1)      (Acceleration)
--ease-out:       cubic-bezier(0, 0, 0.2, 1)     (Deceleration)
--ease-in-out:    cubic-bezier(0.4, 0, 0.2, 1)   (Smooth)
--ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1) (Bounce)
```

### Key Animations

- **Page Enter**: fade + translateY(20px) / 0.5s ease-out
- **Card Reveal**: scale(0.95) + fade / 0.3s spring
- **Life State Transition**: color morph / 0.8s ease-in-out
- **Breathing**: scale(1→1.02) / 4s infinite ease-in-out
- **Success Pulse**: scale(1→1.05→1) / 0.4s spring

## Responsive Design

### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Behavior

- Sidebar collapses to bottom nav (56px)
- Content padding reduces to 16px
- Charts stack vertically
- 2-column grids become single column
- Full-width cards and inputs

## Accessibility

- Semantic HTML throughout
- ARIA labels for interactive elements
- Color not sole indicator of meaning
- Sufficient color contrast (WCAG AA)
- Keyboard navigation support
- Focus indicators on all interactive elements
- Screen reader optimized

## Component Library

Using shadcn/ui with custom theming:
- Button (variants: default, outline, ghost)
- Card (header, content sections)
- Input (text, number, date)
- Checkbox (custom styled)
- Select (dropdowns)
- Badge (status, tags)
- Dialog (modals)
- Tabs (section navigation)

## Data Visualization

Using Recharts for charts:
- BarChart (time distribution, spending)
- LineChart (trends over time)
- PieChart (category breakdown)
- HeatMap (streak visualization)

All charts use theme colors and responsive containers.

## Performance Considerations

- CSS variables for instant theme switching
- Minimal JavaScript animations (prefer CSS)
- Lazy loading for heavy components
- Optimized image assets
- Efficient color calculations
- No decorative animations during interaction

## Internationalization Ready

- All UI text in components (translation-ready)
- Number formatting (currency, percentages)
- Date formatting (day names, months)
- RTL-safe layout using flexbox

## Future Enhancements

- Component composition patterns
- Design token documentation
- Storybook for component showcase
- Figma design file export
- CSS-in-JS migration if needed
- Advanced animation library integration

---

This architecture ensures CorteXia remains maintainable, scalable, and visually cohesive as features expand.
