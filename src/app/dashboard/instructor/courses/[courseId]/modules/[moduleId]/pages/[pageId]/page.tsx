'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { PageLayout } from '../../../../_components/PageLayout';
import { ModulePage, ContentBlock, ContentBlockType } from '@/types/module';
import { getModulePage, updateModulePage, deleteModulePage } from '@/lib/api/module-pages';
import { ContentBlockEditor } from '../../_components/ContentBlockEditor';
import { BlockItem } from '../../_components/BlockItem';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ModulePageView() {
  const params = useParams<{ courseId: string; moduleId: string; pageId: string }>();
  const router = useRouter();
  const { courseId, moduleId, pageId } = params;
  
  const [page, setPage] = useState<ModulePage | null>(null);
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | undefined>(undefined);
  const [selectedBlockType, setSelectedBlockType] = useState<ContentBlockType>('text');
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch page data
  useEffect(() => {
    async function fetchPage() {
      try {
        setIsLoading(true);
        const pageData = await getModulePage(courseId, moduleId, pageId);
        setPage(pageData);
        setBlocks(pageData.contentBlocks || []);
        setTitle(pageData.title);
        setDescription(pageData.description || '');
      } catch (error) {
        console.error('Error fetching page data:', error);
        toast.error('Failed to load page data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPage();
  }, [courseId, moduleId, pageId]);

  const handleEditBlock = (block: ContentBlock) => {
    setEditingBlock(block);
    setSelectedBlockType(block.type);
    setIsBlockEditorOpen(true);
  };

  const handleAddBlock = (type: ContentBlockType = 'text') => {
    setEditingBlock(undefined);
    setSelectedBlockType(type);
    setIsBlockEditorOpen(true);
  };

  const handleSaveBlock = async (block: ContentBlock) => {
    if (!page) return;

    try {
      let updatedBlocks: ContentBlock[];
      
      if (editingBlock) {
        // Update existing block
        updatedBlocks = blocks.map(b => 
          b.id === editingBlock.id ? { ...block } : b
        );
      } else {
        // Add new block with a temporary ID
        const newBlock = {
          ...block,
          id: `temp-${Date.now()}`,
          order: blocks.length + 1
        };
        updatedBlocks = [...blocks, newBlock];
      }
      
      setBlocks(updatedBlocks);
      setIsBlockEditorOpen(false);
      
      // Save page with updated blocks
      await updateModulePage(courseId, moduleId, pageId, {
        contentBlocks: updatedBlocks
      });
      
      toast.success(editingBlock ? 'Block updated' : 'Block added');
    } catch (error) {
      console.error('Error saving block:', error);
      toast.error('Failed to save block');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!page) return;
    
    try {
      const updatedBlocks = blocks.filter(b => b.id !== blockId);
      setBlocks(updatedBlocks);
      
      // Save page with updated blocks
      await updateModulePage(courseId, moduleId, pageId, {
        contentBlocks: updatedBlocks
      });
      
      toast.success('Block removed');
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Failed to delete block');
    }
  };

  const handleSavePage = async () => {
    if (!page) return;
    
    try {
      setIsSaving(true);
      await updateModulePage(courseId, moduleId, pageId, {
        title,
        description
      });
      
      setIsEditing(false);
      toast.success('Page updated');
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error('Failed to update page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePage = async () => {
    if (!window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await deleteModulePage(courseId, moduleId, pageId);
      toast.success('Page deleted');
      router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`);
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Loading Module Page" backHref={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!page) {
    return (
      <PageLayout title="Page Not Found" backHref={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`}>
        <div className="p-6">
          <div className="mb-4">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The page you are looking for doesn't exist or you don't have permission to access it.
            </p>
            <Button onClick={() => router.push(`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`)}>
              Return to Module
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={page?.title || 'Module Page'} backHref={`/dashboard/instructor/courses/${courseId}/modules/${moduleId}`}>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Module
          </Button>
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSavePage} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Details
                </Button>
                <Button variant="destructive" onClick={handleDeletePage}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Page
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Page title"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Page description (optional)"
                    className="w-full"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold mb-2">{page.title}</h1>
                {page.description && (
                  <p className="text-muted-foreground mb-2">{page.description}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Content Blocks</h2>
            <div className="flex gap-2">
              <Button onClick={() => handleAddBlock('text')} variant="outline" size="sm">
                Add Text
              </Button>
              <Button onClick={() => handleAddBlock('video')} variant="outline" size="sm">
                Add Video
              </Button>
              <Button onClick={() => handleAddBlock('youtube')} variant="outline" size="sm">
                Add YouTube
              </Button>
              <Button onClick={() => handleAddBlock('assignment')} variant="outline" size="sm">
                Add Assignment
              </Button>
            </div>
          </div>

          {blocks.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No content blocks yet</p>
                  <Button onClick={() => handleAddBlock()}>
                    Add Your First Content Block
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {blocks.map((block) => (
                <BlockItem
                  key={block.id}
                  block={block}
                  onEdit={() => handleEditBlock(block)}
                  onDelete={() => handleDeleteBlock(block.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Block Editor Dialog */}
      <ContentBlockEditor
        courseId={courseId}
        moduleId={moduleId}
        pageId={pageId}
        block={editingBlock}
        isOpen={isBlockEditorOpen}
        onClose={() => setIsBlockEditorOpen(false)}
        onSave={handleSaveBlock}
        selectedType={selectedBlockType}
      />
    </PageLayout>
  );
}
