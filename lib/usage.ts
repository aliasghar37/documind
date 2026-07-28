import { prisma } from "./prisma";
import { TIER_LIMITS } from "./data";

export async function checkAndUpsertUsage(userId: string) {
  const user = await prisma.user.findUnique({
	where: { id: userId },
	select: {
	  role: true,
	  periodStart: true,
	  periodEnd: true,
	  totalTokens: true,
	},
  });
  if (!user) return null;

  const needsReset = !user.periodEnd || new Date() > user.periodEnd;

  const role = user.role ?? "FREE";

  if (needsReset) {
	const now = new Date();
	const periodDays = TIER_LIMITS[role].periodDays;
	const periodEnd = new Date(now.getTime() + periodDays * 86400000);

	await prisma.user.update({
	  where: { id: userId },
	  data: {
		totalTokens: 0,
		periodStart: now,
		periodEnd,
	  },
	});

	return {
	  totalTokens: 0,
	  limit: TIER_LIMITS[role].maxTokens,
	};
  }

  return {
	totalTokens: user.totalTokens ?? 0,
	limit: TIER_LIMITS[role].maxTokens,
  };
}

export async function getUsage(userId: string) {
  const user = await prisma.user.findUnique({
	where: { id: userId },
	select: {
	  role: true,
	  totalTokens: true,
	  periodStart: true,
	  periodEnd: true,
	},
  });
  if (!user) return null;

  const role = user.role ?? "FREE";
  const limit = TIER_LIMITS[role].maxTokens;
  const tokens = user.totalTokens ?? 0;
  const remaining = Math.max(0, limit - tokens);

  return {
	role,
	totalTokens: tokens,
	limit,
	remaining,
	periodStart: user.periodStart,
	periodEnd: user.periodEnd,
  };
}

export async function addUsage(
  userId: string,
  inputTokens: number,
  outputTokens: number,
) {
  const total = inputTokens + outputTokens;

  await prisma.user.update({
	where: { id: userId },
	data: { totalTokens: { increment: total } },
  });
}
