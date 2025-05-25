#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { generateTemplate } from './templates.js';

// Configuration
const CONFIG = {
    isVerbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
    cssFrameworks: {
        tailwind: { name: 'TailwindCSS', version: '3.4.1' },
        none: { name: 'Plain CSS' }
    }
};

// Logging utility
function log(message) {
    if (CONFIG.isVerbose) {
        console.log(message);
    }
}

// CLI interaction module
const cli = {
    createPrompt() {
        return createInterface({
            input: process.stdin,
            output: process.stdout
        });
    },

    async askQuestion(question) {
        const rl = this.createPrompt();
        return new Promise((resolve) => {
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });
    },

    async askYesNo(question) {
        const answer = await this.askQuestion(`${question} (Y/n): `);
        if (!answer.trim()) return true; 
        return !['n', 'no', 'false', '0'].includes(answer.toLowerCase());
    },

    async askChoice(question, choices) {
        const choiceText = choices.map((choice, index) =>
            `  ${index + 1}. ${choice}`
        ).join('\n');

        const answer = await this.askQuestion(`${question}\n${choiceText}\nChoice (1-${choices.length}): `);
        const index = parseInt(answer) - 1;
        return choices[index] || choices[0];
    }
};

// System utilities
const systemUtils = {
    detectPackageManager() {
        try {
            execSync('pnpm --version', { stdio: 'pipe' });
            return { cmd: 'pnpm', install: 'add', flag: '-D' };
        } catch {
            try {
                execSync('yarn --version', { stdio: 'pipe' });
                return { cmd: 'yarn', install: 'add', flag: '-D' };
            } catch {
                return { cmd: 'npm', install: 'install', flag: '--save-dev' };
            }
        }
    },

    execCommand(command, silent = !CONFIG.isVerbose) {
        try {
            execSync(command, { stdio: silent ? 'pipe' : 'inherit' });
            return true;
        } catch (error) {
            if (CONFIG.isVerbose) {
                console.error(`Command failed: ${command}`);
                console.error(error);
            }
            return false;
        }
    }
};

// Project configuration collector
async function collectProjectConfig() {
    console.log('🚀 Welcome to @toprak/run v0.1');
    console.log('Build a modern web project in seconds!\n');

    // Get project name
    let projectName = process.argv[2];
    if (!projectName) {
        projectName = await cli.askQuestion('📝 Project name: ');
        if (!projectName) {
            console.error('❌ Project name is required');
            process.exit(1);
        }
    }

    const useTypeScript = await cli.askYesNo('🔷 Use TypeScript?');
    
    const cssChoice = await cli.askChoice(
        '🎨 Choose CSS framework:',
        Object.entries(CONFIG.cssFrameworks).map(([key, value]) => 
            `${value.name} ${key === 'tailwind' ? '(recommended)' : ''}`)
    );
    const cssFramework = Object.keys(CONFIG.cssFrameworks)[cssChoice === 'TailwindCSS (recommended)' ? 0 : 1];

    const initGit = await cli.askYesNo('📦 Initialize Git repository?');
    let gitRemote = '';
    if (initGit) {
        gitRemote = await cli.askQuestion('🌐 Git remote URL (optional, press Enter to skip): ');
    }

    return {
        projectName,
        useTypeScript,
        cssFramework,
        git: {
            init: initGit,
            remote: gitRemote.trim()
        }
    };
}

// Project builder module
const projectBuilder = {
    async generatePackageJson(config, pm) {
        const { projectName, useTypeScript, cssFramework } = config;

        const packageJson = {
            name: projectName,
            version: "1.0.0",
            description: `Modern web project built with @toprak/run`,
            main: useTypeScript ? "index.ts" : "index.js",
            scripts: {},
            keywords: ['eleventy', cssFramework === 'tailwind' ? 'tailwindcss' : 'css', 'modern-web'],
            author: "",
            license: "ISC"
        };

        writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

        if (pm.cmd === 'pnpm') {
            writeFileSync('.npmrc', `unsafe-perm=true
enable-pre-post-scripts=true
auto-install-peers=true
shamefully-hoist=true`);
        }
    },

    async installDependencies(config, pm) {
        const { useTypeScript, cssFramework } = config;

        log("Installing base dependencies...");
        let deps = `@11ty/eleventy @11ty/eleventy-plugin-bundle postcss autoprefixer esbuild concurrently html-minifier-terser cssnano postcss-cli`;

        if (cssFramework === 'tailwind') {
            deps += ' tailwindcss@3.4.1';
        }

        if (useTypeScript) {
            deps += ' typescript @types/node';
        }

        const installCmd = `${pm.cmd} ${pm.install} ${pm.flag} ${deps}`;

        if (pm.cmd === 'pnpm') {
            systemUtils.execCommand(`${installCmd} --ignore-scripts`);
            systemUtils.execCommand("pnpm rebuild esbuild");
        } else {
            systemUtils.execCommand(installCmd);
        }

        log("Dependencies installed successfully");
    },

    async setupScripts(config, pm) {
        const { useTypeScript, cssFramework } = config;

        // HTML build - Eleventy ile build yap, sonra minify et
        systemUtils.execCommand(`${pm.cmd} pkg set scripts['build:html']='eleventy && html-minifier-terser --input-dir dist --output-dir dist --file-ext html --collapse-whitespace --remove-comments --remove-optional-tags --remove-redundant-attributes --remove-script-type-attributes --remove-tag-whitespace --use-short-doctype --minify-css true --minify-js true'`);

        if (cssFramework === 'tailwind') {
            // TailwindCSS build et ve minify et
            systemUtils.execCommand(`${pm.cmd} pkg set scripts['build:css']='tailwindcss -i ./src/styles/input.css -o ./dist/style.css --config ./config/tailwind.config.js && postcss ./dist/style.css --use cssnano --output ./dist/style.css'`);
        } else {
            // Plain CSS'i kopyala ve minify et
            systemUtils.execCommand(`${pm.cmd} pkg set scripts['build:css']='cp ./src/styles/input.css ./dist/style.css && postcss ./dist/style.css --use cssnano --output ./dist/style.css'`);
        }

        if (useTypeScript) {
            systemUtils.execCommand(`${pm.cmd} pkg set scripts['build:js']='esbuild src/scripts/main.ts --bundle --outfile=dist/bundle.js --minify --loader:.ts=ts'`);
        } else {
            systemUtils.execCommand(`${pm.cmd} pkg set scripts['build:js']='esbuild src/scripts/main.js --bundle --outfile=dist/bundle.js --minify'`);
        }

        systemUtils.execCommand(`${pm.cmd} pkg set scripts.build='${pm.cmd} run build:css && ${pm.cmd} run build:js && ${pm.cmd} run build:html'`);
        systemUtils.execCommand(`${pm.cmd} pkg set scripts.dev='concurrently "${pm.cmd} run build:css --watch" "${pm.cmd} run build:js --watch" "eleventy --serve --watch"'`);
    },

    async initializeGit(config) {
        const { git, projectName } = config;

        try {
            log("📦 Initializing Git repository...");

            if (!systemUtils.execCommand('git --version', true)) {
                console.log("⚠️  Git not found. Initialize manually with: git init");
                return;
            }

            systemUtils.execCommand('git init');
            systemUtils.execCommand('git add .');
            systemUtils.execCommand(`git commit -m "🎉 Initial commit: ${projectName} built with @toprak/run"`);

            if (git.remote) {
                log("🌐 Adding remote repository...");
                if (systemUtils.execCommand(`git remote add origin ${git.remote}`)) {
                    const shouldPush = await cli.askYesNo('🚀 Push to remote repository?');
                    if (shouldPush) {
                        if (systemUtils.execCommand('git branch -M main') && 
                                systemUtils.execCommand('git push -u origin main')) {
                            log("✅ Code pushed to remote repository");
                        } else {
                            console.log("⚠️  Failed to push to remote. Push manually with:");
                            console.log("   git branch -M main && git push -u origin main");
                        }
                    }
                } else {
                    console.log("⚠️  Failed to add remote. Add manually with:");
                    console.log(`   git remote add origin ${git.remote}`);
                }
            }

            log("✅ Git repository initialized successfully");
        } catch (error) {
            console.log("⚠️  Git initialization failed. Initialize manually with: git init");
            if (CONFIG.isVerbose) console.error(error);
        }
    }
};

async function buildProject(config) {
    const { projectName } = config;
    const root = resolve(process.cwd(), projectName);
    const pm = systemUtils.detectPackageManager();

    console.log(`\n🚀 Building project: ${projectName}`);
    log(`📦 Detected ${pm.cmd.toUpperCase()}`);

    mkdirSync(root, { recursive: true });
    process.chdir(root);

    log("📁 Generating template files...");
    await generateTemplate(config, root, pm);

    log("📦 Generating package.json...");
    await projectBuilder.generatePackageJson(config, pm);

    log("🔧 Installing dependencies...");
    await projectBuilder.installDependencies(config, pm);

    log("📝 Setting up scripts...");
    await projectBuilder.setupScripts(config, pm);

    // Initialize Git repository
    if (config.git.init) {
        await projectBuilder.initializeGit(config);
    }

    console.log("\n✅ Project is ready!");
    console.log(`👉 cd ${projectName}`);
    console.log(`👉 ${pm.cmd} run dev`);

    if (config.git.init && config.git.remote) {
        console.log(`\n📦 Git repository: ${config.git.remote}`);
    }

    console.log(`\n✨ Happy coding with @toprak/run ✨`);
}

// Main function
async function main() {
    try {
        const config = await collectProjectConfig();
        
        console.log('\n📋 Configuration:');
        console.log(`   ⚡ Project: ${config.projectName}`);
        console.log(`   🔷 TypeScript: ${config.useTypeScript ? '✅' : '❌'}`);
        console.log(`   🎨 CSS: ${CONFIG.cssFrameworks[config.cssFramework].name}`);
        console.log(`   📦 Git: ${config.git.init ? '✅' : '❌'}`);

        const proceed = await cli.askYesNo('\n🚀 Build project?');
        if (!proceed) {
            console.log('❌ Cancelled');
            process.exit(0);
        }

        await buildProject(config);
    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main();