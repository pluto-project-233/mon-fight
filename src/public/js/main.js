// Main entry point - loads all modules and initializes the game

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

// Initialize game client when page loads
let gameClient;
window.addEventListener('DOMContentLoaded', () => {
  gameClient = new window.GameClient();
});
