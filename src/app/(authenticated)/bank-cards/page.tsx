"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/useTranslation"

type BankCard = {
  id: string
  name: string
  cardNumber: string | null
  type: "DEBIT" | "CREDIT"
  currencies: string[]
}

const currencies = ["CNY", "USD", "JPY", "HKD", "EUR", "GBP", "KRW", "SGD", "THB", "MYR"]

export default function BankCardsPage() {
  const { t } = useTranslation()
  const [cards, setCards] = useState<BankCard[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [type, setType] = useState<"DEBIT" | "CREDIT">("DEBIT")
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(["CNY"])

  useEffect(() => {
    fetch("/api/bank-cards").then((r) => r.ok && r.json()).then(setCards)
  }, [])

  function resetForm() {
    setName("")
    setCardNumber("")
    setType("DEBIT")
    setSelectedCurrencies(["CNY"])
    setEditId(null)
    setShowForm(false)
  }

  async function reloadCards() {
    const res = await fetch("/api/bank-cards")
    if (res.ok) setCards(await res.json())
  }

  async function handleSave() {
    if (!name.trim()) return
    const url = editId ? `/api/bank-cards/${editId}` : "/api/bank-cards"
    const method = editId ? "PUT" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, cardNumber: cardNumber || null, type, currencies: selectedCurrencies }),
    })
    if (res.ok) {
      resetForm()
      reloadCards()
    }
  }

  function startEdit(card: BankCard) {
    setEditId(card.id)
    setName(card.name)
    setCardNumber(card.cardNumber || "")
    setType(card.type)
    setSelectedCurrencies(card.currencies?.length ? card.currencies : ["CNY"])
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm(t("bankCard.confirmDelete"))) return
    const res = await fetch(`/api/bank-cards/${id}`, { method: "DELETE" })
    if (res.ok) reloadCards()
  }

  function toggleCurrency(currency: string) {
    setSelectedCurrencies((prev) =>
      prev.includes(currency)
        ? prev.length > 1 ? prev.filter((c) => c !== currency) : prev
        : [...prev, currency]
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">{t("bankCard.title")}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + {t("bankCard.add")}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t("bankCard.name")}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("bankCard.cardNumber")}</label>
            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="**** **** **** ****"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("bankCard.type")}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "DEBIT" | "CREDIT")}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="DEBIT">{t("bankCard.debit")}</option>
              <option value="CREDIT">{t("bankCard.credit")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("bankCard.currencies")}</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {currencies.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCurrency(c)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedCurrencies.includes(c)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              {t("bankCard.save")}
            </button>
            <button onClick={resetForm} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              {t("bankCard.cancel")}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {cards.map((card) => (
          <div key={card.id} className="bg-white border rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium break-all">{card.name}</p>
              <p className="text-sm text-gray-500 break-all">
                {card.type === "DEBIT" ? t("bankCard.debit") : t("bankCard.credit")}
                {card.cardNumber && ` · ${card.cardNumber}`}
              </p>
              <p className="text-xs text-gray-400">{card.currencies?.join(", ") || "CNY"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(card)} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                {t("bankCard.edit")}
              </button>
              <button onClick={() => handleDelete(card.id)} className="px-3 py-1 text-sm border rounded text-red-500 hover:bg-red-50">
                {t("bankCard.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
