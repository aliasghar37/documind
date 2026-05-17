"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Copy,
    Mic,
    Send,
    ThumbsDown,
    ThumbsUp,
    Volume2,
    Globe,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ChatMessage = {
    id: number;
    role: "user" | "assistant";
    content: string;
};

const generateAssistantReply = (prompt: string) => {
    const cleanPrompt = prompt.replace(/\s+/g, " ").trim();

    return `I can help with "${cleanPrompt}". A good next step is to break the request into the main goal, any constraints, and the expected output. If you want, I can also turn this into a short implementation plan or a checklist.`;
};

export function ChatInterface() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [prompt, setPrompt] = useState("");
    const [webSearchEnabled, setWebSearchEnabled] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const MAX_LINES = 6;

    const copyMessage = async (content: string) => {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(content);
            toast.success("Message has been copied")
        }
    };

    const doSubmit = () => {
        const trimmed = prompt.trim();
        if (!trimmed) return;
        setMessages((current) => [
            ...current,
            {
                id: current.length + 1,
                role: "user",
                content: trimmed,
            },
            {
                id: current.length + 2,
                role: "assistant",
                content: generateAssistantReply(trimmed),
            },
        ]);
        setPrompt("");

        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.overflowY = "hidden";
        }
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        doSubmit();
    };

    const adjustHeight = (el?: HTMLTextAreaElement | null) => {
        const node = el ?? textareaRef.current;
        if (!node) return;
        node.style.height = "auto";
        const cs = window.getComputedStyle(node);
        const lh = parseFloat(cs.lineHeight || "20");
        const maxH = lh * MAX_LINES;

        if (node.scrollHeight <= maxH) {
            node.style.height = node.scrollHeight + "px";
            node.style.overflowY = "hidden";
        } else {
            node.style.height = maxH + "px";
            node.style.overflowY = "auto";
        }
    };

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(event.target.value);
        adjustHeight(event.target);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            doSubmit();
        }
    };

    useEffect(() => {
        adjustHeight();
    }, []);

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-background">
            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar bg-background px-4 py-4">
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={`${message.id}-${index}`}
                            className={cn(
                                "group flex w-full text-sm leading-relaxed",
                                message.role === "user"
                                    ? "justify-end"
                                    : "justify-start",
                            )}
                        >
                            {message.role === "user" ? (
                                <div className="flex items-end gap-0 justify-end w-full">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            copyMessage(message.content)
                                        }
                                        className="size-8 rounded-full text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-muted hover:text-foreground"
                                        aria-label="Copy message"
                                    >
                                        <Copy className="size-4" />
                                    </Button>
                                    <div className="inline-block max-w-[70%] min-w-0 rounded-2xl bg-primary px-4 py-2 text-accent-foreground shadow-sm whitespace-pre-wrap">
                                        {message.content}
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-[88%] text-foreground px-3 py-2">
                                    {message.content}

                                    <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                            aria-label="Like response"
                                        >
                                            <ThumbsUp className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                            aria-label="Dislike response"
                                        >
                                            <ThumbsDown className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                            aria-label="Copy response"
                                            onClick={() =>
                                                copyMessage(message.content)
                                            }
                                        >
                                            <Copy className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                            aria-label="Listen to response"
                                        >
                                            <Volume2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative px-4 pb-4">
                <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-background/30 via-background/10 to-transparent" />
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="w-full">
                        <div className="rounded-2xl border border-border bg-background px-3 py-3 shadow-md">
                            <Textarea
                                ref={textareaRef}
                                value={prompt}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Write a message..."
                                rows={1}
                                className="min-h-0 w-full resize-none border-0 bg-transparent px-0 py-1 text-sm leading-6 shadow-none focus-visible:ring-0"
                                style={{
                                    height: "auto",
                                    overflowY: "hidden",
                                    lineHeight: "20px",
                                }}
                            />
                            <div className="mt-2 flex items-center justify-between gap-2">
                                <div>
                                    <Button
                                        type="button"
                                        variant={"ghost"}
                                        size="sm"
                                        onClick={() =>
                                            setWebSearchEnabled((s) => !s)
                                        }
                                        className={cn(
                                            "flex items-center gap-2 rounded-md px-2 py-2 text-sm",
                                            webSearchEnabled
                                                ? "bg-primary text-accent-foreground "
                                                : "text-muted-foreground",
                                        )}
                                        aria-pressed={webSearchEnabled}
                                        aria-label="Toggle web search"
                                    >
                                        <Globe className="size-4" />
                                        <span className="text-sm">
                                            Web Search
                                        </span>
                                    </Button>
                                </div>

                                <div className="flex items-center gap-2">
                                    {prompt.trim().length > 0 ? (
                                        <Button
                                            type="submit"
                                            size="lg"
                                            variant={"default"}
                                            aria-label="Send prompt"
                                        >
                                            <Send className="size-4" />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="default"
                                            size="lg"
                                            className="text-accent-foreground  bg-primary "
                                            aria-label="Voice input"
                                        >
                                            <Mic className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
}
