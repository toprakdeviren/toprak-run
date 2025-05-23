# @toprakdeviren/run

🔥 **Zero-config UI starter kit** with TailwindCSS + Eleventy + Vanilla JS/TS

A modern, lightning-fast project generator that builds beautiful web projects in seconds.

## ✨ Features

- 🎨 **TailwindCSS** - Modern utility-first CSS framework
- ⚡ **Eleventy** - Fast static site generator
- 🔷 **TypeScript Support** - Optional TypeScript integration
- 📱 **Responsive Design** - Mobile-first approach
- 🚀 **Zero Configuration** - Works out of the box
- 📦 **Smart Package Manager Detection** - Supports npm, yarn, and pnpm
- 🌐 **Git Integration** - Optional Git repository initialization
- 🔧 **Modern Tooling** - ESBuild, PostCSS, Autoprefixer

## 🚀 Quick Start

```bash
# Using npx (recommended)
npx @toprakdeviren/run my-project

# Or install globally
npm install -g @toprakdeviren/run
toprak-run my-project
```

## 📋 Interactive Setup

The tool will guide you through:

- 📝 **Project name** - Your project identifier
- 🔷 **TypeScript** - Enable TypeScript support (default: Yes)
- 🎨 **CSS Framework** - Choose TailwindCSS or Plain CSS (default: TailwindCSS)
- 📦 **Git Repository** - Initialize Git repo with optional remote (default: Yes)

## 🛠️ Generated Project Structure

```
my-project/
├── package.json
├── .eleventy.js
├── README.md
├── config/
│   ├── tailwind.config.js
│   └── postcss.config.js
|   └── eleventy.config.js
├── src/
│   ├── index.html
│   ├── pages/
│   │   └── about.html
│   ├── styles/
│   │   └── input.css
│   └── scripts/
│       └── main.js|ts
└── public/
    └── (static assets)
```

## 📝 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Individual build commands
npm run build:css    # Build CSS
npm run build:js     # Build JavaScript
npm run build:html   # Build HTML
```

## 🎯 What You Get

- **Modern Web Stack** - Latest tools and best practices
- **Responsive Layout** - Mobile-first design system
- **Fast Development** - Hot reload and watch mode
- **Production Ready** - Optimized builds with minification
- **SEO Friendly** - Clean HTML structure and meta tags
- **Accessible** - WCAG compliant markup

## 🔧 Requirements

- **Node.js** >= 18.0.0
- **Package Manager** - npm, yarn, or pnpm

## 📖 Usage Examples

```bash
# Build a TypeScript project with TailwindCSS
npx @toprakdeviren/run my-app

# Build with verbose output
npx @toprakdeviren/run my-app --verbose

# Skip interactive prompts (use defaults)
npx @toprakdeviren/run my-app --yes
```

## 🎨 CSS Frameworks

### TailwindCSS (Recommended)
- Utility-first CSS framework
- Highly customizable
- Production build optimization
- JIT compilation

### Plain CSS
- Standard CSS setup
- PostCSS with Autoprefixer
- Custom styling freedom

## 🚀 Deployment

Your generated project is ready for deployment to:

- **Netlify** - Drag & drop `dist` folder
- **Vercel** - Connect Git repository
- **GitHub Pages** - Enable in repository settings
- **Any Static Host** - Upload `dist` folder contents

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Make your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [Uğur Toprakdeviren](https://github.com/toprakdeviren)

## 🔗 Links

- [GitHub Repository](https://github.com/toprakdeviren/toprak-run)
- [npm Package](https://www.npmjs.com/package/@toprakdeviren/run)
- [Issues & Bug Reports](https://github.com/toprakdeviren/toprak-run/issues)

---

**Made with ❤️ by [@toprakdeviren](https://github.com/toprakdeviren)**

*Build something amazing! ✨*
