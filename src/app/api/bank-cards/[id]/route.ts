import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { name, cardNumber, type, currencies } = await request.json()

  const card = await prisma.bankCard.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!card) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.bankCard.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(cardNumber !== undefined && { cardNumber }),
      ...(type !== undefined && { type }),
      ...(currencies !== undefined && { currencies }),
    },
  })

  return Response.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const card = await prisma.bankCard.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!card) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.bankCard.delete({ where: { id } })

  return Response.json({ success: true })
}
