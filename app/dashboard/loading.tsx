import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Table } from "@/components/ui/table";

export default function DashboardOverviewPageLoading() {
    return (
        <>
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
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Skeleton className="h-10 w-48" />
                        </div>
                        <div className="flex justify-center items-center gap-2">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-8 w-40" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Card
                                key={`project-skeleton-${index}`}
                                size="default"
                                className="flex h-full w-full flex-col"
                            >
                                <CardHeader>
                                    <CardTitle className="text-2xl">
                                        <Skeleton className="h-8 w-36" />
                                    </CardTitle>
                                    <CardDescription>
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-1">
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-20" />
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <Skeleton className="h-6 w-28" />
                                        </div>
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-3 w-5/6 mt-2" />
                                    <Skeleton className="h-3 w-4/5 mt-2" />
                                </CardContent>

                                <CardFooter className="mt-auto flex justify-center gap-2 bg-card">
                                    <Skeleton className="h-9 w-full" />
                                    <Skeleton className="h-9 w-12" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Skeleton className="h-10 w-48" />
                    </div>
                    <div className="flex justify-center items-center gap-2">
                        <Skeleton className="h-8 w-32" />
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <Card className="w-full max-w-none">
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-lg">
                                            <Skeleton className="h-5 w-24" />
                                        </TableHead>
                                        <TableHead className="text-lg">
                                            <Skeleton className="h-5 w-20" />
                                        </TableHead>
                                        <TableHead className="text-lg">
                                            <Skeleton className="h-5 w-20" />
                                        </TableHead>
                                        <TableHead className="text-lg">
                                            <Skeleton className="h-5 w-16" />
                                        </TableHead>
                                        <TableHead className="text-lg">
                                            <Skeleton className="h-5 w-12" />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from({ length: 4 }).map(
                                        (_, index) => (
                                            <TableRow
                                                key={`doc-skeleton-${index}`}
                                            >
                                                <TableCell>
                                                    <Skeleton className="h-4 w-32" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-24" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-28" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-20" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-4 w-8" />
                                                </TableCell>
                                            </TableRow>
                                        ),
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
