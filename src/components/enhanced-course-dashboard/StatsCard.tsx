import { motion } from 'framer-motion';

interface StatsCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'indigo' | 'purple' | 'pink' | 'blue' | 'emerald';
  className?: string;
  clickable?: boolean;
}

export function StatsCard({ 
  icon, 
  value, 
  label, 
  description, 
  trend,
  color = 'indigo',
  className = '',
  clickable = false
}: StatsCardProps) {
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-800',
      trendPositive: 'text-emerald-600 dark:text-emerald-400',
      trendNegative: 'text-rose-600 dark:text-rose-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-800',
      trendPositive: 'text-emerald-600 dark:text-emerald-400',
      trendNegative: 'text-rose-600 dark:text-rose-400',
    },
    pink: {
      bg: 'bg-pink-50 dark:bg-pink-900/30',
      text: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-100 dark:border-pink-800',
      trendPositive: 'text-emerald-600 dark:text-emerald-400',
      trendNegative: 'text-rose-600 dark:text-rose-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-800',
      trendPositive: 'text-emerald-600 dark:text-emerald-400',
      trendNegative: 'text-rose-600 dark:text-rose-400',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-800',
      trendPositive: 'text-emerald-600 dark:text-emerald-400',
      trendNegative: 'text-rose-600 dark:text-rose-400',
    },
  };

  const currentColor = colorClasses[color];

  return (
    <motion.div 
      className={`rounded-2xl p-6 border ${currentColor.border} ${currentColor.bg} ${
        clickable ? 'cursor-pointer hover:shadow-md transition-shadow duration-200' : ''
      } ${className} h-full`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: clickable ? -4 : 0, 
        scale: clickable ? 1.02 : 1,
        transition: { duration: 0.2 } 
      }}
    >
      <div className="flex items-start justify-between min-w-0">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow-sm min-w-0">
          {icon}
        </div>
        {trend && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            trend.isPositive 
              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200' 
              : 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200'
          }`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}% {trend.label}
          </span>
        )}
      </div>
      
      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white break-words">
          {value}
        </div>
        <h3 className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400 break-words">
          {label}
        </h3>
        
        {description && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default StatsCard;
