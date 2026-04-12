# Web Design Guidelines Skill

> Source: vercel-labs/agent-skills — `skills/web-design-guidelines/SKILL.md`
> Companion: vercel-labs/web-interface-guidelines

## Purpose

Review UI code for Web Interface Guidelines compliance. Activates on "review my UI", "check accessibility", "audit design", "review UX", or "check against best practices."

## Workflow

1. Fetch current guidelines from `vercel-labs/web-interface-guidelines`
2. Read specified files or patterns
3. Check compliance against all rules
4. Report findings in `file:line` format

## Key Audit Domains

- **Accessibility**: ARIA, labels, keyboard support, semantic HTML
- **Focus states**: visible indicators, `:focus-visible`
- **Forms**: autocomplete, types, labels, validation
- **Animation**: `prefers-reduced-motion`, compositor-friendly properties
- **Typography**: proper punctuation, spacing, number formatting
- **Content handling**: overflow, empty states
- **Images**: dimensions, lazy loading
- **Performance**: virtualization, DOM operations
- **Navigation & state**: URL sync, deep linking
- **Touch interactions**: safe areas, tap targets (min 44x44)
- **Dark mode & theming**: consistent token usage
- **Internationalization**: RTL, locale-aware formatting
- **Hydration safety**: no layout shift on hydration
- **Copy & content style**: consistent voice

## Output Format

File-by-file analysis using `file:line` references. Grouped findings. Terse issue statements, no preamble.
