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
  ready: boolean,
  userName?: string,
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
	  const result = await handleSaveAnnotations(documentId, items as any);
	  if (!result.success) {
		console.warn("Annotation save failed:", result.message);
	  }
	} catch (err) {
	  console.warn("Annotation export/save failed:", err);
	}
  }, [viewerRef, documentId]);

  const debouncedSave = useCallback(() => {
	if (timerRef.current) clearTimeout(timerRef.current);
	timerRef.current = setTimeout(() => {
	  flush();
	}, DEBOUNCE_MS);
  }, [flush]);

  useEffect(() => {
	if (!ready) return;
	let cancelled = false;

	const setup = async () => {
	  const registry = await viewerRef.current?.registry;
	  if (!registry || cancelled) return;
	  const plugin = registry.getPlugin("annotation");
	  if (!plugin?.provides) return;
	  const annotation = plugin.provides();
	  if (!annotation) return;

	  const saved = await handleGetAnnotations(documentId);
	  if (cancelled) return;

	  if (saved.length > 0) {
		const patched = userName
		  ? saved.map((a: any) =>
			  a.author === "Guest" ? { ...a, author: userName } : a,
			)
		  : saved;
		annotation.importAnnotations(patched as any);
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
	  loadedRef.current = false;
	};
  }, [viewerRef, documentId, ready, debouncedSave]);
}
