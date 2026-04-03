# OpenClaw Contribution Guidelines

**Welcome to OpenClaw!** 🦞

We appreciate your interest in contributing. This document provides guidelines for contributing to the project.

---

## 🤝 Contributor License Agreement (CLA)

By submitting a Pull Request or any contribution to OpenClaw, you agree that:

1. **You own the copyright** to your original work
2. **You grant us a license** to use your contribution under the MIT License
3. **Your contribution is original** and doesn't violate anyone's rights
4. **You understand this is non-exclusive** - we can use your contribution in any OpenClaw product

### CLA Statement

```markdown
By contributing to OpenClaw, I confirm that:

- The work is my original creation or I have the right to contribute it
- My contribution will be licensed under the MIT License
- I understand this agreement applies to all future contributions as well
- I am not aware of any conflicts with third-party rights
```

**No signature required!** By submitting code, you automatically agree to these terms.

---

## 🚀 How to Contribute

### 1. Find an Issue

- Check [GitHub Issues](https://github.com/openclaw/openclaw/issues) for bugs or feature requests
- Look for issues labeled `good first issue` if you're new
- Comment on an issue to let others know you're working on it

### 2. Fork and Clone

```bash
git clone https://github.com/yourusername/openclaw.git
cd openclaw
npm install
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 4. Make Changes

- Follow the code style (TypeScript, ESLint)
- Write tests for new features
- Update documentation as needed
- Add copyright headers to new files:
  ```typescript
  /**
   * @file filename.ts
   * @description Brief description
   * @author Your Name <your.email@example.com>
   * @copyright Copyright (c) 2026 OpenClaw Team. All rights reserved.
   * @license MIT License - See LICENSE file for details
   */
  ```

### 5. Test Locally

```bash
npm run test      # Run unit tests
npm run build     # Build the project
npm run lint      # Check code style
```

### 6. Commit Your Changes

Use clear commit messages:
- `feat: add new skill discovery feature`
- `fix: resolve session memory leak issue`
- `docs: update API documentation`
- `refactor: improve error handling logic`

### 7. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a PR on GitHub with:
- Clear description of changes
- Reference to related issue (if any)
- Screenshots for UI changes
- Testing instructions if needed

---

## 📋 Code Review Process

1. **Automated Checks**: CI will run tests and linting
2. **Maintainer Review**: At least one maintainer must approve
3. **Discussion**: Be open to feedback and suggestions
4. **Final Approval**: Once approved, your PR will be merged

### Review Guidelines for Contributors

- Keep PRs focused (one feature/fix per PR)
- Write clear commit messages
- Update documentation as needed
- Add tests for new functionality
- Ensure all checks pass before requesting review

---

## 🎨 Code Style

We use **ESLint** and **Prettier** to maintain consistent code style.

### TypeScript Guidelines

```typescript
// ✅ Good
export interface User {
  id: string;
  name: string;
}

function greetUser(user: User): void {
  console.log(`Hello, ${user.name}!`);
}

// ❌ Bad
const user = {id: "123", name: "John"}; // No interface
greetUser(user); // Type inference issues
```

### Documentation Guidelines

- Use JSDoc for public APIs
- Keep comments concise and meaningful
- Update README.md for major changes
- Add examples for complex features

---

## 🐛 Reporting Bugs

When reporting a bug, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment details**:
   - OS and version
   - Node.js version
   - OpenClaw version
5. **Screenshots or logs** if applicable

---

## 💡 Feature Requests

When suggesting a new feature:

1. Search existing issues to avoid duplicates
2. Explain the problem you're trying to solve
3. Describe your proposed solution
4. Consider potential impact on other features
5. Be open to alternative solutions

---

## 🌍 Internationalization

We welcome translations! To contribute:

1. Add a new locale file in `i18n/locales/`
2. Translate all strings from the base English file
3. Update the language selector in UI
4. Submit a PR with your translation

**Supported languages**: English, Chinese (zh), Japanese (ja) - more coming!

---

## 📚 Resources

- [GitHub Repository](https://github.com/openclaw/openclaw)
- [Discord Community](https://discord.gg/clawd)
- [Documentation](https://docs.openclaw.ai)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

---

## 🙏 Thank You!

Thank you for contributing to OpenClaw! Your efforts help make this project better for everyone.

**Remember**: Every contribution, no matter how small, makes a difference! 🦞

---

*This document is licensed under MIT License.*
*Last updated: 2026-04-03*
