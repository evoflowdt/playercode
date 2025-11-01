import { getUncachableGitHubClient } from '../server/github';

async function main() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    const owner = 'evoflowdt';
    const repo = 'evoflow';
    
    // Get repository info
    const { data: repoInfo } = await octokit.repos.get({ owner, repo });
    console.log(`\n📦 Repository: ${repoInfo.html_url}`);
    console.log(`   Default branch: ${repoInfo.default_branch}`);
    console.log(`   Size: ${repoInfo.size} KB`);
    console.log(`   Updated: ${repoInfo.updated_at}`);
    
    // Get commits
    try {
      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        per_page: 10,
      });
      console.log(`\n📝 Recent commits: ${commits.length}`);
      commits.forEach((commit: any, i: number) => {
        console.log(`   ${i + 1}. ${commit.commit.message.substring(0, 50)} (${commit.sha.substring(0, 7)})`);
      });
    } catch (err: any) {
      if (err.status === 409) {
        console.log(`\n⚠️  Repository is empty (no commits yet)`);
      } else {
        throw err;
      }
    }
    
    // Get file tree
    try {
      const { data: tree } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: repoInfo.default_branch,
        recursive: '1',
      });
      
      console.log(`\n📁 Files in repository: ${tree.tree.length}`);
      
      // Group by directory
      const byDir = tree.tree.reduce((acc: any, item: any) => {
        if (item.type === 'blob') {
          const dir = item.path.includes('/') ? item.path.split('/')[0] : 'root';
          acc[dir] = (acc[dir] || 0) + 1;
        }
        return acc;
      }, {});
      
      console.log('\nFiles by directory:');
      Object.entries(byDir).sort().forEach(([dir, count]) => {
        console.log(`   ${dir}: ${count} files`);
      });
      
    } catch (err: any) {
      console.log(`\n⚠️  Could not get file tree: ${err.message}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
