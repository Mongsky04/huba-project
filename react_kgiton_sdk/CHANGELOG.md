# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-25

### Added

- Initial release of React Native KGiTON SDK
- **Core API Integration**
  - User authentication (register, login, logout)
  - Email verification
  - Password reset flow
  - Token management with AsyncStorage persistence
  - License key management
  - Token balance tracking
  - Transaction history
  - Top-up functionality

- **Huba API Integration**
  - Extended user profile management
  - Item browsing with filters and pagination
  - Cart management with weighing support
  - Transaction/checkout flow
  - Dual pricing support (per kg and per piece)

- **Architecture**
  - Clean architecture with domain entities
  - Service-based API layer
  - Custom exception handling
  - TypeScript support with full type definitions
  - Comprehensive documentation

- **Developer Experience**
  - Logging support (development mode)
  - Session persistence
  - Easy-to-use SDK facade
  - Platform-specific URL configuration guidance
