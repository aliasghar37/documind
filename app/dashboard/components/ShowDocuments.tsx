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
import { formatDate } from "@/lib/dateFormatter";

export default function ShowDocuments({
    recentDocuments,
    page,
}: {
    recentDocuments: Document[];
    page: "overview" | "documents";
}) {
    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-3xl">
                            {page === "overview"
                                ? "Recent Documents"
                                : "All Documents"}
                        </h1>
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
                                        Updated
                                    </TableHead>
                                    <TableHead className="text-lg">
                                        Status
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentDocuments.map((doc) => (
                                    <TableRow key={doc.fileUrl}>
                                        <TableCell className="text-base">
                                            {doc.fileName}
                                        </TableCell>
                                        <TableCell className="text-base">
                                            {doc.projectId}
                                        </TableCell>
                                        <TableCell className="text-base">
                                            {formatDate(doc.updatedAt)}
                                        </TableCell>
                                        <TableCell className="text-base">
                                            {"Add Status later"}
                                        </TableCell>
                                        <TableCell className="text-base">
                                            <Button
                                                variant={"ghost"}
                                                size={"lg"}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="currentColor"
                                                >
                                                    <path d="M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z"></path>
                                                </svg>
                                            </Button>
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
