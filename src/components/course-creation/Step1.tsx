import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourseFormData } from '@/types/course';
import { COURSE_CATEGORIES, LANGUAGES } from '@/constants/course';

interface Step1Props {
  formData: CourseFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export function Step1({ formData, onChange }: Step1Props) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={onChange}
          placeholder="e.g., Learn React from Scratch"
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="shortDescription">Short Description *</Label>
        <Textarea
          id="shortDescription"
          name="shortDescription"
          value={formData.shortDescription}
          onChange={onChange}
          placeholder="A brief description of your course (max 160 characters)"
          className="mt-1"
          rows={2}
          maxLength={160}
          required
        />
        <p className="mt-1 text-sm text-gray-500 break-words">
          {formData.shortDescription.length}/160 characters
        </p>
      </div>

      <div>
        <Label htmlFor="description">Detailed Description *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onChange}
          placeholder="What will students learn in your course? What are the main topics covered?"
          className="mt-1 min-h-[150px]"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => 
              onChange({ target: { name: 'category', value } } as any)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {COURSE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="level">Difficulty Level</Label>
          <Select
            value={formData.level}
            onValueChange={(value: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') => 
              onChange({ target: { name: 'level', value } } as any)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select difficulty level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEGINNER">Beginner</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
              <SelectItem value="ADVANCED">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="language">Language</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => 
              onChange({ target: { name: 'language', value } } as any)
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
