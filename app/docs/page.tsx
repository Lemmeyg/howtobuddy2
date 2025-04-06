import { Metadata } from 'next'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation - HowToBuddy',
  description: 'Learn how to use HowToBuddy effectively with our comprehensive documentation.',
}

// Search index for documentation content
const searchIndex = {
  'getting-started': ['account', 'dashboard', 'create document', 'new user', 'setup'],
  'documents': ['create', 'edit', 'version history', 'share', 'collaborate', 'permissions'],
  'templates': ['library', 'create template', 'manage templates', 'categories'],
  'analytics': ['metrics', 'reports', 'statistics', 'performance', 'insights'],
}

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('getting-started')

  // Search through documentation content
  const searchResults = searchQuery
    ? Object.entries(searchIndex).flatMap(([section, keywords]) =>
        keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
          ? [section]
          : []
      )
    : []

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">HowToBuddy Documentation</h1>
        
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search documentation..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs 
        defaultValue="getting-started" 
        className="space-y-4"
        value={searchQuery && searchResults.length > 0 ? searchResults[0] : activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Getting Started with HowToBuddy</h2>
            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-medium mb-3">1. Create an Account</h3>
                <div className="space-y-2">
                  <p>Sign up for HowToBuddy using your email address or Google account. Once registered, you'll have access to all features.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Visit the signup page and choose your preferred authentication method</li>
                    <li>Fill in your profile information</li>
                    <li>Verify your email address</li>
                    <li>Set up two-factor authentication (recommended)</li>
                  </ul>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-medium mb-3">2. Dashboard Overview</h3>
                <div className="space-y-2">
                  <p>Your dashboard is your command center, showing your recent activity and quick access to key features.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Recent Documents: Quick access to your latest work</li>
                    <li>Popular Templates: Most used templates in your workspace</li>
                    <li>Activity Feed: Track changes and updates</li>
                    <li>Quick Stats: Document count, storage usage, and more</li>
                  </ul>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-medium mb-3">3. Create Your First Document</h3>
                <div className="space-y-2">
                  <p>Start creating content with our intuitive document editor.</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Click "New Document" or use the keyboard shortcut (Ctrl/Cmd + N)</li>
                    <li>Choose a template or start from scratch</li>
                    <li>Use the rich text editor for formatting</li>
                    <li>Enable auto-save for peace of mind</li>
                  </ul>
                  <div className="mt-4">
                    <Button className="mr-2">Create Document</Button>
                    <Button variant="outline">Watch Tutorial</Button>
                  </div>
                </div>
              </section>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Working with Documents</h2>
            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-medium mb-3">Creating and Editing</h3>
                <div className="space-y-2">
                  <p>Master the document creation and editing features:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Rich Text Formatting: Bold, italic, lists, tables</li>
                    <li>Image Support: Drag & drop, paste, or upload</li>
                    <li>Code Blocks: Syntax highlighting for 40+ languages</li>
                    <li>Auto-save: Never lose your work</li>
                  </ul>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-medium mb-3">Version History</h3>
                <div className="space-y-2">
                  <p>Track changes and manage document versions:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Automatic versioning on every save</li>
                    <li>Compare versions side by side</li>
                    <li>Restore previous versions</li>
                    <li>Add version notes for better tracking</li>
                  </ul>
                </div>
              </section>
              
              <section>
                <h3 className="text-xl font-medium mb-3">Collaboration</h3>
                <div className="space-y-2">
                  <p>Work together effectively:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Real-time collaboration with cursor presence</li>
                    <li>Comments and @mentions</li>
                    <li>Role-based access control</li>
                    <li>Activity tracking and notifications</li>
                  </ul>
                </div>
              </section>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Using Templates</h2>
            <div className="space-y-4">
              <section>
                <h3 className="text-xl font-medium mb-2">Template Library</h3>
                <p>Browse our collection of templates or create your own. Templates help maintain consistency.</p>
              </section>
              
              <section>
                <h3 className="text-xl font-medium mb-2">Creating Templates</h3>
                <p>Convert any document into a template. Add placeholders for customizable content.</p>
              </section>
              
              <section>
                <h3 className="text-xl font-medium mb-2">Template Management</h3>
                <p>Organize templates by category. Track usage statistics to optimize your workflow.</p>
              </section>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Understanding Analytics</h2>
            <div className="space-y-4">
              <section>
                <h3 className="text-xl font-medium mb-2">Dashboard Metrics</h3>
                <p>Track document creation, template usage, and team activity through comprehensive analytics.</p>
              </section>
              
              <section>
                <h3 className="text-xl font-medium mb-2">Custom Reports</h3>
                <p>Generate custom reports based on date ranges and specific metrics. Export data for further analysis.</p>
              </section>
              
              <section>
                <h3 className="text-xl font-medium mb-2">Performance Insights</h3>
                <p>Gain insights into team productivity and content effectiveness through detailed analytics.</p>
              </section>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Need Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <h3 className="text-xl font-medium mb-2">Support</h3>
            <p className="mb-4">Contact our support team for assistance with any issues or questions.</p>
            <Button variant="outline">Contact Support</Button>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-xl font-medium mb-2">API Documentation</h3>
            <p className="mb-4">Access our API documentation for technical integration details.</p>
            <Button variant="outline">View API Docs</Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-medium mb-2">Video Tutorials</h3>
            <p className="mb-4">Watch step-by-step guides and tutorials.</p>
            <Button variant="outline">Watch Tutorials</Button>
          </Card>
        </div>
      </div>
    </div>
  )
} 