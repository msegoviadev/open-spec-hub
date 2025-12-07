# Open Spec Hub

> A unified documentation platform for all your API specifications - REST, Events, and beyond.

## 🚀 Live Demo

**https://msegovia.dev/open-spec-hub/demo/**

See it in action with our example page featuring both REST APIs and AsyncAPI event streams.

## ✨ What is this?

Open Spec Hub is a **protocol-agnostic documentation platform** that lets you browse and understand all your API contracts through a single, intuitive interface. Whether you're working with REST APIs, event-driven architectures, or both - we handle the complexity so you don't have to.

### 🎯 The Problem We Solve

Your team probably uses multiple API protocols:
- **REST APIs** for traditional request/response operations
- **AsyncAPI** for event-driven architectures  
- **GraphQL** for flexible data queries
- **gRPC** for high-performance services

Each has its own documentation format, tools, and terminology. **Open Spec Hub unifies them all.**

## 🏗️ How It Works

### Protocol Abstraction
We translate different API protocols into a common conceptual model:

| Universal Concept | REST (OpenAPI) | AsyncAPI | What You See |
|-------------------|----------------|----------|--------------|
| **Operation** | HTTP Endpoint | Channel Operation | Just "Operation" |
| **Action** | GET, POST, PUT | Publish, Subscribe | Clear action badges |
| **Location** | `/api/users` | `user.events` | Simple location path |
| **Data In** | Request Body | Published Message | "Input Schema" |
| **Data Out** | Response Body | Subscribed Message | "Output Schema" |

### Key Features
- 🔍 **Unified Search** - Find anything across all your APIs
- 🔄 **Git Sync** - Automatically fetch specs from GitHub/GitLab repositories
- 📱 **Responsive Design** - Works on desktop and mobile
- 🌙 **Dark Mode** - Built-in theme switching
- 📋 **Code Examples** - Auto-generated samples in multiple languages
- ⚡ **Static Site Generation** - Fast loading and SEO-friendly
- 🧪 **Comprehensive Testing** - 83 E2E tests ensure reliability

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/msegoviadev/open-spec-hub.git
cd open-spec-hub

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your API documentation hub.

### Adding Your Own APIs

#### Option 1: Manual (Local Files)

1. **Place your spec files** in the `specs/` directory:
   ```
   specs/
   ├── openapi/
   │   └── your-api.yaml
   └── asyncapi/
       └── your-events.yaml
   ```

2. **Restart the dev server** - your APIs will automatically appear!

#### Option 2: Automatic Sync (Git Repositories)

Automatically fetch specs from GitHub/GitLab repositories:

1. **Setup sync**:
   ```bash
   bash scripts/setup.sh
   ```

2. **Configure tokens** in `.env`:
   ```bash
   GITHUB_TOKEN=ghp_your_token_here
   GITLAB_TOKEN=glpat_your_token_here
   ```

3. **Add repositories** in `config/sync-config.yaml`:
   ```yaml
   sources:
     - name: "my-apis"
       platform: "github"
       repository: "your-org/api-specs"
       branch: "main"
       auth:
         token_env: "GITHUB_TOKEN"
       files:
         - path: "openapi/users-api.yaml"
           type: "openapi"
   ```

4. **Sync specs**:
   ```bash
   python3 scripts/sync-specs.py
   ```

5. **Install cron** for automatic updates:
   ```bash
   bash scripts/install-cron.sh
   ```

See [README-SYNC.md](README-SYNC.md) for complete documentation.

#### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
open-spec-hub/
├── app/                    # Next.js app router
├── components/
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   └── unified/           # Protocol-agnostic components
├── lib/
│   ├── parsers/           # OpenAPI & AsyncAPI parsers
│   ├── normalization/     # Protocol → Unified model
│   └── utils/             # Helper functions
├── scripts/               # Git sync automation
│   ├── sync-specs.py     # Main sync script
│   ├── setup.sh          # Setup automation
│   └── install-cron.sh   # Cron installation
├── config/
│   └── sync-config.yaml  # Git sync configuration
├── specs/                 # Your API specifications
│   ├── openapi/          # REST API specs
│   └── asyncapi/         # Event-driven specs
└── public/               # Static assets
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode
npm run test:headed
```

Our test suite includes 83 E2E tests covering:
- Homepage functionality
- REST API operations
- AsyncAPI operations  
- Code examples
- Search and filtering

## 🎨 Customization

### Theming
The platform uses Tailwind CSS with shadcn/ui components. Customize colors, fonts, and spacing in:
- `tailwind.config.ts` - Design system configuration
- `app/globals.css` - Global styles and CSS variables

### Adding New Protocols
Want to support GraphQL, gRPC, or other protocols? The architecture is designed for extensibility:

1. **Create a parser** in `lib/parsers/`
2. **Create a normalizer** in `lib/normalization/`
3. **Update the spec detector** in `lib/parsers/spec-detector.ts`

## 📚 Example APIs Included

The repository comes with a complete e-commerce platform example:

- **REST API** (`specs/openapi/ecommerce-api.yaml`)
  - Product catalog
  - Order management
  - User authentication

- **Event Streams** (`specs/asyncapi/simple-events.yaml`)
  - User lifecycle events
  - Order status updates
  - Inventory notifications

- **Avro Schema** (`specs/asyncapi/avro-user-signup.yaml`)
  - User signup with Avro schema format

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 📖 Documentation

- **[Git Sync Setup](README-SYNC.md)** - Automatic spec syncing from GitHub/GitLab
- **[Development Guidelines](CLAUDE.md)** - Workflow rules and architecture
- **[Project Status](.claude/STATUS.md)** - Current features and roadmap

## 🔗 Links

- **Live Demo**: https://msegovia.dev/open-spec-hub
- **Repository**: https://github.com/msegoviadev/open-spec-hub
- **Issues**: https://github.com/msegoviadev/open-spec-hub/issues

---

<div align="center">

**⭐ Star this repo if it helped you!**

Made with ❤️ by [Marcos Segovia](https://github.com/msegoviadev)

</div>
