# Round 3: landing page to verified world-class (the design brief / forcing function)

Tier 1 (world-facing). world-class-frontend LAW applies. No flat template allowed.

## The forcing function (committed before code)

1. **ONE CONCEPT:** "Determinism you can watch." The site is a dark machined instrument where
   intelligence (the five agents) is suspended in a precise lattice and work moves through it as
   deterministic light, halting visibly at the cold-verify gate. Every decision serves this.

2. **AESTHETIC EXTREME:** retro-futurist instrument / deep-space telemetry (oscilloscope, CNC
   control panel, observatory readout). Not "modern clean SaaS."

3. **TYPE SYSTEM:** Display = Clash Display (Fontshare). Body = Switzer (Fontshare). Technical /
   code = JetBrains Mono. (None on the ban list. No Inter/Roboto/Space-Grotesk.)

4. **COLOR LOGIC:** dominant near-black substrate (#06070b) with deep indigo structural lines;
   ONE sharp accent = signal amber/gold reserved for the GATE (the dramatic stop). The five agent
   colors appear ONLY as node signals, surgically, never a rainbow wash.

5. **SIGNATURE MOMENT:** a WebGL 3D orchestration core: five luminous agent nodes on a
   deterministic spine, work flowing as light Research -> Design -> Build -> Verify, then a hard
   amber HALT at the gate, then release to Market. Shader compute-lattice background. The core
   assembles and the narrative advances as you scroll. This is what a viewer screenshots.

6. **TECHNIQUES (5 of the toolkit):** Three.js 3D core + GLSL shader background + GSAP
   ScrollTrigger choreography + Lenis smooth scroll + kinetic oversized variable type.

## Non-negotiables

- Self-contained single HTML (Octopus ships one index.html; no build step). three as ESM,
  gsap+ScrollTrigger+lenis as UMD from a CDN, GLSL inlined. This satisfies THE LAW; it is NOT
  the banned flat HTML.
- The 3D core MUST be visible (blank-engine rule: verified by an actual rendered screenshot,
  looked at, before this is called done).
- prefers-reduced-motion: halt shader + scrub, present a composed static frame.
- Every claim truthful to v3/ARCHITECTURE.md. No invented features. ZERO em dashes.
- WCAG AA contrast, real focus states, semantic markup, performant (cap DPR, pause on hidden tab).

## Acceptance for this round (binary)

R3.1 The 3D orchestration core renders visibly (proven by a screenshot I read, not asserted).
R3.2 At least 3 toolkit techniques present (target 5): Three.js, GLSL, GSAP ScrollTrigger, Lenis, kinetic type.
R3.3 Stripping motion/3D would NOT leave a plain template (the concept carries the structure).
R3.4 Content accurate to ARCHITECTURE.md; sequential sprint honesty preserved; 0 em dashes.
R3.5 prefers-reduced-motion path works; AA contrast; no console errors.
R3.6 Display/body fonts are distinctive (Clash Display + Switzer), not banned fonts.
