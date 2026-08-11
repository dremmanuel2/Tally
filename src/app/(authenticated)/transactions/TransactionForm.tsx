"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/useTranslation"
import { useLocale } from "@/components/LocaleProvider"

const currencies = ["CNY", "USD", "JPY", "HKD", "EUR", "GBP", "KRW", "SGD", "THB", "MYR"]

type BankCard = { id: string; name: string; cardNumber: string | null; currencies: string[] }
type CommonNote = { id: string; content: string }
type Transaction = {
  id: string
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "EXCHANGE"
  amount: number
  currency: string
  cardId: string | null
  dateTime: string
  note: string | null
  toCardId: string | null
  toCardName: string | null
  exchangeRate: number | null
  exchangeFromAmount: number | null
  exchangeFromCurrency: string | null
  exchangeToAmount: number | null
  exchangeToCurrency: string | null
}

type Props = {
  editTx: Transaction | null
  cards: BankCard[]
  onSave: () => void
  onCancel: () => void
}

function cardLabel(card: BankCard) {
  return card.cardNumber ? `${card.name} (${card.cardNumber.slice(0, 4)})` : card.name
}

export default function TransactionForm({ editTx, cards, onSave, onCancel }: Props) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const defaultCurrency = locale === "en" ? "USD" : "CNY"

  const [formType, setFormType] = useState<"INCOME" | "EXPENSE" | "TRANSFER" | "EXCHANGE">("EXPENSE")

  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("")
  const [cardId, setCardId] = useState("")
  const [dateTime, setDateTime] = useState(() => new Date().toISOString().slice(0, 16))
  const [note, setNote] = useState("")

  const [toCardId, setToCardId] = useState("")
  const [toCardName, setToCardName] = useState("")
  const [useExternalCard, setUseExternalCard] = useState(false)

  const [exchangeFromAmount, setExchangeFromAmount] = useState("")
  const [exchangeFromCurrency, setExchangeFromCurrency] = useState("")
  const [exchangeToAmount, setExchangeToAmount] = useState("")
  const [exchangeToCurrency, setExchangeToCurrency] = useState("")
  const [exchangeRate, setExchangeRate] = useState("")

  const [commonNotes, setCommonNotes] = useState<CommonNote[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!editTx) {
      setCurrency(defaultCurrency)
      setExchangeFromCurrency(defaultCurrency)
      setExchangeToCurrency(locale === "en" ? "CNY" : "USD")
    }
  }, [defaultCurrency, locale, editTx])

  useEffect(() => {
    if (editTx) {
      setFormType(editTx.type)
      setAmount(String(editTx.amount))
      setCurrency(editTx.currency)
      setCardId(editTx.cardId || "")
      setDateTime(new Date(editTx.dateTime).toISOString().slice(0, 16))
      setNote(editTx.note || "")
      setToCardId(editTx.toCardId || "")
      setToCardName(editTx.toCardName || "")
      setUseExternalCard(!!editTx.toCardName)
      setExchangeFromAmount(editTx.exchangeFromAmount ? String(editTx.exchangeFromAmount) : "")
      setExchangeFromCurrency(editTx.exchangeFromCurrency || "CNY")
      setExchangeToAmount(editTx.exchangeToAmount ? String(editTx.exchangeToAmount) : "")
      setExchangeToCurrency(editTx.exchangeToCurrency || "USD")
      setExchangeRate(editTx.exchangeRate ? String(editTx.exchangeRate) : "")
    } else {
      setFormType("EXPENSE")
      setAmount("")
      setCurrency(defaultCurrency)
      setCardId("")
      setDateTime(new Date().toISOString().slice(0, 16))
      setNote("")
      setToCardId("")
      setToCardName("")
      setUseExternalCard(false)
      setExchangeFromAmount("")
      setExchangeFromCurrency(defaultCurrency)
      setExchangeToAmount("")
      setExchangeToCurrency(locale === "en" ? "CNY" : "USD")
      setExchangeRate("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTx])

  useEffect(() => {
    fetch("/api/common-notes").then((r) => r.ok && r.json()).then(setCommonNotes)
  }, [])

  useEffect(() => {
    const from = parseFloat(exchangeFromAmount)
    const to = parseFloat(exchangeToAmount)
    if (from && to) {
      setExchangeRate((to / from).toFixed(4))
    }
  }, [exchangeFromAmount, exchangeToAmount])

  async function handleSave() {
    if (!dateTime) return
    if (formType === "INCOME" || formType === "EXPENSE") {
      if (!amount) return
    }
    if (formType === "TRANSFER") {
      if (!amount) return
      if (!cardId) return
      if (!useExternalCard && !toCardId) return
      if (useExternalCard && !toCardName.trim()) return
    }
    if (formType === "EXCHANGE") {
      if (!exchangeFromAmount || !exchangeToAmount) return
    }

    setLoading(true)

    const body: Record<string, unknown> = {
      type: formType,
      dateTime,
      note: note || null,
    }

    if (formType === "INCOME" || formType === "EXPENSE") {
      body.amount = parseFloat(amount)
      body.currency = currency
      body.cardId = cardId || null
    } else if (formType === "TRANSFER") {
      body.amount = parseFloat(amount)
      body.currency = currency
      body.cardId = cardId
      body.toCardId = useExternalCard ? null : (toCardId || null)
      body.toCardName = useExternalCard ? toCardName.trim() : null
    } else if (formType === "EXCHANGE") {
      body.amount = parseFloat(exchangeFromAmount)
      body.currency = exchangeFromCurrency
      body.cardId = cardId || null
      body.exchangeFromAmount = parseFloat(exchangeFromAmount)
      body.exchangeFromCurrency = exchangeFromCurrency
      body.exchangeToAmount = parseFloat(exchangeToAmount)
      body.exchangeToCurrency = exchangeToCurrency
      const rate = parseFloat(exchangeRate)
      body.exchangeRate = rate || null
    }

    const url = editTx ? `/api/transactions/${editTx.id}` : "/api/transactions"
    const method = editTx ? "PUT" : "POST"
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) onSave()
    setLoading(false)
  }

  const tabs: { key: Transaction["type"]; label: string }[] = [
    { key: "INCOME", label: t("transaction.income") },
    { key: "EXPENSE", label: t("transaction.expense") },
    { key: "TRANSFER", label: t("transaction.transfer") },
    { key: "EXCHANGE", label: t("transaction.exchange") },
  ]

  return (
    <div className="space-y-3">
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFormType(tab.key)}
            className={`flex-1 px-2 sm:px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              formType === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(formType === "INCOME" || formType === "EXPENSE") && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.amount")}</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.currency")}</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.card")}</label>
              <select value={cardId} onChange={(e) => {
                setCardId(e.target.value)
                const card = cards.find((c) => c.id === e.target.value)
                if (card && card.currencies?.length) setCurrency(card.currencies[0])
              }} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">-</option>
                {cards.map((c) => <option key={c.id} value={c.id}>{cardLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.dateTime")}</label>
              <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
          </div>
        </>
      )}

      {formType === "TRANSFER" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.fromCard")}</label>
              <select value={cardId} onChange={(e) => setCardId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">-</option>
                {cards.map((c) => <option key={c.id} value={c.id}>{cardLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.toCard")}</label>
              <div className="flex gap-2">
                <select
                  value={useExternalCard ? "" : toCardId}
                  onChange={(e) => { setToCardId(e.target.value); setToCardName(""); setUseExternalCard(false) }}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">-</option>
                  {cards.filter((c) => c.id !== cardId).map((c) => <option key={c.id} value={c.id}>{cardLabel(c)}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => { setUseExternalCard(true); setToCardId("") }}
                  className={`px-3 py-2 text-sm border rounded-lg ${useExternalCard ? "bg-blue-600 text-white border-blue-600" : "hover:bg-gray-50"}`}
                >
                  {t("transaction.externalCard")}
                </button>
              </div>
              {useExternalCard && (
                <input
                  value={toCardName}
                  onChange={(e) => setToCardName(e.target.value)}
                  placeholder={t("transaction.toCardName")}
                  className="w-full px-3 py-2 border rounded-lg text-sm mt-2"
                />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.amount")}</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.currency")}</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.dateTime")}</label>
              <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
          </div>
        </>
      )}

      {formType === "EXCHANGE" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.card")}</label>
              <select value={cardId} onChange={(e) => setCardId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">-</option>
                {cards.map((c) => <option key={c.id} value={c.id}>{cardLabel(c)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("transaction.dateTime")}</label>
              <input type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-700">{t("transaction.exchangeFrom")}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t("transaction.amount")}</label>
                <input type="number" step="0.01" value={exchangeFromAmount} onChange={(e) => setExchangeFromAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("transaction.currency")}</label>
                <select value={exchangeFromCurrency} onChange={(e) => setExchangeFromCurrency(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">→</span>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-gray-400">{t("transaction.exchangeRate")}:</span>
                <input type="text" value={exchangeRate} readOnly placeholder="auto"
                  className="w-24 px-2 py-1 border rounded text-sm bg-gray-50" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t("transaction.amount")}</label>
                <input type="number" step="0.01" value={exchangeToAmount} onChange={(e) => setExchangeToAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("transaction.currency")}</label>
                <select value={exchangeToCurrency} onChange={(e) => setExchangeToCurrency(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">{t("transaction.note")}</label>
        <div className="flex gap-2">
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm" list="common-notes" />
          <datalist id="common-notes">
            {commonNotes.map((n) => <option key={n.id} value={n.content} />)}
          </datalist>
        </div>
        {commonNotes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {commonNotes.map((n) => (
              <button key={n.id} type="button" onClick={() => setNote(n.content)}
                className="px-2 py-0.5 text-xs border rounded hover:bg-gray-50">
                {n.content}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
          {t("transaction.save")}
        </button>
        <button onClick={onCancel} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
          {t("transaction.cancel")}
        </button>
      </div>
    </div>
  )
}
