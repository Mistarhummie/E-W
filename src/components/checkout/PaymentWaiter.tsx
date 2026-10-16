'use client'

import { Loader2, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { orderStatus, retryMpesa, simulatePayment } from '../../app/(frontend)/actions/checkout'
import { formatKsh } from '../../lib/catalogue'

export function PaymentWaiter({
  orderNumber,
  token,
  method,
  phone,
  total,
  initialMessage,
  failed: initiallyFailed,
  demo,
}: {
  orderNumber: string
  token: string
  method: string
  phone: string
  total: number
  initialMessage: string | null
  failed: boolean
  demo: boolean
}) {
  const router = useRouter()
  const [message, setMessage] = useState(initialMessage)
  const [failed, setFailed] = useState(initiallyFailed)
  const [retryPhone, setRetryPhone] = useState(phone.startsWith('254') ? `0${phone.slice(3)}` : phone)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let stop = false
    let tries = 0
    const tick = async () => {
      if (stop) return
      tries++
      const s = await orderStatus(orderNumber, token).catch(() => null)
      if (s?.paymentStatus === 'paid') {
        router.refresh()
        return
      }
      if (s?.paymentStatus === 'failed') {
        setFailed(true)
        setMessage(s.message)
      }
      if (tries < 60) setTimeout(tick, tries < 10 ? 3000 : 6000)
    }
    const t = setTimeout(tick, 3000)
    return () => {
      stop = true
      clearTimeout(t)
    }
  }, [orderNumber, token, router])

  const retry = async () => {
    setBusy(true)
    const r = await retryMpesa(orderNumber, token, retryPhone)
    setBusy(false)
    setFailed(!r.ok)
    setMessage(r.message)
  }

  return (
    <div className="mt-8 animate-fade-up rounded-3xl border-2 border-teal bg-teal-light/50 p-6 sm:p-8">
      {method === 'mpesa' ? (
        <>
          <div className="flex items-start gap-4">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal text-white">
              <Smartphone className="h-7 w-7" />
              {!failed ? <span className="absolute inset-0 animate-ping rounded-2xl bg-teal opacity-30" /> : null}
            </span>
            <div>
              <p className="text-xl font-bold">{failed ? 'Payment not completed' : 'Check your phone'}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {failed
                  ? message || 'The M-Pesa payment was cancelled or timed out.'
                  : `Enter your M-Pesa PIN to pay ${formatKsh(total)}. This page updates by itself.`}
              </p>
              {!failed && message ? <p className="mt-1 text-xs text-muted">{message}</p> : null}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-end gap-3">
            <label className="flex-1">
              <span className="label">{failed ? 'Try again with' : "Didn't get the prompt? Resend to"}</span>
              <input className="field bg-white" type="tel" value={retryPhone} onChange={(e) => setRetryPhone(e.target.value)} />
            </label>
            <button type="button" onClick={retry} disabled={busy} className="btn btn-primary h-[50px]">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send M-Pesa prompt
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-teal" />
          <p className="font-semibold">{message || 'Confirming your card payment…'}</p>
        </div>
      )}
      {demo ? (
        <button
          type="button"
          className="btn btn-teal mt-6"
          onClick={async () => {
            await simulatePayment(orderNumber, token)
            router.refresh()
          }}
        >
          Test mode: mark as paid
        </button>
      ) : null}
    </div>
  )
}
