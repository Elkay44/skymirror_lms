'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Step2Props {
  formData: {
    price: number;
    isFree: boolean;
    hasDiscount: boolean;
    discountedPrice: number;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onToggle: (name: string, checked: boolean) => void;
  onArrayFieldChange?: (field: string, index: number, value: string) => void;
  onAddArrayFieldItem?: (field: string, defaultValue: string) => void;
  onRemoveArrayFieldItem?: (field: string, index: number) => void;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Step2({ formData, onChange, onToggle }: Step2Props) {
  const [localPrice, setLocalPrice] = useState(formData.price.toString());
  const [localDiscountedPrice, setLocalDiscountedPrice] = useState(
    formData.discountedPrice.toString()
  );

  // Sync local state with form data
  useEffect(() => {
    setLocalPrice(formData.price.toString());
  }, [formData.price]);

  useEffect(() => {
    setLocalDiscountedPrice(formData.discountedPrice.toString());
  }, [formData.discountedPrice]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setLocalPrice(value);
      // Create a new input element for the event
      const input = document.createElement('input');
      input.name = 'price';
      input.value = value;
      
      // Create a new event with the correct type
      const event = {
        ...e,
        target: input,
        currentTarget: input,
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      onChange(event);
    }
  };

  const handleDiscountedPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setLocalDiscountedPrice(value);
      // Create a new input element for the event
      const input = document.createElement('input');
      input.name = 'discountedPrice';
      input.value = value;
      
      // Create a new event with the correct type
      const event = {
        ...e,
        target: input,
        currentTarget: input,
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      
      onChange(event);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Free Course</Label>
            <p className="text-sm text-gray-500">
              Set whether this course is free or paid
            </p>
          </div>
          <Switch
            checked={formData.isFree}
            onCheckedChange={(checked) => onToggle('isFree', checked)}
          />
        </div>

        {!formData.isFree && (
          <>
            <div className="pt-4">
              <Label htmlFor="price">Course Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="text"
                value={localPrice}
                onChange={handlePriceChange}
                placeholder="0.00"
                className="mt-1"
                inputMode="decimal"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <Label>Add Discount</Label>
                <p className="text-sm text-gray-500">
                  Offer this course at a discounted price
                </p>
              </div>
              <Switch
                checked={formData.hasDiscount}
                onCheckedChange={(checked) =>
                  onToggle('hasDiscount', checked)
                }
              />
            </div>

            {formData.hasDiscount && (
              <div className="pt-2">
                <Label htmlFor="discountedPrice">Discounted Price ($)</Label>
                <Input
                  id="discountedPrice"
                  name="discountedPrice"
                  type="text"
                  value={localDiscountedPrice}
                  onChange={handleDiscountedPriceChange}
                  placeholder="0.00"
                  className="mt-1"
                  inputMode="decimal"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
