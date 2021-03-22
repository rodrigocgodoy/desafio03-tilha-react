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
  const [stock, setStock] = useState<Stock[]>([]);
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  
  useEffect(() => {
    (async () => {
      const { data } = await api.get('stock');
      setStock(data);
    })();
  }, []);

  const addProduct = async (productId: number) => {
    try {
      const stockProduct = stock.find((stock: Stock) => stock.id === productId);
      let dataCart = cart;
      const isExists = cart?.find((product) => product.id === productId);
      if (isExists) {
        if (!isExists || !stockProduct || isExists?.amount + 1 > stockProduct?.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        stock.find((stock: Stock) => stock.id === productId);
        console.log(stock);
        dataCart = dataCart.map((product) => {
          if (product.id === isExists?.id) {
            return {
              ...product,
              amount: product.amount += 1,
            }
          }
          return product;
        });
      } else {
        const { data } = await api.get('products');
        const productData = data.find((product: Product) => product.id === productId);
        
        dataCart = [...cart, {
          ...productData,
          amount: 1
        }]
      }
      setCart(dataCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(dataCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };
  
  const removeProduct = (productId: number) => {
    try {
      let dataCart = cart.filter((product) => product?.id !== productId);
      setCart(dataCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(dataCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stockProduct = stock.find((stock: Stock) => stock.id === productId);
      let dataCart = cart;
      const isExists = cart?.find((product) => product.id === productId);
      if (!isExists || !stockProduct || isExists?.amount > stockProduct?.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      dataCart = dataCart.map((product) => {
        if (product.id === isExists?.id) {
          return {
            ...product,
            amount: amount
          }
        }
        return product;
      });
      setCart(dataCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(dataCart));
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
