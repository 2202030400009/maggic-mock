
import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  label?: string;
  description?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  max = 5,
  label,
  description,
}) => {
  return (
    <div className="space-y-2">
      {label && <div className="font-medium text-sm">{label}</div>}
      <div className="flex items-center space-x-1">
        {Array.from({ length: max }).map((_, index) => (
          <Star
            key={index}
            className={`w-6 h-6 cursor-pointer ${
              index < value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
            onClick={() => onChange(index + 1)}
          />
        ))}
        <span className="ml-2 text-sm text-gray-500">{value} / {max}</span>
      </div>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
};

export default StarRating;
