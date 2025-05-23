#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { generateTemplate } from './templates.js';

const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');

const CSS_FRAMEWORKS = {
    tailwind: { name: 'TailwindCSS', version: '3.4.1' },
    none: { name: 'Plain CSS' }
};

function log(message) {
    if (isVerbose) {
        console.log(message);
    }
}

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

function detectPackageManager() {
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
}

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
        Object.entries(CSS_FRAMEWORKS).map(([key, value]) => 
            `${value.name} ${key === 'tailwind' ? '(recommended)' : ''}`)
    );
    const cssFramework = Object.keys(CSS_FRAMEWORKS)[cssChoice === 'TailwindCSS (recommended)' ? 0 : 1];

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

async function generatePackageJson(config, pm) {
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
}

async function installDependencies(config, pm) {
    const { useTypeScript, cssFramework } = config;

    log("Installing base dependencies...");
    let deps = '@11ty/eleventy postcss autoprefixer esbuild concurrently';

    if (cssFramework === 'tailwind') {
        deps += ' tailwindcss@3.4.1';
    }

    if (useTypeScript) {
        deps += ' typescript @types/node';
    }

    const installCmd = `${pm.cmd} ${pm.install} ${pm.flag} ${deps}`;

    if (pm.cmd === 'pnpm') {
        execSync(`${installCmd} --ignore-scripts`, { stdio: isVerbose ? "inherit" : "pipe" });
        try {
            execSync("pnpm rebuild esbuild", { stdio: isVerbose ? "inherit" : "pipe" });
        } catch (error) {
            // Silent fail
        }
    } else {
        execSync(installCmd, { stdio: isVerbose ? "inherit" : "pipe" });
    }

    log("Dependencies installed successfully");
}

async function setupScripts(config, pm) {
    const { useTypeScript, cssFramework } = config;

    execSync(`${pm.cmd} pkg set scripts['build:html']='eleventy'`, { stdio: 'pipe' });

    if (cssFramework === 'tailwind') {
        execSync(`${pm.cmd} pkg set scripts['build:css']='tailwindcss -i ./src/styles/input.css -o ./dist/style.css --config ./config/tailwind.config.js'`, { stdio: 'pipe' });
    } else {
        execSync(`${pm.cmd} pkg set scripts['build:css']='cp ./src/styles/input.css ./dist/style.css'`, { stdio: 'pipe' });
    }

    if (useTypeScript) {
        execSync(`${pm.cmd} pkg set scripts['build:js']='esbuild src/scripts/main.ts --bundle --outfile=dist/bundle.js --minify --loader:.ts=ts'`, { stdio: 'pipe' });
    } else {
        execSync(`${pm.cmd} pkg set scripts['build:js']='esbuild src/scripts/main.js --bundle --outfile=dist/bundle.js --minify'`, { stdio: 'pipe' });
    }

    execSync(`${pm.cmd} pkg set scripts.build='${pm.cmd} run build:css && ${pm.cmd} run build:js && ${pm.cmd} run build:html'`, { stdio: 'pipe' });
    execSync(`${pm.cmd} pkg set scripts.dev='concurrently "${pm.cmd} run build:css --watch" "${pm.cmd} run build:js --watch" "eleventy --serve --watch"'`, { stdio: 'pipe' });
}

async function initializeGit(config) {
    const { git, projectName } = config;

    try {
        log("📦 Initializing Git repository...");

        execSync('git --version', { stdio: 'pipe' });
        execSync('git init', { stdio: isVerbose ? "inherit" : "pipe" });
        execSync('git add .', { stdio: isVerbose ? "inherit" : "pipe" });
        execSync(`git commit -m "🎉 Initial commit: ${projectName} built with @toprak/run"`, { stdio: isVerbose ? "inherit" : "pipe" });

        if (git.remote) {
            log("🌐 Adding remote repository...");
            try {
                execSync(`git remote add origin ${git.remote}`, { stdio: isVerbose ? "inherit" : "pipe" });

                const shouldPush = await cli.askYesNo('🚀 Push to remote repository?');
                if (shouldPush) {
                    try {
                        execSync('git branch -M main', { stdio: isVerbose ? "inherit" : "pipe" });
                        execSync('git push -u origin main', { stdio: isVerbose ? "inherit" : "pipe" });
                        log("✅ Code pushed to remote repository");
                    } catch (error) {
                        console.log("⚠️  Failed to push to remote. Push manually with:");
                        console.log("   git branch -M main && git push -u origin main");
                    }
                }
            } catch (error) {
                console.log("⚠️  Failed to add remote. Add manually with:");
                console.log(`   git remote add origin ${git.remote}`);
            }
        }

        log("✅ Git repository initialized successfully");

    } catch (error) {
        console.log("⚠️  Git not found. Initialize manually with: git init");
    }
}

async function buildProject(config) {
    const { projectName } = config;
    const root = resolve(process.cwd(), projectName);
    const pm = detectPackageManager();

    console.log(`\n🚀 Building project: ${projectName}`);
    log(`📦 Detected ${pm.cmd.toUpperCase()}`);

    mkdirSync(root, { recursive: true });
    process.chdir(root);

    log("📁 Generating template files...");
    await generateTemplate(config, root, pm);

    log("📦 Generating package.json...");
    await generatePackageJson(config, pm);

    log("🔧 Installing dependencies...");
    await installDependencies(config, pm);

    log("📝 Setting up scripts...");
    await setupScripts(config, pm);

    // Initialize Git repository
    if (config.git.init) {
        await initializeGit(config);
    }

    console.log("\n✅ Project is ready!");
    console.log(`👉 cd ${projectName}`);
    console.log(`👉 ${pm.cmd} run dev`);

    if (config.git.init && config.git.remote) {
        console.log(`\n📦 Git repository: ${config.git.remote}`);
    }

    console.log(`\n✨ Happy coding with @toprak/run ✨`);
}

async function main() {
    try {
        const config = await collectProjectConfig();
        
        console.log('\n📋 Configuration:');
        console.log(`   ⚡ Project: ${config.projectName}`);
        console.log(`   🔷 TypeScript: ${config.useTypeScript ? '✅' : '❌'}`);
        console.log(`   🎨 CSS: ${CSS_FRAMEWORKS[config.cssFramework].name}`);
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