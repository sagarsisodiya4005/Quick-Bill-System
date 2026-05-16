import { createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    customerName: '',
    customerPhone: '',
    paymentMethod: 'cash',
    taxRate: 18,
    discount: 0,
  },
  reducers: {
    addToCart(state, action) {
      const product = action.payload;
      const existing = state.items.find(i => i.productId === product._id);
      if (existing) {
        if (existing.quantity < product.stock) {
          existing.quantity += 1;
          existing.subtotal = existing.quantity * existing.unitPrice;
        }
      } else {
        state.items.push({
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.sellingPrice,
          subtotal: product.sellingPrice,
          stock: product.stock,
        });
      }
    },
    removeFromCart(state, action) {
      state.items = state.items.filter(i => i.productId !== action.payload);
    },
    updateQuantity(state, action) {
      const { productId, quantity } = action.payload;
      const item = state.items.find(i => i.productId === productId);
      if (item) {
        if (quantity <= 0) { state.items = state.items.filter(i => i.productId !== productId); }
        else if (quantity <= item.stock) { item.quantity = quantity; item.subtotal = quantity * item.unitPrice; }
      }
    },
    clearCart(state) {
      state.items = [];
      state.customerName = '';
      state.customerPhone = '';
      state.paymentMethod = 'cash';
      state.discount = 0;
    },
    setCustomer(state, action) {
      state.customerName = action.payload.name;
      state.customerPhone = action.payload.phone;
    },
    setPaymentMethod(state, action) { state.paymentMethod = action.payload; },
    setDiscount(state, action) { state.discount = Number(action.payload) || 0; },
    setTaxRate(state, action) { state.taxRate = Number(action.payload) || 0; },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, setCustomer, setPaymentMethod, setDiscount, setTaxRate } = cartSlice.actions;

export const selectCartSubtotal = state => state.cart.items.reduce((s, i) => s + i.subtotal, 0);
export const selectCartTax = state => {
  const sub = state.cart.items.reduce((s, i) => s + i.subtotal, 0);
  return (sub * state.cart.taxRate) / 100;
};
export const selectCartTotal = state => {
  const sub = state.cart.items.reduce((s, i) => s + i.subtotal, 0);
  const tax = (sub * state.cart.taxRate) / 100;
  return sub + tax - state.cart.discount;
};

export default cartSlice.reducer;
