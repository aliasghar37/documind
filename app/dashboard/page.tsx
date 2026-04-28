import Projects from "./components/Projects";
import Documents from "./components/Documents";

export type Project = {
    id: number;
    title: string;
    documents: number;
    date: string;
    tags: string[];
    description: string;
};

export type Document = {
    name: string;
    project: string;
    updated: string;
    status: "Indexed" | "Queued";
};

export const initialProjects: Project[] = [
    {
        id: 1,
        title: "Product Name",
        documents: 4,
        date: "Apr 12",
        tags: ["AI", "Personal Development", "Novels"],
        description:
            'The card component supports a size prop that can be set to "sm" for a more compact appearance. The card component supports a size prop that can be set to "sm" for a more compact appearance.',
    },
    {
        id: 9,
        title: "Product Name",
        documents: 4,
        date: "Apr 12",
        tags: ["AI", "Personal Development", "Novels"],
        description:
            'The card component supports a size prop that can be set to "sm" for a more compact appearance. The card component supports a size prop that can be set to "sm" for a more compact appearance.',
    },
    {
        id: 8,
        title: "Product Name",
        documents: 4,
        date: "Apr 12",
        tags: ["AI", "Personal Development", "Novels"],
        description:
            'The card component supports a size prop that can be set to "sm" for a more compact appearance. The card component supports a size prop that can be set to "sm" for a more compact appearance.',
    },
    {
        id: 3,
        title: "Product Name",
        documents: 4,
        date: "Apr 12",
        tags: ["AI", "Personal Development", "Novels"],
        description:
            'The card component supports a size prop that can be set to "sm" for a more compact appearance.',
    },
    {
        id: 4,
        title: "Product Name",
        documents: 4,
        date: "Apr 12",
        tags: ["AI", "Personal Development", "Novels"],
        description:
            'The card component supports a size prop that can be set to "sm" for a more compact appearance.',
    },
    {
        id: 5,
        title: "Product Name",
        documents: 4,
        date: "Apr 12",
        tags: ["AI", "Personal Development", "Novels"],
        description:
            'The card component supports a size prop that can be set to "sm" for a more compact appearance.',
    },
    {
        id: 6,
        title: "Product Name",
        documents: 4,
        date: "Apr 12",
        tags: ["AI", "Personal Development", "Novels"],
        description:
            'The card component supports a size prop that can be set to "sm" for a more compact appearance.',
    },
    {
        id: 2,
        title: "Product Name",
        documents: 4,
        date: "Apr 12",
        tags: ["AI", "Personal Development", "Novels"],
        description:
            'The card component supports a size prop that can be set to "sm" for a more compact appearance.',
    },
];

export const recentDocuments: Document[] = [
    {
        name: "PRD-v2.pdf",
        project: "Product Name",
        updated: "2h ago",
        status: "Indexed",
    },
    {
        name: "Audience-Notes.docx",
        project: "Product Name",
        updated: "5h ago",
        status: "Indexed",
    },
    {
        name: "Sprint-Outline.md",
        project: "Product Name",
        updated: "Yesterday",
        status: "Queued",
    },
    {
        name: "Brand-Voice.txt",
        project: "Product Name",
        updated: "Yesterday",
        status: "Indexed",
    },
    {
        name: "Competitor-Analysis.pdf",
        project: "Product Name",
        updated: "Apr 24",
        status: "Indexed",
    },
    {
        name: "Feature-Ideas.xlsx",
        project: "Product Name",
        updated: "Apr 21",
        status: "Queued",
    },
];

export default function CardSmall() {
    const visibleProjects = initialProjects.slice(0, 3);
    const visibleDocuments = recentDocuments.slice(0, 6);

    return (
        <div className="flex flex-col gap-12">
            <Projects page="overview" projects={visibleProjects} />
            <Documents recentDocuments={visibleDocuments} />
        </div>
    );
}
