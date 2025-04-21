require("dotenv").config();
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const connectDB = require("./databaseOrders/dbConnection");
const UserModel = require("./databaseUsers/shemas/users");
const OrderModel = require("./databaseOrders/shemas/orderShema");
const getOrders = require('./routes/orders');

const PORT = 8000;

app.use(cors());
app.use(express.json());

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

connectDB();

app.use('/orders', getOrders);

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get("/", (req, res) => {
  res.send("Welcome to the Route Optimizer Backend!");
});

app.get("/user",  async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, "your_jwt_secret_key");
    const user = await UserModel.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Error in /user route:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/users", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const loggedInUserId = decoded.id;

    const users = await UserModel.find({ role: "user", masterAdmin: loggedInUserId });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error });
  }
});

app.get("/users/:id/orders",  async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);

    if (!user || !user.orders.length) {
      return res.status(404).json({ message: "No orders found for this user." });
    }

    const orders = await OrderModel.find({ _id: { $in: user.orders } });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.put("/users/:id/status",  async (req, res) => {
  try {
    const { status } = req.body;
    await UserModel.findByIdAndUpdate(req.params.id, { status });

    res.json({ message: "User status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating user status", error });
  }
});

app.post('/users/location', async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;
  const { lat, lng } = req.body;

  await UserModel.findByIdAndUpdate(userId, {
    location: { lat, lng }
  });

  res.status(200).json({ message: "Location saved" });
});

app.get("/orders/:id",  async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.put("/orders/:orderId",  async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { orderStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order status updated successfully", updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.put("/user/:userId/removeOrder",  async (req, res) => {
  try {
    const { userId } = req.params;
    const { orderId } = req.body;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { orders: orderId } }, 
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Order removed from user list", user });
  } catch (error) {
    console.error("Error removing order:", error);
    res.status(500).json({ message: "Server error", error });
  }
});

app.put("/users/:id/ordersasaign",  async (req, res) => {
  try {
    const { id } = req.params;
    const { orders } = req.body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ message: "Invalid or empty orders array" });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $push: { orders: { $each: orders } } },  
      { new: true }
    );

    if (!updatedUser) {
      console.error("User not found for ID:", id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Orders assigned successfully:", updatedUser);
    res.json({ message: "Orders assigned successfully", user: updatedUser });
  } catch (error) {
    console.error("Error assigning orders:", error);
    res.status(500).json({ message: "Error assigning orders", error });
  }
});

app.get('/', (req, res) => {
  res.send('Welcome to the Route Optimizer Backend!');
});

app.post('/login', async (req, res) => {
const { email, password } = req.body;
try {
  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.password !== password) { 
    return res.status(400).json({ message: 'Invalid password' });
  }
  console.log("Signing token with secret:", process.env.JWT_SECRET);
  
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
  );

  res.json({ message: "Login successful", token, user: { role: user.role } });
} catch (err) {
  res.status(500).json({ message: "Server error", error: err });
}
});

const authenticate = require('./middlewares/authMiddleware');

app.post("/signup", authenticate, async (req, res) => {
  try {
    const { name, email, password, role, lat, lng } = req.body;

    console.log("Request body:", req.body);

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const masterAdminId = req.user._id;

    const newUser = new UserModel({
      name,
      email,
      password,
      role,
      status: role === "user" ? "unavailable" : undefined,
      masterAdmin: role === "user" ? masterAdminId : undefined,
      location: role === "user" && lat && lng ? { lat, lng } : undefined,
    });

    console.log("New user object:", newUser);

    await newUser.save();
    res.json({ message: "User created successfully", user: newUser });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
});

app.post("/create",  async (req, res) => {
try {
  const { fullName, senderAddress, recipientAddress, senderPhone, recipientPhone, orderPrice } = req.body;

  if (!fullName || !senderAddress || !recipientAddress || !senderPhone || !recipientPhone || !orderPrice) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newOrder = new OrderModel({
    fullName,
    senderAddress,
    recipientAddress,
    senderPhone,
    recipientPhone,
    orderPrice,
    orderStatus: "for deployment" 
  });

  await newOrder.save();
  res.status(201).json({ message: "Order created successfully", order: newOrder });
} catch (err) {
  console.error("Error creating order:", err);
  res.status(500).json({ message: "Error creating order", error: err.message });
}
});
