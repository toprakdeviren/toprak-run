import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, unlinkSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const cssFrameworks = {
    tailwind: { name: 'TailwindCSS', version: '3.4.1' },
    none: { name: 'Plain CSS' }
};

export async function generateTemplate(config, targetDir, pm) {
    try {
        buildDirectories(targetDir);

        generateAllFiles(targetDir, config, pm);

        const placeholders = {
            '{{PROJECT_NAME}}': config.projectName,
            '{{PROJECT_DESCRIPTION}}': `Modern web project built with @toprak/run`,
            '{{USE_TYPESCRIPT}}': config.useTypeScript ? '✅' : '❌',
            '{{CSS_FRAMEWORK}}': cssFrameworks[config.cssFramework].name,
            '{{GIT_INIT}}': config.git.init ? '✅' : '❌',
            '{{PACKAGE_MANAGER}}': pm.cmd
        };

        replacePlaceholders(targetDir, placeholders);

        cleanupFiles(targetDir, config);

    } catch (error) {
        console.error('❌ Failed to generate template:', error.message);
        process.exit(1);
    }
}

function buildDirectories(targetDir) {
    const dirs = [
        'src/scripts',
        'src/styles',
        'config',
        'public',
        'dist'
    ];

    dirs.forEach(dir => {
        mkdirSync(join(targetDir, dir), { recursive: true });
    });
}

function generateAllFiles(targetDir, config) {
    const files = {
        'src/index.html': getIndexTemplate(),
        'src/scripts/main.js': getMainJSTemplate(),
        'src/scripts/main.ts': getMainTSTemplate(),
        'src/styles/plain.css': getBaseCSS(),
        'src/styles/tailwind.css': getTailwindCSS(),
        'config/eleventy.config.js': getEleventyConfig(),
        'tsconfig.json': getTSConfig(),
        '.gitignore': getGitignore(),
        'README.md.template': getReadmeTemplate(),
        '.eleventy.js': `module.exports = require('./config/eleventy.config.js');`
    };

    // Add Tailwind config files if needed
    if (config.cssFramework === 'tailwind') {
        files['config/tailwind.config.js'] = getTailwindConfig();
        files['config/postcss.config.js'] = getPostCSSConfig();
    }

    Object.entries(files).forEach(([filePath, content]) => {
        writeFileSync(join(targetDir, filePath), content);
    });
}

function replacePlaceholders(dir, placeholders) {
    function replaceInFile(filePath) {
        try {
            let content = readFileSync(filePath, 'utf8');

            Object.entries(placeholders).forEach(([placeholder, value]) => {
                content = content.replaceAll(placeholder, value);
            });

            writeFileSync(filePath, content);
        } catch (error) {
          //
        }
    }

    function walkDir(currentDir) {
        const items = readdirSync(currentDir);

        items.forEach(item => {
            const fullPath = join(currentDir, item);
            const stat = statSync(fullPath);

            if (stat.isDirectory()) {
                walkDir(fullPath);
            } else {
                if (isTextFile(fullPath)) {
                    replaceInFile(fullPath);
                }
            }
        });
    }

    walkDir(dir);
}

function isTextFile(filePath) {
    const textExtensions = ['.html', '.js', '.ts', '.css', '.json', '.md', '.txt'];
    return textExtensions.some(ext => filePath.endsWith(ext)) ||
        filePath.endsWith('.template') ||
        filePath.includes('.gitignore') ||
        filePath.includes('.eleventy');
}

function cleanupFiles(targetDir, config) {
    try {
        if (config.useTypeScript) {
            unlinkSync(join(targetDir, 'src/scripts/main.js'));
        } else {
            unlinkSync(join(targetDir, 'src/scripts/main.ts'));
            unlinkSync(join(targetDir, 'tsconfig.json'));
        }

        if (config.cssFramework === 'tailwind') {
            renameSync(
                join(targetDir, 'src/styles/tailwind.css'),
                join(targetDir, 'src/styles/input.css')
            );
            unlinkSync(join(targetDir, 'src/styles/plain.css'));
        } else {
            unlinkSync(join(targetDir, 'src/styles/tailwind.css'));
            try {
                unlinkSync(join(targetDir, 'config/tailwind.config.js'));
                unlinkSync(join(targetDir, 'config/postcss.config.js'));
            } catch (error) {
              //
            }
            renameSync(
                join(targetDir, 'src/styles/plain.css'),
                join(targetDir, 'src/styles/input.css')
            );
        }

        renameSync(
            join(targetDir, 'README.md.template'),
            join(targetDir, 'README.md')
        );

    } catch (error) {
        // Some files might not exist, that's okay
        console.log(`⚠️  Cleanup note: ${error.message}`);
    }
}

function getIndexTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{PROJECT_NAME}}</title>
  <meta name="description" content="{{PROJECT_DESCRIPTION}}">
  <link rel="stylesheet" href="/style.css">
  <script type="module" src="/bundle.js"></script>
</head>
<body>
  <div class="container">
    <h1>{{PROJECT_NAME}}</h1>
    
    <p>Your modern web project is ready to go! 🚀</p>
    
    <button id="get-started-btn" class="btn">Get Started</button>
    
    <div class="footer-text">
      Built with ❤️ using <a href="https://www.npmjs.com/package/@toprak/run">@toprak/run</a>
    </div>
  </div>
</body>
</html>`;
}

function getMainJSTemplate() {
    return `document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 {{PROJECT_NAME}} loaded successfully!');

  // Get started button functionality
  const getStartedBtn = document.getElementById('get-started-btn');
  getStartedBtn?.addEventListener('click', () => {
    alert('Welcome to {{PROJECT_NAME}}! Ready to build something amazing? 🎉');
  });
});`;
}

function getMainTSTemplate() {
    return `document.addEventListener('DOMContentLoaded', (): void => {
  console.log('🚀 {{PROJECT_NAME}} loaded successfully!');

  // Get started button functionality
  const getStartedBtn = document.getElementById('get-started-btn') as HTMLButtonElement;
  getStartedBtn?.addEventListener('click', (): void => {
    alert('Welcome to {{PROJECT_NAME}}! Ready to build something amazing? 🎉');
  });
});`;
}

function getTailwindCSS() {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center font-sans;
  }
}

@layer components {
  .container {
    @apply text-center p-8 max-w-2xl mx-auto;
  }
  
  .btn {
    @apply bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg hover:shadow-xl inline-block;
  }
  
  h1 {
    @apply text-6xl font-bold text-gray-900 mb-6;
  }
  
  p {
    @apply text-xl text-gray-600 mb-8 leading-relaxed;
  }
  
  .footer-text {
    @apply mt-12 text-sm text-gray-500;
  }
  
  .footer-text a {
    @apply text-blue-600 hover:underline;
  }
}

@media (max-width: 768px) {
  h1 {
    @apply text-4xl;
  }
  
  p {
    @apply text-lg;
  }
  
  .btn {
    @apply px-6 py-3 text-base;
  }
}`;
}

function getBaseCSS() {
    return `/* Modern CSS Reset & Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #111827;
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  padding: 2rem;
  max-width: 48rem;
  margin: 0 auto;
}

h1 {
  font-size: 3.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}

p {
  font-size: 1.25rem;
  color: #4b5563;
  margin-bottom: 2rem;
  line-height: 1.75;
}

.btn {
  display: inline-block;
  background-color: #2563eb;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  text-decoration: none;
}

.btn:hover {
  background-color: #1d4ed8;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}

.footer-text {
  margin-top: 3rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.footer-text a {
  color: #2563eb;
  text-decoration: none;
}

.footer-text a:hover {
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  h1 {
    font-size: 2.5rem;
  }
  
  p {
    font-size: 1.125rem;
  }
  
  .btn {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
}`;
}

function getTailwindConfig() {
    return `module.exports = {
  content: [
    './src/**/*.{html,js,ts}',
    './dist/**/*.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
};`;
}

function getPostCSSConfig() {
    return `module.exports = {
  plugins: {
    tailwindcss: { config: './config/tailwind.config.js' },
    autoprefixer: {},
  },
};`;
}

function getEleventyConfig() {
    return `module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "public": "." });
  eleventyConfig.addPassthroughCopy("dist/style.css");
  eleventyConfig.addPassthroughCopy("dist/bundle.js");
  
  return {
    dir: {
      input: "src",
      output: "dist"
    },
  };
};`;
}

function getTSConfig() {
    return `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "lib": ["DOM", "ES2020"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`;
}

function getGitignore() {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Build outputs
dist/
build/

# Environment variables
.env
.env.local

# Editor files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log

# Cache
.cache/`;
}

function getReadmeTemplate() {
    return `# {{PROJECT_NAME}}

⚡ **Modern web project** built with [@toprak/run](https://www.npmjs.com/package/@toprak/run)

## ✨ Features

- 🎨 Modern, clean design
- ⚡ Lightning-fast build system
- 📱 Responsive layout
- 🚀 Production-ready

## 🛠 Configuration

- **TypeScript**: {{USE_TYPESCRIPT}}
- **CSS Framework**: {{CSS_FRAMEWORK}}
- **Git**: {{GIT_INIT}}

## 🚀 Getting Started

\`\`\`bash
# Install dependencies
{{PACKAGE_MANAGER}} install

# Start development server
{{PACKAGE_MANAGER}} run dev

# Build for production
{{PACKAGE_MANAGER}} run build
\`\`\`

## 📁 Project Structure

\`\`\`
src/
├── scripts/       # JavaScript/TypeScript files
├── styles/        # CSS files
└── index.html     # Main page
\`\`\`

## 📝 Scripts

- \`{{PACKAGE_MANAGER}} run dev\` - Development server with hot reload
- \`{{PACKAGE_MANAGER}} run build\` - Production build
- \`{{PACKAGE_MANAGER}} run build:css\` - Build CSS only
- \`{{PACKAGE_MANAGER}} run build:js\` - Build JavaScript only
- \`{{PACKAGE_MANAGER}} run build:html\` - Build HTML only

---

Made with ❤️ using [@toprak/run](https://www.npmjs.com/package/@toprak/run)
`;
}