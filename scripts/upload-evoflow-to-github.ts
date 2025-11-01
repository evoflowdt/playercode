import { getUncachableGitHubClient } from '../server/github';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const OWNER = 'evoflowdt';
const REPO = 'evoflow';
const BRANCH = 'main';

interface FileToUpload {
  path: string;
  content: string;
}

async function getFileSha(octokit: any, filePath: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: filePath,
      ref: BRANCH,
    });
    return (data as any).sha;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

async function uploadFile(octokit: any, file: FileToUpload, message: string) {
  console.log(`📝 Uploading ${file.path}...`);
  
  const sha = await getFileSha(octokit, file.path);
  const content = Buffer.from(file.content).toString('base64');
  
  const params: any = {
    owner: OWNER,
    repo: REPO,
    path: file.path,
    message: message,
    content: content,
    branch: BRANCH,
  };
  
  if (sha) {
    params.sha = sha;
  }
  
  try {
    await octokit.repos.createOrUpdateFileContents(params);
    console.log(`✅ ${file.path}`);
  } catch (error: any) {
    console.error(`❌ Failed to upload ${file.path}: ${error.message}`);
  }
}

async function collectFiles(): Promise<FileToUpload[]> {
  const files: FileToUpload[] = [];
  const cwd = process.cwd();
  
  // Configuration files
  const configFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'drizzle.config.ts',
    'components.json',
    'postcss.config.js',
    '.gitignore',
  ];
  
  for (const file of configFiles) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      files.push({
        path: file,
        content: fs.readFileSync(filePath, 'utf-8'),
      });
    }
  }
  
  // README from our generated file
  const readmePath = path.join(cwd, 'GITHUB_README.md');
  if (fs.existsSync(readmePath)) {
    files.push({
      path: 'README.md',
      content: fs.readFileSync(readmePath, 'utf-8'),
    });
  }
  
  // Source directories
  const sourceDirs = ['client', 'server', 'shared', 'public'];
  
  for (const dir of sourceDirs) {
    const dirPath = path.join(cwd, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    // Find all source files
    const pattern = `${dir}/**/*.{ts,tsx,js,jsx,css,html,json}`;
    const sourceFiles = await glob(pattern, {
      cwd,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
    });
    
    for (const file of sourceFiles) {
      const filePath = path.join(cwd, file);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        files.push({
          path: file,
          content: fs.readFileSync(filePath, 'utf-8'),
        });
      }
    }
  }
  
  return files;
}

async function main() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    console.log(`\n📦 Collecting files...`);
    const files = await collectFiles();
    console.log(`Found ${files.length} files to upload\n`);
    
    // Upload in batches
    console.log(`🚀 Uploading configuration files...`);
    const configFiles = files.filter(f => !f.path.includes('/'));
    for (const file of configFiles) {
      await uploadFile(octokit, file, `chore: add ${file.path}`);
    }
    
    console.log(`\n🚀 Uploading source files...`);
    const sourceFiles = files.filter(f => f.path.includes('/'));
    
    // Group by directory for better commit messages
    const byDir = sourceFiles.reduce((acc, file) => {
      const dir = file.path.split('/')[0];
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(file);
      return acc;
    }, {} as Record<string, FileToUpload[]>);
    
    for (const [dir, dirFiles] of Object.entries(byDir)) {
      console.log(`\n📁 Uploading ${dir}/ (${dirFiles.length} files)...`);
      for (const file of dirFiles) {
        await uploadFile(octokit, file, `feat: add ${file.path}`);
      }
    }
    
    console.log(`\n✅ Upload complete!`);
    console.log(`🔗 View repository: https://github.com/${OWNER}/${REPO}`);
    console.log(`\nTotal files uploaded: ${files.length}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
