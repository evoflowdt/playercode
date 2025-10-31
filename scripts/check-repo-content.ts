import { getUncachableGitHubClient } from '../server/github';

async function main() {
  try {
    const octokit = await getUncachableGitHubClient();
    const owner = 'evoflowdt';
    const repo = 'playercode';
    
    console.log(`📂 Checking repository content...`);
    
    // Get repository contents
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: '',
    });
    
    if (Array.isArray(contents)) {
      console.log(`\n✅ Repository has ${contents.length} items:\n`);
      contents.forEach((item: any) => {
        console.log(`   ${item.type === 'dir' ? '📁' : '📄'} ${item.name}`);
      });
      
      // Check for key player files
      const hasPackageJson = contents.some((item: any) => item.name === 'package.json');
      const hasSrc = contents.some((item: any) => item.name === 'src' && item.type === 'dir');
      
      console.log(`\n🔍 Key files check:`);
      console.log(`   package.json: ${hasPackageJson ? '✅' : '❌'}`);
      console.log(`   src/: ${hasSrc ? '✅' : '❌'}`);
      
      if (hasPackageJson && hasSrc) {
        console.log(`\n✅ Repository appears to have player code already!`);
      } else {
        console.log(`\n⚠️  Repository missing player code, needs upload`);
      }
    }
    
    // Test ZIP download URL
    console.log(`\n🔗 ZIP download URL: https://github.com/${owner}/${repo}/archive/refs/heads/main.zip`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
