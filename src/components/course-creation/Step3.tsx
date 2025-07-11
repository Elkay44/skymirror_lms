import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CourseFormData } from '@/types/course';

interface Step3Props {
  formData: CourseFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onToggle: (name: keyof CourseFormData, checked: boolean) => void;
}

export function Step3({ formData, onChange, onToggle }: Step3Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Free Course</Label>
          <p className="text-sm text-gray-500">Check this if the course is free</p>
        </div>
        <Switch
          checked={formData.isFree}
          onCheckedChange={(checked) => onToggle('isFree', checked)}
        />
      </div>

      {!formData.isFree && (
        <>
          <div>
            <Label htmlFor="price">Price (USD) *</Label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <Input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={onChange}
                min="0"
                step="0.01"
                className="pl-7"
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Discount</Label>
                <p className="text-sm text-gray-500">Offer this course at a discounted price</p>
              </div>
              <Switch
                checked={formData.hasDiscount}
                onCheckedChange={(checked) => onToggle('hasDiscount', checked)}
              />
            </div>

            {formData.hasDiscount && (
              <div className="mt-4">
                <Label htmlFor="discountedPrice">Discounted Price (USD) *</Label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    name="discountedPrice"
                    id="discountedPrice"
                    value={formData.discountedPrice}
                    onChange={onChange}
                    min="0"
                    step="0.01"
                    className="pl-7"
                    required
                  />
                </div>
                {formData.discountedPrice >= formData.price && (
                  <p className="mt-1 text-sm text-red-600">
                    Discounted price must be lower than the original price
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
