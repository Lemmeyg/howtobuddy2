'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AnalyticsData {
  user: {
    email: string
    createdAt: string
    lastSignIn: string
  }
  documentCount: number
  totalVideoMinutes: number
  documentTypeDistribution: Record<string, number>
  recentActivity: Array<{
    title: string
    created_at: string
    document_type: string
    metadata: any
  }>
  templateUsage: Array<{
    template_id: string
    name: string
    count: number
  }>
  dailyActivity: Record<string, number>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Analytics</h1>
        <p>Failed to load analytics data</p>
      </div>
    )
  }

  // Prepare data for document type chart
  const documentTypeData = Object.entries(data.documentTypeDistribution).map(
    ([type, count]) => ({
      type,
      count,
    })
  )

  // Prepare data for daily activity chart
  const dailyActivityData = Object.entries(data.dailyActivity)
    .map(([date, count]) => ({
      date: format(new Date(date), 'MMM d'),
      count,
    }))
    .slice(-30) // Show last 30 days

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {data.user.email}
        </p>
        <p className="text-sm text-muted-foreground">
          Member since {format(new Date(data.user.createdAt), 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.documentCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video Minutes Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalVideoMinutes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Used Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.templateUsage[0]?.count || 0}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.templateUsage[0]?.name || 'No templates used'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.templateUsage.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Document Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={documentTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.created_at} className="flex justify-between">
                  <div>
                    <span className="font-medium">{activity.title}</span>
                    <p className="text-sm text-muted-foreground">
                      {activity.document_type}
                    </p>
                  </div>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.templateUsage.map((usage) => (
                <div key={usage.template_id} className="flex justify-between">
                  <span className="font-medium">{usage.name}</span>
                  <span className="text-muted-foreground">
                    {usage.count} uses
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 