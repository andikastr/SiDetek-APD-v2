# Caldera.xyz UI/UX Design System Specification (`DESIGN.md`)

> **Document Type:** Comprehensive Design System & Frontend Recreation Spec  
> **Target Framework:** Next.js (App Router), Tailwind CSS, Framer Motion, Lucide Icons  
> **Target Website:** [caldera.xyz](https://caldera.xyz/) — *The Internet of Chains*

---

## 1. Design Overview & Vibe
* **Theme:** Web3 / Modular Blockchain Infrastructure (Dark-mode first).
* **Atmosphere:** Futuristic, sleek, modular, deep obsidian/slate canvas with fiery Caldera accents (vibrant electric orange, warm flame gradients, laser cyan highlights).
* **Layout Paradigm:** Centered maximum-width container (`max-w-7xl`), asymmetrical Bento Grid structures, pill-shaped floating action triggers, glassmorphic frosted cards, and infinite loop marquee carousels.

---

## 2. Design Tokens & Color Palette

### 2.1 Color Tokens

| Token Name | HEX / CSS Value | Description & Usage |
| :--- | :--- | :--- |
| **`bg-canvas`** | `#08080C` | Deepest root canvas / base dark background |
| **`bg-surface`** | `#0E0E14` | Primary card background, bento containers |
| **`bg-surface-elevated`** | `#161622` | Hovered cards, floating navbar, dialogs |
| **`border-subtle`** | `rgba(255, 255, 255, 0.08)` | Default borders, subtle separators |
| **`border-hover`** | `rgba(255, 255, 255, 0.20)` | Highlighted card borders on cursor hover |
| **`accent-orange`** | `#FF5520` | Brand primary, glowing elements, CTAs |
| **`accent-flame`** | `#FF8A3D` | Gradient stop, secondary warm orange tone |
| **`accent-cyan`** | `#00E5FF` | Secondary tech accent (interoperability / Metalayer) |
| **`text-primary`** | `#F3F4F6` | Primary headings and prominent numerical values |
| **`text-secondary`** | `#9CA3AF` | Supporting descriptions and card paragraphs |
| **`text-muted`** | `#6B7280` | Footers, timestamps, badges |

### 2.2 Gradients & Glow Effects

```css
/* Hero Ambient Glow */
background: radial-gradient(circle at 50% 35%, rgba(255, 85, 32, 0.18) 0%, rgba(8, 8, 12, 0) 70%);

/* Card Surface Glow Border */
background: linear-gradient(135deg, rgba(255, 85, 32, 0.15) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(0, 229, 255, 0.1) 100%);

/* Primary Button Gradient */
background: linear-gradient(135deg, #FF5520 0%, #FF7A00 100%);
```

---

## 3. Typography Hierarchy

| Role | Font Family | Size / Leading | Weight | Tracking / Transform |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | *PP Neue Corp* / *Cabinet Grotesk* | `clamp(3rem, 7vw, 6.5rem)` / `0.95` | `800` / `900` | Uppercase, `tracking-tight` (-0.03em) |
| **Section H2** | *PP Neue Corp* / *Cabinet Grotesk* | `clamp(2rem, 4vw, 3.5rem)` / `1.1` | `700` / `800` | Uppercase, `tracking-tight` |
| **Card H3** | *DM Sans* / *Inter* | `1.5rem (24px)` / `1.3` | `600` | Normal |
| **Body Large** | *DM Sans* / *Inter* | `1.125rem (18px)` / `1.6` | `400` / `500` | Normal (`text-secondary`) |
| **Body Regular** | *DM Sans* / *Inter* | `1rem (16px)` / `1.5` | `400` | Normal (`text-secondary`) |
| **Badges / Mono** | *JetBrains Mono* | `0.75rem (12px)` / `1.0` | `600` | Uppercase, `tracking-widest` |

---

## 4. Layout & Spacing Rules

* **Container Width:** `max-w-7xl` (`1280px`) with centered auto margins.
* **Horizontal Gutters:** `px-4 sm:px-6 lg:px-8`.
* **Vertical Section Spacing:** `py-16 md:py-24 lg:py-32`.
* **Border Radii:**
  * Cards / Containers: `rounded-2xl` (`16px`) or `rounded-3xl` (`24px`).
  * Floating Navbar, Badges, Action Buttons: `rounded-full`.
* **Bento Grid:** 12-column setup (`grid grid-cols-1 md:grid-cols-12 gap-6`).

---

## 5. Component Breakdown

### 5.1 Floating Navbar
* Fixed pill bar (`top-6 left-0 right-0 max-w-5xl mx-auto z-50`).
* Styling: `bg-[#0E0E14]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-6 py-3`.
* Items: Brand glyph + uppercase text, navigation links (`Rollups`, `Metalayer`, `Blog`, `Docs`), and a primary `"Get Started"` CTA button.

### 5.2 Hero Section
* Centralized vertical stack with ambient radial glow behind the content.
* Pill badge with animated pulsing neon dot: `"The Modular Rollup Operating System"`.
* Scaled uppercase heading `"THE INTERNET OF CHAINS"` with split gradient color text clip.
* Dual CTA grouping: solid glowing primary button paired with a translucent glass button.
* Centered 3D particle orbit animation or looping background video.

### 5.3 Key Metrics Proof Bar
* 4-item Bento Grid:
  * **$1B+** — *Total Value Locked*
  * **550M+** — *Total Transactions*
  * **17M+** — *Unique Wallets*
  * **75+** — *Caldera Chains*

### 5.4 Infinite Partner Marquee
* Continuous horizontal looping animation (`animation: marquee 30s linear infinite`).
* Edge mask: `mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent)`.

### 5.5 Product Bento Cards
* **Rollup Engine:** Multichain support badges (Arbitrum Orbit, OP Stack, Polygon CDK, ZKsync Hyperchains).
* **Metalayer:** Cross-chain messaging and intent routing node graph.
* **Metatoken Toolkit:** Omnichain token standard capabilities.

---

## 6. Tailwind CSS Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#08080C',
        surface: {
          DEFAULT: '#0E0E14',
          subtle: '#12121B',
          elevated: '#181824',
        },
        caldera: {
          orange: '#FF5520',
          flame: '#FF7A00',
          cyan: '#00E5FF',
        },
      },
      fontFamily: {
        display: ['Cabinet Grotesk', 'PP Neue Corp', 'sans-serif'],
        sans: ['DM Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'hero-radial': 'radial-gradient(circle at 50% 35%, rgba(255, 85, 32, 0.18) 0%, rgba(8, 8, 12, 0) 70%)',
        'card-glow': 'linear-gradient(135deg, rgba(255, 85, 32, 0.15) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(0, 229, 255, 0.1) 100%)',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## 7. Frontend Recreation Template (Next.js / React)

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const stats = [
  { label: "Total Value Locked", value: "$1B+" },
  { label: "Total Transactions", value: "550M+" },
  { label: "Unique Wallets", value: "17M+" },
  { label: "Caldera Chains", value: "75+" },
];

export default function CalderaLandingPage() {
  return (
    <div className="min-h-screen bg-[#08080C] text-white font-sans selection:bg-[#FF5520] selection:text-white antialiased overflow-x-hidden">
      {/* Ambient Hero Glow */}
      <div className="fixed inset-0 pointer-events-none bg-hero-radial z-0" />

      {/* Floating Pill Header */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="flex items-center justify-between gap-8 px-6 py-3 rounded-full bg-[#0E0E14]/80 backdrop-blur-xl border border-white/10 shadow-2xl max-w-5xl w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5520] to-[#FF8A3D] flex items-center justify-center font-bold text-black text-sm">
              C
            </div>
            <span className="font-extrabold tracking-wider text-lg uppercase font-display">CALDERA</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <a href="#rollups" className="hover:text-white transition-colors">Rollups</a>
            <a href="#metalayer" className="hover:text-white transition-colors">Metalayer</a>
            <a href="#blog" className="hover:text-white transition-colors">Blog</a>
            <a href="#docs" className="hover:text-white transition-colors">Docs</a>
          </div>

          <a
            href="#get-started"
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-[#FF5520] hover:bg-[#ff6938] text-white rounded-full transition-all shadow-[0_0_20px_rgba(255,85,32,0.4)]"
          >
            Get Started
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-40 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[#FF5520] animate-pulse" />
          The Modular Rollup Operating System
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight font-display max-w-5xl mx-auto leading-[0.95]"
        >
          The Internet <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500">
            Of Chains
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Caldera is a network of interconnected, purpose-built blockchains, settling on Ethereum.
        </motion.p>

        {/* CTA Group */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button className="px-8 py-4 rounded-full bg-[#FF5520] hover:bg-[#ff6938] text-white font-semibold text-sm tracking-wide transition-all shadow-[0_0_30px_rgba(255,85,32,0.45)] flex items-center gap-2">
            Explore Chains <ArrowRight className="w-4 h-4" />
          </button>
          <button className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 text-gray-200 border border-white/15 font-semibold text-sm tracking-wide transition-all backdrop-blur-md">
            Book A Call
          </button>
        </motion.div>

        {/* Metrics Grid */}
        <div className="mt-28 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#0E0E14]/70 border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center text-center group hover:border-[#FF5520]/40 transition-colors"
            >
              <span className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-white group-hover:text-[#FF5520] transition-colors">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm text-gray-400 mt-2 font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
```

---

## 8. Recreation Checklist
- [ ] Setup Next.js App Router with Tailwind CSS & Framer Motion.
- [ ] Configure custom color tokens (`#08080C`, `#0E0E14`, `#FF5520`, `#00E5FF`).
- [ ] Configure display and body fonts (*Cabinet Grotesk* / *PP Neue Corp* + *DM Sans*).
- [ ] Build floating pill navbar with glassmorphism filter.
- [ ] Implement Hero title with gradient text & ambient radial glow background.
- [ ] Implement metrics bento cards and infinite marquee slider.
