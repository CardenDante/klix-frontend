'use client';

import { Socket, type Channel } from 'phoenix';
import { API_URL } from './api/client';
import { useAuth } from './auth';
import type { OrderStatus } from './api/types';

let socket: Socket | null = null;

function getSocket() {
  if (!socket) {
    socket = new Socket(`${API_URL.replace(/^http/, 'ws')}/socket`, {
      params: () => {
        const token = useAuth.getState().accessToken;
        return token ? { token } : {};
      },
    });
    socket.connect();
  }
  return socket;
}

export interface PaymentStatus {
  transaction_id: string;
  status: OrderStatus;
  message?: string | null;
}

/**
 * Subscribes to live status updates for one order. Returns an unsubscribe
 * function. The join reply carries the current status, so nothing is missed
 * between loading the page and joining.
 */
export function watchOrder(orderId: string, onStatus: (status: PaymentStatus) => void) {
  const channel: Channel = getSocket().channel(`order:${orderId}`);
  channel.on('payment_status', (payload: PaymentStatus) => onStatus(payload));
  channel.join().receive('ok', (payload: PaymentStatus) => onStatus(payload));
  return () => {
    channel.leave();
  };
}
