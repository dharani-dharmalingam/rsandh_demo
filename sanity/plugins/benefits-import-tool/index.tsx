'use client'

/**
 * Studio tool: "Import Benefits Guide" – PDF upload, logo upload, client slug, Generate Site.
 */

import { useState } from 'react'
import { Card, Stack, Box, Label, TextInput, Button, Spinner, Text, Flex } from '@sanity/ui'
import { runBenefitsImport } from './api'

export function BenefitsImportTool() {
  const [clientSlug, setClientSlug] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !clientSlug.trim()) {
      setStatus('error')
      setMessage('Please provide both a PDF file and a client slug.')
      return
    }
    setStatus('loading')
    setMessage('')
    try {
      const result = await runBenefitsImport(file, clientSlug, logo)
      if (!result.success) {
        setStatus('error')
        setMessage(result.error || 'Request failed')
        return
      }
      setStatus('success')
      setMessage(result.message || 'Site generated successfully.')
      if (Array.isArray(result.created) && result.created.length) {
        setMessage((m) => `${m} Documents: ${result.created!.join(', ')}`)
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Network error')
    }
  }

  return (
    <Card padding={4} sizing="border">
      <Stack space={4}>
        <Text size={1} weight="semibold">
          Import Benefits Guide
        </Text>
        <Text size={1} muted>
          Upload a Benefits Guide PDF and optionally a company logo to generate the full client site content. Enter a client slug (e.g. premier-america, acme-corp).
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack space={4}>
            <Box>
              <Label>Client slug</Label>
              <Box marginTop={2}>
                <TextInput
                  value={clientSlug}
                  onChange={(e) => setClientSlug(e.currentTarget.value)}
                  placeholder="e.g. premier-america"
                  disabled={status === 'loading'}
                />
              </Box>
            </Box>
            <Box>
              <Label>PDF file</Label>
              <Box marginTop={2}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={status === 'loading'}
                />
              </Box>
            </Box>
            <Box>
              <Label>Company Logo (optional)</Label>
              <Box marginTop={2}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
                  disabled={status === 'loading'}
                />
              </Box>
              <Box marginTop={1}>
                <Text size={0} muted>PNG, JPG, SVG, or WebP. Used in the site header.</Text>
              </Box>
            </Box>

            <Flex gap={2} align="center">
              <Button
                type="submit"
                text="Generate Site"
                tone="primary"
                disabled={status === 'loading' || !file || !clientSlug.trim()}
              />
              {status === 'loading' && <Spinner />}
            </Flex>

            {message && (
              <Card
                padding={3}
                tone={status === 'error' ? 'critical' : status === 'success' ? 'positive' : 'default'}
                radius={2}
              >
                <Text size={1}>{message}</Text>
              </Card>
            )}
          </Stack>
        </form>
      </Stack>
    </Card>
  )
}

