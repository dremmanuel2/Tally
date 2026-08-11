import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const note = await prisma.commonNote.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!note) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.commonNote.delete({ where: { id } })

  return Response.json({ success: true })
}
