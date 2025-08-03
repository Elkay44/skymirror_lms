'use client';

import { useCourseForm } from '@/context/CourseFormContext';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Lock, Globe } from 'lucide-react';

export function FinalStep() {
  const { formData, handleChange } = useCourseForm();

  return (
    <div className="space-y-8">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Almost there!</AlertTitle>
        <AlertDescription>
          Review your course settings before publishing.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Course Status</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">
                  {formData.isPublished ? 'Published' : 'Draft'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formData.isPublished
                    ? 'Your course will be visible to students after review.'
                    : 'Your course is currently a draft and not visible to students.'}
                </p>
              </div>
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleChange('isPublished', checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Course Visibility</h3>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {formData.isPrivate ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {formData.isPrivate ? 'Private' : 'Public'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formData.isPrivate
                      ? 'Only students with an enrollment link can access this course.'
                      : 'This course will be publicly visible in the course catalog.'}
                  </p>
                </div>
              </div>
              <Switch
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={(checked) => handleChange('isPrivate', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
        <div className="flex items-start">
          <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
              Ready to publish?
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Your course will be reviewed by our team before it goes live. This process usually takes 1-2 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
