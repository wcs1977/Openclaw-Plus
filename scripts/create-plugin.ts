/**
 * Plugin CLI Scaffold - 插件创建命令行工具
 * 
 * 运行此命令来创建新的 OpenClaw 插件：
 *   npx openclaw create-plugin <plugin-name>
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

interface PluginOptions {
  name: string;
  description?: string;
  author?: string;
}

async function createPlugin(options: PluginOptions): Promise<void> {
  
  const pluginName = options.name.replace(/[^a-zA-Z0-9-]/g, '-');
  const camelCaseName = pluginName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  
  console.log(`🚀 Creating plugin "${pluginName}"...`);
  
  // Step 1: 创建目录结构
  const pluginDir = path.join(process.cwd(), pluginName);
  
  try {
    await fs.mkdir(pluginDir, { recursive: true });
    console.log(`✅ Created directory: ${pluginDir}`);
  } catch (error) {
    throw new Error(`Failed to create directory: ${error.message}`);
  }
  
  const dirs = ['src', 'docs', 'tests', 'dist'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(path.join(pluginDir, dir), { recursive: true });
    } catch (error) {
      console.warn(`⚠️  Could not create directory ${dir}:`, error.message);
    }
  }
  
  // Step 2: 创建 package.json
  const packageName = `@openclaw/${pluginName}`;
  const packageJson = {
    name: packageName,
    version: '1.0.0',
    description: options.description || `${camelCaseName} plugin for OpenClaw`,
    main: './dist/index.js',
    types: './dist/index.d.ts',
    scripts: {
      build: 'tsc',
      dev: 'ts-node src/index.ts',
      test: 'jest',
      publish: 'npm publish'
    },
    files: [
      'dist/**/*',
      'README.md'
    ],
    keywords: [
      'openclaw',
      'plugin',
      'ai-assistant'
    ],
    author: options.author || 'Your Name <your.email@example.com>',
    license: 'MIT',
    dependencies: {
      '@openclaw/plugin-sdk': '^1.0.0'
    },
    devDependencies: {
      typescript: '~6.0.0',
      ts-node: '^10.9.2',
      jest: '^29.7.0',
      '@types/jest': '^29.5.14'
    }
  };
  
  try {
    await fs.writeFile(
      path.join(pluginDir, 'package.json'),
      JSON.stringify(packageJson, null, 2) + '\n'
    );
    console.log('✅ Created package.json');
  } catch (error) {
    throw new Error(`Failed to write package.json: ${error.message}`);
  }
  
  // Step 3: 创建 TypeScript 配置
  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      outDir: './dist',
      rootDir: './src',
      strict: true,
      skipLibCheck: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      moduleResolution: 'node'
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  };
  
  try {
    await fs.writeFile(
      path.join(pluginDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2) + '\n'
    );
    console.log('✅ Created tsconfig.json');
  } catch (error) {
    throw new Error(`Failed to write tsconfig.json: ${error.message}`);
  }
  
  // Step 4: 创建插件入口文件
  const pluginTemplate = `/**
 * ${camelCaseName} Plugin - OpenClaw 插件
 * 
 * @module ${pluginName}
 */

import { Plugin, PluginHook } from '@openclaw/plugin-sdk';

export interface ${camelCaseName}Options {
  [key: string]: any;
}

export class ${camelCaseName}Plugin implements Plugin {
  
  id = '${pluginName}';
  name = '${camelCaseName} Plugin';
  version = '1.0.0';
  description = '${options.description || 'A custom plugin for OpenClaw'}';
  author = '${options.author || 'Your Name'}';
  
  permissions: string[] = ['read', 'write'];
  
  hooks: PluginHook[] = [
    {
      name: 'onMessageReceived',
      description: '当收到消息时触发',
      callback: async (params) => {
        const { channel, senderId, content } = params;
        
        console.log(\`📬 Message from \${senderId} on \${channel}: \${content}\`);
        
        // TODO: 实现你的消息处理逻辑
        
        return true; // 继续处理其他钩子
      }
    },
    
    {
      name: 'onCommandExecuted',
      description: '当执行命令时触发',
      callback: async (params) => {
        const { command, args } = params;
        
        console.log(\`📝 Command \${command} with args: \${args.join(' ')}\`);
        
        // TODO: 实现你的命令处理逻辑
        
        return true; // 继续执行其他命令处理器
      }
    }
  ];
  
  async install(): Promise<void> {
    console.log(\`📦 Installing \${this.name}...\`);
    
    // TODO: 安装逻辑
    
    console.log(\`✅ \${this.name} installed successfully!\`);
  }
  
  async uninstall(): Promise<void> {
    console.log(\`🗑️ Uninstalling \${this.name}...\`);
    
    // TODO: 卸载逻辑
    
    console.log(\`✅ \${this.name} uninstalled!\`);
  }
}

export const ${camelCaseName.toLowerCase()}Plugin = new ${camelCaseName}Plugin();

export default ${camelCaseName.toLowerCase()}Plugin;
`;
  
  try {
    await fs.writeFile(
      path.join(pluginDir, 'src', 'index.ts'),
      pluginTemplate
    );
    console.log('✅ Created src/index.ts');
  } catch (error) {
    throw new Error(`Failed to write src/index.ts: ${error.message}`);
  }
  
  // Step 5: 创建 README.md
  const readme = `# ${pluginName}

${options.description || 'A custom plugin for OpenClaw.'}

## Installation

\`\`\`bash
openclaw plugins install @openclaw/${pluginName}
\`\`\`

Or manually:

\`\`\`bash
npm install @openclaw/${pluginName}
\`\`\`

## Usage

After installation, the plugin will automatically register its hooks and commands.

## Development

\`\`\`bash
cd ${pluginName}
npm install
npm run dev
\`\`\`

## Building

\`\`\`bash
npm run build
\`\`\`

This compiles the TypeScript code to JavaScript in the \`dist/\` directory.

## Publishing

To publish your plugin to npm:

\`\`\`bash
npm login
npm publish
\`\`\`

Make sure you have a valid npm account and the package is ready for publication.

## License

MIT
`;
  
  try {
    await fs.writeFile(
      path.join(pluginDir, 'README.md'),
      readme
    );
    console.log('✅ Created README.md');
  } catch (error) {
    throw new Error(`Failed to write README.md: ${error.message}`);
  }
  
  // Step 6: 创建 .gitignore
  const gitignore = `# Dependencies
node_modules/

# Build output
dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Environment
.env
.env.local
`;
  
  try {
    await fs.writeFile(
      path.join(pluginDir, '.gitignore'),
      gitignore
    );
    console.log('✅ Created .gitignore');
  } catch (error) {
    throw new Error(`Failed to write .gitignore: ${error.message}`);
  }
  
  // Step 7: 创建测试模板
  const testTemplate = `import { ${camelCaseName}Plugin } from '../src/index';

describe('${pluginName}', () => {
  
  let plugin: ${camelCaseName}Plugin;
  
  beforeEach(() => {
    plugin = new ${camelCaseName}Plugin();
  });
  
  test('should have correct metadata', () => {
    expect(plugin.id).toBe('${pluginName}');
    expect(plugin.name).toBe('${camelCaseName} Plugin');
    expect(plugin.version).toBe('1.0.0');
  });
  
  test('should have hooks defined', () => {
    expect(plugin.hooks.length).toBeGreaterThan(0);
    expect(plugin.hooks[0].name).toBe('onMessageReceived');
  });
  
  test('should install successfully', async () => {
    await expect(plugin.install()).resolves.toBeUndefined();
  });
  
  test('should uninstall successfully', async () => {
    await expect(plugin.uninstall()).resolves.toBeUndefined();
  });
});
`;
  
  try {
    await fs.writeFile(
      path.join(pluginDir, 'tests', `${pluginName}.test.ts`),
      testTemplate
    );
    console.log('✅ Created tests file');
  } catch (error) {
    throw new Error(`Failed to write test file: ${error.message}`);
  }
  
  // Step 8: 创建 .npmignore
  const npmignore = `docs/
tests/
.gitignore
`;
  
  try {
    await fs.writeFile(
      path.join(pluginDir, '.npmignore'),
      npmignore
    );
    console.log('✅ Created .npmignore');
  } catch (error) {
    throw new Error(`Failed to write .npmignore: ${error.message}`);
  }
  
  console.log(`\n✨ Plugin "${pluginName}" created successfully!`);
  console.log(`📁 Location: ${pluginDir}`);
  console.log(`\nNext steps:`);
  console.log(`1. cd ${pluginName}`);
  console.log(`2. Edit src/index.ts to customize your plugin`);
  console.log(`3. npm run build to compile`);
  console.log(`4. npm publish to share with others\n`);
}

// CLI entry point
const args = process.argv.slice(2);

if (args[0] === 'create-plugin' || args[0] === 'cp') {
  
  const name = args[1];
  
  if (!name) {
    console.error('❌ Please provide a plugin name');
    console.log('Usage: npx openclaw create-plugin <plugin-name>');
    process.exit(1);
  }
  
  createPlugin({ name }).catch((error) => {
    console.error('❌ Error creating plugin:', error.message);
    process.exit(1);
  });
  
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
OpenClaw Plugin CLI - Create new plugins

Usage:
  npx openclaw create-plugin <plugin-name>
  npx openclaw cp <plugin-name>

Options:
  --help, -h    Show this help message
  
Examples:
  npx openclaw create-plugin weather-bot
  npx openclaw cp my-custom-plugin
`);
} else {
  console.log('Usage: npx openclaw create-plugin <plugin-name>');
  console.log('Run "npx openclaw create-plugin --help" for more information.');
}
