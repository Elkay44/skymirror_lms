import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { CourseFormData } from '@/types/course';

interface Step4Props {
  formData: CourseFormData;
  onArrayFieldChange: (field: keyof CourseFormData, index: number, value: string) => void;
  onAddArrayFieldItem: (field: keyof CourseFormData) => void;
  onRemoveArrayFieldItem: (field: keyof CourseFormData, index: number) => void;
}

export function Step4({
  formData,
  onArrayFieldChange,
  onAddArrayFieldItem,
  onRemoveArrayFieldItem,
}: Step4Props) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Requirements</h3>
        <p className="text-sm text-gray-500 mb-4">
          What are the requirements or prerequisites for taking this course?
        </p>
        <div className="space-y-3">
          {formData.requirements.map((requirement, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={requirement}
                onChange={(e) => onArrayFieldChange('requirements', index, e.target.value)}
                placeholder={`Requirement ${index + 1}`}
                className="flex-1"
                required={index === 0}
              />
              {formData.requirements.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onRemoveArrayFieldItem('requirements', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => onAddArrayFieldItem('requirements')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Requirement
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">What Students Will Learn</h3>
        <p className="text-sm text-gray-500 mb-4">
          Add the key learning outcomes for your course
        </p>
        <div className="space-y-3">
          {formData.learningOutcomes.map((outcome, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={outcome}
                onChange={(e) => onArrayFieldChange('learningOutcomes', index, e.target.value)}
                placeholder={`Learning outcome ${index + 1}`}
                className="flex-1"
                required={index === 0}
              />
              {formData.learningOutcomes.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onRemoveArrayFieldItem('learningOutcomes', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => onAddArrayFieldItem('learningOutcomes')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Learning Outcome
          </Button>
        </div>
      </div>
    </div>
  );
}
