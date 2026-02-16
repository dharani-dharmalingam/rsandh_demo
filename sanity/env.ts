export const apiVersion =
    process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-02-12'

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ow03d9eg'

export const activeClientSlug = process.env.NEXT_PUBLIC_ACTIVE_CLIENT_SLUG || 'rs-h'

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const clientConfig = {
    projectId,
    dataset,
    apiVersion,
    useCdn: true,
    previewUrl: siteUrl,
}

function assertValue<T>(v: T | undefined, errorMessage: string): T {
    if (v === undefined) {
        throw new Error(errorMessage)
    }

    return v
}
