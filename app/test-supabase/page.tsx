'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Database, User, Key, Globe } from 'lucide-react'

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    setConnectionStatus('testing')
    setError('')
    setLogs([])

    addLog('Starting Supabase connection test...')

    try {
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set or is placeholder')
      }

      if (!supabaseKey || supabaseKey === 'your_supabase_anon_key') {
        throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or is placeholder')
      }

      addLog('✓ Environment variables found')
      addLog(`URL: ${supabaseUrl.substring(0, 30)}...`)
      addLog(`Key: ${supabaseKey.substring(0, 20)}...`)

      // Test connection
      const supabase = createClient()
      addLog('✓ Supabase client created')

      // Test basic connection by getting session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        addLog(`⚠ Session check warning: ${sessionError.message}`)
      } else {
        addLog('✓ Session check successful')
        if (session) {
          addLog(`✓ Active session found for user: ${session.user.email}`)
        }
      }

      // Test if we can query the auth users (this will fail if connection is bad)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError && !userError.message.includes('JWT') && !userError.message.includes('session missing')) {
        throw new Error(`Auth error: ${userError.message}`)
      }
      addLog('✓ Auth service accessible')

      if (user) {
        setUser(user)
        addLog(`✓ User authenticated: ${user.email}`)
      } else {
        addLog('ℹ No user currently authenticated (this is normal)')
      }

      // Test database connection with a simple query
      try {
        const { error: dbError } = await supabase
          .from('profiles')
          .select('count')
          .limit(0)

        if (dbError) {
          if (dbError.message.includes('relation "public.profiles" does not exist')) {
            addLog('⚠ Database tables not yet created - you need to run the schema.sql')
          } else {
            addLog(`⚠ Database query error: ${dbError.message}`)
          }
        } else {
          addLog('✓ Database connection successful')
        }
      } catch (dbErr) {
        addLog(`⚠ Database test failed: ${dbErr}`)
      }

      setConnectionStatus('connected')
      addLog('🎉 Supabase connection test completed successfully!')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setConnectionStatus('failed')
      addLog(`❌ Connection failed: ${errorMessage}`)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])


  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />
      default: return <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-background p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Supabase Connection Test</h1>
          <p className="text-muted-foreground">Testing your Supabase configuration and database connection</p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Connection Status
              <Badge variant={connectionStatus === 'connected' ? 'default' : connectionStatus === 'failed' ? 'destructive' : 'secondary'}>
                {connectionStatus}
              </Badge>
            </CardTitle>
            <CardDescription>
              Real-time connection status with your Supabase project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-sm">
                  URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ?
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` :
                    'Not set'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-green-500" />
                <span className="text-sm">
                  Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
                    `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` :
                    'Not set'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-500" />
                <span className="text-sm">
                  Auth: {user ? 'Authenticated' : 'Anonymous'}
                </span>
              </div>
            </div>

            {user && (
              <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Current User
                </h4>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs Card */}
        <Card>
          <CardHeader>
            <CardTitle>Connection Logs</CardTitle>
            <CardDescription>
              Detailed log of the connection test process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-muted-foreground">No logs yet...</div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={testConnection} disabled={connectionStatus === 'testing'}>
                {connectionStatus === 'testing' ? 'Testing...' : 'Test Again'}
              </Button>
              <Button variant="outline" onClick={() => setLogs([])}>
                Clear Logs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium">If the connection fails:</p>
              <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                <li>Make sure you've created a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a></li>
                <li>Copy your Project URL and anon key from Settings → API</li>
                <li>Update your <code className="bg-muted px-1 rounded">.env.local</code> file with the real values</li>
                <li>Restart your development server</li>
                <li>Run the database schema from <code className="bg-muted px-1 rounded">supabase/schema.sql</code> in Supabase SQL Editor</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}