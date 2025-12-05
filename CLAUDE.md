# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `yarn build` - Build the plugin using WordPress scripts
- `yarn start` - Start development server with hot reload
- `yarn tailwind:watch` - Watch and compile Tailwind CSS
- `yarn tailwind:build` - Build and minify Tailwind CSS

### Code Quality
- `yarn lint:js` - Lint JavaScript/TypeScript files
- `yarn lint:css` - Lint CSS files
- `yarn format` - Format code using WordPress standards
- `yarn test:unit` - Run unit tests
- `yarn test:e2e` - Run end-to-end tests

### Translation
- `yarn translate` - Generate translation files (both POT and JSON)
- `yarn translate:pot` - Generate POT file using Lando/WP-CLI
- `yarn translate:js` - Generate JSON translation files

### WordPress Plugin
- `yarn plugin-zip` - Create plugin ZIP for distribution

## Architecture

### WordPress Plugin Structure
- **Entry point**: `suggerence-gutenberg.php` - Main plugin file with WordPress headers and initialization
- **Autoloader**: Uses Composer PSR-4 autoloading with namespace `SuggerenceGutenberg\`
- **Plugin loader**: `Includes/Loader.php` - Dynamically loads all functionality classes
- **Lifecycle**: `Includes/Lyfecycle.php` - Handles plugin activation/deactivation/uninstall

### Frontend Architecture
- **Build tool**: Webpack with `@wordpress/scripts` configuration
- **Entry points**: React applications in `src/entry-points/`:
  - `gutenberg-editor.tsx` - Editor components
- **State management**: Zustand stores for different features (located in `stores/` directories)
- **API layer**: TanStack Query with WordPress REST API integration
- **Styling**: Tailwind CSS v4 with PostCSS

### PHP Backend Structure
- **API endpoints**: `Functionality/ApiEndpoints.php` uses PluboRoutes library for REST API endpoints
- **Admin functionality**: `Functionality/Admin/` contains WordPress admin-specific classes
- **Components**: `Components/` contains reusable PHP components
- **Namespace**: All PHP classes use `SuggerenceGutenberg\` namespace

### Key Dependencies
- **Frontend**: React, TanStack Query/Router, WordPress Components, Zustand
- **Backend**: PluboRoutes for API routing, WordPress standards
- **Development**: WordPress Scripts, Tailwind CSS, TypeScript

### File Organization
- `src/shared/` - Shared utilities, types, and API abstractions
- `src/apps/` - Individual React applications with their own components/hooks/stores
- TypeScript path alias `@/*` maps to `src/*` for imports
- CSS is processed through Tailwind and bundled via Webpack

### Development Environment
- Uses Lando for local WordPress development
- Node.js 22+ required
- Yarn package manager with volta
- WordPress environment with WP-CLI integration for translations
- Types are automtically imported
- React components are created with index.tsx inside a dir with its name
- Uses @wordpress/element package instead of react
- Uses lucide-react for icons
- Uses of tanstack react query