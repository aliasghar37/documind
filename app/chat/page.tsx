"use client";

import {
    PDFViewer,
    ZoomMode,
    type PDFViewerRef,
} from "@embedpdf/react-pdf-viewer";
import { useMemo, useRef, useState } from "react";
import { ChatInterface } from "./components/ChatInterface";

type DocumentOption = {
    id: string;
    label: string;
    src: string;
};

const DOCUMENTS: DocumentOption[] = [
    {
        id: "doc-1",
        label: "Sample Document One",
        src: "/doc-1.pdf",
    },
    {
        id: "doc-2",
        label: "Sample Document Two",
        src: "/doc-2.pdf",
    },
    {
        id: "doc-3",
        label: "Sample Document Three",
        src: "/doc-3.pdf",
    },
];

export default function CustomViewer() {
    const viewerRef = useRef<PDFViewerRef>(null);
    const [selectedDocument, setSelectedDocument] = useState<DocumentOption>(
        DOCUMENTS[0],
    );
    const [documentMenuOpen, setDocumentMenuOpen] = useState(false);
    const registeredRegistryRef = useRef<unknown>(null);

    const viewerConfig = useMemo(
        () => ({
            src: selectedDocument.src,
            disabledCategories: [
                "document-open",
                "document-close",
                "document-protect",
                "document-print",
                "insert",
                "form",
                "redaction",
            ],
            permissions: {
                enforceDocumentPermissions: true,
                overrides: {
                    print: false,
                    assembleDocument: false,
                },
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
        [selectedDocument.src],
    );

    const handleReady = async () => {
        const registry = await viewerRef.current?.registry;
        if (!registry || registeredRegistryRef.current === registry) return;

        registeredRegistryRef.current = registry;

        const commands = registry.getPlugin("commands")?.provides?.();
        const ui = registry.getPlugin("ui")?.provides?.();

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

        // remove only rotation-related entries
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

    return (
        <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-3">
            <div className="relative min-h-0 overflow-hidden border-r border-border bg-background lg:col-span-2">
                <PDFViewer
                    ref={viewerRef}
                    onReady={handleReady}
                    config={viewerConfig}
                    className="h-full w-full"
                    style={{ height: "100%", width: "100%" }}
                    key={selectedDocument.src}
                />

                {documentMenuOpen ? (
                    <div className="absolute right-4 top-16 z-50 w-72 rounded-xl border border-border bg-card p-2 shadow-xl shadow-black/10">
                        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Open a document
                        </div>
                        <div className="space-y-1">
                            {DOCUMENTS.map((document) => (
                                <button
                                    key={document.id}
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                                    onClick={() => {
                                        setSelectedDocument(document);
                                        setDocumentMenuOpen(false);
                                    }}
                                >
                                    <span>{document.label}</span>
                                    {selectedDocument.id === document.id ? (
                                        <span className="text-xs font-medium text-primary">
                                            Open
                                        </span>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            <aside className="min-h-0 lg:col-span-1">
                <ChatInterface />
            </aside>
        </div>
    );
}
