// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    fid: v.string(), // Farcaster ID
    username: v.string(),
    score: v.number(), // Calculated engagement score
    isOG: v.boolean(), // OG status via self.xyz
    address: v.string(), // Wallet address for rewards
    lastUpdated: v.number(), // Timestamp for last score update
  }).index("by_fid", ["fid"]),

  rewards: defineTable({
    fid: v.string(),
    amount: v.number(), // CELO reward amount (in wei)
    claimed: v.boolean(), // Whether reward has been claimed
    period: v.string(), // Reward period (e.g., "2025-05-22")
  }).index("by_fid_period", ["fid", "period"]),
});
