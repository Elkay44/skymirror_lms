import { Course } from "@/types/course.types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Star, StarHalf, Heart, Share2, Clock, Users, BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  course: Course
  variant?: 'default' | 'compact' | 'detailed'
  showInstructor?: boolean
  showProgress?: boolean
  className?: string
  onEnroll?: (courseId: string) => Promise<void>
  onToggleFavorite?: (courseId: string, isFavorite: boolean) => Promise<void>
  onShare?: (course: Course) => void
}

export function CourseCard({
  course,
  variant = 'default',
  showInstructor = true,
  showProgress = false,
  className = '',
  onEnroll,
  onToggleFavorite,
  onShare,
}: CourseCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const {
    id,
    title,
    description,
    shortDescription,
    imageUrl,
    category,
    level,
    price,
    discountedPrice,
    duration,
    isEnrolled,
    isNew,
    isBestSeller,
    progress,
    modules,
    projects,
    grades,
    promoVideo,
    instructor,
    rating,
    reviewCount,
    studentCount,
    lessonCount,
    requirements,
    learningOutcomes,
    targetAudience,
    isPublished,
    isPrivate
  } = course

  const handleEnroll = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (isEnrolled) {
      router.push(`/courses/${course.slug}`)
      return
    }

    try {
      setIsEnrolling(true)
      if (onEnroll) {
        await onEnroll(id)
      }
      toast.success('Successfully enrolled in the course!')
      router.push(`/courses/${course.slug}`)
    } catch (error) {
      console.error('Enrollment error:', error)
      toast.error('Failed to enroll in the course. Please try again.')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!session?.user?.id) {
      toast.error('Please sign in to add courses to favorites')
      return
    }

    try {
      const newIsFavorite = !isFavorite
      setIsFavorite(newIsFavorite)
      if (onToggleFavorite) {
        await onToggleFavorite(id, newIsFavorite)
      }
    } catch (error) {
      toast.error('Failed to update favorite status')
      setIsFavorite(isFavorite) // Revert the state
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onShare) {
      onShare(course)
    } else if (navigator.share) {
      navigator.share({
        title: course.title,
        text: course.shortDescription,
        url: `${window.location.origin}/courses/${course.slug}`,
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/courses/${course.slug}`)
      toast.success('Link copied to clipboard!')
    }
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const renderRating = () => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          } else if (i === fullStars && hasHalfStar) {
            return <StarHalf key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          } else {
            return <Star key={i} className="w-4 h-4 text-gray-300" />
          }
        })}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          {rating.toFixed(1)} ({reviewCount.toLocaleString()})
        </span>
      </div>
    )
  }

  // Render different card variants
  if (variant === 'compact') {
    return (
      <Link href={`/courses/${course.slug}`} className="block group">
        <Card className={cn("overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-gray-700/50", className)}>
          <div className="flex">
            <div className="relative w-32 h-24 flex-shrink-0">
              <Image
                src={imageUrl || '/images/course-placeholder.jpg'}
                alt={title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div>
                <h3 className="font-medium text-sm line-clamp-2">{title}</h3>
                {instructor && showInstructor && (
                  <p className="text-xs text-gray-500 mt-1">{instructor.name}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  {renderRating()}
                </div>
                <div className="text-sm font-medium">
                  {price === 0 ? 'Free' : formatPrice(price)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={cn("border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow", className)}>
        <div className="relative h-48">
          <Image
            src={imageUrl || '/images/course-placeholder.jpg'}
            alt={title}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 left-2 flex gap-2">
            {course.isNew && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                New
              </Badge>
            )}
            {course.isBestSeller && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                Bestseller
              </Badge>
            )}
          </div>
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
            />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </div>
          </div>
          
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {shortDescription || description}
          </p>
          
          {showInstructor && instructor && (
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
                <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{instructor.name}</p>
                {instructor.title && (
                  <p className="text-xs text-gray-500">{instructor.title}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {studentCount.toLocaleString()} students
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              {discountedPrice && price > discountedPrice && (
                <span className="text-sm text-gray-500 line-through mr-2">
                  {formatPrice(price)}
                </span>
              )}
              <div className="text-lg font-bold">
                {price === 0 ? 'Free' : formatPrice(discountedPrice || price)}
              </div>
            </div>
          </div>
          
          <Button 
            className="w-full mt-4"
            onClick={handleEnroll}
            disabled={isEnrolling}
          >
            {isEnrolling 
              ? 'Enrolling...' 
              : isEnrolled 
                ? 'Continue Learning' 
                : 'Enroll Now'}
          </Button>
          
          {showProgress && progress > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <Link href={`/courses/${course.slug}`} className="block group">
      <Card className={cn("overflow-hidden transition-all hover:shadow-lg dark:hover:shadow-gray-700/50 h-full flex flex-col", className)}>
        <div className="relative aspect-video">
          <Image
            src={imageUrl || '/images/course-placeholder.jpg'}
            alt={title}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 left-2 flex gap-2">
            {course.isNew && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
                New
              </Badge>
            )}
            {course.isBestSeller && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
                Bestseller
              </Badge>
            )}
          </div>
          <button
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
            />
          </button>
        </div>
        
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </div>
          </div>
          
          <h3 className="font-semibold text-base mb-2 line-clamp-2">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 flex-1">
            {shortDescription}
          </p>
          
          {showInstructor && instructor && (
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={instructor.avatarUrl} alt={instructor.name} />
                <AvatarFallback>{instructor.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {instructor.name}
              </span>
            </div>
          )}
          
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({reviewCount.toLocaleString()})
                </span>
              </div>
              <div className="text-right">
                {discountedPrice && price > discountedPrice && (
                  <span className="text-xs text-gray-500 line-through mr-1">
                    {formatPrice(price)}
                  </span>
                )}
                <span className="font-bold">
                  {price === 0 ? 'Free' : formatPrice(discountedPrice || price)}
                </span>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={(e) => {
                e.preventDefault()
                handleEnroll()
              }}
            >
              {isEnrolled ? 'Continue' : 'Enroll Now'}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  )
}
