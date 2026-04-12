# Building Components Skill

> Source: vercel/components.build — `skills/building-components/SKILL.md`

## Scope

Creating modern, accessible, and composable UI components across the full development lifecycle.

## When to Use

- Creating UI components (primitives, components, blocks, templates)
- Implementing accessibility (ARIA, keyboard navigation, focus management)
- Designing composable APIs (slots, render props, state patterns)
- Design systems work (tokens, theming)
- Package distribution (npm, registries)
- Documentation creation
- Advanced patterns (polymorphism, as-child)
- Styling via data attributes

## Reference Architecture

### Component Taxonomy
1. **Primitives** — atomic building blocks (Button, Input, Badge)
2. **Components** — composed primitives with specific behavior (Combobox, DatePicker)
3. **Blocks** — multi-component patterns (DataTable, FormSection)
4. **Templates** — full page/layout compositions

### Key Patterns

- **Composition over configuration** — prefer slots and children over massive prop APIs
- **Polymorphism** — `as` prop or `asChild` pattern for element flexibility
- **Data attributes** — style via `data-state`, `data-active` for CSS targeting
- **Design tokens** — CSS custom properties for theming, not hardcoded values
- **State management** — controlled/uncontrolled pattern, state machines for complex flows

### Accessibility Checklist
- Semantic HTML elements as base
- ARIA roles, labels, and descriptions
- Keyboard navigation (Tab, Arrow keys, Escape, Enter)
- Focus management and visible focus indicators
- Screen reader announcements for dynamic content
- `prefers-reduced-motion` respect

### Styling Approach
- CSS custom properties for tokens
- Data attributes for state-based styling
- Composition-friendly class merging (cn/clsx)
- No inline styles for themeable properties
