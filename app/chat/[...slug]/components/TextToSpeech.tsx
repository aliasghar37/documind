import { Button } from "@/components/ui/button";
import { CirclePause, Volume2 } from "lucide-react";
import { useRef, useState } from "react";

export default function TextToSpeech({ text }: { text: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleSpeechToggle = () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }
        const encodedText = encodeURIComponent(text);
        const streamUrl = `/api/tts?text=${encodedText}`;

        const audio = new Audio(streamUrl);
        audioRef.current = audio;

        setIsPlaying(true);
        audio.play().catch(() => setIsPlaying(false));

        audio.onended = () => {
            setIsPlaying(false);
        };
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Listen to response"
            onClick={handleSpeechToggle}
            // disabled={isPlaying}
        >
            {isPlaying ? (
                <CirclePause className="size-4" />
            ) : (
                <Volume2 className="size-4" />
            )}
        </Button>
    );
}
