"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mic, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
    id: number;
    role: "user" | "assistant";
    content: string;
};

const initialMessages: ChatMessage[] = [
    {
        id: 1,
        role: "assistant",
        content:
            "I can summarize this document, answer questions, and pull out key points.",
    },
    {
        id: 2,
        role: "user",
        content: "What is this document about?",
    },
    {
        id: 3,
        role: "assistant",
        content:
            "It looks like a sample document. Ask me to extract terms, entities, or a section summary.",
    },
    {
        id: 1,
        role: "assistant",
        content:
            "I can summarize this document, answer questions, and pull out key points.",
    },
    {
        id: 2,
        role: "user",
        content: "What is this document about?",
    },
    {
        id: 3,
        role: "assistant",
        content:
            "It looks like a sample document. Ask me to extract terms, entities, or a section summary.",
    },
    {
        id: 1,
        role: "assistant",
        content:
            "I can summarize this document, answer questions, and pull out key points.",
    },
    {
        id: 2,
        role: "user",
        content: "What is this document about?",
    },
    {
        id: 3,
        role: "assistant",
        content:
            "It looks like a sample document. Ask me to extract terms, entities, or a section summary.",
    },
    {
        id: 1,
        role: "assistant",
        content:
            "I can summarize this document, answer questions, and pull out key points.",
    },
    {
        id: 2,
        role: "user",
        content: "What is this document about?",
    },
    {
        id: 3,
        role: "assistant",
        content:
            "It looks like a sample document. Ask me to extract terms, entities, or a section summary.",
    },
    {
        id: 1,
        role: "assistant",
        content:
            "I can summarize this document, answer questions, and pull out key points.",
    },
    {
        id: 2,
        role: "user",
        content: "What is this document about?",
    },
    {
        id: 3,
        role: "assistant",
        content:
            "It looks like a sample document. Ask me to extract terms, entities, or a section summary.",
    },
];

export function ChatInterface() {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [prompt, setPrompt] = useState("");

    const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = prompt.trim();
        if (!trimmed) return;
        setMessages((current) => [
            ...current,
            {
                id: current.length + 1,
                role: "user",
                content: trimmed,
            },
        ]);
        setPrompt("");
    };

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-background">
            <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar bg-background px-4 py-4">
                <div className="space-y-4 pr-1">
                    {messages.map((message, index) => (
                        <div
                            key={`${message.id}-${index}`}
                            className={cn(
                                "px-3 py-2 text-sm leading-relaxed",
                                message.role === "user"
                                    ? "inline-block w-auto max-w-[70%] whitespace-normal mr-auto ml-auto rounded-2xl  bg-primary text-primary-foreground shadow-sm"
                                    : "max-w-[88%] mr-auto text-foreground",
                            )}
                        >
                            {message.content}
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative px-4 pb-4">
                <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-background/30 via-background/10 to-transparent" />
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/35 px-3 py-2 shadow-sm transition-colors focus-within:border-primary/40 focus-within:bg-background">
                        <Textarea
                            value={prompt}
                            onChange={(event) => setPrompt(event.target.value)}
                            placeholder="Ask something about the document..."
                            rows={1}
                            className="min-h-0 h-10 resize-none border-0 bg-transparent px-0 py-2 text-sm leading-6 shadow-none focus-visible:ring-0"
                        />

                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            className="text-muted-foreground hover:bg-muted hover:rounded-full hover:text-foreground"
                            aria-label="Voice input"
                        >
                            <Mic className="size-4" />
                        </Button>

                        <Button
                            type="submit"
                            size="lg"
                            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                            aria-label="Send prompt"
                        >
                            <Send className="size-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </section>
    );
}
