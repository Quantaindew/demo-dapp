import {
    BitcoinNetwork,
      BitcoinWallet,
      BitcoinProvider,
      EVMWallet,
    } from "@catalogfi/wallets";
    import {
      Orderbook,
      Chains,
      Assets,
      Actions,
        parseStatus,
      TESTNET_ORDERBOOK_API
    } from "@gardenfi/orderbook";
    import { GardenJS } from "@gardenfi/core";
    import { JsonRpcProvider, Wallet } from "ethers";
    
    // create your bitcoin wallet
    const bitcoinWallet = BitcoinWallet.fromWIF(
      "cRvQYB692ffsT1X2YpvZNdSRvoyoSJm3s8UvL7ywuGzPRt4a29Gw",
      new BitcoinProvider(BitcoinNetwork.Testnet)
    );
    
    const signer = new Wallet("297e115792fd25028dfb30d517b528349dc74a7ed98569f884f72933fd0a7e42", new JsonRpcProvider("https://eth-sepolia.public.blastapi.io"));
    
    // create your evm wallet
    const evmWallet = new EVMWallet(signer);
    
    (async () => {
        const orderbook = await Orderbook.init({
            url: TESTNET_ORDERBOOK_API,
        signer,
      });
    
      const wallets = {
        [Chains.bitcoin_testnet]: bitcoinWallet,
        [Chains.ethereum_sepolia]: evmWallet,
      };
    
      const garden = new GardenJS(orderbook, wallets);
    
      const sendAmount = 0.001 * 1e8;
      const receiveAmount = (1 - 0.3 / 100) * sendAmount;
    
      const orderId = await garden.swap(
        Assets.bitcoin_testnet.BTC,
        Assets.ethereum_sepolia.WBTC,
        sendAmount,
        receiveAmount
      );
    
      garden.subscribeOrders(await evmWallet.getAddress(), async (orders) => {
        const order = orders.filter((order) => order.ID === orderId)[0];
        if (!order) return;
        
        const action = parseStatus(order);
        
        console.log('order.ID: ', order.ID);
        console.log('action: ', action);
        if (action === Actions.UserCanInitiate || action === Actions.UserCanRedeem) {
          const swapper = garden.getSwap(order);
          const swapOutput = await swapper.next();
          console.log(`Completed Action ${swapOutput.action} with transaction hash: ${swapOutput.output}`);
        }
      });
    })();