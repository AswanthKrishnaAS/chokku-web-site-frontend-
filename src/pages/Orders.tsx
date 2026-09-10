import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle2, Clock, Calendar, ChevronRight, ArrowLeft, ShoppingBag, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';

export const Orders: React.FC = () => {
  const { orders } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">No Orders Found</h2>
        <p className="text-gray-500 text-sm mt-1">
          You haven't placed any orders yet. Start exploring our store catalog!
        </p>
        <Link to="/shop" className="mt-6 inline-block">
          <button className="bg-brand-green text-white font-bold px-6 py-2.5 rounded-xl hover:bg-brand-green-hover transition-colors shadow-xs">
            Start Shopping Now
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title */}
        <div className="mb-8 pb-4 border-b border-gray-100">
          <span className="text-xs font-bold text-brand-green uppercase tracking-wider">
            Customer Account
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-1">
            My Order History ({orders.length})
          </h1>
        </div>

        {/* Orders Stack */}
        <div className="space-y-6">
          {orders.map((order) => {
            const isDelivered = order.status === 'Delivered';
            const isCancelled = order.status === 'Cancelled';
            const isShipped = order.status === 'Shipped';

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Top Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-gray-900 text-base">{order.id}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isCancelled
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isShipped
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isDelivered ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : isCancelled ? (
                          <XCircle className="w-3.5 h-3.5" />
                        ) : isShipped ? (
                          <Truck className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{order.status}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Ordered on {order.date}
                      </span>
                      <span>•</span>
                      <span>Payment: {order.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-gray-400">Total Payable</p>
                    <p className="text-xl font-extrabold text-gray-900">
                      ₹{order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Items Preview Row */}
                <div className="py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.items.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200 bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          Qty: {item.quantity} × ₹{item.product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Details */}
                <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-600 gap-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-green" />
                    <span>
                      Delivery Address: <strong>{order.shippingAddress.address}, {order.shippingAddress.city}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="font-bold text-brand-blue hover:underline inline-flex items-center gap-1"
                  >
                    <span>View Full Receipt</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Full Order Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold text-brand-green uppercase">Receipt</span>
                <h3 className="text-xl font-extrabold text-gray-900">{selectedOrder.id}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-1 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-600">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                <div>
                  <p className="font-semibold text-gray-400">Date</p>
                  <p className="font-bold text-gray-800">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-400">Payment</p>
                  <p className="font-bold text-gray-800">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-400">Recipient</p>
                  <p className="font-bold text-gray-800">{selectedOrder.shippingAddress.fullName}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-400">Est. Delivery</p>
                  <p className="font-bold text-brand-green">{selectedOrder.estimatedDelivery}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Purchased Items</h4>
                <div className="space-y-2 border rounded-2xl p-3 bg-white">
                  {selectedOrder.items.map((i) => (
                    <div key={i.product.id} className="flex justify-between items-center py-1">
                      <span>{i.product.name} (x{i.quantity})</span>
                      <span className="font-bold">₹{(i.product.price * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 space-y-1.5 border-t text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-brand-green font-bold">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₹{selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base text-gray-900 pt-2 border-t">
                  <span>Total Amount Paid</span>
                  <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-brand-blue text-white py-2.5 rounded-xl font-bold hover:bg-brand-blue-hover transition-colors"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
