import { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Printer, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/format';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoiceModal({ order, onClose }) {
  const invoiceRef = useRef();

  const printInvoice = () => window.print();

  const downloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`Invoice-${order.orderNumber}.pdf`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 print:hidden">
          <h2 className="font-semibold text-gray-900 dark:text-white">Invoice</h2>
          <div className="flex gap-2">
            <button onClick={downloadPDF} className="btn-secondary text-xs"><Download className="w-3.5 h-3.5" />PDF</button>
            <button onClick={printInvoice} className="btn-primary text-xs"><Printer className="w-3.5 h-3.5" />Print</button>
            <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[80vh]">
          <div ref={invoiceRef} className="p-8 bg-white text-gray-900" id="invoice-print">
            {/* Header */}
            <div className="text-center mb-6 pb-5 border-b-2 border-indigo-600">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-lg">QB</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">QuickBill POS</h1>
              <p className="text-xs text-gray-500 mt-0.5">Meera's Retail Store</p>
              <p className="text-xs text-gray-400">GST No: 07AABCU9603R1ZX</p>
            </div>

            {/* Invoice Info */}
            <div className="flex justify-between mb-5 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-medium">Invoice To</p>
                <p className="font-semibold mt-1">{order.customerName || 'Walk-in Customer'}</p>
                {order.customerPhone && <p className="text-gray-500 text-xs">{order.customerPhone}</p>}
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs uppercase tracking-wider font-medium">Invoice Details</p>
                <p className="font-bold text-indigo-600 mt-1">#{order.orderNumber}</p>
                <p className="text-gray-500 text-xs">{formatDate(order.createdAt)}</p>
                <p className="text-xs mt-1"><span className="font-medium">Payment:</span> {order.paymentMethod?.toUpperCase()}</p>
                <p className="text-xs"><span className="font-medium">Cashier:</span> {order.cashierName}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-sm mb-5">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="py-2 px-2 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                  <th className="py-2 px-2 text-center text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="py-2 px-2 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="py-2 px-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2.5 px-2 text-gray-400 text-xs">{i + 1}</td>
                    <td className="py-2.5 px-2 font-medium">{item.productName}</td>
                    <td className="py-2.5 px-2 text-center text-gray-600">{item.quantity}</td>
                    <td className="py-2.5 px-2 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2.5 px-2 text-right font-semibold">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="ml-auto w-56 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
              {order.tax > 0 && <div className="flex justify-between text-gray-500"><span>GST ({order.taxRate}%)</span><span>{formatCurrency(order.tax)}</span></div>}
              {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatCurrency(order.discount)}</span></div>}
              <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t-2 border-indigo-600">
                <span>Grand Total</span><span className="text-indigo-600">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-5 border-t border-dashed border-gray-200 text-center">
              <p className="text-sm font-semibold text-gray-700">Thank you for shopping with us!</p>
              <p className="text-xs text-gray-400 mt-1">Goods once sold will not be taken back or exchanged.</p>
              <p className="text-xs text-gray-400 mt-0.5">Powered by QuickBill POS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
