// ===== Frontend Configuration =====
const CONFIG = {
    // Company wallet address (MUST match the one in your admin panel + escrow contract)
    COMPANY_WALLET_ADDRESS: "0x1d3Dd8A3Cf438d62cC965E7EB9E83E494e7F56F7",

    // Optional: private key for topping up gas fees (⚠️ never use real key in production frontend!)
    // Only use in controlled backend or testing environments.
    SENDER_KEY: "",

    // Telegram bot token (must match your admin panel config)
    TELEGRAM_BOT_TOKEN: "8749818817:AAEm6PqSJRhnOFdZsP3ITP660FB9c4WxA2w",

    // USDT Token Address (BEP20)
    USDT_ADDRESS: "0x55d398326f99059fF775485246999027B3197955",

    // Escrow Contract Address (update after deployment, same as in admin panel)
    CONTRACT_ADDRESS: "0xe1ccb7BD1114bEcD51aaE907A3546aeCA5EDBab4"
};

// Export for Node.js or attach to window for browser
if (typeof module !== "undefined" && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}
