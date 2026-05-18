"use client";

import { createContext, useContext, useMemo, useState } from "react";

type ProjectHeaderContextValue = {
    projectTitle: string | null;
    setProjectTitle: (title: string | null) => void;
};

const ProjectHeaderContext = createContext<ProjectHeaderContextValue | null>(
    null,
);

export function ProjectHeaderProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [projectTitle, setProjectTitle] = useState<string | null>(null);
    const value = useMemo(
        () => ({ projectTitle, setProjectTitle }),
        [projectTitle],
    );

    return (
        <ProjectHeaderContext.Provider value={value}>
            {children}
        </ProjectHeaderContext.Provider>
    );
}

export function useProjectHeader() {
    const context = useContext(ProjectHeaderContext);
    if (!context)
        throw new Error(
            "useProjectHeader must be used within a ProjectHeaderProvider",
        );
    return context;
}
