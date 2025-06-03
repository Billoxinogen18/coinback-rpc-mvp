# Coinback RPC MVP 🪙✨

**Earn cashback on your Ethereum transactions and enjoy enhanced MEV protection. Your transactions, your rewards!**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Coinback RPC is an innovative project designed to revolutionize how users interact with the Ethereum network. By simply routing your transactions through our custom RPC endpoint, you become eligible to receive cashback in ETH and benefit from protection against common MEV (Maximal Extractable Value) strategies like front-running.

The core idea is to redirect a portion of the value generated within the transaction supply chain (typically captured by builders and searchers) back to the users who initiate these transactions. This creates a more equitable and rewarding experience for everyday Ethereum users.

This MVP (Minimum Viable Product) showcases the frontend user experience and core conceptual flow of the Coinback RPC service.

## 🚀 Key Features

* **Custom RPC Endpoint:** Seamlessly integrate with your existing wallet (e.g., MetaMask) by adding the Coinback RPC network.
* **ETH Cashback:** Earn a percentage of value back on transactions processed through our network. The more you transact, the more you can earn!
* **MEV Protection:** Transactions routed via Coinback RPC are sent privately to builders, offering protection against front-running and sandwich attacks.
* **User Dashboard:** A comprehensive dashboard to track your transaction history, view accrued cashback rewards, and manage your claims.
* **Reward Claims:** A straightforward process to claim your accumulated ETH rewards directly to your wallet.
* **(Conceptual) Token Holder Benefits:** Future plans include enhanced rewards and benefits for holders of a native Coinback token (CBK).

## 🛠️ Technology Stack

* **Frontend:** React, Vite
* **Styling:** Tailwind CSS
* **Blockchain Interaction (Client-side):** Ethers.js
* **Data Management & User Authentication (for this MVP):** Firebase (Firestore & Auth)
* **Icons:** Lucide React

## 🏁 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

* Node.js (v18.x or later recommended)
* npm (or yarn)
* A modern web browser with a wallet extension like MetaMask.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/Billoxinogen18/coinback-rpc-mvp.git](https://github.com/Billoxinogen18/coinback-rpc-mvp.git)
    cd coinback-rpc-mvp
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```
    (or `yarn install`)

### 🔥 Firebase Setup (Crucial)

This project uses Firebase for user authentication and to manage user-specific data like transaction history and reward balances (simulating backend persistence for the MVP). You **must** set up your own Firebase project for the application to work correctly.

1.  **Create a Firebase Project:**
    * Go to the [Firebase Console](https://console.firebase.google.com/).
    * Click on "Add project" and follow the steps to create a new project.

2.  **Register your Web App:**
    * In your new Firebase project, click the Web icon (`</>`) to add a web app.
    * Give your app a nickname (e.g., "Coinback RPC MVP").
    * Click "Register app". Firebase will provide you with a `firebaseConfig` object. **Copy this object.**

3.  **Configure `src/services/firebase.js`:**
    * Open the file `coinback-rpc-mvp/src/services/firebase.js` in your code editor.
    * You will see a section for `firebaseConfig`. Replace the placeholder or example configuration with the `firebaseConfig` object you copied from your Firebase project:

        ```javascript
        // src/services/firebase.js

        /
        ```

4.  **Enable Firebase Services:**
    * **Authentication:** In the Firebase console, navigate to "Authentication" (under "Build").
        * Go to the "Sign-in method" tab.
        * Enable **Anonymous** authentication. This allows users to use the app without creating an explicit account for this MVP.
    * **Firestore Database:** In the Firebase console, navigate to "Firestore Database" (under "Build").
        * Click "Create database".
        * Start in **test mode** for easier setup during development. (For a production app, you would need to set up proper security rules).
        * Select a location for your database.

### Running Locally

Once you have installed dependencies and configured Firebase:

```bash
npm run dev
