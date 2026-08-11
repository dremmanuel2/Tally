"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/useTranslation"

type CommonNote = { id: string; content: string }

export default function CommonNotesPage() {
  const { t } = useTranslation()
  const [notes, setNotes] = useState<CommonNote[]>([])
  const [content, setContent] = useState("")

  useEffect(() => {
    fetch("/api/common-notes").then((r) => r.ok && r.json()).then(setNotes)
  }, [])

  async function reloadNotes() {
    const res = await fetch("/api/common-notes")
    if (res.ok) setNotes(await res.json())
  }

  async function handleAdd() {
    if (!content.trim()) return
    const res = await fetch("/api/common-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    })
    if (res.ok) {
      setContent("")
      reloadNotes()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("commonNote.confirmDelete"))) return
    const res = await fetch(`/api/common-notes/${id}`, { method: "DELETE" })
    if (res.ok) reloadNotes()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold">{t("commonNote.title")}</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={t("commonNote.content")}
          className="flex-1 px-3 py-2 border rounded-lg text-sm"
        />
        <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          {t("commonNote.add")}
        </button>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="bg-white border rounded-lg p-3 sm:p-4 flex items-center justify-between gap-3">
            <p className="text-sm flex-1 min-w-0 break-all">{note.content}</p>
            <button onClick={() => handleDelete(note.id)} className="shrink-0 px-3 py-1 text-sm border rounded text-red-500 hover:bg-red-50">
              {t("commonNote.delete")}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
