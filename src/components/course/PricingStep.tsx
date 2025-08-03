'use client';

import { useCourseForm } from '@/context/CourseFormContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Info, DollarSign, Tag, Gift, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useState } from 'react';

export function PricingStep() {
  const { formData, errors, handleChange } = useCourseForm();
  const [pricingTab, setPricingTab] = useState('regular');
  const [saleEndDate, setSaleEndDate] = useState<Date | undefined>(
    formData.saleEndDate ? new Date(formData.saleEndDate) : undefined
  );

  const handleFreeToggle = (checked: boolean) => {
    handleChange('isFree', checked);
    if (checked) {
      handleChange('price', 0);
      handleChange('hasDiscount', false);
      handleChange('discountedPrice', 0);
    }
  };

  const handleDiscountToggle = (checked: boolean) => {
    handleChange('hasDiscount', checked);
    if (!checked) {
      handleChange('discountedPrice', 0);
      handleChange('saleEndDate', undefined);
      setSaleEndDate(undefined);
    }
  };

  const handleSaleEndDate = (date?: Date) => {
    setSaleEndDate(date);
    handleChange('saleEndDate', date ? date.toISOString() : undefined);
  };

  const handleEnrollmentLimit = (value: string) => {
    if (value === 'unlimited') {
      handleChange('hasEnrollmentLimit', false);
      handleChange('enrollmentLimit', 0);
    } else {
      handleChange('hasEnrollmentLimit', true);
    }
  };

  const calculateDiscount = () => {
    if (formData.price && formData.discountedPrice) {
      const discount = ((formData.price - formData.discountedPrice) / formData.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Course Pricing & Marketing</h2>
        <p className="text-muted-foreground text-sm">
          Set your course pricing strategy and marketing options
        </p>
      </div>

      <Tabs value={pricingTab} onValueChange={setPricingTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="regular">Regular Pricing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="regular" className="space-y-6 pt-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="isFree" className="text-base font-medium cursor-pointer">
                  Free Course
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Make this course available for free to all students
              </p>
            </div>
            <Switch
              id="isFree"
              checked={formData.isFree}
              onCheckedChange={handleFreeToggle}
            />
          </div>
          
          {!formData.isFree && (
            <>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="price" className="text-base font-medium mb-2 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" /> Regular Price
                    </Label>
                    <div className="relative">
                      <DollarSign className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price || 0}
                        onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                        className="pl-8"
                        placeholder="29.99"
                      />
                    </div>
                    {errors.price && <p className="text-sm text-destructive mt-1">{errors.price}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      Set a price between $0 and $999.99
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="hasDiscount" className="text-base font-medium cursor-pointer">
                          Discounted Price
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Offer your course at a discounted rate
                      </p>
                    </div>
                    <Switch
                      id="hasDiscount"
                      checked={formData.hasDiscount}
                      onCheckedChange={handleDiscountToggle}
                      disabled={formData.isFree}
                    />
                  </div>

                  {formData.hasDiscount && (
                    <div className="space-y-4 pt-2 pl-4 border-l-2 border-primary/20">
                      <div>
                        <Label htmlFor="discountedPrice" className="text-base font-medium mb-2">
                          Sale Price
                        </Label>
                        <div className="relative">
                          <DollarSign className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="discountedPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            max={formData.price}
                            value={formData.discountedPrice || 0}
                            onChange={(e) => handleChange('discountedPrice', parseFloat(e.target.value) || 0)}
                            className="pl-8"
                            placeholder="19.99"
                          />
                        </div>
                        {errors.discountedPrice && (
                          <p className="text-sm text-destructive mt-1">{errors.discountedPrice}</p>
                        )}
                        
                        {formData.price > 0 && formData.discountedPrice > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              {calculateDiscount()}% OFF
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              You're offering a {calculateDiscount()}% discount
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <Label className="text-base font-medium mb-2 flex items-center gap-1">
                          <Clock className="h-4 w-4" /> Sale End Date (Optional)
                        </Label>
                        <DatePicker
                          date={saleEndDate}
                          setDate={handleSaleEndDate}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          If set, the discount will automatically end on this date
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Alert variant="default" className="bg-muted/50">
                <Info className="h-4 w-4" />
                <AlertTitle>Pricing Tips</AlertTitle>
                <AlertDescription className="text-sm">
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Higher-priced courses often signal higher quality</li>
                    <li>Consider the value you're providing to students</li>
                    <li>Limited-time discounts can create urgency and boost sales</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6 pt-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-medium">Enrollment Limit</Label>
                <RadioGroup 
                  value={formData.hasEnrollmentLimit ? 'limited' : 'unlimited'}
                  onValueChange={handleEnrollmentLimit}
                  className="grid gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unlimited" id="unlimited" />
                    <Label htmlFor="unlimited" className="cursor-pointer">
                      Unlimited enrollments
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limited" id="limited" />
                    <Label htmlFor="limited" className="cursor-pointer">
                      Limit enrollments
                    </Label>
                  </div>
                </RadioGroup>
                
                {formData.hasEnrollmentLimit && (
                  <div className="pt-2 pl-6">
                    <Label htmlFor="enrollmentLimit">Maximum number of students</Label>
                    <Input
                      id="enrollmentLimit"
                      type="number"
                      min="1"
                      value={formData.enrollmentLimit || 50}
                      onChange={(e) => handleChange('enrollmentLimit', parseInt(e.target.value) || 50)}
                      className="mt-1 w-32"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Creates scarcity and can increase perceived value
                    </p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Course Access Duration</Label>
                <RadioGroup 
                  value={formData.hasAccessLimit ? 'limited' : 'lifetime'} 
                  onValueChange={(value) => handleChange('hasAccessLimit', value === 'limited')}
                  className="grid gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lifetime" id="lifetime" />
                    <Label htmlFor="lifetime" className="cursor-pointer">
                      Lifetime access
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limited" id="limited-access" />
                    <Label htmlFor="limited-access" className="cursor-pointer">
                      Limited access period
                    </Label>
                  </div>
                </RadioGroup>
                
                {formData.hasAccessLimit && (
                  <div className="pt-2 pl-6 flex items-center gap-2">
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        value={formData.accessDuration || 30}
                        onChange={(e) => handleChange('accessDuration', parseInt(e.target.value) || 30)}
                      />
                    </div>
                    <Select
                      value={formData.accessPeriod || 'days'}
                      onValueChange={(value) => handleChange('accessPeriod', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Bundle Options</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="availableInBundles" className="font-medium cursor-pointer">
                      Available in Course Bundles
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow this course to be included in bundle offerings
                    </p>
                  </div>
                  <Switch
                    id="availableInBundles"
                    checked={formData.availableInBundles !== false}
                    onCheckedChange={(checked) => handleChange('availableInBundles', checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-base font-medium">Course Certificates</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label htmlFor="offersCertificate" className="font-medium cursor-pointer">
                      Completion Certificate
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Offer a certificate to students who complete the course
                    </p>
                  </div>
                  <Switch
                    id="offersCertificate"
                    checked={formData.offersCertificate !== false}
                    onCheckedChange={(checked) => handleChange('offersCertificate', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
