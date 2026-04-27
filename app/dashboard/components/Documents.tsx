import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Document } from "../page";
import { Card, CardContent } from "@/components/ui/card";

export default function Documents({
    recentDocuments,
}: {
    recentDocuments: Document[];
}) {
    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl">Recent Documents</h1>
                    </div>

                    <Button asChild variant="secondary" size="lg">
                        <Link href="/dashboard/documents">
                            Show all documents
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-lg">
                                        Document
                                    </TableHead>
                                    <TableHead className="text-lg">
                                        Project
                                    </TableHead>
                                    <TableHead className="text-lg">
                                        Type
                                    </TableHead>
                                    <TableHead className="text-lg">
                                        Updated
                                    </TableHead>
                                    <TableHead className="text-lg">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentDocuments.map((doc) => (
                                    <TableRow key={doc.name}>
                                        <TableCell className="text-base">
                                            {doc.name}
                                        </TableCell>
                                        <TableCell className="text-base">
                                            {doc.project}
                                        </TableCell>
                                        <TableCell className="text-base">
                                            {doc.fileType}
                                        </TableCell>
                                        <TableCell className="text-base">
                                            {doc.updated}
                                        </TableCell>
                                        <TableCell className="text-base">
                                            {doc.status}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
