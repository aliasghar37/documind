import { notFound } from "next/navigation";
import DocumentReader from "./components/DocumentReader";
import { handleGetProject } from "@/app/actions/handleGetProject";
import { ProjectWithDocuments } from "@/lib/data";

export default async function Page({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const projectId = Array.isArray(slug) ? slug.join("/") : (slug ?? "");

  if (!projectId) return notFound();

  const result = await handleGetProject(projectId);

  if ("success" in result) {
	return notFound();
  }

  const project: ProjectWithDocuments = result;
  return <DocumentReader project={project} />;
}
