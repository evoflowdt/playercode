import { getUncachableGitHubClient } from '../server/github';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    console.log('🔐 Authenticating with GitHub...');
    const octokit = await getUncachableGitHubClient();
    
    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`✅ Authenticated as: ${user.login} (${user.type})`);
    
    const owner = 'evoflowdt';
    const repo = 'playercode';
    
    // Check if repository already exists
    console.log(`\n🔍 Checking if ${owner}/${repo} exists...`);
    try {
      const { data: existingRepo } = await octokit.repos.get({ owner, repo });
      console.log(`✅ Repository already exists: ${existingRepo.html_url}`);
      console.log(`   Default branch: ${existingRepo.default_branch}`);
      return;
    } catch (err: any) {
      if (err.status === 404) {
        console.log(`ℹ️  Repository does not exist, will create it`);
      } else {
        throw err;
      }
    }
    
    // Create repository
    console.log(`\n📦 Creating repository ${owner}/${repo}...`);
    const { data: newRepo } = await octokit.repos.createInOrg({
      org: owner,
      name: repo,
      description: 'EvoFlow Desktop Player - Electron-based digital signage player',
      homepage: 'https://evoflow.digital',
      private: false,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
      auto_init: true, // Initialize with README
      license_template: 'mit',
    });
    
    console.log(`✅ Repository created: ${newRepo.html_url}`);
    console.log(`   Default branch: ${newRepo.default_branch}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

main();
