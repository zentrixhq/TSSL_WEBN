import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

interface BrandCardProps {
  id: string;
  name: string;
  offers: number;
  image?: string;
  slug: string;
}

export default function BrandCard({ slug, name, offers, image }: BrandCardProps) {
  return (
    <Link to={`/product/${slug}`}>
      <div className="group overflow-hidden rounded-md sm:rounded-lg lg:rounded-xl bg-white shadow-sm hover:shadow-lg cursor-pointer transition-all hover:scale-[1.02] border border-gray-200 max-w-[180px] sm:max-w-[200px] lg:max-w-[220px] mx-auto">
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 p-3 sm:p-4">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 mb-1.5 sm:mb-2" />
              <span className="text-xs font-medium text-center">{name}</span>
            </div>
          )}
        </div>

        <div className="p-1.5 sm:p-2 lg:p-2.5 bg-white">
          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-0.5 sm:mb-1 line-clamp-2">
            {name}
          </h3>
          <div className="flex items-center text-[10px] sm:text-xs text-gray-600">
            <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
            <span className="font-medium truncate">{name}</span>
            <span className="mx-0.5 sm:mx-1">•</span>
            <span>Key</span>
            <span className="mx-0.5 sm:mx-1">•</span>
          </div>
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-semibold text-green-600">
            {offers} {offers === 1 ? 'OFFER' : 'OFFERS'}
          </div>
        </div>
      </div>
    </Link>
  );
}
