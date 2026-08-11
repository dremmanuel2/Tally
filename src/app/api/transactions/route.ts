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
    orderBy: { dateTime: "desc" },
  })

  return Response.json(transactions)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const {
    type, amount, currency, cardId, dateTime, note,
    toCardId, toCardName,
    exchangeRate, exchangeFromAmount, exchangeFromCurrency, exchangeToAmount, exchangeToCurrency,
  } = await request.json()

  if (!type || amount === undefined || !dateTime) {
    return Response.json({ error: "Type, amount, and dateTime are required" }, { status: 400 })
  }

  const data: Prisma.TransactionUncheckedCreateInput = {
    userId: session.user.id,
    type,
    amount: parseFloat(amount),
    currency: currency || "CNY",
    cardId: cardId || null,
    dateTime: new Date(dateTime),
    note: note || null,
  }

  if (type === "TRANSFER") {
    data.toCardId = toCardId || null
    data.toCardName = toCardName || null
  } else if (type === "EXCHANGE") {
    data.exchangeRate = exchangeRate ? parseFloat(exchangeRate) : null
    data.exchangeFromAmount = exchangeFromAmount ? parseFloat(exchangeFromAmount) : null
    data.exchangeFromCurrency = exchangeFromCurrency || null
    data.exchangeToAmount = exchangeToAmount ? parseFloat(exchangeToAmount) : null
    data.exchangeToCurrency = exchangeToCurrency || null
  }

  const transaction = await prisma.transaction.create({
    data,
    include: { card: true },
  })

  return Response.json(transaction, { status: 201 })
}
