import { NextRequest } from "next/server";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { Readable } from "node:stream";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const text = searchParams.get("text");
        const category = searchParams.get("category") || "General Purpose";

        if (!text) return new Response("Text required", { status: 400 });

        const tts = new MsEdgeTTS();
        let selectedVoice = "en-US-AriaNeural";
        if (category === "Medical & Healthcare")
            selectedVoice = "en-US-GuyNeural";
        else if (category === "Academic & Study Notes")
            selectedVoice = "en-US-JennyNeural";
        else if (category === "Technical & Code Docs")
            selectedVoice = "en-US-AndrewNeural";

        await tts.setMetadata(
            selectedVoice,
            OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
        );
        const { audioStream } = tts.toStream(text);
        const webStream = Readable.toWeb(audioStream) as unknown as BodyInit;

        return new Response(webStream, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Accept-Ranges": "none",
            },
        });
    } catch (error) {
        return new Response("Error", { status: 500 });
    }
}
