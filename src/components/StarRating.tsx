/**
 * Componente de avaliação com estrelas
 * Permite que o usuário avalie materiais de 1 a 5 estrelas
 */

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number | null;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  showCount?: boolean;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  rating,
  onRate,
  readonly = false,
  showCount = false,
  count = 0,
  size = 'md'
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = (value: number) => {
    if (!readonly && onRate) {
      onRate(value);
    }
  };

  const displayRating = hoverRating || rating || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating;
        const isHalf = !isFilled && star - 0.5 <= displayRating;

        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(null)}
            disabled={readonly}
            className={`
              ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
              transition-transform duration-150
            `}
            aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`
                ${sizeClasses[size]}
                ${isFilled ? 'fill-yellow-400 text-yellow-400' :
                  isHalf ? 'fill-yellow-200 text-yellow-400' :
                  'text-gray-300'}
                transition-colors duration-150
              `}
            />
          </button>
        );
      })}

      {showCount && count > 0 && (
        <span className="ml-1 text-sm text-gray-600">
          ({count})
        </span>
      )}
    </div>
  );
}
