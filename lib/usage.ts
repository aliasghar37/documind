import { prisma } from "./prisma";
import { TIER_LIMITS } from "./limits";

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

  if (needsReset) {
	const now = new Date();
	const periodDays = TIER_LIMITS[user.role].periodDays;
	const periodEnd = new Date(now.getTime() + periodDays * 86400000);

	await prisma.user.update({
	  where: { id: userId },
	  data: {
		totalTokens: 0,
		periodStart: now,
		periodEnd,
	  },
	});

	return { totalTokens: 0, limit: TIER_LIMITS[user.role].maxTokens };
  }

  return {
	totalTokens: user.totalTokens,
	limit: TIER_LIMITS[user.role].maxTokens,
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

  const limit = TIER_LIMITS[user.role].maxTokens;
  const remaining = Math.max(0, limit - user.totalTokens);

  return {
	role: user.role,
	totalTokens: user.totalTokens,
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
