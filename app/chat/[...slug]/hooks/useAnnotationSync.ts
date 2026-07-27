"use client";

import { useEffect, useRef, useCallback } from "react";
import type { PDFViewerRef } from "@embedpdf/react-pdf-viewer";
import type { AnnotationEvent } from "@embedpdf/plugin-annotation";
import {
  handleSaveAnnotations,
  handleGetAnnotations,
} from "@/app/actions/handleAnnotations";

const DEBOUNCE_MS = 1000;

export function useAnnotationSync(
  viewerRef: React.RefObject<PDFViewerRef | null>,
  documentId: string,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  const flush = useCallback(async () => {
	const registry = await viewerRef.current?.registry;
	if (!registry) return;
	const plugin = registry.getPlugin("annotation");
	if (!plugin?.provides) return;
	const annotation = plugin.provides();

	try {
	  const items = await annotation.exportAnnotations().toPromise();
	  await handleSaveAnnotations(documentId, items as any);
	} catch {
	  // export failed — non-critical
	}
  }, [viewerRef, documentId]);

  const debouncedSave = useCallback(() => {
	if (timerRef.current) clearTimeout(timerRef.current);
	timerRef.current = setTimeout(() => {
	  flush();
	}, DEBOUNCE_MS);
  }, [flush]);

  useEffect(() => {
	let cancelled = false;

	const setup = async () => {
	  const registry = await viewerRef.current?.registry;
	  if (!registry) return;
	  const plugin = registry.getPlugin("annotation");
	  if (!plugin?.provides) return;
	  const annotation = plugin.provides();
	  if (!annotation) return;

	  const saved = await handleGetAnnotations(documentId);
	  if (cancelled) return;

	  if (saved.length > 0) {
		annotation.importAnnotations(saved as any);
	  }
	  loadedRef.current = true;

	  annotation.onAnnotationEvent((event: AnnotationEvent) => {
		if (!loadedRef.current) return;
		if (event.type === "loaded") return;
		debouncedSave();
	  });
	};

	setup();

	return () => {
	  cancelled = true;
	  if (timerRef.current) clearTimeout(timerRef.current);
	};
  }, [viewerRef, documentId, debouncedSave]);
}
