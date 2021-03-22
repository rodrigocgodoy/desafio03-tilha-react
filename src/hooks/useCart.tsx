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
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  
  useEffect(() => {
    (async () => {
      const { data: dataStocks } = await api.get('stock');
      const { data: dataProducts } = await api.get('products');
      setStocks(dataStocks);
      setProducts(dataProducts);
    })();
  }, []);

  const addProduct = async (productId: number) => {
    try {
      const isProductExist = products?.find((product) => product.id === productId);
      if (!isProductExist) {
        toast.error('Erro na adição do produto');
        return;
      }
      const stockProduct = stocks.find((stock: Stock) => stock.id === productId);
      let dataCart = cart;
      const isCartExist = cart?.find((product) => product.id === productId);
      if (isCartExist) {
        if (!isCartExist || !stockProduct || isCartExist?.amount + 1 > stockProduct?.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
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
        const { data } = await api.get('products');
        const productData = data.find((product: Product) => product.id === productId);
        
        dataCart = [...cart, {
          ...productData,
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
      const isProductExist = products?.find((product) => product.id === productId);
      if (!isProductExist) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }
      const stockProduct = stocks.find((stock: Stock) => stock.id === productId);
      let dataCart = cart;
      const isCartExist = cart?.find((product) => product.id === productId);
      if (!isCartExist || !stockProduct || isCartExist?.amount > stockProduct?.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      dataCart = dataCart.map((product) => {
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
