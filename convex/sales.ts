import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

// ─── helpers ─────────────────────────────────────────────────────────────────
async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Not authenticated")
  return identity.subject
}

// ─── Sales ────────────────────────────────────────────────────────────────────
export const listSales = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx)
    return ctx.db
      .query("sales")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect()
  },
})

export const createSale = mutation({
  args: {
    invoiceNumber: v.string(),
    date: v.string(),
    clientName: v.string(),
    service: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    subtotal: v.number(),
    tax: v.number(),
    taxRate: v.number(),
    total: v.number(),
    status: v.union(v.literal("paid"), v.literal("pending"), v.literal("cancelled")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    return ctx.db.insert("sales", { ...args, userId })
  },
})

export const updateSale = mutation({
  args: {
    id: v.id("sales"),
    date: v.string(),
    clientName: v.string(),
    service: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    subtotal: v.number(),
    tax: v.number(),
    taxRate: v.number(),
    total: v.number(),
    status: v.union(v.literal("paid"), v.literal("pending"), v.literal("cancelled")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUser(ctx)
    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) throw new Error("Not found")
    await ctx.db.patch(id, patch)
  },
})

export const deleteSale = mutation({
  args: { id: v.id("sales") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx)
    const existing = await ctx.db.get(id)
    if (!existing || existing.userId !== userId) throw new Error("Not found")
    await ctx.db.delete(id)
  },
})

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx)
    return ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique()
  },
})

export const upsertSettings = mutation({
  args: {
    businessName: v.string(),
    businessRfc: v.optional(v.string()),
    businessAddress: v.optional(v.string()),
    businessEmail: v.optional(v.string()),
    businessPhone: v.optional(v.string()),
    taxRate: v.number(),
    currency: v.string(),
    invoicePrefix: v.string(),
    nextInvoiceNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, args)
    } else {
      await ctx.db.insert("settings", { ...args, userId })
    }
  },
})

// ─── Bulk import (JSON restore) ───────────────────────────────────────────────
export const importAll = mutation({
  args: {
    sales: v.array(v.object({
      invoiceNumber: v.string(),
      date: v.string(),
      clientName: v.string(),
      service: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      subtotal: v.number(),
      tax: v.number(),
      taxRate: v.number(),
      total: v.number(),
      status: v.union(v.literal("paid"), v.literal("pending"), v.literal("cancelled")),
      notes: v.optional(v.string()),
    })),
    settings: v.optional(v.object({
      businessName: v.string(),
      businessRfc: v.optional(v.string()),
      businessAddress: v.optional(v.string()),
      businessEmail: v.optional(v.string()),
      businessPhone: v.optional(v.string()),
      taxRate: v.number(),
      currency: v.string(),
      invoicePrefix: v.string(),
      nextInvoiceNumber: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    // Delete existing sales
    const existing = await ctx.db.query("sales").withIndex("by_user", (q) => q.eq("userId", userId)).collect()
    await Promise.all(existing.map((s) => ctx.db.delete(s._id)))
    // Insert imported
    await Promise.all(args.sales.map((s) => ctx.db.insert("sales", { ...s, userId })))
    // Upsert settings
    if (args.settings) {
      const es = await ctx.db.query("settings").withIndex("by_user", (q) => q.eq("userId", userId)).unique()
      if (es) await ctx.db.patch(es._id, args.settings)
      else await ctx.db.insert("settings", { ...args.settings, userId })
    }
  },
})
