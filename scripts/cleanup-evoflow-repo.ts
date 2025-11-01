import { getUncachableGitHubClient } from '../server/github';

const OWNER = 'evoflowdt';
const REPO = 'evoflow';
const BRANCH = 'main';

async function deleteFile(octokit: any, path: string) {
  try {
    // Get file SHA
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: path,
      ref: BRANCH,
    });
    
    const sha = (data as any).sha;
    
    // Delete file
    await octokit.repos.deleteFile({
      owner: OWNER,
      repo: REPO,
      path: path,
      message: `chore: remove ${path} (sensitive scripts not for public repo)`,
      sha: sha,
      branch: BRANCH,
    });
    
    console.log(`✅ Deleted: ${path}`);
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`⚠️  Not found: ${path}`);
    } else {
      console.error(`❌ Error deleting ${path}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    console.log(`\n🗑️  Removing scripts/ directory from repository...`);
    
    // Get all files in scripts/ directory
    try {
      const { data: contents } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: 'scripts',
        ref: BRANCH,
      });
      
      if (Array.isArray(contents)) {
        console.log(`Found ${contents.length} files in scripts/`);
        
        for (const file of contents) {
          if (file.type === 'file') {
            await deleteFile(octokit, file.path);
          }
        }
      }
    } catch (error: any) {
      if (error.status === 404) {
        console.log('⚠️  scripts/ directory not found (already clean)');
      } else {
        throw error;
      }
    }
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`🔗 ${OWNER}/${REPO}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
