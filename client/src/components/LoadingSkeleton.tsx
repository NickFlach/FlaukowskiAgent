import { Skeleton } from "@/components/ui/skeleton";

export function MetricCardSkeleton() {
  return (
    <div className="bg-navy-800 rounded-xl p-6 border border-navy-600">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24 bg-navy-700" />
        <Skeleton className="h-8 w-8 bg-navy-700 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32 mb-2 bg-navy-700" />
      <Skeleton className="h-4 w-20 bg-navy-700" />
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start space-x-3 p-3">
          <Skeleton className="h-8 w-8 bg-navy-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-navy-700" />
            <Skeleton className="h-3 w-1/2 bg-navy-700" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StrategyCardSkeleton() {
  return (
    <div className="bg-navy-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-32 bg-navy-600" />
        <Skeleton className="h-6 w-16 bg-navy-600 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full mb-2 bg-navy-600" />
      <Skeleton className="h-4 w-2/3 bg-navy-600" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-navy-800 rounded-xl p-6 border border-navy-600 h-full">
      <Skeleton className="h-6 w-40 mb-6 bg-navy-700" />
      <div className="h-64 flex items-end justify-between space-x-2">
        {[40, 60, 35, 80, 55, 70, 45, 90, 65, 75].map((height, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 bg-navy-700" 
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}