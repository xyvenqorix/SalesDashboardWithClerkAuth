import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  sales: defineTable({
    userId: v.string(),
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
  }).index("by_user", ["userId"]),

  settings: defineTable({
    userId: v.string(),
    businessName: v.string(),
    businessRfc: v.optional(v.string()),
    businessAddress: v.optional(v.string()),
    businessEmail: v.optional(v.string()),
    businessPhone: v.optional(v.string()),
    taxRate: v.number(),
    currency: v.string(),
    invoicePrefix: v.string(),
    nextInvoiceNumber: v.number(),
  }).index("by_user", ["userId"]),
})
