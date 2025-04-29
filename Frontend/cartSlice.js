import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'https://api.your-ecommerce.com/api';

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      };
      
      const response = await axios.get(`${API_URL}/cart`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const isLoggedIn = auth.isAuthenticated;
      
      if (isLoggedIn) {
        const config = {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        };
        
        const response = await axios.post(`${API_URL}/cart`, { productId, quantity }, config);
        return response.data;
      } else {
        // For non-logged in users, handle cart in local state
        const { cart } = getState();
        const existingItem = cart.items.find(item => item.product._id === productId);
        
        if (existingItem) {
          return {
            items: cart.items.map(item => 
              item.product._id === productId 
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          };
        } else {
          // Fetch product details for the local cart
          const productResponse = await axios.get(`${API_URL}/products/${productId}`);
          return {
            items: [
              ...cart.items,
              {
                product: productResponse.data,
                quantity
              }
            ]
          };
        }
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error adding to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const isLoggedIn = auth.isAuthenticated;
      
      if (isLoggedIn) {
        const config = {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        };
        
        const response = await axios.put(`${API_URL}/cart/${productId}`, { quantity }, config);
        return response.data;
      } else {
        // For non-logged in users, handle cart in local state
        const { cart } = getState();
        return {
          items: cart.items.map(item => 
            item.product._id === productId 
              ? { ...item, quantity }
              : item
          )
        };
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error updating cart item');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const isLoggedIn = auth.isAuthenticated;
      
      if (isLoggedIn) {
        const config = {
          headers: {
            Authorization: `Bearer ${auth.token}`
          }
        };
        
        const response = await axios.delete(`${API_URL}/cart/${productId}`, config);
        return { ...response.data, removedProductId: productId };
      } else {
        // For non-logged in users, handle cart in local state
        return {
          removedProductId: productId
        };
      }
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Error removing from cart');
    }
  }
);

const loadCartFromLocalStorage = () => {
  try {
    const cartItems = localStorage.getItem('cartItems');
    return cartItems ? JSON.parse(cartItems) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

const initialState = {
  items: loadCartFromLocalStorage(),
  loading: false,
  error: null,
  totalItems: 0,
  subtotal: 0
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.subtotal = 0;
      localStorage.setItem('cartItems', JSON.stringify([]));
    },
    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.subtotal = state.items.reduce(
        (total, item) => total + (item.product.price * item.quantity), 
        0
      );
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.calculateTotals();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch cart';
      })
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        localStorage.setItem('cartItems', JSON.stringify(state.items));
        state.calculateTotals();
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add item to cart';
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        localStorage.setItem('cartItems', JSON.stringify(state.items));
        state.calculateTotals();
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update cart item';
      })
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.items) {
          state.items = action.payload.items;
        } else {
          state.items = state.items.filter(
            item => item.product._id !== action.payload.removedProductId
          );
        }
        localStorage.setItem('cartItems', JSON.stringify(state.items));
        state.calculateTotals();
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove item from cart';
      });
  }
});

export const { clearCart, calculateTotals } = cartSlice.actions;
export default cartSlice.reducer;
