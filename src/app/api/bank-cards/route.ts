import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cards = await prisma.bankCard.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(cards)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, cardNumber, type, currencies } = await request.json()

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 })
  }

  const card = await prisma.bankCard.create({
    data: {
      userId: session.user.id,
      name,
      cardNumber: cardNumber || null,
      type: type || "DEBIT",
      currencies: currencies && currencies.length > 0 ? currencies : ["CNY"],
    },
  })

  return Response.json(card, { status: 201 })
}
