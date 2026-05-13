export const projectCategories = [
    "General Purpose",
    "Academic & Education",
    "Professional & Office",
    "Medical & Healthcare",
] as const;

export type ProjectCategoryType = (typeof projectCategories)[number];
