const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5008;
// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const MONGO_URI = "mongodb+srv://balaguruva-admin:Balaguruva%401@balaguruvacluster.d48xg.mongodb.net/?retryWrites=true&w=majority&appName=BalaguruvaCluster";
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  name: { type: String },
  createdAt: { type: Date, default: Date.now },
  phone: { type: String },
  address: { type: String },
  profileImage: { type: String },
  lastLogin: { type: Date, default: Date.now },
  preferences: {
    notifications: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false }
  },
  orderHistory: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  }],
  wishlist: [{
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String },
    description: { type: String },
    category: { type: String },
    addedAt: { type: Date, default: Date.now }
  }],
  lastUpdated: { type: Date }
});

const User = mongoose.model("User", userSchema);

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now, expires: "7d" }
}, { timestamps: true });

const Contact = mongoose.model("Contact", contactSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false // Allow guest checkout
  },
  userEmail: { type: String, required: true },
  userName: { type: String, required: false, default: "Guest User" },
  orderItems: [{
    name: { type: String, required: true },
    mrp: { type: Number, required: true },
    discountedPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String }
  }],
  
  shippingInfo: {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true }
  },
  deliveryMethod: { 
    type: String, 
    required: true,
    enum: ['standard', 'express'] 
  },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['razorpay', 'cod']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    update_time: { type: String },
    email_address: { type: String }
  },
  subtotal: { type: Number, required: true },
  deliveryPrice: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true },
  orderStatus: {
    type: String, 
    required: true,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  orderReference: { type: String, required: true, unique: true },
  notes: { type: String }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
// Add this product schema first
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  mrp: { type: Number, required: true },
  discount: { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  category: { type: String },
  image: { type: String },
  stock: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model("Product", productSchema);
// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      productId: String,
      name: String,
      image: String,
      mrp: Number,
      discountedPrice: Number,
      quantity: Number
    }
  ]
});

const Cart = mongoose.model("Cart", cartSchema);

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  
  try {
    const verified = jwt.verify(token, "4953546c308be3088b28807c767bd35e99818434d130a588e5e6d90b6d1d326e");
    req.user = verified;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid token. Please log in again." });
    }
    console.error("Token verification error:", error);
    res.status(500).json({ message: "Internal server error during token verification." });
  }
};


// Login Endpoint
app.post("/login", async (req, res) => {
  const { email, password, googleId, name } = req.body;
  try {
    let user = await User.findOne({ email });

    if (googleId) {
      if (!user) user = await User.create({ email, googleId, name });
      else if (user.googleId && user.googleId !== googleId) return res.status(400).json({ message: "This email is registered with a different Google ID" });
      const token = jwt.sign({ id: user._id, email: user.email }, "4953546c308be3088b28807c767bd35e99818434d130a588e5e6d90b6d1d326e", { expiresIn: "1h" });
      return res.json({ user, token });
    } else {
      if (!user) return res.status(400).json({ message: "User not found" });
      if (!user.password) return res.status(400).json({ message: "This account uses Google login" });
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
      const token = jwt.sign({ id: user._id, email: user.email }, "4953546c308be3088b28807c767bd35e99818434d130a588e5e6d90b6d1d326e", { expiresIn: "1h" });
      return res.json({ user, token });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Signup Endpoint
app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    if (await User.findOne({ email })) return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name });
    const token = jwt.sign({ id: user._id, email: user.email }, "4953546c308be3088b28807c767bd35e99818434d130a588e5e6d90b6d1d326e", { expiresIn: "1h" });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Contact Form Endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const newContact = new Contact({ name, email, phone, subject, message });
    const validationError = newContact.validateSync();
    if (validationError) return res.status(400).json({ error: "Validation failed", details: validationError.message });
    const savedContact = await newContact.save();
    res.status(201).json({ message: "Contact saved successfully", id: savedContact._id });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({ error: "Failed to save contact", details: error.message });
  }
});

// Test DB Endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const connectionState = { readyState: mongoose.connection.readyState, status: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown" };
    res.status(200).json({ message: "DB connection test", connection: connectionState });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Contacts
app.get("/api/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find({});
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts", details: error.message });
  }
});

// Get All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}, "email name createdAt");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users", details: error.message });
  }
});

// Get User Profile
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update User Profile
app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, preferences, profileImage } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Update fields if provided
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (preferences) user.preferences = preferences;
    if (profileImage) user.profileImage = profileImage;
    
    // Add last update timestamp
    user.lastUpdated = new Date();
    
    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Password Change Endpoint
app.put("/api/user/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // If user logs in with Google, they don't have a password
    if (!user.password) {
      return res.status(400).json({ message: "This account uses Google for authentication" });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
    
    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.lastUpdated = new Date();
    
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Account Deletion Endpoint
app.delete("/api/user/account", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // You might want to add additional steps here like:
    // - Delete user-related data from other collections
    // - Log the deletion for audit purposes
    // - Send confirmation email
    
    await User.deleteOne({ _id: req.user.id });
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// User Data Export Endpoint
app.get("/api/user/export", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Create user data export
    const userData = {
      profile: user.toObject(),
      exportDate: new Date(),
      exportedBy: req.user.id,
    };
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=user_data_${new Date().toISOString().split('T')[0]}.json`);
    
    res.json(userData);
  } catch (error) {
    console.error("Error exporting user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Authentication Status Endpoint
app.get("/api/auth/status", authenticateToken, (req, res) => {
  res.json({ 
    authenticated: true, 
    userId: req.user.id,
    email: req.user.email,
    lastVerified: new Date()
  });
});

// Create New Order Endpoint
app.post("/api/orders", async (req, res) => {
  try {
    const { 
      userId,
      userName,
      userEmail,
      orderItems, 
      shippingInfo, 
      deliveryMethod, 
      paymentMethod, 
      paymentResult,
      subtotal,
      deliveryPrice,
      totalPrice,
      orderReference,
      notes
    } = req.body;

    // Validate required fields
    if (!userEmail || !orderItems || !shippingInfo || !deliveryMethod || !paymentMethod || !subtotal || !totalPrice) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields",
        details: "Please provide all necessary order information" 
      });
    }

    // Generate a unique order reference if not provided
    const finalOrderReference = orderReference || `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Check if userId is valid or find user by email
    let validatedUserId = null;
    let userFound = false;
    
    // First try by userId if provided
    if (userId) {
      try {
        const userExists = await User.findById(userId);
        if (userExists) {
          validatedUserId = userId;
          userFound = true;
        }
      } catch (error) {
        console.warn(`Error validating userId: ${error.message}`);
      }
    }
    
    // If user not found by ID, try finding by email (for logged-in users who placed orders as guests before)
    if (!userFound && userEmail) {
      try {
        const userByEmail = await User.findOne({ email: userEmail });
        if (userByEmail) {
          validatedUserId = userByEmail._id;
          userFound = true;
          console.log(`Found user by email: ${userEmail}`);
        }
      } catch (error) {
        console.warn(`Error finding user by email: ${error.message}`);
      }
    }

    // Create a new order instance with enhanced structure
    const newOrder = new Order({
      user: validatedUserId,
      userEmail,
      userName: userName || (validatedUserId ? "Registered User" : "Guest User"),
      orderItems: orderItems.map(item => ({
        name: item.name,
        mrp: item.mrp,
        discountedPrice: item.discountedPrice,
        quantity: item.quantity,
        image: item.image || ""
      })),
      
      shippingInfo,
      deliveryMethod,
      paymentMethod,
      subtotal,
      deliveryPrice: deliveryPrice || 0,
      totalPrice,
      orderReference: finalOrderReference,
      notes: notes || "",
      orderStatus: "processing"
    });

    // Handle payment result data
    if (paymentResult) {
      newOrder.paymentResult = {
        id: paymentResult.id || "",
        status: paymentResult.status || "pending",
        update_time: paymentResult.update_time || new Date().toISOString(),
        email_address: paymentResult.email_address || userEmail
      };

      if (paymentResult.status === 'success') {
        newOrder.paymentStatus = 'completed';
      } else if (paymentResult.status === 'failed') {
        newOrder.paymentStatus = 'failed';
      } else {
        newOrder.paymentStatus = 'pending';
      }
    } else {
      newOrder.paymentStatus = paymentMethod === 'cod' ? 'pending' : 'failed';
    }

    // Save the order
    try {
      const savedOrder = await newOrder.save();
      
      // If user is logged in or found by email, update their order history reference
      if (validatedUserId) {
        try {
          await User.findByIdAndUpdate(
            validatedUserId,
            { 
              $push: { orderHistory: savedOrder._id },
              lastUpdated: new Date()
            },
            { new: true }
          );
          console.log(`Updated order history for user ${validatedUserId}`);
        } catch (userUpdateError) {
          console.error("Failed to update user order history:", userUpdateError);
        }
      }
      
      res.status(201).json({
        success: true,
        message: "Order created successfully",
        order: savedOrder,
        orderReference: savedOrder.orderReference
      });
    } catch (saveError) {
      console.error("Database error saving order:", saveError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to save order to database", 
        error: saveError.message 
      });
    }
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while processing order", 
      error: error.message 
    });
  }
});

// Get Order by ID
app.get("/api/orders/:id", authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Check if the order belongs to the authenticated user
    if (order.user && order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to access this order" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get User's Orders - Enhanced to include both ID and email-based lookups
app.get("/api/my-orders", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // If the user has orderHistory field with populated orders, use that first
    if (user.orderHistory && user.orderHistory.length > 0) {
      const populatedUser = await User.findById(req.user.id)
        .select('orderHistory')
        .populate({
          path: 'orderHistory',
          options: { sort: { createdAt: -1 } }
        });
      
      console.log(`Found ${populatedUser.orderHistory.length} orders in user's orderHistory`);
      
      return res.json({
        success: true,
        orders: populatedUser.orderHistory,
        message: "Orders retrieved from order history"
      });
    }
    
    // Fallback: Find orders by user ID or matching email
    const userOrders = await Order.find({ 
      $or: [
        { user: req.user.id },
        { userEmail: user.email }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found ${userOrders.length} orders by ID/email lookup`);
    
    // If we found orders, also update the user's orderHistory for future
    if (userOrders.length > 0) {
      try {
        // Update the user's orderHistory with these order IDs
        const orderIds = userOrders.map(order => order._id);
        await User.findByIdAndUpdate(
          req.user.id,
          { 
            orderHistory: orderIds,
            lastUpdated: new Date()
          }
        );
        console.log("Updated user's orderHistory with found orders");
      } catch (updateError) {
        console.error("Failed to update orderHistory:", updateError);
      }
    }
    
    if (userOrders.length === 0) {
      return res.status(200).json({
        success: true,
        orders: [],
        message: "No orders found for this user"
      });
    }
    
    return res.json({
      success: true,
      orders: userOrders,
      message: "Orders retrieved by ID and email lookup"
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch orders. Please try again later.",
      error: error.message
    });
  }
});

// Get All Orders (Admin)
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders. Please try again later." });
  }
});

// Get All Orders (Admin - No Authentication)
app.get("/api/orders/admin/all", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch orders. Please try again later.",
      error: error.message
    });
  }
});

// Update Order Status Endpoint for Admin (No Authentication)
app.put("/api/orders/admin/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required" 
      });
    }
    
    // Validate status value
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value" 
      });
    }
    
    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    // Update order status
    order.orderStatus = status;
    
    // Set payment status to completed if order is delivered and payment was pending
    if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'completed';
    }
    
    // If order is cancelled, update payment status appropriately
    if (status === 'cancelled') {
      if (order.paymentStatus === 'completed') {
        // For orders where payment is already completed, we might want to mark as 'refunded'
        // For simplicity, we're just logging this case
        console.log(`Admin cancelled order ${id} with completed payment - refund may be needed`);
      } else if (order.paymentStatus === 'pending') {
        // For pending payments, mark as failed when order is cancelled
        order.paymentStatus = 'failed';
      }
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error("Error updating order status (admin):", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update order status", 
      error: error.message 
    });
  }
});

// Update Order Status Endpoint
app.put("/api/orders/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required" 
      });
    }
    
    // Validate status value
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value" 
      });
    }
    
    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    // Update order status
    order.orderStatus = status;
    
    // Set payment status to completed if order is delivered and payment was pending
    if (status === 'delivered' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'completed';
    }
    
    // If order is cancelled and payment was completed, we might want to handle refund logic here
    
    await order.save();
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        _id: order._id,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus
      }
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update order status", 
      error: error.message 
    });
  }
});

// Get User's Wishlist
app.get("/api/user/wishlist", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({
      success: true,
      wishlist: user.wishlist || []
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId });
    res.json(cart || { userId, items: [] }); // return empty cart if none
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart", details: err.message });
  }
});

app.post("/api/cart/add", async (req, res) => {
  try {
    const { userId, product } = req.body;

    if (!userId || !product || !product.productId) {
      return res.status(400).json({ error: "Missing required fields: userId or product" });
    }

    const {
      productId,
      name,
      image,
      mrp,
      discountedPrice,
      quantity
    } = product;

    // Validate fields inside the product
    if (!name || !image || !mrp || !discountedPrice || quantity == null) {
      return res.status(400).json({ error: "Incomplete product details" });
    }

    // Check if a cart already exists
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // New cart for the user
      cart = new Cart({
        userId,
        items: [{
          productId,
          name,
          image,
          mrp,
          discountedPrice,
          quantity
        }]
      });
    } else {
      // Update or add item in the existing cart
      const existingIndex = cart.items.findIndex(item => item.productId === productId);
      
      if (existingIndex !== -1) {
        // Product already exists in cart, update quantity
        cart.items[existingIndex].quantity += quantity;
      } else {
        // Add new product
        cart.items.push({
          productId,
          name,
          image,
          mrp,
          discountedPrice,
          quantity
        });
      }
    }

    // Save and respond
    const savedCart = await cart.save();
    res.status(200).json({ message: "Product added to cart", cart: savedCart });

  } catch (err) {
    console.error("Error adding to cart:", err.message);
    res.status(500).json({ error: "Failed to add product to cart", details: err.message });
  }
});

app.delete("/api/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await Cart.findOneAndDelete({ userId });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear cart", details: err.message });
  }
});

// Add Item to Wishlist
app.post("/api/user/wishlist", authenticateToken, async (req, res) => {
  try {
    const { productId, name, price, image, description, category } = req.body;
    
    if (!productId || !name || price === undefined) {
      return res.status(400).json({ message: "Missing required product information" });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Check if item already exists in wishlist
    const existingItem = user.wishlist.find(item => item.productId === productId);
    if (existingItem) {
      return res.status(400).json({ message: "Item already in wishlist" });
    }
    
    // Add new item to wishlist
    user.wishlist.push({
      productId,
      name,
      price,
      image,
      description,
      category,
      addedAt: new Date()
    });
    
    user.lastUpdated = new Date();
    await user.save();
    
    res.status(201).json({
      success: true,
      message: "Item added to wishlist",
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove Item from Wishlist
app.delete("/api/user/wishlist/:productId", authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Filter out the item to be removed
    const initialLength = user.wishlist.length;
    user.wishlist = user.wishlist.filter(item => item.productId !== productId);
    
    // Check if item was found and removed
    if (user.wishlist.length === initialLength) {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }
    
    user.lastUpdated = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: "Item removed from wishlist",
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear Entire Wishlist
app.delete("/api/user/wishlist", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.wishlist = [];
    user.lastUpdated = new Date();
    await user.save();
    
    res.json({
      success: true,
      message: "Wishlist cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Fetch all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
// DELETE a product from user's cart

app.use("/api/cart", require("./routes/cart"));

// Start Server
app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));