import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardOverviewPageLoading() {
    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={`summary-card-${index}`}
                        className="rounded-xl border bg-card p-4"
                    >
                        <Skeleton className="mb-3 h-4 w-28" />
                        <Skeleton className="mb-2 h-8 w-20" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                ))}
            </div>
            <div className="flex justify-end items-center">
                <Skeleton className="my-3 h-8 w-40" />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div
                        key={`project-card-${index}`}
                        className="rounded-xl border bg-card p-5"
                    >
                        <Skeleton className="mb-4 h-5 w-36" />
                        <Skeleton className="mb-3 h-3 w-full" />
                        <Skeleton className="mb-3 h-3 w-11/12" />
                        <Skeleton className="mb-5 h-3 w-2/3" />
                        <Skeleton className="h-56 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
