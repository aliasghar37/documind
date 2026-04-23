import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(request: Request) {
    try {
        const payload: WebhookEvent = await request.json();
        console.log("payload:", payload);

        return Response.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error("webhook error:", error);
        return Response.json({ ok: false }, { status: 400 });
    }
}

export async function GET() {
    return Response.json({ message: "Hello World!" });
}
