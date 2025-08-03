'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  ChevronUp,
  ChevronDown,
  Trash,
  FileText,
  Image,
  Video,
  Code,
  Link as LinkIcon,
  Plus
} from 'lucide-react';

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'code' | 'link';
  content: string;
  caption?: string;
  url?: string;
}

interface BlockEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onChange
}) => {
  // Generate a unique ID for blocks
  const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Add a new block
  const addBlock = (type: 'text' | 'image' | 'video' | 'code' | 'link') => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      content: '',
      caption: type === 'image' || type === 'video' ? '' : undefined,
      url: type === 'image' || type === 'video' || type === 'link' ? '' : undefined
    };
    
    onChange([...blocks, newBlock]);
  };

  // Update a block's content
  const updateBlockContent = (id: string, content: string) => {
    const updatedBlocks = blocks.map(block => 
      block.id === id ? { ...block, content } : block
    );
    onChange(updatedBlocks);
  };

  // Update a block's caption
  const updateBlockCaption = (id: string, caption: string) => {
    const updatedBlocks = blocks.map(block => 
      block.id === id ? { ...block, caption } : block
    );
    onChange(updatedBlocks);
  };

  // Update a block's URL
  const updateBlockUrl = (id: string, url: string) => {
    const updatedBlocks = blocks.map(block => 
      block.id === id ? { ...block, url } : block
    );
    onChange(updatedBlocks);
  };

  // Delete a block
  const deleteBlock = (id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id);
    onChange(updatedBlocks);
  };

  // Move a block up
  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const updatedBlocks = [...blocks];
    const temp = updatedBlocks[index];
    updatedBlocks[index] = updatedBlocks[index - 1];
    updatedBlocks[index - 1] = temp;
    onChange(updatedBlocks);
  };

  // Move a block down
  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const updatedBlocks = [...blocks];
    const temp = updatedBlocks[index];
    updatedBlocks[index] = updatedBlocks[index + 1];
    updatedBlocks[index + 1] = temp;
    onChange(updatedBlocks);
  };

  // Render a specific block based on type
  const renderBlock = (block: ContentBlock, index: number) => {
    const commonControls = (
      <div className="flex space-x-1">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => moveBlockUp(index)}
          disabled={index === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => moveBlockDown(index)}
          disabled={index === blocks.length - 1}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700" 
          onClick={() => deleteBlock(block.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    );

    switch (block.type) {
      case 'text':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader className="p-3 flex flex-row items-center justify-between border-b">
              <div className="flex items-center text-sm font-medium">
                <FileText className="h-4 w-4 mr-2" />
                Text Block
              </div>
              {commonControls}
            </CardHeader>
            <CardContent className="p-3">
              <Textarea
                value={block.content}
                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                placeholder="Enter your text here..."
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        );
      
      case 'image':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader className="p-3 flex flex-row items-center justify-between border-b">
              <div className="flex items-center text-sm font-medium">
                <Image className="h-4 w-4 mr-2" />
                Image Block
              </div>
              {commonControls}
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={block.url || ''}
                  onChange={(e) => updateBlockUrl(block.id, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Caption</label>
                <Input
                  value={block.caption || ''}
                  onChange={(e) => updateBlockCaption(block.id, e.target.value)}
                  placeholder="Image caption"
                />
              </div>
              {block.url && (
                <div className="mt-2 border rounded p-1">
                  <p className="text-xs text-center text-gray-500 p-8">Image preview would appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      
      case 'video':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader className="p-3 flex flex-row items-center justify-between border-b">
              <div className="flex items-center text-sm font-medium">
                <Video className="h-4 w-4 mr-2" />
                Video Block
              </div>
              {commonControls}
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Video URL</label>
                <Input
                  value={block.url || ''}
                  onChange={(e) => updateBlockUrl(block.id, e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Caption</label>
                <Input
                  value={block.caption || ''}
                  onChange={(e) => updateBlockCaption(block.id, e.target.value)}
                  placeholder="Video caption"
                />
              </div>
              {block.url && (
                <div className="mt-2 border rounded aspect-video flex items-center justify-center">
                  <p className="text-xs text-center text-gray-500">Video embed would appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      
      case 'code':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader className="p-3 flex flex-row items-center justify-between border-b">
              <div className="flex items-center text-sm font-medium">
                <Code className="h-4 w-4 mr-2" />
                Code Block
              </div>
              {commonControls}
            </CardHeader>
            <CardContent className="p-3">
              <Textarea
                value={block.content}
                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                placeholder="Enter your code here..."
                className="min-h-[150px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        );
      
      case 'link':
        return (
          <Card key={block.id} className="mb-4">
            <CardHeader className="p-3 flex flex-row items-center justify-between border-b">
              <div className="flex items-center text-sm font-medium">
                <LinkIcon className="h-4 w-4 mr-2" />
                Link Block
              </div>
              {commonControls}
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Link Text</label>
                <Input
                  value={block.content}
                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                  placeholder="Link text to display"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  value={block.url || ''}
                  onChange={(e) => updateBlockUrl(block.id, e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="space-y-2">
        {blocks.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-md">
            <p className="text-gray-500">No content blocks yet. Add a block below to get started.</p>
          </div>
        ) : (
          blocks.map((block, index) => renderBlock(block, index))
        )}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock('text')}
          className="flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> <FileText className="h-3 w-3" /> Text
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock('image')}
          className="flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> <Image className="h-3 w-3" /> Image
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock('video')}
          className="flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> <Video className="h-3 w-3" /> Video
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock('code')}
          className="flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> <Code className="h-3 w-3" /> Code
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => addBlock('link')}
          className="flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> <LinkIcon className="h-3 w-3" /> Link
        </Button>
      </div>
    </div>
  );
};
