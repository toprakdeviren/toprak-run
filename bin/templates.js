import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, unlinkSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const templatesDir = join(__dirname, '..', 'templates');
const TEXT_FILE_EXTENSIONS = ['.html', '.js', '.ts', '.css', '.json', '.md', '.txt'];

const cssFrameworks = {
  tailwind: { name: 'TailwindCSS', version: '3.4.1' },
  none: { name: 'Plain CSS' }
};

// Core template generation
export async function generateTemplate(config, targetDir, pm) {
  try {
    const placeholders = createPlaceholders(config, pm);
    
    buildDirectories(targetDir);
    generateAllFiles(targetDir, config);
    replacePlaceholders(targetDir, placeholders);
    cleanupFiles(targetDir, config);
  } catch (error) {
    console.error('❌ Failed to generate template:', error.message);
    process.exit(1);
  }
}

function createPlaceholders(config, pm) {
  return {
    '{{PROJECT_NAME}}': config.projectName,
    '{{PROJECT_DESCRIPTION}}': `Modern web project built with @toprak/run`,
    '{{USE_TYPESCRIPT}}': config.useTypeScript ? '✅' : '❌',
    '{{CSS_FRAMEWORK}}': cssFrameworks[config.cssFramework].name,
    '{{TEMPLATE_FORMAT}}': config.useMarkdown ? 'Markdown' : 'HTML',
    '{{GIT_INIT}}': config.git.init ? '✅' : '❌',
    '{{PACKAGE_MANAGER}}': pm.cmd
  };
}

// File and directory operations
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

function readTemplate(templatePath) {
  try {
    return readFileSync(join(templatesDir, templatePath), 'utf8');
  } catch (error) {
    console.error(`❌ Failed to read template: ${templatePath}`, error.message);
    return '';
  }
}

function generateAllFiles(targetDir, config) {
  const files = {
    'src/scripts/main.js': readTemplate('js/main.js'),
    'src/scripts/main.ts': readTemplate('ts/main.ts'),
    'src/styles/plain.css': readTemplate('css/plain.css'),
    'src/styles/tailwind.css': readTemplate('css/tailwind.css'),
    'config/eleventy.config.js': readTemplate('config/eleventy.config.js'),
    'tsconfig.json': readTemplate('config/tsconfig.json'),
    '.gitignore': readTemplate('docs/gitignore'),
    'README.md.template': readTemplate('docs/README.md'),
    '.eleventy.js': readTemplate('config/eleventy.js')
  };

  // HTML template files
  files['src/index.html'] = readTemplate('html/index.html');
  files['src/index.md'] = readTemplate('html/index.md');
  files['src/_includes/layout.html'] = readTemplate('html/_includes/layout.html');
  files['src/_includes/hero.html'] = readTemplate('html/_includes/hero.html');

  // Add Tailwind config files if needed
  if (config.cssFramework === 'tailwind') {
    files['config/tailwind.config.js'] = readTemplate('config/tailwind.config.js');
    files['config/postcss.config.js'] = readTemplate('config/postcss.config.js');
  }

  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = join(targetDir, filePath);
    // Create directory if it doesn't exist
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  });
}

function replacePlaceholders(dir, placeholders) {
  walkDir(dir, (filePath) => {
    if (isTextFile(filePath)) {
      replaceInFile(filePath, placeholders);
    }
  });
}

function replaceInFile(filePath, placeholders) {
  try {
    let content = readFileSync(filePath, 'utf8');

    Object.entries(placeholders).forEach(([placeholder, value]) => {
      content = content.replaceAll(placeholder, value);
    });

    writeFileSync(filePath, content);
  } catch (error) {
    // Silently fail on file operations
  }
}

function cleanupFiles(targetDir, config) {
  try {
    // Handle TypeScript-specific files
    if (config.useTypeScript) {
      safeUnlink(join(targetDir, 'src/scripts/main.js'));
    } else {
      safeUnlink(join(targetDir, 'src/scripts/main.ts'));
      safeUnlink(join(targetDir, 'tsconfig.json'));
    }

    // Handle template format - keep either HTML or Markdown
    if (config.useMarkdown) {
      safeUnlink(join(targetDir, 'src/index.html'));
    } else {
      safeUnlink(join(targetDir, 'src/index.md'));
    }

    // Handle CSS framework-specific files
    if (config.cssFramework === 'tailwind') {
      safeRename(
        join(targetDir, 'src/styles/tailwind.css'),
        join(targetDir, 'src/styles/input.css')
      );
      safeUnlink(join(targetDir, 'src/styles/plain.css'));
    } else {
      safeUnlink(join(targetDir, 'src/styles/tailwind.css'));
      safeUnlink(join(targetDir, 'config/tailwind.config.js'));
      safeUnlink(join(targetDir, 'config/postcss.config.js'));
      safeRename(
        join(targetDir, 'src/styles/plain.css'),
        join(targetDir, 'src/styles/input.css')
      );
    }

    // Rename README template
    safeRename(
      join(targetDir, 'README.md.template'),
      join(targetDir, 'README.md')
    );
  } catch (error) {
    console.log(`⚠️  Cleanup note: ${error.message}`);
  }
}

// Helper functions
function isTextFile(filePath) {
  return TEXT_FILE_EXTENSIONS.some(ext => filePath.endsWith(ext)) ||
    filePath.endsWith('.template') ||
    filePath.includes('.gitignore') ||
    filePath.includes('.eleventy');
}

function walkDir(currentDir, callback) {
  const items = readdirSync(currentDir);

  items.forEach(item => {
    const fullPath = join(currentDir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

function safeUnlink(filePath) {
  try {
    unlinkSync(filePath);
  } catch (error) {
    // Ignore errors when file doesn't exist
  }
}

function safeRename(oldPath, newPath) {
  try {
    renameSync(oldPath, newPath);
  } catch (error) {
    // Ignore errors when file doesn't exist
  }
}