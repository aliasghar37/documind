"use client";

import { useEffect, useState } from "react";
import {
  handleGetUserAnnotations,
  type UserAnnotation,
} from "@/app/actions/handleAnnotations";
import { toast } from "sonner";

function CopyButton({ text }: { text: string }) {
  return (
	<button
	  type="button"
	  onClick={() => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	  }}
	  className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1.5 transition-colors"
	  title="Copy"
	>
	  <svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className="h-4 w-4"
	  >
		<path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z" />
	  </svg>
	</button>
  );
}

function CommentCard({
  item,
  documentName,
}: {
  item: UserAnnotation;
  documentName: string;
}) {
  return (
	<div className="border-border group flex flex-col gap-2.5 rounded-lg border p-4 transition-colors hover:bg-muted/50">
	  <div className="flex items-start justify-between gap-2">
		<div className="flex min-w-0 items-center gap-2.5">
		  <div className="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-medium">
			{item.pageNumber}
		  </div>
		  <span className="text-muted-foreground truncate text-sm">
			{documentName}
		  </span>
		</div>
		<div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
		  <CopyButton text={item.text} />
		</div>
	  </div>

	  <p className="text-foreground line-clamp-5 whitespace-pre-wrap wrap-break-word text-sm">
		{item.text}
	  </p>
	</div>
  );
}

export default function CommentsPage() {
  const [annotations, setAnnotations] = useState<UserAnnotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
	handleGetUserAnnotations().then((data) => {
	  setAnnotations(data);
	  setLoading(false);
	});
  }, []);

  const grouped = annotations.reduce(
	(acc, a) => {
	  const key = a.documentId;
	  if (!acc[key]) {
		acc[key] = {
		  documentName: a.documentName,
		  projectTitle: a.projectTitle,
		  items: [],
		};
	  }
	  acc[key].items.push(a);
	  return acc;
	},
	{} as Record<
	  string,
	  { documentName: string; projectTitle: string; items: UserAnnotation[] }
	>,
  );

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
	const aLatest = Math.max(
	  ...grouped[a].items.map((i) => new Date(i.createdAt).getTime()),
	);
	const bLatest = Math.max(
	  ...grouped[b].items.map((i) => new Date(i.createdAt).getTime()),
	);
	return bLatest - aLatest;
  });

  if (loading) {
	return (
	  <div className="flex h-full items-center justify-center">
		<p className="text-muted-foreground text-sm">Loading comments...</p>
	  </div>
	);
  }

  if (annotations.length === 0) {
	return (
	  <div className="flex h-full flex-col items-center justify-center gap-2">
		<svg
		  xmlns="http://www.w3.org/2000/svg"
		  viewBox="0 0 24 24"
		  fill="currentColor"
		  className="text-muted-foreground h-12 w-12"
		>
		  <path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6Z" />
		</svg>
		<p className="text-muted-foreground text-sm">
		  No comments yet. Add comments to your documents in the reader.
		</p>
	  </div>
	);
  }

  return (
	<div className="mx-full max-w-screen-2xl space-y-10  ">
	  <div>
		<h1 className="text-foreground text-2xl font-semibold">Comments</h1>
		<p className="text-muted-foreground mt-1 text-sm">
		  {annotations.length} comment{annotations.length !== 1 ? "s" : ""}{" "}
		  across {sortedKeys.length} document
		  {sortedKeys.length !== 1 ? "s" : ""}
		</p>
	  </div>

	  {sortedKeys.map((docId) => {
		const group = grouped[docId];
		return (
		  <section key={docId}>
			<div className="mb-5 flex items-center gap-3">
			  <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
				<svg
				  xmlns="http://www.w3.org/2000/svg"
				  viewBox="0 0 24 24"
				  fill="currentColor"
				  className="h-5 w-5"
				>
				  <path d="M21 8V20.9932C21 21.5501 20.5552 22 20.0066 22H3.9934C3.44495 22 3 21.556 3 21.0082V2.9918C3 2.45531 3.4487 2 4.00221 2H14.9968L21 8ZM19 9H14V4H5V20H19V9ZM8 7H11V9H8V7ZM8 11H16V13H8V11ZM8 15H16V17H8V15Z" />
				</svg>
			  </div>
			  <div>
				<h2 className="text-foreground text-base font-medium">
				  {group.documentName}
				</h2>
				<p className="text-muted-foreground text-sm">
				  {group.projectTitle} · {group.items.length} comment
				  {group.items.length !== 1 ? "s" : ""}
				</p>
			  </div>
			</div>

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5 min-w-full ">
			  {group.items
				.sort(
				  (a, b) =>
					new Date(b.createdAt).getTime() -
					new Date(a.createdAt).getTime(),
				)
				.map((item) => (
				  <CommentCard
					key={item.id}
					item={item}
					documentName={group.documentName}
				  />
				))}
			</div>
		  </section>
		);
	  })}
	</div>
  );
}
