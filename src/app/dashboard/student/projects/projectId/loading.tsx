import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          
          <div className="mt-8 space-y-2">
            <Skeleton className="h-8 w-48 mb-4" />
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
