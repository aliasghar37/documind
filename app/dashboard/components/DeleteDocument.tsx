"use client";

import { handleDeleteDocument } from "@/app/actions/handleDeleteDocument";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

export default function DeleteDocument({ documentId }: { documentId: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const router = useRouter();

    const confirmDeleteDocument = async () => {
        setIsDeleting(true);
        try {
            const result = await handleDeleteDocument(documentId);
            if (result.success) {
                toast.success(result.message);
                setOpenDelete(false);
                router.refresh();
            } else {
                toast.error(result.message || "Failed to delete document.");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant={"ghost"}
                size={"lg"}
                onClick={() => {
                    setOpenDelete(true);
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z"></path>
                </svg>
            </Button>
            <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Document?</DialogTitle>
                        <DialogDescription>
                            This will permanently delete the document. Do you
                            really want to delete?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => setOpenDelete(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={isDeleting}
                            variant={"destructive"}
                            onClick={confirmDeleteDocument}
                        >
                            {isDeleting
                                ? "Deleting Document..."
                                : "Yes, Delete permanently"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
