import { getUncachableGitHubClient } from '../server/github';

async function main() {
  try {
    const octokit = await getUncachableGitHubClient();
    const owner = 'evoflowdt';
    const repo = 'playercode';
    
    console.log(`🔓 Making repository ${owner}/${repo} public...`);
    
    const { data: updatedRepo } = await octokit.repos.update({
      owner,
      repo,
      private: false,
    });
    
    console.log(`✅ Repository is now public!`);
    console.log(`   URL: ${updatedRepo.html_url}`);
    console.log(`   Private: ${updatedRepo.private}`);
    console.log(`\n📥 ZIP download should now work:`);
    console.log(`   https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

main();
