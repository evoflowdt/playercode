import { getUncachableGitHubClient } from '../server/github';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    const owner = 'evoflowdt';
    const repo = 'evoflow';
    
    console.log('\n📄 Adding LICENSE file...');
    
    const licensePath = path.join(process.cwd(), 'LICENSE');
    const content = fs.readFileSync(licensePath, 'utf-8');
    
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'LICENSE',
      message: 'chore: add MIT license file',
      content: Buffer.from(content).toString('base64'),
      branch: 'main',
    });
    
    console.log('✅ LICENSE file added successfully!');
    console.log(`🔗 https://github.com/${owner}/${repo}/blob/main/LICENSE`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
