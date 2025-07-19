export function NotificationSkeleton() {
  return (
    <div className="animate-pulse border-b p-4">
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200"></div>
        <div className="h-3 w-full rounded bg-gray-200"></div>
        <div className="h-3 w-1/2 rounded bg-gray-200"></div>
      </div>
    </div>
  );
}
