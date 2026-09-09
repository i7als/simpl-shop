import { Router, type IRouter } from "express";
import {
  CreateCheckoutSessionBody,
  CreateCheckoutSessionResponse,
  GetShopSummaryResponse,
  ListProductsResponse,
} from "@workspace/api-zod";
import {
  createStripeCheckoutSession,
  getCatalog,
} from "../stripe";

const router: IRouter = Router();

router.get("/products", async (req, res) => {
  try {
    const products = await getCatalog();
    res.json(ListProductsResponse.parse(products));
  } catch (error) {
    req.log.error({ err: error }, "Unable to load shop products");
    res.status(502).json({ error: "Unable to load products right now" });
  }
});

router.get("/shop-summary", async (req, res) => {
  try {
    const products = await getCatalog();
    const response = {
      productCount: products.length,
      categories: [...new Set(products.map((product) => product.category))],
      currency: products[0]?.currency ?? "usd",
    };
    res.json(GetShopSummaryResponse.parse(response));
  } catch (error) {
    req.log.error({ err: error }, "Unable to load shop summary");
    res.status(502).json({ error: "Unable to load shop summary right now" });
  }
});

router.post("/checkout", async (req, res) => {
  try {
    const input = CreateCheckoutSessionBody.parse(req.body);
    const products = await getCatalog();
    const allowedPrices = new Set(products.map((product) => product.priceId));

    if (input.items.some((item) => !allowedPrices.has(item.priceId))) {
      return res.status(400).json({ error: "One or more products are unavailable" });
    }

    const origin = `${req.protocol}://${req.get("host")}`;
    const response = await createStripeCheckoutSession(input.items, origin);
    return res.json(CreateCheckoutSessionResponse.parse(response));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    req.log.error({ err: error }, "Unable to create checkout session");
    const isInvalidRequest =
      error instanceof Error && error.name === "ZodError";
    return res.status(isInvalidRequest ? 400 : 502).json({
      error: isInvalidRequest ? "Please check your cart and try again" : message,
    });
  }
});

export default router;