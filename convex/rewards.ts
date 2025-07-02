// convex/rewards.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const distributeRewards = mutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").order("desc").take(50);

    const celoPriceUSD = 0.5; // Assume 1 CELO = $0.5 (fetch from an oracle in production)
    const period = new Date().toISOString().split("T")[0]; // Daily period (e.g., "2025-05-22")

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      let amountUSD = i < 10 ? 6 : 1; // Top 10: $6, Others: $1
      if (user.isOG) amountUSD *= 2; // Double for OG users
      const amountWei = Math.floor((amountUSD / celoPriceUSD) * 1e18); // Convert to CELO wei

      await ctx.db.insert("rewards", {
        fid: user.fid,
        amount: amountWei,
        claimed: false,
        period,
      });
    }
  },
});

export const claimReward = mutation({
  args: { fid: v.string(), period: v.string() },
  handler: async (ctx, args) => {
    const reward = await ctx.db
      .query("rewards")
      .filter((q) => q.eq(q.field("fid"), args.fid))
      .filter((q) => q.eq(q.field("period"), args.period))
      .first();

    if (!reward || reward.claimed) throw new Error("No unclaimed reward found");

    await ctx.db.patch(reward._id, { claimed: true });
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("fid"), args.fid))
      .first();
    if (!user) throw new Error("User not found");
    return { amount: reward.amount, address: user.address };
  },
});
export const getReward = query({
  args: { fid: v.string(), period: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rewards")
      .filter((q) => q.eq(q.field("fid"), args.fid))
      .filter((q) => q.eq(q.field("period"), args.period))
      .first();
  },
});

export const markClaimed = mutation({
  args: { rewardId: v.id("rewards") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rewardId, { claimed: true });
  },
});
