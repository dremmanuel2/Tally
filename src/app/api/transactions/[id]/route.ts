import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const {
    type, amount, currency, cardId, dateTime, note,
    toCardId, toCardName,
    exchangeRate, exchangeFromAmount, exchangeFromCurrency, exchangeToAmount, exchangeToCurrency,
  } = await request.json()

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (type !== undefined) data.type = type
  if (amount !== undefined) data.amount = parseFloat(amount)
  if (currency !== undefined) data.currency = currency
  if (cardId !== undefined) data.cardId = cardId || null
  if (dateTime !== undefined) data.dateTime = new Date(dateTime)
  if (note !== undefined) data.note = note

  if (type === "TRANSFER" || existing.type === "TRANSFER") {
    data.toCardId = toCardId !== undefined ? (toCardId || null) : existing.toCardId
    data.toCardName = toCardName !== undefined ? (toCardName || null) : existing.toCardName
  }
  if (type === "EXCHANGE" || existing.type === "EXCHANGE") {
    data.exchangeRate = exchangeRate !== undefined ? (exchangeRate ? parseFloat(exchangeRate) : null) : existing.exchangeRate
    data.exchangeFromAmount = exchangeFromAmount !== undefined ? (exchangeFromAmount ? parseFloat(exchangeFromAmount) : null) : existing.exchangeFromAmount
    data.exchangeFromCurrency = exchangeFromCurrency !== undefined ? (exchangeFromCurrency || null) : existing.exchangeFromCurrency
    data.exchangeToAmount = exchangeToAmount !== undefined ? (exchangeToAmount ? parseFloat(exchangeToAmount) : null) : existing.exchangeToAmount
    data.exchangeToCurrency = exchangeToCurrency !== undefined ? (exchangeToCurrency || null) : existing.exchangeToCurrency
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data,
    include: { card: true },
  })

  return Response.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.transaction.delete({ where: { id } })

  return Response.json({ success: true })
}
