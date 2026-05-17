import React from 'react';
import { motion } from 'motion/react';

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`bg-natural-surface animate-pulse rounded-2xl ${className}`} {...props} />
);

export const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
    <div className="flex justify-between items-end">
      <div className="space-y-4">
        <Skeleton className="w-48 h-10" />
        <Skeleton className="w-32 h-4" />
      </div>
      <Skeleton className="w-40 h-12" />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>

    <div className="space-y-8">
      <Skeleton className="w-32 h-6" />
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  </div>
);

export const ServiceCardSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
      <Skeleton key={i} className="aspect-square" />
    ))}
  </div>
);
