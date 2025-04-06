'use client'

import { useEffect, useState } from 'react'
import { SwaggerUI } from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { Card } from '@/components/ui/card'

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSpec = async () => {
      try {
        const response = await fetch('/api/openapi.json')
        if (!response.ok) {
          throw new Error('Failed to load API spec')
        }
        const data = await response.json()
        setSpec(data)
      } catch (error) {
        console.error('Error loading API spec:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSpec()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground">
          Explore and test our API endpoints
        </p>
      </div>

      <Card className="p-4">
        {spec && <SwaggerUI spec={spec} />}
      </Card>
    </div>
  )
} 