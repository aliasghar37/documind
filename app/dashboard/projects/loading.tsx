import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
    return (
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
    );
}
