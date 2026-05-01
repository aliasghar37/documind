export type AiPersonaType =
    | "Reading Assistant"
    | "Technical Expert"
    | "Creative Assistant";

export const AI_PERSONAS: AiPersonaType[] = [
    "Reading Assistant",
    "Technical Expert",
    "Creative Assistant",
];

export const PROJECT_TAG_OPTIONS = [
    "Book Reading",
    "Office Work",
    "Research",
    "Study Notes",
    "Contracts",
    "Others",
    "Reports",
    "Presentations",
] as const;

export type ProjectTag = (typeof PROJECT_TAG_OPTIONS)[number];
export type ProjectTags = ProjectTag[];

export type ProjectSettings = {
    webSearch?: boolean;
    aiPersona?: AiPersonaType;
    createdWith?: string;
};
