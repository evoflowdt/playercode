import { getUncachableGitHubClient } from '../server/github';

async function main() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    const owner = 'evoflowdt';
    const possibleRepoNames = ['evoflow', 'evoflow-platform', 'evoflow-webapp'];
    
    console.log(`\n🔍 Checking for existing repositories...`);
    
    for (const repo of possibleRepoNames) {
      try {
        const { data } = await octokit.repos.get({ owner, repo });
        console.log(`✅ Found: ${repo}`);
        console.log(`   URL: ${data.html_url}`);
        console.log(`   Private: ${data.private}`);
        console.log(`   Default branch: ${data.default_branch}`);
      } catch (err: any) {
        if (err.status === 404) {
          console.log(`❌ Not found: ${repo} (available for creation)`);
        } else {
          console.log(`⚠️  Error checking ${repo}: ${err.message}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
