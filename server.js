const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// PayMob API Key and IDs (from .env file)
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const MERCHANT_ID = process.env.MERCHANT_ID;
const INTEGRATION_ID = process.env.INTEGRATION_ID;

// Step 1: Authenticate with PayMob
app.post("/api/paymob/auth", async (req, res) => {
  try {
    const response = await fetch("https://accept.paymob.com/api/auth/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to authenticate with PayMob");
    }

    res.status(200).json({ token: data.token });
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Step 2: Create an Order
app.post("/api/paymob/create-order", async (req, res) => {
  const { authToken, amount } = req.body;

  try {
    const orderResponse = await fetch(
      "https://accept.paymob.com/api/ecommerce/orders",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: "false",
          amount_cents: amount * 100, // Convert to cents
          currency: "EGP",
          items: [],
        }),
      }
    );

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(orderData.message || "Failed to create order");
    }

    res.status(200).json({ orderId: orderData.id });
  } catch (error) {
    console.error("Order creation error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/paymob/payment-key", async (req, res) => {
  const { authToken, amount, orderId } = req.body;

  try {
    // Example billing data (replace with actual customer data)
    const billingData = {
      apartment: "803",
      email: "customer@example.com",
      floor: "42",
      first_name: "John",
      street: "Ethan Land",
      building: "8028",
      phone_number: "+201234567890",
      shipping_method: "PKG",
      postal_code: "01898",
      city: "Cairo",
      country: "Egypt",
      last_name: "Doe",
      state: "Cairo",
    };

    const paymentResponse = await fetch(
      "https://accept.paymob.com/api/acceptance/payment_keys",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: amount * 100, // Convert to cents
          expiration: 3600, // 1 hour
          order_id: orderId,
          currency: "EGP",
          integration_id: INTEGRATION_ID,
          billing_data: billingData, // Include billing data
        }),
      }
    );

    const paymentData = await paymentResponse.json();

    if (!paymentResponse.ok) {
      throw new Error(paymentData.message || "Failed to generate payment key");
    }

    res.status(200).json({ paymentToken: paymentData.token });
  } catch (error) {
    console.error("Payment key error:", error.message);
    res.status(500).json({ error: error.message });
  }
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
