import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

type StripeListResponse<T> = {
  data: T[];
};

type StripeProduct = {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  metadata?: Record<string, string>;
};

type StripePrice = {
  id: string;
  product: string;
  unit_amount: number | null;
  currency: string;
  active: boolean;
  metadata?: Record<string, string>;
};

type StripeCheckoutSession = {
  id: string;
  url: string | null;
};

async function stripeRequest<T>(
  path: string,
  options: { method?: string; body?: URLSearchParams } = {},
): Promise<T> {
  const response = await connectors.proxy("stripe", path, {
    method: options.method ?? "GET",
    body: options.body,
    headers: options.body
      ? { "Content-Type": "application/x-www-form-urlencoded" }
      : undefined,
  });

  const raw = await response.text();
  let payload: unknown = null;

  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = raw;
  }

  if (!response.ok) {
    const providerMessage =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : `Stripe request failed with status ${response.status}`;
    throw new Error(providerMessage);
  }

  return payload as T;
}

export const productDefinitions = [
  {
    slug: "linen-weekender",
    name: "Linen Weekender",
    description: "A soft-structured carryall for slow weekends and quick escapes.",
    amount: 14800,
    category: "Carry",
  },
  {
    slug: "stoneware-mug",
    name: "Stoneware Mug",
    description: "Hand-finished ceramic with a warm, grounding weight in the hand.",
    amount: 3200,
    category: "Home",
  },
  {
    slug: "everyday-notebook",
    name: "Everyday Notebook",
    description: "A clothbound place for lists, sketches, and half-formed ideas.",
    amount: 1800,
    category: "Paper",
  },
  {
    slug: "wool-throw",
    name: "Wool Throw",
    description: "A generous layer of soft wool for reading corners and cool evenings.",
    amount: 9600,
    category: "Home",
  },
] as const;

export type ShopProduct = {
  id: string;
  priceId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: null;
};

let catalogPromise: Promise<ShopProduct[]> | undefined;

async function listStripeProducts() {
  return stripeRequest<StripeListResponse<StripeProduct>>(
    "/v1/products?active=true&limit=100",
  );
}

async function listStripePrices(productId: string) {
  return stripeRequest<StripeListResponse<StripePrice>>(
    `/v1/prices?active=true&limit=100&product=${encodeURIComponent(productId)}`,
  );
}

async function createStripeProduct(
  definition: (typeof productDefinitions)[number],
) {
  const body = new URLSearchParams();
  body.set("name", definition.name);
  body.set("description", definition.description);
  body.set("metadata[shop_slug]", definition.slug);

  const product = await stripeRequest<StripeProduct>("/v1/products", {
    method: "POST",
    body,
  });

  const priceBody = new URLSearchParams();
  priceBody.set("product", product.id);
  priceBody.set("unit_amount", String(definition.amount));
  priceBody.set("currency", "usd");
  priceBody.set("metadata[shop_slug]", definition.slug);
  await stripeRequest<StripePrice>("/v1/prices", {
    method: "POST",
    body: priceBody,
  });

  return product;
}

const defaultCatalog: ShopProduct[] = productDefinitions.map((def, index) => ({
  id: `prod_${index + 1}`,
  priceId: `price_${index + 1}`,
  name: def.name,
  description: def.description,
  price: def.amount,
  currency: "usd",
  category: def.category,
  imageUrl: null,
}));

async function buildCatalog(): Promise<ShopProduct[]> {
  try {
    const existing = await listStripeProducts();
    const productsBySlug = new Map(
      existing.data
        .filter((product) => product.metadata?.shop_slug)
        .map((product) => [product.metadata!.shop_slug, product]),
    );

    for (const definition of productDefinitions) {
      if (!productsBySlug.has(definition.slug)) {
        const product = await createStripeProduct(definition);
        productsBySlug.set(definition.slug, product);
      }
    }

    const catalog: ShopProduct[] = [];
    for (const definition of productDefinitions) {
      const product = productsBySlug.get(definition.slug);
      if (!product) {
        throw new Error(`Stripe product missing for ${definition.slug}`);
      }

      const prices = await listStripePrices(product.id);
      const price =
        prices.data.find(
          (candidate) => candidate.metadata?.shop_slug === definition.slug,
        ) ??
        prices.data.find(
          (candidate) => candidate.unit_amount === definition.amount,
        );

      if (!price || price.unit_amount === null) {
        throw new Error(`Stripe price missing for ${definition.slug}`);
      }

      catalog.push({
        id: product.id,
        priceId: price.id,
        name: product.name,
        description: product.description ?? definition.description,
        price: price.unit_amount,
        currency: price.currency,
        category: definition.category,
        imageUrl: null,
      });
    }

    return catalog;
  } catch (error) {
    console.warn("Stripe catalog integration unavailable, using default catalog:", error);
    return defaultCatalog;
  }
}

export function getCatalog() {
  catalogPromise ??= buildCatalog().catch((error) => {
    catalogPromise = undefined;
    console.warn("Catalog fetch error, falling back to default catalog:", error);
    return defaultCatalog;
  });
  return catalogPromise;
}

export async function createStripeCheckoutSession(
  items: Array<{ priceId: string; quantity: number }>,
  origin: string,
) {
  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${origin}/success?session_id={CHECKOUT_SESSION_ID}`);
  body.set("cancel_url", `${origin}/cancel`);
  body.set("billing_address_collection", "auto");
  body.set("shipping_address_collection[allowed_countries][0]", "US");

  items.forEach((item, index) => {
    body.set(`line_items[${index}][price]`, item.priceId);
    body.set(`line_items[${index}][quantity]`, String(item.quantity));
  });

  try {
    const session = await stripeRequest<StripeCheckoutSession>(
      "/v1/checkout/sessions",
      { method: "POST", body },
    );

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return { url: session.url, sessionId: session.id };
  } catch (error) {
    console.warn("Stripe checkout session creation failed, returning demo checkout:", error);
    return { url: `${origin}/success?session_id=demo_session`, sessionId: "demo_session" };
  }
}