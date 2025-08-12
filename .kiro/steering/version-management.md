---
inclusion: always
---

# Version Management Guidelines

## Version Change Requirement

**Every change to the application should have an associated version change.**

This includes:

- Bug fixes
- Feature additions
- UI/UX improvements
- Code refactoring
- Performance optimizations
- Documentation updates that affect functionality

## Version Location

The application version is located in:

- `index.html` - Footer section: `This or That v0.6.6`

## Version Format

Use semantic versioning format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or significant feature overhauls
- **MINOR**: New features, significant improvements, or notable changes
- **PATCH**: Bug fixes, small improvements, or minor changes

## Examples of Version Changes

### PATCH (0.6.6 → 0.6.7)

- Fixed overlay click handling
- Updated heart icon from emoji to glyph
- Corrected hover behavior

### MINOR (0.6.6 → 0.7.0)

- Added website name links under images
- Implemented pseudo-element overlay system
- Major UX improvements to interaction patterns

### MAJOR (0.6.6 → 1.0.0)

- Complete redesign
- Breaking API changes
- Fundamental architecture changes

## Process

1. **Make changes** to the application
2. **Update version** in `index.html` footer
3. **Document changes** in `CHANGELOG.md` if it exists
4. **Test thoroughly** to ensure version reflects stability
5. **Commit with descriptive message** including version number

## Current Version Tracking

As of the recent changes:

- **Previous**: v0.6.6
- **Current changes made**:
  - Fixed overlay positioning and click handling
  - Implemented pseudo-element overlay approach
  - Added website name links with heart buttons
  - Refined hover behavior to image-only
  - Improved UX with clear interaction boundaries

**Recommended next version**: v0.7.0 (minor version bump due to significant UX improvements)

## Benefits of Version Management

- **Tracking**: Easy to identify when changes were made
- **Debugging**: Helps correlate issues with specific versions
- **Communication**: Clear indication of app evolution to users
- **Rollback**: Ability to reference previous stable versions
- **Professional**: Shows active development and maintenance
