import clsx from 'clsx';

export default function LoadingSpinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };
  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className={clsx(
        'rounded-full border-indigo-600 border-t-transparent animate-spin',
        sizes[size] || sizes.md
      )} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading BizConnect...</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-card">
      <div className="h-48 animate-shimmer" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 rounded-lg animate-shimmer" />
        <div className="h-4 w-1/2 rounded-lg animate-shimmer" />
        <div className="h-4 w-full rounded-lg animate-shimmer" />
        <div className="flex gap-2 mt-4">
          <div className="h-8 w-24 rounded-lg animate-shimmer" />
          <div className="h-8 w-20 rounded-lg animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
