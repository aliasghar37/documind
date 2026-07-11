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
import DeleteDocument from "./DeleteDocument";

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
			  {page === "overview" ? "Recent Documents" : "All Documents"}
			</h1>
		  </div>

		  <Button asChild variant="secondary" size="lg">
			{page === "overview" && (
			  <Link href="/dashboard/documents">Show all documents</Link>
			)}
		  </Button>
		</div>

		<Card>
		  <CardContent>
			<Table>
			  <TableHeader>
				<TableRow>
				  <TableHead className="text-lg">Document</TableHead>
				  <TableHead className="text-lg">Project</TableHead>
				  <TableHead className="text-lg">Updated</TableHead>
				  <TableHead className="text-lg">Status</TableHead>
				</TableRow>
			  </TableHeader>
			  <TableBody>
				{recentDocuments.map((doc) => (
				  <TableRow key={doc.fileUrl}>
					<TableCell className="text-base">{doc.fileName}</TableCell>
					<TableCell className="text-base">
					  {doc.projectName}
					</TableCell>
					<TableCell className="text-base">
					  {formatDate(doc.updatedAt)}
					</TableCell>
					<TableCell className="text-base">
					  {"Add Status later"}
					</TableCell>
					<TableCell className="text-base">
					  <DeleteDocument documentId={doc.id} />
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
