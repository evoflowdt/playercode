import { getUncachableGitHubClient } from '../server/github';
import fs from 'fs';
import path from 'path';

const OWNER = 'evoflowdt';
const REPO = 'playercode';
const BRANCH = 'main';

interface FileToUpdate {
  path: string;
  content: string;
  message: string;
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

async function updateFile(octokit: any, file: FileToUpdate) {
  console.log(`📝 Updating ${file.path}...`);
  
  const sha = await getFileSha(octokit, file.path);
  const content = Buffer.from(file.content).toString('base64');
  
  const params: any = {
    owner: OWNER,
    repo: REPO,
    path: file.path,
    message: file.message,
    content: content,
    branch: BRANCH,
  };
  
  if (sha) {
    params.sha = sha;
  }
  
  await octokit.repos.createOrUpdateFileContents(params);
  console.log(`✅ ${file.path} updated successfully`);
}

async function main() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    console.log(`\n📦 Updating ${OWNER}/${REPO}...`);
    
    const playerDir = path.join(process.cwd(), 'player');
    
    const filesToUpdate: FileToUpdate[] = [
      {
        path: 'package.json',
        content: fs.readFileSync(path.join(playerDir, 'package.json'), 'utf-8'),
        message: 'chore: bump version to 1.1.0',
      },
      {
        path: 'src/renderer/player.ts',
        content: fs.readFileSync(path.join(playerDir, 'src/renderer/player.ts'), 'utf-8'),
        message: 'feat(ui): add player controls with auto-hide and status indicators',
      },
      {
        path: 'src/renderer/index.html',
        content: fs.readFileSync(path.join(playerDir, 'src/renderer/index.html'), 'utf-8'),
        message: 'feat(ui): add connection badge, pagination, and transparent controls',
      },
      {
        path: 'src/shared/types.ts',
        content: fs.readFileSync(path.join(playerDir, 'src/shared/types.ts'), 'utf-8'),
        message: 'feat: add webpage content type support',
      },
    ];
    
    console.log(`\n🚀 Updating ${filesToUpdate.length} files...\n`);
    
    for (const file of filesToUpdate) {
      await updateFile(octokit, file);
    }
    
    console.log(`\n✅ All files updated successfully!`);
    console.log(`🔗 View changes: https://github.com/${OWNER}/${REPO}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
