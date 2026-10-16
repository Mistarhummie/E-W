import 'server-only'

import type { Payload } from 'payload'

import type { Order } from '../payload-types'
import { formatKsh } from './catalogue'
import { sendSms } from './sms'

const site = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://eastwest.ke'

function storeName(order: Order) {
  return typeof order.store === 'object' && order.store ? order.store.name : 'our store'
}

export function statusMessage(order: Order): string | null {
  const n = order.orderNumber
  switch (order.status) {
    case 'paid':
      return `EastWest: Payment of ${formatKsh(order.total)} received for order ${n}. Thank you! Track it: ${site()}/orders/${n}`
    case 'printing':
      return `EastWest: Your order ${n} is being printed tonight.`
    case 'ready':
      return `EastWest: Order ${n} is ready for pickup at ${storeName(order)}. Show code ${order.pickupCode} at the counter.`
    case 'shipped':
      return `EastWest: Order ${n} is on its way${order.courier ? ` (${order.courier})` : ''}.`
    case 'completed':
      return `EastWest: Order ${n} is complete. Enjoy your kit! Tag us @eastwestfashionske`
    case 'cancelled':
      return `EastWest: Order ${n} was cancelled. Questions? WhatsApp +254700011817.`
    default:
      return null
  }
}

export async function notifyStatusChange(payload: Payload, order: Order) {
  const text = statusMessage(order)
  if (!text) return
  await sendSms(order.contact.phone, text)
  if (order.contact.email) {
    try {
      await payload.sendEmail({
        to: order.contact.email,
        subject: `Order ${order.orderNumber}: ${order.status === 'paid' ? 'payment received' : 'update'}`,
        text: `${text}\n\nEastWest Fashions Ke`,
      })
    } catch (err) {
      payload.logger.warn({ err }, 'order email not sent')
    }
  }
}
