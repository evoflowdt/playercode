import { getUncachableGitHubClient } from '../server/github';

async function main() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const { data: file } = await octokit.repos.getContent({
      owner: 'evoflowdt',
      repo: 'evoflow',
      path: 'README.md',
      ref: 'main',
    });
    
    const content = Buffer.from((file as any).content, 'base64').toString('utf-8');
    
    console.log('=== Documentation Section ===');
    const docSection = content.match(/## 📖 Documentation[\s\S]*?(?=##|$)/);
    if (docSection) {
      console.log(docSection[0].substring(0, 500));
    }
    
    console.log('\n=== Checking for missing docs/ references ===');
    const hasMissingDocs = content.includes('docs/API.md') || 
                           content.includes('docs/DATABASE.md') ||
                           content.includes('docs/AUTH.md');
    
    if (hasMissingDocs) {
      console.log('❌ README still contains references to missing docs/ files!');
    } else {
      console.log('✅ README is clean - no missing docs/ references');
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

main();
