"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import handleUpdateProject from "@/app/actions/handleUpdateProject";
import { ProjectCategoryType, projectCategories } from "@/lib/data";

const MAX_FILES = 3;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 1500;

export function UpdateProject({
    oldTitle,
    oldDescription,
    oldDocuments,
    oldIsWebSearch,
    oldProjectCategory,
}: {
    oldTitle: string;
    oldDescription: string | null;
    oldDocuments: FileList | null;
    oldIsWebSearch: boolean;
    oldProjectCategory: ProjectCategoryType;
}) {
    const [title, setTitle] = useState(oldTitle);
    const [description, setDescription] = useState(oldDescription);
    const [files, setFiles] = useState<FileList | null>(oldDocuments);
    const [isWebSearch, setIsWebSearch] = useState(oldIsWebSearch);
    const [projectCategory, setProjectCategory] =
        useState<ProjectCategoryType>(oldProjectCategory);

    const selectedFiles = useMemo(() => {
        return files ? Array.from(files) : [];
    }, [files]);

    const validateFiles = (incomingFiles: FileList | null) => {
        if (!incomingFiles || incomingFiles.length === 0) {
            return true;
        }

        if (incomingFiles.length > MAX_FILES) {
            toast.error(`Maximum ${MAX_FILES} documents allowed per project.`);
            return false;
        }

        for (const file of Array.from(incomingFiles)) {
            const isPdf =
                file.type === "application/pdf" ||
                file.name.toLowerCase().endsWith(".pdf");

            if (!isPdf) {
                toast.error(`${file.name} is not a PDF file.`);
                return false;
            }

            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast.error(`${file.name} is larger than 5 MB.`);
                return false;
            }
        }
        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!validateFiles(selectedFiles)) {
            e.target.value = "";
            setFiles(null);
            return;
        }
        setFiles(selectedFiles);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (
            trimmedTitle.length === 0 ||
            trimmedTitle.length > MAX_TITLE_LENGTH
        ) {
            toast.error(
                `Title must be between 1 and ${MAX_TITLE_LENGTH} characters.`,
            );
            return;
        }

        if (description && description.length > MAX_DESCRIPTION_LENGTH) {
            toast.error(
                `Description must be between 0 and ${MAX_DESCRIPTION_LENGTH} characters.`,
            );
            return;
        }

        if (!files || files.length === 0) {
            toast.error("Please upload at least one PDF file.");
            return;
        }
        if (!validateFiles(files)) return;

        const fd = new FormData();
        fd.append("title", trimmedTitle);
        fd.append("description", description || "");
        fd.append("projectCategory", `${projectCategory}`);
        fd.append("webSearch", `${isWebSearch}`);
        for (const file of Array.from(files)) {
            fd.append("docs", file, file.name);
        }
        setIsSubmitting(true);

        const loadingToastId = toast.loading(
            "Uploading files and creating project...",
        );
        try {
            const result = await handleUpdateProject(fd);

            if (!result.success) {
                toast.dismiss(loadingToastId);
                toast.error(result.message || "Failed to create project");
                return;
            }
            toast.dismiss(loadingToastId);
            toast.success("Project created successfully.");

            setTitle("");
            setDescription("");
            setFiles(null);
            setProjectCategory(projectCategories[0]);
            setIsWebSearch(true);
        } catch (err) {
            console.error(err);
            toast.dismiss(loadingToastId);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="default" className="w-1/2 ">
                    Edit Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create a new project</DialogTitle>
                        <DialogDescription>
                            Interact with your documents using AI. Upload your
                            documents and configure your AI assistant.
                        </DialogDescription>
                    </DialogHeader>

                    <FieldGroup className="py-6 space-y-0">
                        <Field>
                            <Label htmlFor="title">Project Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g., Course work"
                                maxLength={MAX_TITLE_LENGTH}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                {title.length}/{MAX_TITLE_LENGTH}
                            </p>
                        </Field>

                        <Field>
                            <Label htmlFor="description">
                                Short Description
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="What is this project about?"
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                value={description ? description : ""}
                                onChange={(e) => setDescription(e.target.value)}
                                className="resize-none h-28 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-gray-100 "
                            />
                            <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                {description?.length}/{MAX_DESCRIPTION_LENGTH}
                            </p>
                        </Field>

                        <Field>
                            <Label htmlFor="docs">
                                Upload Documents (1-3 PDFs) *
                            </Label>
                            <Input
                                id="docs"
                                type="file"
                                accept=".pdf"
                                multiple
                                required
                                onChange={handleFileChange}
                                className="cursor-pointer"
                            />
                            {selectedFiles.length > 0 ? (
                                <div className="mt-2 space-y-1">
                                    {selectedFiles.map((file) => (
                                        <p
                                            key={`${file.name}-${file.lastModified}`}
                                            className="text-[10px] text-muted-foreground truncate"
                                            title={file.name}
                                        >
                                            {file.name} (
                                            {(
                                                file.size /
                                                (1024 * 1024)
                                            ).toFixed(2)}{" "}
                                            MB)
                                        </p>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Select up to 3 PDF files (max 5 MB each)
                                </p>
                            )}
                        </Field>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <Field>
                                <Label>Project Category</Label>
                                <Select
                                    name="projectCategory"
                                    defaultValue={projectCategories[0]}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select project category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projectCategories.map((category) => {
                                            return (
                                                <SelectItem
                                                    key={category}
                                                    value={category}
                                                >
                                                    {category}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </Field>

                            <div className="flex flex-col gap-2 justify-center">
                                <Label htmlFor="web-search">Web Search</Label>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="web-search"
                                        name="webSearchEnabled"
                                        defaultChecked={isWebSearch}
                                        onClick={(prev) =>
                                            setIsWebSearch(!prev)
                                        }
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        Tavily API
                                    </span>
                                </div>
                            </div>
                        </div>
                    </FieldGroup>

                    <DialogFooter className="sm:justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
