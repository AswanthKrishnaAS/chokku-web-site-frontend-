import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle2, Clock, Calendar, ChevronRight, ArrowLeft, ShoppingBag, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Order } from '../types';
import { Button } from '../components/Button';

export const Orders: React.FC = () => {
  const { orders, isOrdersLoading, ordersError, fetchMyOrders, user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 1. Loading State
  if (isOrdersLoading && (!orders || orders.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#488710] animate-spin mx-auto" />
        <h2 className="text-lg font-black text-gray-900">Loading your orders...</h2>
        <p className="text-gray-500 text-xs">Fetching your order history from server.</p>
      </div>
    );
  }

  // 2. Error State
  if (ordersError && (!orders || orders.length === 0)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <XCircle className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-xl font-black text-gray-900">Unable to load your orders. Please try again.</h2>
        <p className="text-gray-500 text-xs max-w-md mx-auto">{ordersError}</p>
        <div className="pt-2">
          <button
            onClick={() => fetchMyOrders()}
            className="px-6 py-2.5 bg-[#488710] text-white font-extrabold text-xs rounded-2xl hover:bg-[#386b0c] transition-colors shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. No Orders State
  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-2xl font-black text-gray-900">You haven't placed any orders yet.</h2>
        <p className="text-gray-500 text-sm">
          Explore our store catalog and discover awesome products!
        </p>
        <div className="pt-2">
          <Link to="/shop" className="inline-block">
            <Button variant="primary" size="lg">Start Shopping Now</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7faf5] min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-[#488710] uppercase tracking-wider">
              Customer Account
            </span>
            <h1 className="text-2xl font-black text-gray-900 mt-0.5">
              My Order History ({orders.length})
            </h1>
          </div>
          <button
            onClick={() => fetchMyOrders()}
            className="p-2 text-gray-500 hover:text-[#488710] hover:bg-gray-50 rounded-2xl border border-gray-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Orders Stack */}
        <div className="space-y-5">
          {orders.map((order) => {
            const isDelivered = order.status === 'Delivered';
            const isCancelled = order.status === 'Cancelled';
            const isShipped = order.status === 'Shipped';
            const itemsList = order.items || [];

            return (
              <div
                key={order.id || order._id}
                className="bg-white rounded-3xl border border-gray-100 p-6 shadow-2xs hover:shadow-md transition-shadow space-y-4"
              >
                {/* Top Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-black text-gray-900 text-base">{order.id}</span>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full border ${
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
                        <span>{order.status || 'Processing'}</span>
                      </span>

                      {/* Payment Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {order.paymentStatus === 'paid' ? '● PAID' : '● ' + (order.paymentStatus?.toUpperCase() || 'PAYMENT')}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Ordered on {order.date} {order.paymentTime ? `at ${order.paymentTime}` : ''}
                      </span>
                      <span>•</span>
                      <span>Payment: <strong>{order.paymentMethod || 'Online'}</strong></span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Total Payable</p>
                    <p className="text-2xl font-black text-[#488710]">
                      ₹{(order.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Items Preview Row */}
                <div className="py-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {itemsList.map((item: any, idx: number) => {
                    const itemName = item.title || item.product?.name || 'Product';
                    const itemImage = item.image || item.product?.image || '/placeholder.png';
                    const itemPrice = typeof item.price === 'number' ? item.price : (item.product?.price || 0);
                    const itemQty = item.quantity || 1;

                    return (
                      <div
                        key={item.id || item.product?.id || idx}
                        className="flex items-center gap-3 p-2.5 bg-gray-50/80 rounded-2xl border border-gray-100"
                      >
                        <img
                          src={itemImage}
                          alt={itemName}
                          onError={(e) => {
                            (e.target as HTMLElement).setAttribute('src', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200');
                          }}
                          className="w-12 h-12 object-cover rounded-xl border border-gray-200 bg-white shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {itemName}
                          </p>
                          <p className="text-[11px] text-gray-500 font-medium">
                            Qty: {itemQty} × ₹{itemPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Details */}
                <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-600 gap-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#488710] shrink-0" />
                    <span className="font-medium text-gray-700">
                      Delivery Address: <strong>{order.shippingAddress?.address || 'N/A'}, {order.shippingAddress?.city}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="font-extrabold text-[#488710] hover:text-[#386b0c] bg-[#f0f9e8] px-3.5 py-1.5 rounded-xl border border-[#d2ea9d] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black text-[#488710] uppercase tracking-wider">Official Receipt</span>
                <h3 className="text-xl font-black text-gray-900">{selectedOrder.id}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-600">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <p className="font-extrabold text-gray-400 text-[10px] uppercase">Order Date</p>
                  <p className="font-bold text-gray-900">{selectedOrder.date} {selectedOrder.paymentTime || ''}</p>
                </div>
                <div>
                  <p className="font-extrabold text-gray-400 text-[10px] uppercase">Payment Method</p>
                  <p className="font-bold text-[#488710]">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="font-extrabold text-gray-400 text-[10px] uppercase">Recipient Name</p>
                  <p className="font-bold text-gray-900">{selectedOrder.shippingAddress?.fullName || 'Customer'}</p>
                </div>
                <div>
                  <p className="font-extrabold text-gray-400 text-[10px] uppercase">Est. Delivery</p>
                  <p className="font-bold text-[#488710]">{selectedOrder.estimatedDelivery}</p>
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-gray-900 mb-2">Purchased Items ({selectedOrder.items?.length || 0})</h4>
                <div className="space-y-2 border border-gray-200 rounded-2xl p-3 bg-white">
                  {selectedOrder.items?.map((i: any, idx: number) => {
                    const title = i.title || i.product?.name || 'Product';
                    const price = typeof i.price === 'number' ? i.price : (i.product?.price || 0);
                    const qty = i.quantity || 1;

                    return (
                      <div key={idx} className="flex justify-between items-center py-1">
                        <span className="font-bold text-gray-800">{title} (x{qty})</span>
                        <span className="font-extrabold text-gray-900">₹{(price * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 space-y-1.5 border-t border-gray-100 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{(selectedOrder.subtotal || selectedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
                {(selectedOrder.discount || 0) > 0 && (
                  <div className="flex justify-between text-[#488710] font-bold">
                    <span>Discount</span>
                    <span>-₹{(selectedOrder.discount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>₹{(selectedOrder.deliveryFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-base text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total Amount Paid</span>
                  <span className="text-[#488710]">₹{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="w-full bg-[#488710] text-white py-3 rounded-2xl font-extrabold hover:bg-[#386b0c] transition-colors shadow-md cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
