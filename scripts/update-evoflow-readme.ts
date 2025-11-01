import { getUncachableGitHubClient } from '../server/github';
import fs from 'fs';
import path from 'path';

const OWNER = 'evoflowdt';
const REPO = 'evoflow';
const BRANCH = 'main';

async function main() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    console.log(`\n📝 Updating README.md...`);
    
    // Read corrected README
    const readmePath = path.join(process.cwd(), 'GITHUB_README.md');
    const content = fs.readFileSync(readmePath, 'utf-8');
    
    // Get current README SHA
    const { data: currentFile } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: 'README.md',
      ref: BRANCH,
    });
    
    const sha = (currentFile as any).sha;
    
    // Update README
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: 'README.md',
      message: 'docs: update README with correct documentation references',
      content: Buffer.from(content).toString('base64'),
      sha: sha,
      branch: BRANCH,
    });
    
    console.log(`✅ README.md updated successfully!`);
    console.log(`🔗 https://github.com/${OWNER}/${REPO}/blob/main/README.md`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
