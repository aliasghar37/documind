"use client";

import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

export default function SpeechToText() {
  return (
	<Button
	  type="button"
	  variant="ghost"
	  size="default"
	  className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground"
	  aria-label="Voice input"
	>
	  <Mic className={"size-4"} />
	</Button>
  );
}
