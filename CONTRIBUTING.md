# Contributing to CIAF Vault

Thank you for your interest in contributing to CIAF Vault! This document provides guidelines and instructions for contributing.

## 📜 License Agreement

CIAF Vault is licensed under **Business Source License 1.1 (BUSL-1.1)**. By contributing, you agree that:

1. Your contributions will be licensed under the same BUSL-1.1 license
2. You retain copyright to your contributions
3. You grant the project the right to use your contributions under BUSL-1.1
4. Your contributions are your original work
5. You have the right to submit the work under this license

See [LICENSE](LICENSE) for full terms.

## 🤝 How to Contribute

### Reporting Bugs

**Before submitting a bug report:**
- Check existing [GitHub Issues](https://github.com/DenzilGreenwood/pyciaf/issues)
- Verify you're using the latest version
- Test in a clean environment if possible

**Bug Report Template:**
```markdown
**Description**: Clear description of the bug

**Steps to Reproduce**:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**: What should happen

**Actual Behavior**: What actually happens

**Environment**:
- OS: [e.g., Windows 11, macOS 14]
- Browser: [e.g., Chrome 120]
- Node.js: [e.g., 20.10.0]
- CIAF Vault Version: [e.g., 0.1.0]

**Screenshots**: If applicable

**Additional Context**: Any other relevant information
```

### Suggesting Enhancements

**Enhancement Request Template:**
```markdown
**Feature Description**: Clear description of the proposed feature

**Use Case**: Why is this feature needed? What problem does it solve?

**Proposed Solution**: How should this feature work?

**Alternatives Considered**: Other approaches you've thought about

**Additional Context**: Mockups, examples, references
```

### Pull Requests

**PR Process:**

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ciaf-vault.git
   cd ciaf-vault
   ```

2. **Create Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make Changes**
   - Follow code style guidelines
   - Add tests if applicable
   - Update documentation

4. **Test Locally**
   ```bash
   npm install
   npm run dev
   npm run lint
   npm run type-check
   npm run build
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   
   Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Formatting
   - `refactor:` - Code restructuring
   - `test:` - Adding tests
   - `chore:` - Maintenance

6. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   
   Then create PR on GitHub with:
   - Clear title and description
   - Reference related issues
   - Screenshots/demo if applicable

**PR Guidelines:**
- One feature/fix per PR
- Keep changes focused and minimal
- Update relevant documentation
- Ensure all tests pass
- Follow existing code patterns

## 🎨 Code Style Guidelines

### TypeScript

```typescript
// ✅ Good
interface UserEvent {
  userId: string
  timestamp: string
  eventType: EventType
}

function handleEvent(event: UserEvent): void {
  // Implementation
}

// ❌ Avoid
function handle_event(evt) {
  // Implementation
}
```

### React Components

```typescript
// ✅ Good - Descriptive names, typed props
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={cn('base-classes', variant === 'primary' && 'primary-classes')}
    >
      {label}
    </button>
  )
}

// ❌ Avoid - Unclear naming, no types
export function Btn({ l, o, v }) {
  return <button onClick={o}>{l}</button>
}
```

### File Organization

```
app/
  feature/
    page.tsx          # Page component
    layout.tsx        # Layout (if needed)
    
components/
  feature/
    FeatureTable.tsx  # Main component
    FeatureCard.tsx   # Sub-component
    
lib/
  feature-utils.ts   # Utilities specific to feature
```

### Naming Conventions

- **Components**: PascalCase (`EventTable.tsx`)
- **Files**: kebab-case for non-components (`event-utils.ts`)
- **Functions**: camelCase (`fetchEvents`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces/Types**: PascalCase (`CoreEvent`)

### Comments

```typescript
// ✅ Good - Explains WHY, not WHAT
// Calculate sensitivity score based on PII presence and content analysis
// Uses weighted algorithm: PII (70%) + content keywords (30%)
const sensitivityScore = calculateSensitivity(content)

// ❌ Avoid - States the obvious
// Set the score
const sensitivityScore = calculateSensitivity(content)
```

## 🧪 Testing Guidelines

### Manual Testing

Before submitting PR:

1. **Test all pages**
   - Dashboard loads correctly
   - Navigation works
   - No console errors

2. **Test features**
   - New feature works as expected
   - Edge cases handled
   - Error states work

3. **Test responsiveness**
   - Mobile (< 768px)
   - Tablet (768px - 1024px)
   - Desktop (> 1024px)

4. **Test dark mode**
   - All colors readable
   - No white/dark text on white/dark background

### Future: Automated Tests

Coming soon - we'll add:
- Jest for unit tests
- Playwright for E2E tests
- Cypress for integration tests

## 📝 Documentation Guidelines

### Code Documentation

```typescript
/**
 * Fetches core AI events from Supabase with optional filtering
 * 
 * @param filters - Optional filters for events (model, date range, etc.)
 * @param limit - Maximum number of events to return (default: 100)
 * @returns Promise resolving to array of CoreEvent objects
 * @throws Error if Supabase query fails
 * 
 * @example
 * ```typescript
 * const events = await fetchCoreEvents({ modelName: 'gpt-4' }, 50)
 * console.log(events.length) // Up to 50 events
 * ```
 */
export async function fetchCoreEvents(
  filters?: EventFilters,
  limit: number = 100
): Promise<CoreEvent[]> {
  // Implementation
}
```

### README Updates

When adding features:

1. Update main [README.md](README.md)
2. Add examples to [DEVELOPMENT.md](DEVELOPMENT.md)
3. Update [DEPLOYMENT.md](DEPLOYMENT.md) if needed

## 🔒 Security Guidelines

### Sensitive Data

```typescript
// ✅ Good - Never log sensitive data
console.log('Event ingested:', { eventId: event.event_id })

// ❌ Avoid - Logs API keys, tokens
console.log('Full event:', event)  // May contain secrets
```

### Environment Variables

- Never commit `.env.local`
- Update `.env.example` when adding new variables
- Document all environment variables in README

### Database Security

- Always use parameterized queries
- Respect RLS policies
- Never expose service role key in client

## 🚀 Release Process

(For maintainers)

1. **Version Bump**
   ```bash
   npm version patch  # 0.1.0 -> 0.1.1
   # or
   npm version minor  # 0.1.0 -> 0.2.0
   # or
   npm version major  # 0.1.0 -> 1.0.0
   ```

2. **Update CHANGELOG**
   - Document new features
   - List bug fixes
   - Note breaking changes

3. **Tag Release**
   ```bash
   git tag -a v0.2.0 -m "Release v0.2.0"
   git push origin v0.2.0
   ```

4. **GitHub Release**
   - Create release on GitHub
   - Attach build artifacts
   - Publish release notes

## 🏆 Recognition

Contributors will be recognized in:
- GitHub Contributors page
- CHANGELOG.md for significant contributions
- README.md for major features

## 📞 Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/DenzilGreenwood/pyciaf/discussions)
- **Bugs**: Open a [GitHub Issue](https://github.com/DenzilGreenwood/pyciaf/issues)
- **Security**: Email **Founder@cognitiveinsight.ai** (do not open public issue)
- **Commercial**: Email **Founder@cognitiveinsight.ai**

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all.

### Our Standards

**Positive Behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable Behavior:**
- Harassment, trolling, or discriminatory comments
- Publishing others' private information
- Other conduct inappropriate in a professional setting

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report violations to: **Founder@cognitiveinsight.ai**

## 📄 Attribution

This Contributing Guide is adapted from:
- [Contributor Covenant](https://www.contributor-covenant.org/)
- [Open Source Guide](https://opensource.guide/)

## ✅ Contributor Checklist

Before submitting PR:

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated (when applicable)
- [ ] Local build succeeds
- [ ] Changes work in production build
- [ ] PR template filled out

## 🙏 Thank You!

Every contribution, no matter how small, helps make CIAF Vault better for everyone.

---

**© 2025 Denzil James Greenwood | Cognitive Insight™**
