"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Copy, Send, Loader2, Globe, FileText, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Markdown from "react-markdown";
import TextToSpeech from "./TextToSpeech";
import SpeechToText from "./SpeechToText";

type ParsedResponse = {
  answer: string;
  references: { title: string; url?: string; documentId?: string; pageNumber?: number | null }[];
};

function getMessageText(message: UIMessage): string {
  return message.parts
	.filter(isTextUIPart)
	.map((p) => p.text)
	.join("");
}

export function ChatInterface({ projectId }: { projectId: string }) {
  const [parsedResponses, setParsedResponses] = useState<
	Map<string, ParsedResponse>
  >(new Map());
  const [expandedRefs, setExpandedRefs] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const MAX_LINES = 6;

  const { messages, sendMessage, status, error } = useChat({
	id: projectId,
	transport: new DefaultChatTransport({
	  api: "/api/chat",
	  body: { projectId },
	}),
	onFinish: ({ message }) => {
	  const text = getMessageText(message);
	  try {
		let cleaned = text.trim();
		cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
		const jsonStart = cleaned.indexOf("{");
		const jsonEnd = cleaned.lastIndexOf("}");
		if (jsonStart !== -1 && jsonEnd > jsonStart) {
		  const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
		  if (parsed.answer && Array.isArray(parsed.references)) {
			setParsedResponses((prev) => new Map(prev).set(message.id, parsed));
			return;
		  }
		}
	  } catch {}
	  setParsedResponses((prev) =>
		new Map(prev).set(message.id, { answer: text, references: [] }),
	  );
	},
  });

  const isLoading = status === "submitted" || status === "streaming";

  const copyMessage = async (text: string) => {
	if (navigator.clipboard?.writeText) {
	  await navigator.clipboard.writeText(text);
	  toast.success("Message has been copied");
	}
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

  const doSubmit = () => {
	const trimmed = input.trim();
	if (!trimmed || isLoading) return;
	sendMessage({ text: trimmed });
	setInput("");
	const el = textareaRef.current;
	if (el) {
	  el.style.height = "auto";
	  el.style.overflowY = "hidden";
	}
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

  useEffect(() => {
	if (scrollRef.current) {
	  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}
  }, [messages, parsedResponses, isLoading]);

  const getDisplayText = (message: UIMessage) => {
	const parsed = parsedResponses.get(message.id);
	if (parsed?.answer) return parsed.answer;
	return "";
  };

  const getReferences = (message: { id: string }) => {
	return parsedResponses.get(message.id)?.references ?? [];
  };

  const lastMessage = messages[messages.length - 1];
  const isStreamingLastMessage = isLoading && lastMessage?.role === "assistant";

  return (
	<section className="flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-background">
	  <div
		ref={scrollRef}
		className="flex-1 min-h-0 overflow-y-auto chat-scrollbar bg-background px-4 py-4"
	  >
		<div className="space-y-4">
		  {messages.map((message) => (
			<div
			  key={message.id}
			  className={cn(
				"group flex w-full text-sm leading-relaxed",
				message.role === "user" ? "justify-end" : "justify-start",
			  )}
			>
			  {message.role === "user" ? (
				<div className="flex items-end gap-0 justify-end w-full">
				  <Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={() => copyMessage(getMessageText(message))}
					className="size-8 rounded-full text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-muted hover:text-foreground"
					aria-label="Copy message"
				  >
					<Copy className="size-4" />
				  </Button>
				  <div className="inline-block max-w-[70%] min-w-0 rounded-2xl bg-primary px-4 py-2 text-accent-foreground shadow-sm whitespace-pre-wrap">
					{getMessageText(message)}
				  </div>
				</div>
			  ) : (
				<div className="max-w-[88%] text-foreground px-3 py-2">
				  {(() => {
					const displayText = getDisplayText(message);
					const refs = getReferences(message);
					const isComplete = parsedResponses.has(message.id);
					const refsExpanded = expandedRefs.has(message.id);

					if (!isComplete) {
					  if (message.id === lastMessage?.id && isStreamingLastMessage) {
						return (
						  <div className="flex items-center gap-1.5 py-1">
							<Loader2 className="size-4 animate-spin text-muted-foreground" />
							<span className="text-sm text-muted-foreground">Thinking...</span>
						  </div>
						);
					  }
					  return null;
					}

					return (
					  <>
						<div className="prose prose-sm dark:prose-invert max-w-none">
						  <Markdown>{displayText}</Markdown>
						</div>

						<div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
						  <Button
							type="button"
							variant="ghost"
							size="icon"
							className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
							aria-label="Copy response"
							onClick={() => copyMessage(displayText)}
						  >
							<Copy className="size-4" />
						  </Button>
						  <TextToSpeech text={displayText} />
						  {refs.length > 0 && (
							<Button
							  type="button"
							  variant="ghost"
							  size="icon"
							  className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
							  aria-label="Show references"
							  onClick={() =>
								setExpandedRefs((prev) => {
								  const next = new Set(prev);
								  if (next.has(message.id)) {
									next.delete(message.id);
								  } else {
									next.add(message.id);
								  }
								  return next;
								})
							  }
							>
							  {refsExpanded ? (
								<ChevronUp className="size-4" />
							  ) : (
								<ChevronDown className="size-4" />
							  )}
							</Button>
						  )}
						</div>

						{refsExpanded && refs.length > 0 && (
						  <div className="mt-2 flex flex-wrap gap-1.5">
							{refs.map((ref, i) => {
							  const icon = ref.url ? (
								<Globe className="size-3.5 shrink-0" />
							  ) : (ref.documentId || ref.pageNumber) ? (
								<FileText className="size-3.5 shrink-0" />
							  ) : (
								<Sparkles className="size-3.5 shrink-0" />
							  );
							  const label = ref.url
								? ref.title
								: ref.pageNumber
								  ? `${ref.title} (p. ${ref.pageNumber})`
								  : ref.title || "Unknown";

							  const chipClass =
								"inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/50 px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary hover:text-foreground";

							  return ref.url ? (
								<a
								  key={i}
								  href={ref.url}
								  target="_blank"
								  rel="noopener noreferrer"
								  className={chipClass}
								>
								  {icon}
								  {label}
								</a>
							  ) : (
								<span key={i} className={chipClass}>
								  {icon}
								  {label}
								</span>
							  );
							})}
						  </div>
						)}
					  </>
					);
				  })()}
				</div>
			  )}
			</div>
		  ))}

		  {error && (
			<div className="flex justify-start">
			  <div className="max-w-[88%] text-sm text-destructive px-3 py-2 rounded-lg bg-destructive/10">
				Something went wrong. Please try again.
			  </div>
			</div>
		  )}
		</div>
	  </div>

	  <div className="relative px-4 pb-4">
		<div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-background/30 via-background/10 to-transparent" />
		<form
		  onSubmit={(e) => {
			e.preventDefault();
			doSubmit();
		  }}
		  className="space-y-3"
		>
		  <div className="w-full">
			<div className="rounded-2xl border border-border bg-background px-3 py-3 shadow-md">
			  <Textarea
				ref={textareaRef}
				value={input}
				onChange={(e) => {
				  setInput(e.target.value);
				  adjustHeight(e.target);
				}}
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
			  <div className="mt-2 flex items-center justify-end gap-2">
				<div className="flex items-center gap-2">
				  <SpeechToText />
				  <Button
					type="submit"
					size="default"
					variant="default"
					disabled={isLoading || !input.trim()}
					aria-label="Send prompt"
				  >
					<Send className="size-4" />
				  </Button>
				</div>
			  </div>
			</div>
		  </div>
		</form>
	  </div>
	</section>
  );
}
