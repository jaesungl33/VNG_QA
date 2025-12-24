import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            VNG QA
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered Q&A system for game designers and developers.
            Ask questions about your codebase, documentation, and files.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/workspace">
              <Button size="lg" className="text-lg px-8 py-3">
                Get Started
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Try Chat
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Workspaces</CardTitle>
              <CardDescription>
                Organize your projects and files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create and manage workspaces to keep your game projects organized.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Chat</CardTitle>
              <CardDescription>
                Ask questions with context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Use @doc, @codebase, or @file references to get relevant answers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Registry</CardTitle>
              <CardDescription>
                Track your project files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Register and manage files in your workspace for better context.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
