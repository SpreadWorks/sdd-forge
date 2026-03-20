### Generic Font Prohibition
<!-- {%meta: {phase: [impl]}%} -->
Do not use generic font names (e.g. Arial, Times New Roman, Helvetica) directly. Define project fonts as CSS custom properties or design tokens and reference those instead.

### Color System Required
<!-- {%meta: {phase: [impl]}%} -->
All colors shall be defined as CSS custom properties (e.g. `--color-primary`). Hard-coded hex/rgb values in component styles are prohibited. Use the project's color system.

### Animation Method Constraint
<!-- {%meta: {phase: [impl]}%} -->
Prefer CSS animations and transitions over JavaScript-driven animations. Use JavaScript animation only when CSS cannot achieve the required effect (e.g. scroll-linked, physics-based).

### No Inline Styles in Components
<!-- {%meta: {phase: [impl]}%} -->
Inline `style` attributes in component templates are prohibited. Use CSS classes, CSS modules, or styled-components instead.

### Responsive Breakpoints Must Use Design Tokens
<!-- {%meta: {phase: [impl]}%} -->
Media query breakpoints shall reference design tokens or shared variables. Hard-coded pixel values in individual components are prohibited.

### Accessibility Minimum for Interactive Elements
<!-- {%meta: {phase: [spec, impl]}%} -->
All interactive elements (buttons, links, form controls) shall have accessible labels, sufficient color contrast (WCAG AA), and keyboard operability.

### Image Format and Optimization Required
<!-- {%meta: {phase: [impl]}%} -->
Images shall use modern formats (WebP, AVIF) with appropriate fallbacks. Unoptimized images (BMP, uncompressed PNG/TIFF) are prohibited in production builds.
