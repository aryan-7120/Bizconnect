import { Star } from 'lucide-react';
import clsx from 'clsx';

export default function StarRating({ rating, max = 5, size = 'sm', showCount, count, interactive = false, onChange }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const iconSize = sizes[size] || sizes.sm;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={clsx(
              'relative transition-transform',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={clsx(
                iconSize,
                filled || partial ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200 dark:fill-slate-600 dark:text-slate-600'
              )}
            />
          </button>
        );
      })}
      {showCount && (
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
          ({count ?? 0})
        </span>
      )}
      {!showCount && rating > 0 && (
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
          {typeof rating === 'number' ? rating.toFixed(1) : rating}
        </span>
      )}
    </div>
  );
}
