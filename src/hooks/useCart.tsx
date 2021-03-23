import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: isProductExist } = await api.get(`products/${productId}`);
      const { data: { amount: stockProduct } } = await api.get(`stock/${productId}`);
      const isCartExist = cart?.find((product) => product.id === productId);
      if (isCartExist && isCartExist.amount + 1 > stockProduct) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (!isProductExist) {
        toast.error('Erro na adição do produto');
        return;
      }
      let dataCart = cart;
      if (isCartExist) {
        dataCart = dataCart.map((product) => {
          if (product.id === isCartExist?.id) {
            return {
              ...product,
              amount: product.amount += 1,
            }
          }
          return product;
        });
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(dataCart));
      } else {
        dataCart = [...cart, {
          ...isProductExist,
          amount: 1
        }]
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(dataCart));
      }
      setCart(dataCart);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };
  
  const removeProduct = (productId: number) => {
    try {
      const isCartExist = cart?.find((product) => product.id === productId);
      if (!isCartExist) {
        toast.error('Erro na remoção do produto');
        return;
      }
      let dataCart = cart.filter((product) => product?.id !== productId);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(dataCart));
      setCart(dataCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) return;
      const { data: dataStock } = await api.get(`stock/${productId}`);
      const { data: isProductExist } = await api.get(`products/${productId}`);
      const isCartExist = cart?.find((product) => product.id === productId);
      if (amount > dataStock?.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (!isProductExist) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }
      let dataCart = cart;
      dataCart.map((product) => {
        if (product.id === isCartExist?.id) {
          return {
            ...product,
            amount: amount
          }
        }
        return product;
      });
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(dataCart));
      setCart(dataCart);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
