import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const cardId = searchParams.get("cardId")

  const where: Prisma.TransactionWhereInput = { userId: session.user.id }

  if (startDate || endDate) {
    const dateFilter: Prisma.DateTimeFilter = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)
    where.dateTime = dateFilter
  }

  if (cardId) {
    where.cardId = cardId
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { card: true },
  })

  const income: Record<string, number> = {}
  const expense: Record<string, number> = {}
  const byCard: Record<string, { name: string; cardNumber: string | null; income: Record<string, number>; expense: Record<string, number> }> = {}

  for (const tx of transactions) {
    const curr = tx.currency
    if (tx.type === "INCOME") {
      income[curr] = (income[curr] || 0) + tx.amount
    } else {
      expense[curr] = (expense[curr] || 0) + tx.amount
    }

    const cardKey = tx.cardId || "none"
    if (!byCard[cardKey]) {
      byCard[cardKey] = { name: tx.card?.name || "No Card", cardNumber: tx.card?.cardNumber || null, income: {}, expense: {} }
    }
    if (tx.type === "INCOME") {
      byCard[cardKey].income[curr] = (byCard[cardKey].income[curr] || 0) + tx.amount
    } else {
      byCard[cardKey].expense[curr] = (byCard[cardKey].expense[curr] || 0) + tx.amount
    }
  }

  const net: Record<string, number> = {}
  const allCurrencies = new Set([...Object.keys(income), ...Object.keys(expense)])
  for (const curr of allCurrencies) {
    net[curr] = (income[curr] || 0) - (expense[curr] || 0)
  }

  return Response.json({ income, expense, net, byCard })
}
