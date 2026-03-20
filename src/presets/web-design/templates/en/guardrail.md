<!-- {%guardrail {phase: [impl]}%} -->
### Generic Font Prohibition
Do not use generic font names (e.g. Arial, Times New Roman, Helvetica) directly. Define project fonts as CSS custom properties or design tokens and reference those instead.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### Color System Required
All colors shall be defined as CSS custom properties (e.g. `--color-primary`). Hard-coded hex/rgb values in component styles are prohibited. Use the project's color system.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### Animation Method Constraint
Prefer CSS animations and transitions over JavaScript-driven animations. Use JavaScript animation only when CSS cannot achieve the required effect (e.g. scroll-linked, physics-based).
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### No Inline Styles in Components
Inline `style` attributes in component templates are prohibited. Use CSS classes, CSS modules, or styled-components instead.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### Responsive Breakpoints Must Use Design Tokens
Media query breakpoints shall reference design tokens or shared variables. Hard-coded pixel values in individual components are prohibited.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [spec, impl]}%} -->
### Accessibility Minimum for Interactive Elements
All interactive elements (buttons, links, form controls) shall have accessible labels, sufficient color contrast (WCAG AA), and keyboard operability.
<!-- {%/guardrail%} -->

<!-- {%guardrail {phase: [impl]}%} -->
### Image Format and Optimization Required
Images shall use modern formats (WebP, AVIF) with appropriate fallbacks. Unoptimized images (BMP, uncompressed PNG/TIFF) are prohibited in production builds.
<!-- {%/guardrail%} -->
