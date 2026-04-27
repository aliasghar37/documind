"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormEvent, useMemo, useState } from "react";
import { Project } from "../page";
import Link from "next/link";

const badgePalette = [
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-sky-100 text-sky-800 border-sky-200",
    "bg-amber-100 text-amber-900 border-amber-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-cyan-100 text-cyan-800 border-cyan-200",
];

export default function Projects({
    projects: initialProjects,
    page,
}: {
    projects: Project[];
    page: "projects" | "overview";
}) {
    const [projects, setProjects] = useState<Project[]>(initialProjects);

    const metricesData = useMemo(() => {
        const totalDocuments = projects.reduce(
            (sum, project) => sum + project.documents,
            0,
        );

        return [
            { title: 4885, description: "Token Usage" },
            { title: projects.length, description: "Projects Created" },
            { title: totalDocuments, description: "Documents Uploaded" },
            { title: "Free", description: "User Type" },
        ];
    }, [projects]);

    return (
        <>
            {page === "overview" ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
                    {metricesData.map((data) => (
                        <Card
                            key={data.description}
                            size="default"
                            className="mx-auto w-full max-w-sm"
                        >
                            <CardHeader>
                                <CardTitle className="text-2xl text-foreground">
                                    {data.title}
                                </CardTitle>
                                <CardDescription className="text-lg">
                                    {data.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : (
                ""
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl">Recent Projects</h1>
                </div>
                <div className="flex justify-center items-center gap-2">
                    <Button asChild variant="secondary" size="lg">
                        <Link href="/dashboard/documents">
                            Show all documents
                        </Link>
                    </Button>
                    <Button size="lg">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M4 3C3.44772 3 3 3.44772 3 4V10C3 10.5523 3.44772 11 4 11H10C10.5523 11 11 10.5523 11 10V4C11 3.44772 10.5523 3 10 3H4ZM4 13C3.44772 13 3 13.4477 3 14V20C3 20.5523 3.44772 21 4 21H10C10.5523 21 11 20.5523 11 20V14C11 13.4477 10.5523 13 10 13H4ZM14 13C13.4477 13 13 13.4477 13 14V20C13 20.5523 13.4477 21 14 21H20C20.5523 21 21 20.5523 21 20V14C21 13.4477 20.5523 13 20 13H14ZM15 19V15H19V19H15ZM5 9V5H9V9H5ZM5 19V15H9V19H5ZM16 11V8H13V6H16V3H18V6H21V8H18V11H16Z"></path>
                        </svg>
                        Create new project
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {projects.map((project) => (
                    <Card
                        key={project.id}
                        size="default"
                        className="flex h-full w-full flex-col"
                    >
                        <CardHeader>
                            <CardTitle className="text-2xl">
                                {project.title}
                            </CardTitle>
                            <CardDescription>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-1">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            width="18"
                                        >
                                            <path d="M21 8V20.9932C21 21.5501 20.5552 22 20.0066 22H3.9934C3.44495 22 3 21.556 3 21.0082V2.9918C3 2.45531 3.4487 2 4.00221 2H14.9968L21 8ZM19 9H14V4H5V20H19V9ZM8 7H11V9H8V7ZM8 11H16V13H8V11ZM8 15H16V17H8V15Z"></path>
                                        </svg>
                                        <p className="text-base">
                                            Documents ({project.documents})
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            width="18"
                                        >
                                            <path d="M17 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H7V1H9V3H15V1H17V3ZM4 9V19H20V9H4ZM6 11H8V13H6V11ZM11 11H13V13H11V11ZM16 11H18V13H16V11Z"></path>
                                        </svg>
                                        <p className="text-base">
                                            {project.date}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1">
                                    {project.tags.map((tag, i) => (
                                        <Badge
                                            key={`${project.id}-${tag}`}
                                            className={badgePalette[i]}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1">
                            <p className="line-clamp-3">
                                {project.description ||
                                    "No description added yet."}
                            </p>
                        </CardContent>

                        <CardFooter className="mt-auto flex justify-center gap-2 bg-card">
                            <Button
                                variant="outline"
                                size="default"
                                className="w-1/2 bg-primary text-background"
                            >
                                Open Project
                            </Button>
                            <Button
                                variant="outline"
                                size="default"
                                className="w-1/2"
                            >
                                Edit Project
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </>
    );
}
