// convex/users.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const addOrUpdateUser = mutation({
  args: {
    fid: v.string(),
    username: v.string(),
    score: v.number(),
    isOG: v.optional(v.boolean()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("fid"), args.fid))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        score: args.score,
        username: args.username,
        ...(args.isOG !== undefined && { isOG: args.isOG }),
        ...(args.address && { address: args.address }), // Only update address if provided
        lastUpdated: Date.now(),
      });
      return existingUser._id;
    } else {
      return await ctx.db.insert("users", {
        fid: args.fid,
        username: args.username,
        score: args.score,
        isOG: args.isOG || false,
        address: args.address || "", // Default to empty string
        lastUpdated: Date.now(),
      });
    }
  },
});

export const getLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(args.limit || 50);

    return users;
  },
});

export const verifyOG = mutation({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("address"), args.address))
      .first();

    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { isOG: true });
  },
});

export const getUserByFid = query({
  args: { fid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("fid"), args.fid))
      .first();
  },
});
export const checkAddressExists = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("address"), args.address))
      .first();

    return user !== null; // Returns true if a user is found, false otherwise
  },
});
export const getRewardsLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users")
      .order("desc") // Sort by score descending
      .take(100); // Limit to top 100 users

    return users
      .filter((user) => user.score > 0 && user.address) // Exclude users with zero score or no address
      .map((user, index) => ({
        donor: user.address,
        amount: (user.isOG ? user.score * 2 : user.score).toFixed(2), // Apply 2x multiplier for isOG
        username: user.username || null,
        rank: index + 1,
      }));
  },
});
