require('dotenv').config();
const cors = require('cors')
const express  = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const connectDB = require('./databaseOrders/dbConnection');
const UserModel = require('./databaseUsers/shemas/users');
const OrderModel = require('./databaseOrders/shemas/orderShema');
const verifyToken = require('./middleware/verifyToken');

const PORT = 8000;

const getOrders = require('./routes/orders');

app.use(cors())
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use('/orders', getOrders);

app.get("/user", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, "your_jwt_secret");
    const user = await UserModel.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ name: user.name });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await UserModel.find({ role: "user" }); // Fetch only users with role "user"
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});


app.delete("/users/:id", async (req, res) => {
  try {
    await UserModel.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
});

app.put("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await UserModel.findByIdAndUpdate(req.params.id, { status });

    res.json({ message: "User status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating user status", error });
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

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, "your_jwt_secret", { expiresIn: "1h" });

    res.json({ message: "Login successful", token, user: { role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const newUser = new UserModel({
      name,
      email,
      password,
      role,
      status: role === "user" ? "unavailable" : undefined,
    });

    await newUser.save();
    res.json({ message: "User created successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err });
  }
});

app.post("/create", async (req, res) => {
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


connectDB();