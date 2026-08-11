import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [cards, transactions] = await Promise.all([
    prisma.bankCard.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({ where: { userId: session.user.id } }),
  ])

  const balance: Record<string, Record<string, number>> = {}
  for (const card of cards) balance[card.id] = {}

  const add = (cardId: string | null, currency: string | null, amount: number) => {
    if (!cardId || !currency || !isFinite(amount)) return
    if (!balance[cardId]) balance[cardId] = {}
    balance[cardId][currency] = (balance[cardId][currency] || 0) + amount
  }

  for (const tx of transactions) {
    if (tx.type === "INCOME") {
      add(tx.cardId, tx.currency, tx.amount)
    } else if (tx.type === "EXPENSE") {
      add(tx.cardId, tx.currency, -tx.amount)
    } else if (tx.type === "TRANSFER") {
      add(tx.cardId, tx.currency, -tx.amount)
      add(tx.toCardId, tx.currency, tx.amount)
    } else if (tx.type === "EXCHANGE") {
      add(tx.cardId, tx.exchangeFromCurrency, -(tx.exchangeFromAmount || 0))
      add(tx.cardId, tx.exchangeToCurrency, tx.exchangeToAmount || 0)
    }
  }

  const rounded: Record<string, Record<string, number>> = {}
  for (const card of cards) {
    rounded[card.id] = {}
    for (const [cur, amt] of Object.entries(balance[card.id])) {
      const v = Math.round(amt * 100) / 100
      if (Math.abs(v) >= 0.005) rounded[card.id][cur] = v
    }
  }

  const result = cards.map((card) => ({
    id: card.id,
    name: card.name,
    cardNumber: card.cardNumber,
    balance: rounded[card.id],
  }))

  return Response.json({ cards: result })
}
