import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
	const event = await verifyWebhook(request);
	const { id } = event.data;

	if (event.type === "user.created") {
	  const { first_name, last_name, email_addresses, image_url } = event.data;
	  console.log(first_name, last_name, email_addresses, image_url);
	  console.log("dataaa:", event.data);

	  let user = await prisma.user.findUnique({
		where: { clerkUserId: id as string },
	  });

	  if (!user) {
		user = await prisma.user.findUnique({
		  where: { email: email_addresses[0].email_address },
		});
	  }

	  if (user) {
		await prisma.user.update({
		  where: { id: user.id },
		  data: {
			clerkUserId: id as string,
			email: email_addresses[0].email_address,
			firstName: first_name as string,
			lastName: last_name as string,
			imageUrl: image_url,
		  },
		});
	  } else {
		await prisma.user.create({
		  data: {
			clerkUserId: id as string,
			email: email_addresses[0].email_address,
			firstName: first_name as string,
			lastName: last_name as string,
			imageUrl: image_url,
			role: "FREE",
		  },
		});
	  }
	  try {
		const client = await clerkClient();
		await client.users.updateUser(id as string, {
		  publicMetadata: { role: "free" },
		});
	  } catch (error) {
		console.error("Failed to set user role metadata:", error);
	  }
	}
	return new Response("Webhook received", { status: 200 });
  } catch (error) {
	console.error("webhook verifying error:", error);
	return new Response("Error Verifying Webhook", { status: 400 });
  }
}

export async function GET() {
  return Response.json({ message: "Hello World!" });
}
