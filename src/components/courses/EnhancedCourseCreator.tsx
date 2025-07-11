import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, Plus, Image as ImageIcon, Video, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CourseFormData } from '@/types/course';

const STEPS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'content', label: 'Content' },
  { id: 'media', label: 'Media' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'settings', label: 'Settings' },
];

export function EnhancedCourseCreator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Extend CourseFormData to include our additional fields
  type FormDataState = Omit<CourseFormData, 'promoVideoUrl'> & {
    promoVideo: string;
    requirements: string[];
    learningOutcomes: string[];
    targetAudience: string[];
    imageUrl?: string;
  };

  const [formData, setFormData] = useState<FormDataState>({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    level: 'BEGINNER',
    language: 'en',
    price: 0,
    isFree: false,
    isPublished: false,
    isPrivate: false,
    hasDiscount: false,
    discountedPrice: 0,
    promoVideo: '',
    requirements: [''],
    learningOutcomes: [''],
    targetAudience: [''],
    imageFile: undefined,
    imagePreview: '',
    imageUrl: ''
  });

  const router = useRouter();

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleArrayChange = (
    field: 'requirements' | 'learningOutcomes' | 'targetAudience',
    index: number, 
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field: 'requirements' | 'learningOutcomes' | 'targetAudience') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'requirements' | 'learningOutcomes' | 'targetAudience', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (formData.imagePreview) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    };
  }, [formData.imagePreview]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Revoke previous object URL if exists
      if (formData.imagePreview) {
        URL.revokeObjectURL(formData.imagePreview);
      }
      
      // Create a preview URL for the image
      const imagePreview = URL.createObjectURL(file);
      
      // Store both the file and the preview URL
      setFormData(prev => ({
        ...prev,
        imagePreview,
        imageFile: file,
        imageUrl: file.name, // Store the file name as URL for reference
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add all form fields to FormData
      const { imageFile, promoVideo, requirements, learningOutcomes, targetAudience, ...rest } = formData;
      
      // Add regular fields
      Object.entries(rest).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            formDataToSend.append(key, JSON.stringify(value));
          } else if (typeof value === 'boolean' || typeof value === 'number') {
            formDataToSend.append(key, value.toString());
          } else if (value) { // Only append non-empty strings
            formDataToSend.append(key, value);
          }
        }
      });

      // Handle array fields
      formDataToSend.append('requirements', JSON.stringify(requirements));
      formDataToSend.append('learningOutcomes', JSON.stringify(learningOutcomes));
      formDataToSend.append('targetAudience', JSON.stringify(targetAudience));

      // Handle promo video
      if (promoVideo) {
        formDataToSend.append('promoVideoUrl', promoVideo);
      }

      // Handle image file if exists
      if (imageFile) {
        formDataToSend.append('imageFile', imageFile);
      }

      const response = await fetch('/api/courses/instructor', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create course');
      }

      const data = await response.json();
      toast.success('Course created successfully!');
      
      // Ensure we have a valid course ID before navigating
      const courseId = data.courses?.[0]?.id;
      if (!courseId) {
        throw new Error('Invalid course data received');
      }
      
      router.push(`/dashboard/instructor/courses/${courseId}`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Advanced Web Development"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shortDescription">Short Description</Label>
              <Textarea
                id="shortDescription"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleInputChange}
                placeholder="A brief description that appears in course cards"
                className="mt-1 min-h-[100px]"
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.shortDescription.length}/160 characters
              </p>
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-development">Web Development</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="it-software">IT & Software</SelectItem>
                  <SelectItem value="personal-development">Personal Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 1: // Content
        return (
          <div className="space-y-6">
            <div>
              <Label>Learning Outcomes</Label>
              <div className="space-y-2 mt-2">
                {formData.learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={outcome}
                      onChange={(e) => handleArrayChange('learningOutcomes', index, e.target.value)}
                      placeholder="What will students learn?"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeArrayItem('learningOutcomes', index)}
                      disabled={formData.learningOutcomes.length <= 1}
                    >
                      −
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => addArrayItem('learningOutcomes')}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Outcome
                </Button>
              </div>
            </div>
            {/* Similar sections for requirements and target audience */}
          </div>
        );
      case 2: // Media
        return (
          <div className="space-y-6">
            <div>
              <Label>Course Image</Label>
              <div className="mt-2">
                {formData.imagePreview ? (
                  <div className="relative group">
                    <img
                      src={formData.imagePreview}
                      alt="Course preview"
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-md">
                        Change Image
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <div className="flex justify-center">
                        <Upload className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="flex text-sm text-muted-foreground">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/90 focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 3: // Pricing
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isFree"
                checked={formData.isFree}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFree: checked }))}
              />
              <Label htmlFor="isFree">This is a free course</Label>
            </div>
            {!formData.isFree && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        );
      case 4: // Settings
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Publish Course</h3>
                <p className="text-sm text-muted-foreground">
                  Make your course visible to students
                </p>
              </div>
              <Switch
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Private Course</h3>
                <p className="text-sm text-muted-foreground">
                  Only enrolled students can access
                </p>
              </div>
              <Switch
                checked={formData.isPrivate}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create a New Course</h1>
        <p className="text-muted-foreground">
          Follow the steps to create an engaging learning experience for your students
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {index + 1}
              </div>
              <span className="text-sm text-center">{step.label}</span>
            </div>
          ))}
        </div>
        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
