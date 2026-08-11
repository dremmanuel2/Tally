import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const notes = await prisma.commonNote.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return Response.json(notes)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { content } = await request.json()
  if (!content?.trim()) {
    return Response.json({ error: "Content is required" }, { status: 400 })
  }

  const note = await prisma.commonNote.create({
    data: { userId: session.user.id, content: content.trim() },
  })

  return Response.json(note, { status: 201 })
}
