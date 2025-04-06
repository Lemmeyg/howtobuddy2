'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VersionHistory } from '@/components/document/version-history'
import { Loader2 } from 'lucide-react'

interface Document {
  id: string
  title: string
  content: string
  user_id: string
}

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadDocument()
  }, [params.id])

  const loadDocument = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        throw error
      }

      setDocument(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load document',
        variant: 'destructive',
      })
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!document) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('documents')
        .update({ content: document.content })
        .eq('id', document.id)
        .eq('user_id', document.user_id)

      if (error) {
        throw error
      }

      toast({
        title: 'Success',
        description: 'Document saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save document',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleVersionSelect = async (version: { content: string }) => {
    if (!document) return

    setDocument({
      ...document,
      content: version.content,
    })

    toast({
      title: 'Success',
      description: 'Version restored successfully',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{document.title}</h1>
        <div className="flex gap-4">
          <VersionHistory
            documentId={document.id}
            userId={document.user_id}
            onVersionSelect={handleVersionSelect}
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
      <Textarea
        value={document.content}
        onChange={(e) =>
          setDocument({ ...document, content: e.target.value })
        }
        className="min-h-[500px] font-mono"
      />
    </div>
  )
} 