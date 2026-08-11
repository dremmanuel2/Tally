"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "@/lib/useTranslation"
import { useLocale } from "@/components/LocaleProvider"
import TransactionForm from "./TransactionForm"
import { exportTransactionsPdf } from "./exportPdf"

type BankCard = { id: string; name: string; cardNumber: string | null; currencies: string[] }
type CardBalance = {
  id: string
  name: string
  cardNumber: string | null
  balance: Record<string, number>
}
type Transaction = {
  id: string
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "EXCHANGE"
  amount: number
  currency: string
  cardId: string | null
  card: (BankCard & { cardNumber?: string | null }) | null
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

export default function TransactionsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cards, setCards] = useState<BankCard[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [filterCard, setFilterCard] = useState("")
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd, setFilterEnd] = useState("")
  const [exporting, setExporting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showBalance, setShowBalance] = useState(false)
  const [balanceCards, setBalanceCards] = useState<string[]>([])
  const [balances, setBalances] = useState<CardBalance[]>([])

  const loadTransactions = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterCard) params.set("cardId", filterCard)
    if (filterMonth === "custom") {
      if (filterStart) params.set("startDate", new Date(filterStart + "T00:00:00").toISOString())
      if (filterEnd) params.set("endDate", new Date(filterEnd + "T23:59:59.999").toISOString())
    } else if (filterMonth) {
      params.set("startDate", new Date(filterMonth + "-01T00:00:00").toISOString())
      const end = new Date(filterMonth + "-01T00:00:00")
      end.setMonth(end.getMonth() + 1)
      params.set("endDate", end.toISOString())
    }
    const res = await fetch(`/api/transactions?${params.toString()}`)
    if (res.ok) setTransactions(await res.json())
  }, [filterCard, filterMonth, filterStart, filterEnd])

  useEffect(() => { loadTransactions() }, [loadTransactions, refreshKey])

  useEffect(() => {
    fetch("/api/bank-cards").then((r) => r.ok && r.json()).then(setCards)
    fetch("/api/dashboard/balances").then((r) => r.ok && r.json()).then((data) => {
      if (data?.cards) setBalances(data.cards)
    })
  }, [])

  function openCreate() { setEditTx(null); setShowForm(true) }
  function openEdit(tx: Transaction) { setEditTx(tx); setShowForm(true) }

  async function handleDelete(id: string) {
    if (!confirm(t("transaction.confirmDelete"))) return
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
    if (res.ok) setRefreshKey((k) => k + 1)
  }

  function handleSave() {
    setShowForm(false)
    setRefreshKey((k) => k + 1)
  }

  function openExportDialog() {
    if (transactions.length === 0) {
      alert(t("report.noDataTip"))
      return
    }
    setShowBalance(false)
    setBalanceCards(cards.map((c) => c.id))
    setShowExportDialog(true)
  }

  function toggleBalanceCard(id: string) {
    setBalanceCards((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function handleDoExport() {
    setShowExportDialog(false)
    setExporting(true)
    try {
      const selectedBalances = showBalance ? balances.filter((b) => balanceCards.includes(b.id)) : []
      await exportTransactionsPdf({ transactions, cards, filterMonth, filterStart, filterEnd, filterCard, locale, t, balances: selectedBalances })
    } finally {
      setExporting(false)
    }
  }

  function getCardDisplay(card: BankCard | null) {
    if (!card) return "-"
    return card.cardNumber ? `${card.name} (${card.cardNumber.slice(0, 4)})` : card.name
  }

  function getTxDisplay(tx: Transaction) {
    if (tx.type === "TRANSFER") {
      const toCard = cards.find((c) => c.id === tx.toCardId)
      const toDisplay = tx.toCardName || (toCard ? getCardDisplay(toCard) : "-")
      return (
        <div>
          <p className="font-medium">
            {tx.currency} {tx.amount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">
            {getCardDisplay(tx.card)} → {toDisplay} · {new Date(tx.dateTime).toLocaleString()}
          </p>
          {tx.note && <p className="text-sm text-gray-500">{tx.note}</p>}
        </div>
      )
    }
    if (tx.type === "EXCHANGE") {
      return (
        <div>
          <p className="font-medium">
            {tx.exchangeFromCurrency} {tx.exchangeFromAmount?.toFixed(2)} → {tx.exchangeToCurrency} {tx.exchangeToAmount?.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400">
            {getCardDisplay(tx.card)} · {t("transaction.exchangeRate")}: {tx.exchangeRate} · {new Date(tx.dateTime).toLocaleString()}
          </p>
          {tx.note && <p className="text-sm text-gray-500">{tx.note}</p>}
        </div>
      )
    }
    return (
      <div>
        <p className="font-medium">
          {tx.currency} {tx.amount.toFixed(2)}
        </p>
        <p className="text-xs text-gray-400">
          {getCardDisplay(tx.card)} · {new Date(tx.dateTime).toLocaleString()}
        </p>
        {tx.note && <p className="text-sm text-gray-500">{tx.note}</p>}
      </div>
    )
  }

  function getTxBadge(tx: Transaction) {
    const map: Record<string, { label: string; className: string }> = {
      INCOME: { label: t("transaction.income"), className: "bg-green-100 text-green-700" },
      EXPENSE: { label: t("transaction.expense"), className: "bg-red-100 text-red-700" },
      TRANSFER: { label: t("transaction.transfer"), className: "bg-blue-100 text-blue-700" },
      EXCHANGE: { label: t("transaction.exchange"), className: "bg-purple-100 text-purple-700" },
    }
    const info = map[tx.type]
    return <span className={`text-sm font-medium px-2 py-0.5 rounded ${info.className}`}>{info.label}</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("transaction.title")}</h1>
        <div className="flex gap-2">
          <button
            onClick={openExportDialog}
            disabled={exporting}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? "..." : t("transaction.exportPdf")}
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            + {t("transaction.add")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">{t("transaction.allTime")}</option>
          <option value="custom">{t("transaction.custom")}</option>
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            return (
              <option key={d.toISOString()} value={`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`}>
                {d.getFullYear()}-{String(d.getMonth() + 1).padStart(2, "0")}
              </option>
            )
          })}
        </select>
        {filterMonth === "custom" && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={filterStart}
              max={filterEnd || undefined}
              onChange={(e) => setFilterStart(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <span className="text-sm text-gray-400">~</span>
            <input
              type="date"
              value={filterEnd}
              min={filterStart || undefined}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        )}
        <select
          value={filterCard}
          onChange={(e) => setFilterCard(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="">{t("dashboard.allCards")}</option>
          {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <TransactionForm
            editTx={editTx}
            cards={cards}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getTxBadge(tx)}
              {getTxDisplay(tx)}
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(tx)} className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                {t("transaction.edit")}
              </button>
              <button onClick={() => handleDelete(tx.id)} className="px-3 py-1 text-sm border rounded text-red-500 hover:bg-red-50">
                {t("transaction.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showExportDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowExportDialog(false)}
        >
          <div
            className="bg-white rounded-lg p-6 w-[440px] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">{t("report.showBalance")}</h2>

            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="showBalance"
                  checked={!showBalance}
                  onChange={() => setShowBalance(false)}
                />
                {t("report.no")}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="showBalance"
                  checked={showBalance}
                  onChange={() => setShowBalance(true)}
                />
                {t("report.yes")}
              </label>
            </div>

            {showBalance && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">{t("report.selectCards")}</p>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {cards.length > 0 ? cards.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={balanceCards.includes(c.id)}
                        onChange={() => toggleBalanceCard(c.id)}
                      />
                      {c.name}{c.cardNumber ? ` (${c.cardNumber.slice(0, 4)})` : ""}
                    </label>
                  )) : (
                    <p className="text-sm text-gray-400">{t("report.noData")}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowExportDialog(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                {t("transaction.cancel")}
              </button>
              <button onClick={handleDoExport} disabled={exporting} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                {exporting ? "..." : t("transaction.exportPdf")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
