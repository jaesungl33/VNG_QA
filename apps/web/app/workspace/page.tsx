'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@vng-qa/api-client';
import type { Workspace } from '@vng-qa/shared';
import { Plus, FolderOpen, MessageCircle, FileText } from 'lucide-react';

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      setError('Failed to load workspaces. Make sure the API is running.');
      console.error('Error loading workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setCreating(true);
      const workspace = await apiClient.createWorkspace({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim() || undefined,
      });
      setWorkspaces(prev => [...prev, workspace]);
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
    } catch (err) {
      setError('Failed to create workspace.');
      console.error('Error creating workspace:', err);
    } finally {
      setCreating(false);
    }
  };

  const selectWorkspace = (workspaceId: string) => {
    localStorage.setItem('selectedWorkspaceId', workspaceId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading workspaces...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Workspaces</h1>
          <p className="text-gray-600">Manage your game development projects</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Create Workspace Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Workspace
            </CardTitle>
            <CardDescription>
              Start a new project workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createWorkspace} className="flex gap-4">
              <Input
                placeholder="Workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Description (optional)"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Workspaces List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  {workspace.name}
                </CardTitle>
                {workspace.description && (
                  <CardDescription>{workspace.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Link href={`/chat?workspace=${workspace.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectWorkspace(workspace.id)}
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </Button>
                  </Link>
                  <Link href={`/files?workspace=${workspace.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectWorkspace(workspace.id)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Files
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {workspaces.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first workspace to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
