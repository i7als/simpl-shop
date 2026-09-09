import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  Minus,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  getGetShopSummaryQueryKey,
  getListProductsQueryKey,
  useCreateCheckoutSession,
  useGetShopSummary,
  useListProducts,
  type Product,
} from '@workspace/api-client-react';
import {
  Route,
  Switch,
  Link,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type CartLine = {
  product: Product;
  quantity: number;
};

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(price / 100);

function BrandMark() {
  return (
    <div className="flex items-center gap-3" data-testid="brand-mark">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-foreground/25 bg-accent text-accent-foreground shadow-[3px_3px_0_hsl(var(--foreground))]">
        <span className="font-display text-lg leading-none">P</span>
        <span className="absolute -bottom-1 -right-1 text-[9px] font-bold tracking-tight">+</span>
      </div>
      <div className="leading-none">
        <div className="font-display text-xl font-semibold tracking-tight">Parcel &amp; Pine</div>
        <div className="mt-1 font-mono-app text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Good objects, slowly found</div>
      </div>
    </div>
  );
}

function Header({ cartCount, onCartOpen }: { cartCount: number; onCartOpen: () => void }) {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-10 md:py-7">
      <Link href="/" className="transition-transform duration-300 hover:-translate-y-0.5" data-testid="link-home">
        <BrandMark />
      </Link>
      <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
        <a href="#collection" className="font-mono-app text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground" data-testid="link-collection">
          Collection
        </a>
        <a href="#notes" className="font-mono-app text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground" data-testid="link-notes">
          Our point of view
        </a>
      </nav>
      <button
        type="button"
        onClick={onCartOpen}
        className="group relative flex items-center gap-2.5 rounded-full border border-foreground/20 bg-card px-4 py-2.5 text-sm font-semibold shadow-[2px_2px_0_hsl(var(--foreground)/.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_hsl(var(--foreground)/.3)] active:translate-y-0"
        data-testid="button-open-cart"
      >
        <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
        <span>Bag</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 font-mono-app text-[10px] text-accent-foreground" data-testid="text-cart-count">
          {cartCount}
        </span>
      </button>
    </header>
  );
}

function Hero({ onBrowse }: { onBrowse: () => void }) {
  return (
    <section className="mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-16 pt-12 md:grid-cols-[1.1fr_.9fr] md:px-10 md:pb-24 md:pt-20">
      <div className="animate-rise-in">
        <div className="mb-7 flex items-center gap-3 font-mono-app text-[10px] uppercase tracking-[0.24em] text-accent">
          <span className="h-px w-9 bg-accent" />
          A considered edit
        </div>
        <h1 className="max-w-3xl font-display text-[clamp(3.8rem,10vw,8.5rem)] font-medium leading-[.82] tracking-[-.065em] text-foreground">
          The small
          <br />
          <span className="ml-[12vw] text-accent">things.</span>
        </h1>
        <div className="mt-9 flex max-w-lg items-end justify-between gap-6">
          <p className="max-w-xs text-sm leading-6 text-muted-foreground md:text-base">
            Useful, beautiful objects for the spaces where life actually happens. No endless scroll. Just a few things worth keeping.
          </p>
          <button
            type="button"
            onClick={onBrowse}
            className="group hidden shrink-0 items-center gap-2 border-b border-foreground pb-1 text-xs font-semibold uppercase tracking-[0.15em] md:flex"
            data-testid="button-browse-collection"
          >
            Browse edit
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
      <div className="relative animate-rise-in [animation-delay:120ms]">
        <div className="relative ml-auto aspect-[4/5] w-[min(100%,420px)] overflow-hidden rounded-[9rem_9rem_1rem_1rem] bg-sidebar shadow-[12px_14px_0_hsl(var(--accent)/.8)]">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(135deg, transparent 0 42%, rgba(232, 111, 86, .48) 42% 45%, transparent 45% 100%), radial-gradient(circle at 65% 24%, rgba(246, 229, 191, .34) 0 4%, transparent 4.5%), radial-gradient(circle at 35% 68%, rgba(246, 229, 191, .22) 0 13%, transparent 13.5%)' }} />
          <div className="absolute inset-x-7 bottom-8 top-10 border border-card/25" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-card">
            <div className="font-mono-app text-[10px] uppercase tracking-[.34em] opacity-70">Est. 2024</div>
            <div className="mt-4 font-display text-6xl leading-[.85] tracking-[-.07em]">P&amp;P</div>
            <div className="mt-5 font-mono-app text-[9px] uppercase tracking-[.22em] opacity-70">Objects with a story</div>
          </div>
          <div className="animate-drift absolute bottom-10 right-8 h-20 w-14 rotate-12 border-2 border-accent bg-accent/80 shadow-[5px_5px_0_hsl(var(--card)/.2)]" />
          <div className="absolute bottom-7 right-[4.25rem] h-4 w-4 rounded-full bg-card/60" />
        </div>
        <div className="absolute -bottom-8 left-0 max-w-[180px] rotate-[-6deg] bg-accent px-4 py-3 text-accent-foreground shadow-[4px_4px_0_hsl(var(--foreground)/.2)]">
          <Sparkles className="mb-2 h-4 w-4" />
          <p className="font-display text-lg leading-5">Take your time.</p>
        </div>
        <div className="absolute -right-1 top-4 hidden h-20 w-20 rounded-full border border-foreground/20 md:block">
          <div className="flex h-full items-center justify-center text-center font-mono-app text-[8px] uppercase leading-3 tracking-widest text-muted-foreground">Selected<br />with care</div>
        </div>
      </div>
    </section>
  );
}

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  if (!product.imageUrl || failed) {
    return (
      <div className="flex h-full w-full items-end justify-between bg-[linear-gradient(145deg,hsl(var(--secondary)),hsl(var(--muted)))] p-5">
        <span className="font-display text-5xl leading-none text-foreground/20">{product.name.slice(0, 1)}</span>
        <div className="h-20 w-14 rotate-[12deg] border border-foreground/20 bg-accent/55" />
      </div>
    );
  }
  return <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" onError={() => setFailed(true)} />;
}

function ProductCard({ product, index, onAdd }: { product: Product; index: number; onAdd: (product: Product) => void }) {
  return (
    <article
      className={`group animate-rise-in ${index === 0 ? 'md:col-span-2' : ''}`}
      style={{ animationDelay: `${Math.min(index * 70, 420)}ms` }}
      data-testid={`card-product-${product.id}`}
    >
      <div className={`relative overflow-hidden rounded-[1rem] border border-foreground/10 bg-card ${index === 0 ? 'aspect-[1.75/1]' : 'aspect-[1/1.12]'} shadow-[4px_5px_0_hsl(var(--foreground)/.08)]`}>
        <ProductImage product={product} />
        <div className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1.5 font-mono-app text-[9px] uppercase tracking-[.16em] text-muted-foreground backdrop-blur-sm">
          {product.category}
        </div>
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-1 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 shadow-[3px_3px_0_hsl(var(--foreground)/.25)] transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 active:scale-95"
          aria-label={`Add ${product.name} to bag`}
          data-testid={`button-add-product-${product.id}`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <div className="flex items-start justify-between gap-4 px-1 pt-4">
        <div>
          <h3 className="font-display text-xl leading-tight" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
          <p className="mt-1 max-w-xs text-sm leading-5 text-muted-foreground">{product.description}</p>
        </div>
        <span className="shrink-0 font-mono-app text-xs font-medium" data-testid={`text-product-price-${product.id}`}>{formatPrice(product.price, product.currency)}</span>
      </div>
      <button type="button" onClick={() => onAdd(product)} className="mt-3 flex items-center gap-1 px-1 text-[11px] font-semibold uppercase tracking-[.16em] text-accent md:hidden" data-testid={`button-add-product-mobile-${product.id}`}>
        Add to bag <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}

function ProductSkeleton({ index }: { index: number }) {
  return <div className={`animate-rise-in ${index === 0 ? 'md:col-span-2' : ''}`} style={{ animationDelay: `${index * 60}ms` }}>
    <div className={`skeleton rounded-[1rem] ${index === 0 ? 'aspect-[1.75/1]' : 'aspect-[1/1.12]'}`} />
    <div className="mt-4 flex justify-between gap-4"><div className="skeleton h-5 w-32 rounded" /><div className="skeleton h-4 w-14 rounded" /></div>
    <div className="skeleton mt-2 h-4 w-48 rounded" />
  </div>;
}

function CartDrawer({ lines, open, currency, checkoutPending, checkoutError, onClose, onChangeQuantity, onRemove, onCheckout }: {
  lines: CartLine[];
  open: boolean;
  currency: string;
  checkoutPending: boolean;
  checkoutError: string | null;
  onClose: () => void;
  onChangeQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return (
    <>
      <div className={`fixed inset-0 z-30 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={onClose} aria-hidden="true" />
      <aside className={`fixed right-0 top-0 z-40 flex h-[100dvh] w-full max-w-md flex-col border-l border-foreground/10 bg-background px-5 pb-6 pt-5 shadow-[-12px_0_40px_hsl(var(--foreground)/.12)] transition-transform duration-500 ease-[cubic-bezier(.22,.8,.28,1)] sm:px-7 ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Shopping bag" aria-hidden={!open}>
        <div className="flex items-start justify-between border-b border-foreground/10 pb-5">
          <div>
            <div className="font-mono-app text-[10px] uppercase tracking-[.2em] text-accent">Your edit</div>
            <h2 className="mt-2 font-display text-4xl tracking-[-.04em]">Shopping bag</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-foreground/15 p-2 transition-colors hover:bg-muted" aria-label="Close shopping bag" data-testid="button-close-cart"><X className="h-5 w-5" /></button>
        </div>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-foreground/25 text-accent"><ShoppingBag className="h-7 w-7" strokeWidth={1.4} /></div>
            <h3 className="mt-6 font-display text-2xl">A quiet bag</h3>
            <p className="mt-2 max-w-[220px] text-sm leading-6 text-muted-foreground">Nothing here yet. Wander back to the collection when you are ready.</p>
            <button type="button" onClick={onClose} className="mt-6 inline-flex items-center gap-2 border-b border-foreground pb-1 text-xs font-semibold uppercase tracking-[.16em]" data-testid="button-continue-shopping-empty">Continue browsing <ArrowRight className="h-4 w-4" /></button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-5">
              <div className="space-y-5">
                {lines.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-4" data-testid={`row-cart-${product.id}`}>
                    <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"><ProductImage product={product} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <h3 className="font-display text-lg leading-tight">{product.name}</h3>
                        <span className="font-mono-app text-xs">{formatPrice(product.price * quantity, product.currency)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-foreground/15">
                          <button type="button" onClick={() => onChangeQuantity(product.id, quantity - 1)} className="p-1.5 text-muted-foreground transition-colors hover:text-foreground" aria-label={`Decrease ${product.name} quantity`} data-testid={`button-decrease-${product.id}`}><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-7 text-center font-mono-app text-xs" data-testid={`text-quantity-${product.id}`}>{quantity}</span>
                          <button type="button" onClick={() => onChangeQuantity(product.id, quantity + 1)} className="p-1.5 text-muted-foreground transition-colors hover:text-foreground" aria-label={`Increase ${product.name} quantity`} data-testid={`button-increase-${product.id}`}><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <button type="button" onClick={() => onRemove(product.id)} className="flex items-center gap-1 text-[10px] uppercase tracking-[.15em] text-muted-foreground transition-colors hover:text-destructive" data-testid={`button-remove-${product.id}`}><Trash2 className="h-3 w-3" /> Remove</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-foreground/10 pt-5">
              {checkoutError && <div className="mb-4 flex gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-xs leading-5 text-destructive" data-testid="status-checkout-error"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{checkoutError}</div>}
              <div className="flex items-baseline justify-between"><span className="text-sm text-muted-foreground">Subtotal</span><span className="font-mono-app text-lg" data-testid="text-cart-total">{formatPrice(total, currency)}</span></div>
              <p className="mt-2 text-[11px] leading-5 text-muted-foreground">Shipping and tax are calculated securely at checkout.</p>
              <button type="button" onClick={onCheckout} disabled={checkoutPending} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-4 text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground disabled:cursor-wait disabled:opacity-70" data-testid="button-checkout">
                {checkoutPending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Opening secure checkout</> : <>Continue to checkout <ArrowRight className="h-4 w-4" /></>}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function Collection() {
  const productsQuery = useListProducts({ query: { queryKey: getListProductsQueryKey() } });
  const summaryQuery = useGetShopSummary({ query: { queryKey: getGetShopSummaryQueryKey() } });
  const checkout = useCreateCheckoutSession();
  const [category, setCategory] = useState('All objects');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const products = productsQuery.data ?? [];
  const summary = summaryQuery.data;
  const categories = summary?.categories ?? Array.from(new Set(products.map((product) => product.category)));
  const filteredProducts = useMemo(
    () => category === 'All objects' ? products : products.filter((product) => product.category === category),
    [category, products],
  );
  const cartCount = cart.reduce((total, line) => total + line.quantity, 0);
  const currency = summary?.currency ?? products[0]?.currency ?? 'usd';

  useEffect(() => {
    if (window.location.hash === '#collection') {
      window.setTimeout(() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, []);

  const addToCart = (product: Product) => {
    setCart((current) => {
      const found = current.find((line) => line.product.id === product.id);
      if (found) return current.map((line) => line.product.id === product.id ? { ...line, quantity: Math.min(line.quantity + 1, 20) } : line);
      return [...current, { product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const changeQuantity = (id: string, quantity: number) => {
    setCart((current) => quantity < 1 ? current.filter((line) => line.product.id !== id) : current.map((line) => line.product.id === id ? { ...line, quantity: Math.min(quantity, 20) } : line));
  };

  const startCheckout = () => {
    setCheckoutError(null);
    checkout.mutate(
      { data: { items: cart.map(({ product, quantity }) => ({ priceId: product.priceId, quantity })) } },
      {
        onSuccess: (session) => { window.location.href = session.url; },
        onError: (error) => { setCheckoutError(error instanceof Error ? error.message : 'We could not open checkout. Please try again.'); },
      },
    );
  };

  return (
    <div className="noise-overlay min-h-[100dvh] overflow-x-hidden">
      <Header cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />
      <main>
        <Hero onBrowse={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })} />
        <section id="collection" className="mx-auto w-full max-w-7xl scroll-mt-5 px-5 pb-20 md:px-10 md:pb-32">
          <div className="mb-8 flex flex-col justify-between gap-5 border-t border-foreground/15 pt-6 md:flex-row md:items-end">
            <div>
              <div className="font-mono-app text-[10px] uppercase tracking-[.22em] text-accent">The collection</div>
              <h2 className="mt-2 font-display text-4xl tracking-[-.045em] md:text-5xl">Objects for a slower day.</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono-app" data-testid="text-product-count">{summary?.productCount ?? products.length}</span>
              <span>pieces, chosen with restraint</span>
            </div>
          </div>
          <div className="mb-9 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter by category">
            {['All objects', ...categories].map((item) => (
              <button type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)} key={item} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ${category === item ? 'border-foreground bg-foreground text-background shadow-[2px_2px_0_hsl(var(--accent))]' : 'border-foreground/15 bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground'}`} data-testid={`button-filter-${item.toLowerCase().replace(/\s+/g, '-')}`}>
                {item}
              </button>
            ))}
            <ChevronDown className="ml-auto hidden h-4 w-4 text-muted-foreground md:block" />
          </div>
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-x-5 gap-y-12 md:grid-cols-3"><>{Array.from({ length: 5 }).map((_, index) => <ProductSkeleton index={index} key={index} />)}</></div>
          ) : productsQuery.isError ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/35 bg-destructive/5 p-8 text-center" data-testid="status-products-error">
              <CircleAlert className="h-8 w-8 text-destructive" strokeWidth={1.5} />
              <h3 className="mt-4 font-display text-2xl">The shelves are taking a moment.</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">We could not load the collection. Nothing is lost — please give it another try.</p>
              <button type="button" onClick={() => productsQuery.refetch()} className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-background transition-colors hover:bg-accent hover:text-accent-foreground" data-testid="button-retry-products"><RefreshCw className="h-3.5 w-3.5" /> Try again</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/25 bg-card/40 p-8 text-center" data-testid="status-products-empty">
              <PackageCheck className="h-8 w-8 text-accent" strokeWidth={1.5} />
              <h3 className="mt-4 font-display text-2xl">A blank little shelf.</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">There are no objects in this category just yet.</p>
              <button type="button" onClick={() => setCategory('All objects')} className="mt-5 inline-flex items-center gap-2 border-b border-foreground pb-1 text-xs font-semibold uppercase tracking-[.15em]" data-testid="button-reset-filter">See everything <ArrowRight className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-5 gap-y-12 md:grid-cols-3">
              {filteredProducts.map((product, index) => <ProductCard product={product} index={index} onAdd={addToCart} key={product.id} />)}
            </div>
          )}
        </section>
        <section id="notes" className="border-y border-foreground/10 bg-sidebar px-5 py-20 text-sidebar-foreground md:px-10 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[.8fr_1.2fr] md:items-end">
            <div>
              <div className="font-mono-app text-[10px] uppercase tracking-[.24em] text-accent">Why this shop exists</div>
              <h2 className="mt-4 max-w-md font-display text-5xl leading-[.95] tracking-[-.05em] md:text-6xl">Less, but better company.</h2>
            </div>
            <div className="max-w-xl md:ml-auto">
              <p className="text-lg leading-8 text-sidebar-foreground/75">Parcel &amp; Pine is a small storefront for the objects that quietly improve a room, a ritual, or an ordinary Tuesday. We look for honest materials, useful shapes, and the kind of patina that gets better with you.</p>
              <div className="mt-8 flex items-center gap-3 font-mono-app text-[10px] uppercase tracking-[.18em] text-sidebar-foreground/55"><span className="h-px w-8 bg-accent" /> {summary?.productCount ?? products.length} things on the shelf today</div>
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-7 text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
        <span className="font-mono-app uppercase tracking-[.2em]">Parcel &amp; Pine / Objects with a story</span>
        <span>Made for the everyday, wherever you are.</span>
      </footer>
      <CartDrawer lines={cart} open={cartOpen} currency={currency} checkoutPending={checkout.isPending} checkoutError={checkoutError} onClose={() => setCartOpen(false)} onChangeQuantity={changeQuantity} onRemove={(id) => setCart((current) => current.filter((line) => line.product.id !== id))} onCheckout={startCheckout} />
    </div>
  );
}

function StatusPage({ cancelled = false }: { cancelled?: boolean }) {
  const [, setLocation] = useLocation();
  return (
    <div className="noise-overlay min-h-[100dvh]">
      <Header cartCount={0} onCartOpen={() => setLocation('/')} />
      <main className="mx-auto flex min-h-[calc(100dvh-110px)] w-full max-w-4xl items-center justify-center px-5 py-16 md:px-10">
        <div className="relative w-full overflow-hidden rounded-[2rem] border border-foreground/10 bg-card px-6 py-14 text-center shadow-[8px_9px_0_hsl(var(--accent)/.7)] md:px-16 md:py-20">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-accent/30" />
          <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full border border-foreground/10" />
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${cancelled ? 'bg-secondary text-foreground' : 'bg-accent text-accent-foreground'}`}>
            {cancelled ? <RotateCcw className="h-7 w-7" strokeWidth={1.6} /> : <Check className="h-8 w-8" strokeWidth={2} />}
          </div>
          <div className="relative">
            <div className="mt-7 font-mono-app text-[10px] uppercase tracking-[.25em] text-accent">{cancelled ? 'Checkout paused' : 'Order received'}</div>
            <h1 className="mx-auto mt-3 max-w-2xl font-display text-5xl leading-[.95] tracking-[-.055em] md:text-7xl">{cancelled ? 'Your bag is still here.' : 'A good choice, on its way.'}</h1>
            <p className="mx-auto mt-6 max-w-md text-sm leading-7 text-muted-foreground md:text-base">{cancelled ? 'No payment was taken. Your objects are waiting whenever the moment feels right.' : 'Thank you for choosing a smaller way to shop. Stripe has your order, and the details are on their way to your inbox.'}</p>
            <Link href="/" className="group mt-9 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground" data-testid={cancelled ? 'link-return-shopping-cancel' : 'link-return-shopping-success'}>
              {cancelled ? <><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Return to the collection</> : <>Keep wandering <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/success"><StatusPage /></Route>
        <Route path="/cancel"><StatusPage cancelled /></Route>
        <Route path="/" component={Collection} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
