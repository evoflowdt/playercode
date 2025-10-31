import { getUncachableGitHubClient } from '../server/github';

async function main() {
  try {
    const octokit = await getUncachableGitHubClient();
    const owner = 'evoflowdt';
    const repo = 'playercode';
    
    console.log(`📋 Checking repository details...`);
    
    // Get repository info
    const { data: repoInfo } = await octokit.repos.get({ owner, repo });
    console.log(`\nRepository: ${repoInfo.html_url}`);
    console.log(`Default branch: ${repoInfo.default_branch}`);
    console.log(`Private: ${repoInfo.private}`);
    console.log(`Size: ${repoInfo.size} KB`);
    
    // Try to get commits
    try {
      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        per_page: 5,
      });
      console.log(`\n📝 Recent commits: ${commits.length}`);
      commits.forEach((commit: any, i: number) => {
        console.log(`   ${i + 1}. ${commit.commit.message} (${commit.sha.substring(0, 7)})`);
      });
    } catch (err: any) {
      if (err.status === 409) {
        console.log(`\n⚠️  Repository is empty (no commits yet)`);
        console.log(`   This is why ZIP download doesn't work!`);
      } else {
        throw err;
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
