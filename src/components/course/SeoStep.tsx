'use client';

import { useState } from 'react';
import { useCourseForm } from '@/context/CourseFormContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Search, Tag, Globe, AlertCircle } from 'lucide-react';

export function SeoStep() {
  const { formData, handleChange } = useCourseForm();
  const [keywords, setKeywords] = useState<string[]>(formData.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  
  // Calculate SEO score
  const calculateSeoScore = () => {
    let score = 0;
    
    // Title length (ideal: 50-60 chars)
    if (formData.seoTitle) {
      const titleLength = formData.seoTitle.length;
      if (titleLength >= 40 && titleLength <= 70) score += 20;
      else if (titleLength >= 30 && titleLength <= 80) score += 15;
      else if (titleLength > 0) score += 10;
    }
    
    // Description length (ideal: 150-160 chars)
    if (formData.seoDescription) {
      const descLength = formData.seoDescription.length;
      if (descLength >= 140 && descLength <= 170) score += 20;
      else if (descLength >= 100 && descLength <= 200) score += 15;
      else if (descLength > 0) score += 10;
    }
    
    // Keywords (ideal: 3-5)
    if (keywords.length > 0) {
      if (keywords.length >= 3 && keywords.length <= 5) score += 20;
      else if (keywords.length > 5) score += 15;
      else score += 10;
    }
    
    // URL slug (ideal: contains keywords, no special chars)
    if (formData.slug) {
      if (formData.slug.length > 0) score += 10;
      if (/^[a-z0-9-]+$/.test(formData.slug)) score += 10;
    }
    
    // Social image
    if (formData.socialImageUrl) score += 20;
    
    return score;
  };
  
  const seoScore = calculateSeoScore();
  
  const getSeoScoreColor = () => {
    if (seoScore >= 80) return 'bg-green-500';
    if (seoScore >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getSeoScoreText = () => {
    if (seoScore >= 80) return 'Excellent';
    if (seoScore >= 50) return 'Good';
    if (seoScore >= 30) return 'Needs Improvement';
    return 'Poor';
  };
  
  // Handle keywords
  const addKeyword = () => {
    if (!keywordInput.trim() || keywords.includes(keywordInput.trim())) return;
    
    const newKeywords = [...keywords, keywordInput.trim()];
    setKeywords(newKeywords);
    handleChange('keywords', newKeywords);
    setKeywordInput('');
  };
  
  const removeKeyword = (keyword: string) => {
    const newKeywords = keywords.filter(k => k !== keyword);
    setKeywords(newKeywords);
    handleChange('keywords', newKeywords);
  };
  
  // Generate slug from title
  const generateSlug = () => {
    if (!formData.title) return;
    
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')  // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-');      // Remove consecutive hyphens
    
    handleChange('slug', slug);
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Search Engine Optimization</h2>
          <p className="text-muted-foreground text-sm">
            Improve your course's visibility in search results
          </p>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">SEO Score:</div>
            <div className="text-xl font-bold">{seoScore}%</div>
          </div>
          <div className="w-full mt-1">
            <Progress value={seoScore} className={`h-2 ${getSeoScoreColor()}`} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {getSeoScoreText()}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="seoTitle" className="font-medium">SEO Title</Label>
                </div>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle || ''}
                  onChange={(e) => handleChange('seoTitle', e.target.value)}
                  placeholder="Optimized title for search engines"
                  className="mt-1"
                />
                <div className="flex items-center justify-between mt-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => handleChange('seoTitle', formData.title)}
                  >
                    Use course title
                  </Button>
                  <p className={`text-xs ${formData.seoTitle && formData.seoTitle.length > 70 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {(formData.seoTitle?.length || 0)}/70
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ideal length: 50-60 characters. Include your main keyword near the beginning.
                </p>
              </div>
              
              <div>
                <Label htmlFor="seoDescription" className="font-medium">Meta Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription || ''}
                  onChange={(e) => handleChange('seoDescription', e.target.value)}
                  placeholder="A compelling summary of your course for search results"
                  className="mt-1"
                  rows={3}
                />
                <div className="flex items-center justify-between mt-1">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => handleChange('seoDescription', formData.shortDescription)}
                  >
                    Use short description
                  </Button>
                  <p className={`text-xs ${formData.seoDescription && formData.seoDescription.length > 160 ? 'text-red-500' : 'text-muted-foreground'}`}>
                    {(formData.seoDescription?.length || 0)}/160
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ideal length: 150-160 characters. Include your main keyword and a call to action.
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="keywords" className="font-medium">Keywords</Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {keywords.length}/5 recommended
                  </Badge>
                </div>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="keywords"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Enter a keyword"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  />
                  <Button type="button" onClick={addKeyword} variant="secondary">
                    Add
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {keyword}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                          onClick={() => removeKeyword(keyword)}
                        >
                          &times;
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Add 3-5 relevant keywords that describe your course content
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="slug" className="font-medium">URL Slug</Label>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={generateSlug}
                  >
                    Generate from title
                  </Button>
                </div>
                <Input
                  id="slug"
                  value={formData.slug || ''}
                  onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^\w-]/g, '-'))}
                  placeholder="your-course-url-slug"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use hyphens to separate words. Include your main keyword if possible.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="socialTitle" className="font-medium">Social Media Title</Label>
                <Input
                  id="socialTitle"
                  value={formData.socialTitle || ''}
                  onChange={(e) => handleChange('socialTitle', e.target.value)}
                  placeholder="Title for social media shares"
                  className="mt-1"
                />
                <div className="flex justify-end mt-1">
                  <p className="text-xs text-muted-foreground">
                    {(formData.socialTitle?.length || 0)}/60
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="socialDescription" className="font-medium">Social Media Description</Label>
                <Textarea
                  id="socialDescription"
                  value={formData.socialDescription || ''}
                  onChange={(e) => handleChange('socialDescription', e.target.value)}
                  placeholder="Description for social media shares"
                  className="mt-1"
                  rows={2}
                />
                <div className="flex justify-end mt-1">
                  <p className="text-xs text-muted-foreground">
                    {(formData.socialDescription?.length || 0)}/120
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Social Media Image</Label>
                <div className="mt-2 border border-dashed rounded-lg p-4 text-center">
                  {formData.socialImageUrl ? (
                    <div className="relative">
                      <img 
                        src={formData.socialImageUrl} 
                        alt="Social preview" 
                        className="w-full h-40 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                        <Button variant="secondary" size="sm">Change Image</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8">
                      <p className="text-sm text-muted-foreground">
                        Upload an image for social media shares (1200 × 630px recommended)
                      </p>
                      <Button type="button" variant="secondary" className="mt-2">
                        Upload Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <Alert variant="default" className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertTitle>Social Media Preview</AlertTitle>
                <AlertDescription className="text-sm">
                  When your course is shared on platforms like Facebook, Twitter, or LinkedIn, 
                  the social media title, description, and image will be displayed.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          <Alert variant="default" className="border-amber-200 bg-amber-50 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>SEO Tips</AlertTitle>
            <AlertDescription className="text-sm">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Use your main keyword in your title, description, and URL</li>
                <li>Make your meta description compelling and actionable</li>
                <li>Choose a high-quality social image to increase click rates</li>
                <li>Target specific search terms your students use</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
