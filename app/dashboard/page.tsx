import ShowProjects from "./components/ShowProjects";
import ShowDocuments from "./components/ShowDocuments";
import type { Prisma } from "@prisma/client";
import { getDashboardData } from "./data";

export type Project = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    title: string;
    description?: string;
    metadata: Prisma.JsonValue;
    projectSettings: Prisma.JsonValue | null;
};

export type Document = {
    userId: string;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    fileUrl: string;
    fileName: string;
    fileType: string;
    pages: number;
    projectId: string;
};

export default async function DashboardOverview() {
    const data = await getDashboardData();

    if (!data.success && data.reason === "unauthenticated") {
        return (
            <div className="p-8">
                <h2 className="text-xl font-semibold">Not signed in</h2>
                <p className="text-muted-foreground">
                    Please sign in to view your dashboard.
                </p>
            </div>
        );
    }

    if (!data.success && data.reason === "missing-user") {
        return (
            <div className="p-8">
                <h2 className="text-xl font-semibold">No account found</h2>
                <p className="text-muted-foreground">
                    We couldn't find an application user for this account.
                    Please contact support.
                </p>
            </div>
        );
    }

    if (!data.success) {
        return (
            <div className="p-8">
                <h2 className="text-xl font-semibold">
                    Error loading dashboard
                </h2>
                <p className="text-muted-foreground">
                    Couldn't fetch projects and documents, please try again
                    later.
                </p>
            </div>
        );
    }

    const projects = data.projects;
    const documents = data.documents;

    const visibleProjects =
        projects.length > 3 ? projects.slice(0, 3) : projects;
    const visibleDocuments =
        documents.length > 6 ? documents.slice(0, 6) : documents;

    return (
        <div className="flex flex-col gap-12">
            <ShowProjects
                page="overview"
                projects={visibleProjects}
                documents={visibleDocuments}
                totalDocuments={documents.length}
                totalProjects={projects.length}
            />
            <ShowDocuments
                recentDocuments={visibleDocuments}
                page={"overview"}
            />
        </div>
    );
}
