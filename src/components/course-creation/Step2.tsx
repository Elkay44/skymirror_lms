import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, X } from 'lucide-react';
import { CourseFormData } from '@/types/course';

interface Step2Props {
  formData: CourseFormData;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<CourseFormData>>;
}

export function Step2({ formData, onImageUpload, onChange, setFormData }: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Course Image *</Label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {formData.imagePreview ? (
              <div className="relative">
                <img
                  src={formData.imagePreview}
                  alt="Course preview"
                  className="mx-auto h-48 w-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      imageFile: null,
                      imagePreview: ''
                    }));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={onImageUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="promoVideoUrl">Promotional Video URL (Optional)</Label>
        <Input
          id="promoVideoUrl"
          name="promoVideoUrl"
          type="url"
          value={formData.promoVideoUrl}
          onChange={onChange}
          placeholder="https://www.youtube.com/watch?v=..."
          className="mt-1"
        />
        <p className="mt-1 text-sm text-gray-500">
          Add a link to a promotional video for your course (YouTube, Vimeo, etc.)
        </p>
      </div>
    </div>
  );
}
EOLcat > /Users/lukman.ibrahim/Downloads/skymirror_academy_lms-main/src/components/course-creation/Step2.tsx << 'EOL'
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Image as ImageIcon, X } from 'lucide-react';
import { CourseFormData } from '@/types/course';

interface Step2Props {
  formData: CourseFormData;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<CourseFormData>>;
}

export function Step2({ formData, onImageUpload, onChange, setFormData }: Step2Props) {
  return (
    <div className="space-y-6">
      <div>
        <Label>Course Image *</Label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {formData.imagePreview ? (
              <div className="relative">
                <img
                  src={formData.imagePreview}
                  alt="Course preview"
                  className="mx-auto h-48 w-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      imageFile: null,
                      imagePreview: ''
                    }));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="image-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={onImageUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
              </>
            )}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="promoVideoUrl">Promotional Video URL (Optional)</Label>
        <Input
          id="promoVideoUrl"
          name="promoVideoUrl"
          type="url"
          value={formData.promoVideoUrl}
          onChange={onChange}
          placeholder="https://www.youtube.com/watch?v=..."
          className="mt-1"
        />
        <p className="mt-1 text-sm text-gray-500">
          Add a link to a promotional video for your course (YouTube, Vimeo, etc.)
        </p>
      </div>
    </div>
  );
}
