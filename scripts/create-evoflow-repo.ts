import { getUncachableGitHubClient } from '../server/github';

async function main() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login}`);
    
    const repo = 'evoflow';
    
    console.log(`\n📦 Creating repository ${user.login}/${repo}...`);
    
    // Create repository for authenticated user (not organization)
    const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
      name: repo,
      description: 'EvoFlow - Cloud-based digital signage management platform with multi-tenant architecture, RBAC, and multi-OS player support',
      homepage: 'https://evoflow.digital',
      private: false,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
      auto_init: false, // We'll push our own files
      license_template: 'mit',
    });
    
    console.log(`✅ Repository created: ${newRepo.html_url}`);
    console.log(`   Default branch: ${newRepo.default_branch}`);
    console.log(`   Clone URL: ${newRepo.clone_url}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
