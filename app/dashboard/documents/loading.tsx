import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

export default function DocumentsLoading() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <Skeleton className="h-10 w-48" />
            </div>

            <Card>
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
                            {Array.from({ length: 20 }).map((_, index) => (
                                <TableRow key={`doc-skeleton-${index}`}>
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
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
