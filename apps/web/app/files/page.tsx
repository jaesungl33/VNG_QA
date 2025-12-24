'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@vng-qa/api-client';
import type { File, Workspace } from '@vng-qa/shared';
import { ArrowLeft, Plus, FileText, FileType, Upload, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function FilesPage() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspace');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFileSlug, setNewFileSlug] = useState('');
  const [newFileType, setNewFileType] = useState('');
  const [newFileSize, setNewFileSize] = useState('');
  const [creating, setCreating] = useState(false);

  // Upload states
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingZip, setUploadingZip] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [embedding, setEmbedding] = useState(false);

  // File input refs
  const docFileRef = useRef<HTMLInputElement>(null);
  const zipFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
      loadFiles();
    } else {
      setLoading(false);
      setError('No workspace selected. Please select a workspace first.');
    }
  }, [workspaceId]);

  const loadWorkspace = async () => {
    if (!workspaceId) return;
    try {
      const data = await apiClient.getWorkspace(workspaceId);
      setWorkspace(data);
    } catch (err) {
      console.error('Error loading workspace:', err);
    }
  };

  const loadFiles = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const data = await apiClient.getFiles(workspaceId);
      setFiles(data);
    } catch (err) {
      setError('Failed to load files. Make sure the API is running.');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !newFileName.trim() || !newFileSlug.trim() || !newFileType.trim()) return;

    try {
      setCreating(true);
      const file = await apiClient.createFile(workspaceId, {
        workspace_id: workspaceId,
        name: newFileName.trim(),
        slug: newFileSlug.trim(),
        file_type: newFileType.trim(),
        size_bytes: newFileSize ? parseInt(newFileSize) : undefined,
      });
      setFiles(prev => [...prev, file]);
      setNewFileName('');
      setNewFileSlug('');
      setNewFileType('');
      setNewFileSize('');
    } catch (err) {
      setError('Failed to create file record.');
      console.error('Error creating file:', err);
    } finally {
      setCreating(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!workspaceId) return;
    try {
      await apiClient.deleteFile(workspaceId, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      setError('Failed to delete file record.');
      console.error('Error deleting file:', err);
    }
  };

  const uploadDocFile = async (file: File) => {
    if (!workspaceId) return;
    try {
      setUploadingDoc(true);
      const response = await apiClient.uploadDocFile(workspaceId, file);
      await loadFiles(); // Refresh the file list
      setError(null);
    } catch (err) {
      setError('Failed to upload document.');
      console.error('Error uploading document:', err);
    } finally {
      setUploadingDoc(false);
      if (docFileRef.current) {
        docFileRef.current.value = '';
      }
    }
  };

  const uploadZipFile = async (file: File) => {
    if (!workspaceId) return;
    try {
      setUploadingZip(true);
      const response = await apiClient.uploadCodeZip(workspaceId, file);
      await loadFiles(); // Refresh the file list
      setError(null);
    } catch (err) {
      setError('Failed to upload code zip.');
      console.error('Error uploading code zip:', err);
    } finally {
      setUploadingZip(false);
      if (zipFileRef.current) {
        zipFileRef.current.value = '';
      }
    }
  };

  const runIndexing = async () => {
    if (!workspaceId) return;
    try {
      setIndexing(true);
      const response = await apiClient.runIndexing(workspaceId);
      await loadFiles(); // Refresh to show updated statuses
      setError(null);
    } catch (err) {
      setError('Failed to run indexing.');
      console.error('Error running indexing:', err);
    } finally {
      setIndexing(false);
    }
  };

  const runEmbedding = async () => {
    if (!workspaceId) return;
    try {
      setEmbedding(true);
      const response = await apiClient.runEmbedding(workspaceId);
      await loadFiles(); // Refresh to show any status updates
      setError(null);
    } catch (err) {
      setError('Failed to run embedding.');
      console.error('Error running embedding:', err);
    } finally {
      setEmbedding(false);
    }
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDocFile(file);
    }
  };

  const handleZipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadZipFile(file);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'Uploaded';
      case 'processing':
        return 'Processing';
      case 'ready':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading files...</div>
      </div>
    );
  }

  if (error && !workspaceId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Link href="/workspace">
                <Button>Select Workspace</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/workspace">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Workspaces
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Files - {workspace?.name || 'Workspace'}
          </h1>
          <p className="text-gray-600">Manage file records in your workspace</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Upload Forms */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Document
              </CardTitle>
              <CardDescription>
                Upload text files (txt, md) or PDFs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={docFileRef}
                type="file"
                accept=".txt,.md,.pdf"
                onChange={handleDocFileChange}
                disabled={uploadingDoc}
                className="hidden"
                id="doc-upload"
              />
              <label htmlFor="doc-upload">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={uploadingDoc}
                  asChild
                >
                  <span className="cursor-pointer">
                    {uploadingDoc ? 'Uploading...' : 'Choose Document File'}
                  </span>
                </Button>
              </label>
            </CardContent>
          </Card>

          {/* Code Zip Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Code Zip
              </CardTitle>
              <CardDescription>
                Upload a zip file containing code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={zipFileRef}
                type="file"
                accept=".zip"
                onChange={handleZipFileChange}
                disabled={uploadingZip}
                className="hidden"
                id="zip-upload"
              />
              <label htmlFor="zip-upload">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={uploadingZip}
                  asChild
                >
                  <span className="cursor-pointer">
                    {uploadingZip ? 'Uploading...' : 'Choose Zip File'}
                  </span>
                </Button>
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Indexing and Embedding Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Step 1: Run Indexing
              </CardTitle>
              <CardDescription>
                Process uploaded files and create searchable chunks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runIndexing}
                disabled={indexing}
                className="w-full"
                variant="outline"
              >
                {indexing ? 'Indexing...' : 'Run Indexing'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Step 2: Create Embeddings
              </CardTitle>
              <CardDescription>
                Generate vector embeddings for semantic search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runEmbedding}
                disabled={embedding}
                className="w-full"
              >
                {embedding ? 'Creating Embeddings...' : 'Create Embeddings'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Create File Form (Legacy) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add File Record (Manual)
            </CardTitle>
            <CardDescription>
              Register a file record manually (advanced)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createFile} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input
                placeholder="File name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                required
              />
              <Input
                placeholder="Slug (e.g., auth.py)"
                value={newFileSlug}
                onChange={(e) => setNewFileSlug(e.target.value)}
                required
              />
              <Input
                placeholder="Type (e.g., python, json)"
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value)}
                required
              />
              <Input
                type="number"
                placeholder="Size in bytes (optional)"
                value={newFileSize}
                onChange={(e) => setNewFileSize(e.target.value)}
              />
              <Button type="submit" disabled={creating} className="md:col-span-1">
                {creating ? 'Creating...' : 'Add File'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Files ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No files yet
                </h3>
                <p className="text-gray-600">
                  Add your first file record to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileType className="w-8 h-8 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{file.name}</h4>
                          {getStatusIcon(file.status)}
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {getStatusText(file.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          @{file.slug} • {file.source_type} • {file.file_type} • {formatFileSize(file.size_bytes)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(file.created_at).toLocaleDateString()}
                        </p>
                        {file.error_message && (
                          <p className="text-xs text-red-600 mt-1">
                            Error: {file.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteFile(file.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
