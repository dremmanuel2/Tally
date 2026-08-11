"use client"

import { jsPDF } from "jspdf"
import html2canvas from "html2canvas-pro"
import type { Locale } from "@/lib/i18n"

type BankCard = { id: string; name: string; cardNumber: string | null; currencies: string[] }
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

type ExportOptions = {
  transactions: Transaction[]
  cards: BankCard[]
  filterMonth: string
  filterStart: string
  filterEnd: string
  filterCard: string
  locale: Locale
  t: (path: string) => string
  balances: CardBalance[]
}

type CardBalance = {
  id: string
  name: string
  cardNumber: string | null
  balance: Record<string, number>
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function cardLabel(card: { name: string; cardNumber: string | null }): string {
  return card.cardNumber ? `${card.name} (${card.cardNumber.slice(0, 4)})` : card.name
}

function txCardText(tx: Transaction, cards: BankCard[]): string {
  const from = tx.card ? cardLabel(tx.card) : "-"
  if (tx.type === "TRANSFER") {
    const toCard = cards.find((c) => c.id === tx.toCardId)
    const to = tx.toCardName || (toCard ? cardLabel(toCard) : "-")
    return `${from} → ${to}`
  }
  return from
}

function txAmountText(tx: Transaction): string {
  if (tx.type === "EXCHANGE") {
    return `${tx.exchangeFromCurrency} ${Number(tx.exchangeFromAmount).toFixed(2)} → ${tx.exchangeToCurrency} ${Number(tx.exchangeToAmount).toFixed(2)}`
  }
  return `${tx.currency} ${tx.amount.toFixed(2)}`
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { CNY: "¥", USD: "$", JPY: "¥", EUR: "€", GBP: "£", HKD: "HK$", KRW: "₩", SGD: "S$", THB: "฿", MYR: "RM" }
  return `${symbols[currency] || currency} ${amount.toFixed(2)}`
}

export async function exportTransactionsPdf(opts: ExportOptions): Promise<void> {
  const { transactions, cards, filterMonth, filterStart, filterEnd, filterCard, locale, t, balances } = opts

  const period =
    filterMonth === "custom"
      ? `${filterStart} ~ ${filterEnd}`
      : filterMonth || t("transaction.allTime")

  const cardName = filterCard ? (cards.find((c) => c.id === filterCard)?.name || "") : ""

  const incomeByCurrency = new Map<string, number>()
  const expenseByCurrency = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type === "INCOME") {
      incomeByCurrency.set(tx.currency, (incomeByCurrency.get(tx.currency) || 0) + tx.amount)
    } else if (tx.type === "EXPENSE") {
      expenseByCurrency.set(tx.currency, (expenseByCurrency.get(tx.currency) || 0) + tx.amount)
    }
  }
  const summaryCurrencies = new Set([...incomeByCurrency.keys(), ...expenseByCurrency.keys()])

  const summaryRows = [...summaryCurrencies].sort().map((cur) => {
    const income = incomeByCurrency.get(cur) || 0
    const expense = expenseByCurrency.get(cur) || 0
    return `<tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${esc(cur)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;color:#047857;">${income.toFixed(2)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;color:#b91c1c;">${expense.toFixed(2)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;">${(income - expense).toFixed(2)}</td>
    </tr>`
  }).join("")

  const detailRows = transactions.map((tx) => {
    const typeLabels: Record<string, string> = {
      INCOME: t("transaction.income"),
      EXPENSE: t("transaction.expense"),
      TRANSFER: t("transaction.transfer"),
      EXCHANGE: t("transaction.exchange"),
    }
    const dateText = new Date(tx.dateTime).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")
    return `<tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${esc(typeLabels[tx.type])}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;white-space:nowrap;">${esc(dateText)}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap;">${esc(txAmountText(tx))}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${esc(txCardText(tx, cards))}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#4b5563;">${esc(tx.note || "")}</td>
    </tr>`
  }).join("")

  const balanceRows = balances.map((card) => {
    const entries = Object.entries(card.balance)
    const balanceText = entries.length > 0
      ? entries.map(([cur, amt]) => formatCurrency(amt, cur)).join(", ")
      : t("report.noData")
    return `<tr>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;">${esc(cardLabel(card))}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;">${esc(balanceText)}</td>
    </tr>`
  }).join("")

  const html = `<div style="width:794px;padding:32px 40px;background:#ffffff;color:#111827;font-family:Arial,'Microsoft YaHei','PingFang SC',sans-serif;box-sizing:border-box;">
    <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;color:#111827;">${esc(t("report.title"))}</h1>
    <p style="font-size:12px;color:#6b7280;margin:0 0 24px;">
      ${esc(t("report.period"))}: ${esc(period)}
      ${cardName ? `&nbsp;&nbsp;|&nbsp;&nbsp;${esc(t("report.card"))}: ${esc(cardName)}` : ""}
    </p>

    ${balances.length > 0 ? `
    <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#111827;">${esc(t("report.cardBalance"))}</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;">${esc(t("transaction.card"))}</th>
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;">${esc(t("report.balance"))}</th>
        </tr>
      </thead>
      <tbody>${balanceRows}</tbody>
    </table>
    ` : ""}

    <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#111827;">${esc(t("report.summary"))}</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:13px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;">${esc(t("transaction.currency"))}</th>
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;">${esc(t("report.income"))}</th>
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;">${esc(t("report.expense"))}</th>
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;">${esc(t("report.net"))}</th>
        </tr>
      </thead>
      <tbody>${summaryRows || `<tr><td colspan="4" style="padding:12px;border:1px solid #e5e7eb;text-align:center;color:#9ca3af;">${esc(t("report.noData"))}</td></tr>`}</tbody>
    </table>

    <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#111827;">${esc(t("report.details"))}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;">${esc(t("transaction.type"))}</th>
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;">${esc(t("transaction.dateTime"))}</th>
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:right;">${esc(t("transaction.amount"))}</th>
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;">${esc(t("transaction.card"))}</th>
          <th style="padding:8px 12px;border:1px solid #e5e7eb;text-align:left;">${esc(t("transaction.note"))}</th>
        </tr>
      </thead>
      <tbody>${detailRows || `<tr><td colspan="5" style="padding:12px;border:1px solid #e5e7eb;text-align:center;color:#9ca3af;">${esc(t("report.noData"))}</td></tr>`}</tbody>
    </table>
  </div>`

  const container = document.createElement("div")
  container.style.position = "absolute"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.innerHTML = html
  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false })
    const imgW = canvas.width
    const imgH = canvas.height

    const pdf = new jsPDF({ unit: "mm", format: "a4" })
    const pdfW = 210
    const pdfH = 297
    const marginX = 10
    const marginY = 10
    const usableW = pdfW - marginX * 2
    const usableH = pdfH - marginY * 2
    const imgHInMm = (imgH / imgW) * usableW
    const pageHpx = imgH / (imgHInMm / usableH)

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95)

    let heightLeft = imgH
    let position = 0
    pdf.addImage(dataUrl, "JPEG", marginX, marginY + position, usableW, imgHInMm)
    heightLeft -= pageHpx
    while (heightLeft > 0) {
      position -= pageHpx
      pdf.addPage()
      pdf.addImage(dataUrl, "JPEG", marginX, marginY + position, usableW, imgHInMm)
      heightLeft -= pageHpx
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    pdf.save(`tally-report-${dateStr}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
