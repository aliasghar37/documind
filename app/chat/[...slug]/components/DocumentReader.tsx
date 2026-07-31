"use client";

import {
  PDFViewer,
  ZoomMode,
  type PDFViewerRef,
} from "@embedpdf/react-pdf-viewer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatInterface } from "./ChatInterface";
import { ProjectWithDocuments } from "@/lib/data";
import { ProjectMessage } from "@/app/actions/handleGetProjectMessages";
import { useProjectHeader } from "@/components/project-header-context";
import { useAnnotationSync } from "../hooks/useAnnotationSync";

type Document = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  pages: number;
  projectId: string;
  projectName: string;
};

export default function CustomViewer({
  project,
  initialMessages,
}: {
  project: ProjectWithDocuments;
  initialMessages?: ProjectMessage[];
}) {
  const documents = project.documents;
  const { setProjectTitle } = useProjectHeader();

  const viewerRef = useRef<PDFViewerRef>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document>(
	documents[0],
  );
  const [documentMenuOpen, setDocumentMenuOpen] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const registeredRegistryRef = useRef<unknown>(null);
  const scrollCapabilityRef = useRef<{ scrollToPage: (opts: { pageNumber: number; behavior?: string }) => void } | null>(null);
  const pendingPageNavRef = useRef<number | null>(null);

  useEffect(() => {
	setViewerReady(false);
  }, [selectedDocument.id]);

  useEffect(() => {
	setProjectTitle(project.title);

	return () => {
	  setProjectTitle(null);
	};
  }, [project.title, setProjectTitle]);

  useAnnotationSync(viewerRef, selectedDocument.id, viewerReady, "You");

  const viewerConfig = useMemo(
	() => ({
	  src: selectedDocument.fileUrl,
	  disabledCategories: [
		"document-open",
		"document-close",
		"document-protect",
		"document-print",
		"insert",
		"form",
		"redaction",
		"annotation-text",
	  ],
	  permissions: {
		enforceDocumentPermissions: true,
		overrides: {
		  print: false,
		  assembleDocument: false,
		},
	  },
	  annotations: {
		annotationAuthor: "You",
	  },
	  theme: {
		preference: "light" as const,
		light: {
		  accent: {
			primary: "#476e66",
			primaryHover: "#3f645c",
			primaryActive: "#35564f",
			primaryLight: "#dfe8e5",
			primaryForeground: "#fefefe",
		  },
		  interactive: {
			selected: "#dfe8e5",
			focus: "#476e66",
			focusRing: "#c9d8d4",
		  },
		  scrollbar: {
			track: "#f4f4f4",
			thumb: "#bec0bf",
			thumbHover: "#708a83",
		  },
		},
		dark: {
		  accent: {
			primary: "#5fa295",
			primaryHover: "#4f8b7f",
			primaryActive: "#43766b",
			primaryLight: "#1c2422",
			primaryForeground: "#0d1110",
		  },
		  interactive: {
			selected: "#1c2422",
			focus: "#5fa295",
			focusRing: "#355b52",
		  },
		  scrollbar: {
			track: "#1c2422",
			thumb: "#4b5563",
			thumbHover: "#6b7280",
		  },
		},
	  },
	  zoom: {
		defaultZoomLevel: ZoomMode.FitWidth,
	  },
	  tabBar: "never" as const,
	}),
	[selectedDocument.fileUrl, "You"],
  );

  const handleReady = async () => {
	const registry = await viewerRef.current?.registry;
	if (!registry || registeredRegistryRef.current === registry) return;

	registeredRegistryRef.current = registry;
	setViewerReady(true);

	const commands = registry.getPlugin("commands")?.provides?.();
	const ui = registry.getPlugin("ui")?.provides?.();

	const scroll = registry.getPlugin("scroll")?.provides?.();
	if (scroll) {
	  scrollCapabilityRef.current = scroll;
	  const pending = pendingPageNavRef.current;
	  if (pending !== null) {
		pendingPageNavRef.current = null;
		scroll.scrollToPage({ pageNumber: pending, behavior: "smooth" });
	  }
	}

	if (!commands || !ui) return;

	commands.registerCommand({
	  id: "custom.select-document",
	  label: "Documents",
	  action: () => setDocumentMenuOpen((open) => !open),
	});

	const schema = ui.getSchema();
	const toolbar = schema.toolbars["main-toolbar"];
	if (!toolbar) return;

	const items = JSON.parse(JSON.stringify(toolbar.items));
	const rightGroup = items.find((item: any) => item.id === "right-group");

	if (
	  rightGroup &&
	  !rightGroup.items.some(
		(item: any) => item.id === "document-picker-button",
	  )
	) {
	  rightGroup.items.push({
		type: "command-button",
		id: "document-picker-button",
		commandId: "custom.select-document",
		variant: "text",
		label: "Documents",
	  });
	}

	ui.mergeSchema({
	  toolbars: { "main-toolbar": { ...toolbar, items } },
	});

	try {
	  const full = ui.getSchema();

	  const clone = JSON.parse(JSON.stringify(full));

	  const isRotationItem = (it: any) => {
		const id = String(it.id ?? "").toLowerCase();
		const cmd = String(it.commandId ?? "").toLowerCase();
		const label = String(it.label ?? "").toLowerCase();
		return (
		  id.includes("rotate") ||
		  id.includes("rotation") ||
		  cmd.includes("rotate") ||
		  cmd.includes("rotation") ||
		  label.includes("rotate") ||
		  label.includes("rotation")
		);
	  };

	  const filterItems = (items: any[]): any[] => {
		return (items || [])
		  .map((it: any) => {
			if (it.items && Array.isArray(it.items)) {
			  return { ...it, items: filterItems(it.items) };
			}
			return it;
		  })
		  .filter((it: any) => !isRotationItem(it));
	  };

	  if (clone.toolbars) {
		for (const key of Object.keys(clone.toolbars)) {
		  const tb = clone.toolbars[key];
		  tb.items = filterItems(tb.items || []);
		}
	  }

	  if (clone.menus) {
		for (const key of Object.keys(clone.menus)) {
		  const menu = clone.menus[key];
		  menu.items = filterItems(menu.items || []);
		}
	  }

	  ui.mergeSchema(clone);
	} catch (e) {
	  // non-fatal
	  // eslint-disable-next-line no-console
	  console.warn("Could not remove rotation items from schema:", e);
	}
  };

  const handleNavigateToPage = useCallback(
	(documentId?: string, pageNumber?: number | null) => {
	  if (!pageNumber) return;

	  if (documentId && documentId !== selectedDocument.id) {
		const target = documents.find((d) => d.id === documentId);
		if (target) {
		  pendingPageNavRef.current = pageNumber;
		  setSelectedDocument(target);
		  return;
		}
	  }

	  scrollCapabilityRef.current?.scrollToPage({
		pageNumber,
		behavior: "smooth",
	  });
	},
	[selectedDocument.id, documents],
  );

  return (
	<div className="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-3">
	  <div className="relative min-h-0 overflow-hidden border-r border-border bg-background lg:col-span-2">
		<PDFViewer
		  ref={viewerRef}
		  onReady={handleReady}
		  config={viewerConfig}
		  className="h-full w-full"
		  style={{ height: "100%", width: "100%" }}
		  key={selectedDocument.fileUrl}
		/>

		{documentMenuOpen ? (
		  <div className="absolute right-4 top-16 z-50 w-72 rounded-xl border border-border bg-card p-2 shadow-xl shadow-black/10">
			<div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
			  Open a document
			</div>
			<div className="space-y-1">
			  {documents.map((document) => (
				<button
				  key={document.id}
				  type="button"
				  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
				  onClick={() => {
					setSelectedDocument(document);
					setDocumentMenuOpen(false);
				  }}
				>
				  <span>{document.fileName}</span>
				  {selectedDocument.id === document.id ? (
					<span className="text-xs font-medium text-primary">
					  Opened
					</span>
				  ) : null}
				</button>
			  ))}
			</div>
		  </div>
		) : null}
	  </div>

	  <aside className="min-h-0 lg:col-span-1">
		<ChatInterface
		  projectId={project.id}
		  recommendationQns={project.recommendationQns.map(
			(q) => q.questionText,
		  )}
		  initialMessages={initialMessages}
		  onNavigateToPage={handleNavigateToPage}
		/>
	  </aside>
	</div>
  );
}
