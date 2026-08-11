"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "@/lib/useTranslation"

type Stats = {
  income: Record<string, number>
  expense: Record<string, number>
  net: Record<string, number>
  byCard: Record<string, { name: string; cardNumber: string | null; income: Record<string, number>; expense: Record<string, number> }>
}

type BankCard = { id: string; name: string }

type CardBalance = {
  id: string
  name: string
  cardNumber: string | null
  balance: Record<string, number>
}

type Preset = "today" | "week" | "month" | "year" | "custom"

function getPresetRange(preset: Preset): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString()
  let start: Date

  switch (preset) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return { start: start.toISOString(), end }
    case "week":
      start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      return { start: start.toISOString(), end }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: start.toISOString(), end }
    case "year":
      start = new Date(now.getFullYear(), 0, 1)
      return { start: start.toISOString(), end }
    default:
      return { start: "", end: "" }
  }
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { CNY: "¥", USD: "$", JPY: "¥", EUR: "€", GBP: "£", HKD: "HK$", KRW: "₩", SGD: "S$", THB: "฿", MYR: "RM" }
  return `${symbols[currency] || currency} ${amount.toFixed(2)}`
}

export default function DashboardClient() {
  const { t } = useTranslation()
  const [cards, setCards] = useState<BankCard[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [preset, setPreset] = useState<Preset>("month")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [filterCard, setFilterCard] = useState("")
  const [balances, setBalances] = useState<CardBalance[]>([])

  useEffect(() => {
    fetch("/api/bank-cards").then((r) => r.ok && r.json()).then(setCards)
    fetch("/api/dashboard/balances").then((r) => r.ok && r.json()).then((data) => {
      if (data?.cards) setBalances(data.cards)
    })
  }, [])

  useEffect(() => {
    let params: string | null = null

    if (preset === "custom") {
      if (customStart && customEnd) {
        params = `startDate=${encodeURIComponent(customStart)}&endDate=${encodeURIComponent(customEnd)}`
      }
    } else {
      const range = getPresetRange(preset)
      if (range.start && range.end) {
        params = `startDate=${encodeURIComponent(range.start)}&endDate=${encodeURIComponent(range.end)}`
      }
    }

    if (!params) return

    const url = `/api/dashboard/stats?${params}${filterCard ? `&cardId=${filterCard}` : ""}`
    console.log("[DEBUG dashboard] fetching:", url)
    fetch(url).then((r) => {
      console.log("[DEBUG dashboard] response status:", r.status)
      return r.ok && r.json()
    }).then((data) => {
      console.log("[DEBUG dashboard] data:", data)
      setStats(data)
    }).catch(err => console.error("[DEBUG dashboard] error:", err))
  }, [preset, customStart, customEnd, filterCard])

  const presets: { key: Preset; label: string }[] = [
    { key: "today", label: t("dashboard.today") },
    { key: "week", label: t("dashboard.thisWeek") },
    { key: "month", label: t("dashboard.thisMonth") },
    { key: "year", label: t("dashboard.thisYear") },
    { key: "custom", label: t("dashboard.custom") },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("dashboard.title")}</h1>

      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`px-3 py-1.5 text-sm rounded-md ${
                preset === p.key ? "bg-blue-600 text-white" : "border hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
          <select
            value={filterCard}
            onChange={(e) => setFilterCard(e.target.value)}
            className="ml-auto px-3 py-1.5 text-sm border rounded-md"
          >
            <option value="">{t("dashboard.allCards")}</option>
            {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {preset === "custom" && (
          <div className="flex gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-md" />
            <span className="text-sm text-gray-400 self-center">~</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-md" />
          </div>
        )}
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6 border">
              <p className="text-sm text-gray-500">{t("dashboard.income")}</p>
              {Object.keys(stats.income).length > 0 ? (
                Object.entries(stats.income).map(([curr, amt]) => (
                  <p key={curr} className="text-xl font-bold text-green-600">{formatCurrency(amt, curr)}</p>
                ))
              ) : (
                <p className="text-xl font-bold text-green-600">¥ 0.00</p>
              )}
            </div>
            <div className="bg-white rounded-lg p-6 border">
              <p className="text-sm text-gray-500">{t("dashboard.expense")}</p>
              {Object.keys(stats.expense).length > 0 ? (
                Object.entries(stats.expense).map(([curr, amt]) => (
                  <p key={curr} className="text-xl font-bold text-red-600">{formatCurrency(amt, curr)}</p>
                ))
              ) : (
                <p className="text-xl font-bold text-red-600">¥ 0.00</p>
              )}
            </div>
            <div className="bg-white rounded-lg p-6 border">
              <p className="text-sm text-gray-500">{t("dashboard.net")}</p>
              {Object.keys(stats.net).length > 0 ? (
                Object.entries(stats.net).map(([curr, amt]) => (
                  <p key={curr} className={`text-xl font-bold ${amt >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(amt, curr)}
                  </p>
                ))
              ) : (
                <p className="text-xl font-bold">¥ 0.00</p>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4 mb-6">
            <h2 className="font-medium mb-3">{t("dashboard.cardBalance")}</h2>
            {balances.length > 0 ? (
              <div className="space-y-2">
                {balances.map((card) => (
                  <div key={card.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{card.name}{card.cardNumber ? ` (${card.cardNumber.slice(0, 4)})` : ""}</span>
                    <div className="text-right text-sm">
                      {Object.keys(card.balance).length > 0 ? (
                        Object.entries(card.balance).map(([cur, amt]) => (
                          <p key={cur} className={amt >= 0 ? "text-green-600" : "text-red-600"}>
                            {formatCurrency(amt, cur)}
                          </p>
                        ))
                      ) : (
                        <p className="text-gray-400">{t("dashboard.noData")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t("dashboard.noData")}</p>
            )}
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h2 className="font-medium mb-3">{t("dashboard.title")} · {t("dashboard.allCards")}</h2>
            {Object.keys(stats.byCard).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.byCard).map(([key, card]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{card.name}{card.cardNumber ? ` (${card.cardNumber.slice(0, 4)})` : ""}</span>
                    <div className="text-right text-sm">
                      <span className="text-green-600 mr-3">
                        +{Object.entries(card.income).map(([c, a]) => formatCurrency(a, c)).join(", ") || "¥ 0.00"}
                      </span>
                      <span className="text-red-600">
                        -{Object.entries(card.expense).map(([c, a]) => formatCurrency(a, c)).join(", ") || "¥ 0.00"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t("dashboard.noData")}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
