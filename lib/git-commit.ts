/**
 * Commit generated content to the Git repository via GitHub API.
 * Used by the serverless pipeline: after extraction, content is stored in Supabase
 * and then committed to the repo so Vercel can deploy with the new file.
 *
 * Requires env: GITHUB_TOKEN (PAT with repo scope), GITHUB_REPO (owner/repo).
 */

const GITHUB_API = 'https://api.github.com'

export interface CommitResult {
  success: boolean
  message: string
  commitSha?: string
}

export async function commitContentToGit(
  slug: string,
  content: object,
  options?: { branch?: string }
): Promise<CommitResult> {
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPO

  if (!token || !repo) {
    return {
      success: false,
      message: 'GITHUB_TOKEN or GITHUB_REPO not set. Add them in Vercel (or .env.local) to enable auto-commit.',
    }
  }

  const branch = options?.branch ?? await getDefaultBranch(token, repo)
  if (!branch) {
    return { success: false, message: 'Could not determine default branch.' }
  }

  const filePath = `content/${slug}.published.json`
  const contentStr = JSON.stringify(content, null, 2)
  const contentBase64 = Buffer.from(contentStr, 'utf-8').toString('base64')

  let sha: string | undefined
  try {
    const getRes = await fetch(
      `${GITHUB_API}/repos/${repo}/contents/${filePath}?ref=${branch}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${token}`,
        },
      }
    )
    if (getRes.ok) {
      const data = (await getRes.json()) as { sha?: string }
      sha = data.sha
    }
  } catch (e) {
    console.warn('[git-commit] GET content failed:', e)
  }

  const body = {
    message: `chore: update content for ${slug} (benefits extraction)`,
    content: contentBase64,
    branch,
    ...(sha && { sha }),
  }

  const putRes = await fetch(`${GITHUB_API}/repos/${repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!putRes.ok) {
    const err = (await putRes.json()) as { message?: string }
    return {
      success: false,
      message: err?.message ?? `GitHub API error: ${putRes.status}`,
    }
  }

  const data = (await putRes.json()) as { commit?: { sha?: string } }
  return {
    success: true,
    message: `Content committed to ${branch}. Deployment will run automatically.`,
    commitSha: data.commit?.sha,
  }
}

async function getDefaultBranch(token: string, repo: string): Promise<string | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${repo}`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token}`,
      },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { default_branch?: string }
    return data.default_branch ?? 'main'
  } catch {
    return 'main'
  }
}
