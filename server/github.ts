import { Octokit } from '@octokit/rest';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected. Please set up the GitHub integration in your Replit workspace.');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

export interface GitHubReleaseAsset {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  html_url: string;
  assets: GitHubReleaseAsset[];
}

/**
 * Create a new GitHub release
 */
export async function createGitHubRelease(
  owner: string,
  repo: string,
  version: string,
  changelog: string,
  isPrerelease: boolean = false
): Promise<GitHubRelease> {
  const octokit = await getUncachableGitHubClient();
  
  const response = await octokit.repos.createRelease({
    owner,
    repo,
    tag_name: version,
    name: `EvoFlow Player ${version}`,
    body: changelog,
    draft: false,
    prerelease: isPrerelease,
  });

  return response.data as GitHubRelease;
}

/**
 * Upload an asset to a GitHub release
 */
export async function uploadReleaseAsset(
  owner: string,
  repo: string,
  releaseId: number,
  fileName: string,
  fileData: Buffer | string,
  contentType: string = 'application/octet-stream'
): Promise<GitHubReleaseAsset> {
  const octokit = await getUncachableGitHubClient();
  
  const response = await octokit.repos.uploadReleaseAsset({
    owner,
    repo,
    release_id: releaseId,
    name: fileName,
    data: fileData as any,
    headers: {
      'content-type': contentType,
    },
  });

  return response.data as GitHubReleaseAsset;
}

/**
 * Get all releases from a GitHub repository
 */
export async function getGitHubReleases(
  owner: string,
  repo: string
): Promise<GitHubRelease[]> {
  const octokit = await getUncachableGitHubClient();
  
  const response = await octokit.repos.listReleases({
    owner,
    repo,
    per_page: 100,
  });

  return response.data as GitHubRelease[];
}

/**
 * Get a specific release by tag
 */
export async function getGitHubReleaseByTag(
  owner: string,
  repo: string,
  tag: string
): Promise<GitHubRelease | null> {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const response = await octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag,
    });

    return response.data as GitHubRelease;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a GitHub release
 */
export async function deleteGitHubRelease(
  owner: string,
  repo: string,
  releaseId: number
): Promise<void> {
  const octokit = await getUncachableGitHubClient();
  
  await octokit.repos.deleteRelease({
    owner,
    repo,
    release_id: releaseId,
  });
}

/**
 * Delete a release asset
 */
export async function deleteReleaseAsset(
  owner: string,
  repo: string,
  assetId: number
): Promise<void> {
  const octokit = await getUncachableGitHubClient();
  
  await octokit.repos.deleteReleaseAsset({
    owner,
    repo,
    asset_id: assetId,
  });
}
