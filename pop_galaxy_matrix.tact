import "@stdlib/deploy";

// Standard TEP-74 Jetton Transfer Message
message(0x0f8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

// Standard TEP-74 Jetton Notification
message(0x7362d09c) JettonTransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

// Direct Native/GRAM Slot Purchase Message
message BuySlotWithGram {
    slotId: Int as uint8;
    referrerL1: Address;
    referrerL2: Address;
    referrerL3: Address;
    referrerL4: Address;
}

struct UserSlotState {
    isActive: Bool;
    recycleCount: Int as uint32;
    currentNodes: Int as uint8; // 0 to 3 nodes recycle loop
}

contract PopGalaxyMatrix with Deployable {
    owner: Address;
    adminFeeWallet: Address;
    devFeeWallet: Address;      // আপনার ডেভেলপমেন্ট ওয়ালেট
    popJettonWallet: Address;
    popMasterAddress: Address;

    // Slot Prices in GRAM base units (nanoGRAM: 9 decimals)
    slotPrices: map<Int as uint8, Int as coins>;
    
    // User Matrix State: sha256(userAddress, slotId) -> UserSlotState
    userSlots: map<Int as uint256, UserSlotState>;

    // Fees in nano units (9 decimals)
    const POP_DEV_FEE: Int = 800000000;    // 0.8 GRAM fee (POP দিয়ে কেনার সময়)
    const BASE_DEV_FEE: Int = 1000000000;  // 1.0 GRAM fee (GRAM / USDT দিয়ে কেনার সময়)
    const GAS_RESERVE: Int = 50000000;     // 0.05 GRAM execution gas reserve

    init(adminWallet: Address, popMaster: Address) {
        self.owner = sender();
        self.adminFeeWallet = adminWallet;
        // আপনার নতুন দেওয়া ডেভেলপমেন্ট ওয়ালেট সেট করা হলো
        self.devFeeWallet = address("UQDE5Sxi72raMvfqPOwaRrJTTr6XF9X8MWivo6JNuX-rfeZQ");
        self.popMasterAddress = popMaster;
        self.popJettonWallet = myAddress();

        // 10টি স্লট প্রাইস (GRAM হিসেবে)
        self.slotPrices.set(1, 2000000000);     // Tier 1: 2 GRAM
        self.slotPrices.set(2, 4000000000);     // Tier 2: 4 GRAM
        self.slotPrices.set(3, 8000000000);     // Tier 3: 8 GRAM
        self.slotPrices.set(4, 16000000000);    // Tier 4: 16 GRAM
        self.slotPrices.set(5, 32000000000);    // Tier 5: 32 GRAM
        self.slotPrices.set(6, 64000000000);    // Tier 6: 64 GRAM
        self.slotPrices.set(7, 128000000000);   // Tier 7: 128 GRAM
        self.slotPrices.set(8, 250000000000);   // Tier 8: 250 GRAM
        self.slotPrices.set(9, 500000000000);   // Tier 9: 500 GRAM
        self.slotPrices.set(10, 1000000000000); // Tier 10: 1000 GRAM
    }

    // ========================================================
    // 1. GRAM / USDT দিয়ে স্লট বাই (1.0 GRAM সার্ভিস ফি)
    // ========================================================
    receive(msg: BuySlotWithGram) {
        let buyer: Address = sender();
        require(msg.slotId >= 1 && msg.slotId <= 10, "Invalid slot tier");

        let slotPrice: Int? = self.slotPrices.get(msg.slotId);
        require(slotPrice != null, "Price not configured");

        let requiredAmount: Int = slotPrice!! + self.BASE_DEV_FEE + self.GAS_RESERVE;
        let incomingAmount: Int = context().value;
        require(incomingAmount >= requiredAmount, "Insufficient payment: Needs Slot Price + 1.0 GRAM Fee");

        // সার্ভিস ফি সরাসরি ডেভেলপমেন্ট ওয়ালেটে প্রেরণ
        send(SendParameters{
            to: self.devFeeWallet,
            value: self.BASE_DEV_FEE,
            mode: SendPayGasSeparately,
            body: emptyCell()
        });

        // ম্যাট্রিক্স স্টেট আপডেট
        self.processMatrixNodes(buyer, msg.slotId);

        // প্রফিট ডিস্ট্রিবিউশন (20% Admin, 40% L1, 20% L2, 10% L3, 10% L4)
        self.distributeGramRewards(slotPrice!!, msg.referrerL1, msg.referrerL2, msg.referrerL3, msg.referrerL4);
    }

    // ========================================================
    // 2. POP টোকেন দিয়ে স্লট বাই (0.8 GRAM সার্ভিস ফি)
    // ========================================================
    receive(msg: JettonTransferNotification) {
        let payloadSlice: Slice = msg.forwardPayload;
        let op: Int = payloadSlice.loadUint(32);

        require(op == 0x504F5031, "Invalid operation code");

        let slotId: Int = payloadSlice.loadUint(8);
        require(slotId >= 1 && slotId <= 10, "Invalid slot tier");

        let l1: Address = payloadSlice.loadAddress();
        let l2: Address = payloadSlice.loadAddress();
        let l3: Address = payloadSlice.loadAddress();
        let l4: Address = payloadSlice.loadAddress();

        // 0.8 GRAM সার্ভিস ফি ভ্যালিডেশন
        let incomingNative: Int = context().value;
        require(incomingNative >= (self.POP_DEV_FEE + self.GAS_RESERVE), "Insufficient Native Fee: Needs 0.8 GRAM for Dev Fee");

        // ডেভেলপমেন্ট ওয়ালেটে 0.8 GRAM পাঠিয়ে দেওয়া
        send(SendParameters{
            to: self.devFeeWallet,
            value: self.POP_DEV_FEE,
            mode: SendPayGasSeparately,
            body: emptyCell()
        });

        // POP টোকেন অ্যাডমিন ওয়ালেটে পাঠানো
        self.dispatchJettonTransfer(self.adminFeeWallet, msg.amount, 50000000);

        // ম্যাট্রিক্স স্টেট আপডেট
        self.processMatrixNodes(msg.sender, slotId);

        // মেম্বারদের GRAM রিওয়ার্ড প্রদান
        let slotPrice: Int = self.slotPrices.get(slotId) ?? 0;
        if (slotPrice > 0 && myBalance() > (slotPrice + self.GAS_RESERVE)) {
            self.distributeGramRewards(slotPrice, l1, l2, l3, l4);
        }
    }

    fun processMatrixNodes(user: Address, slotId: Int) {
        let userKey: Int = self.getUserSlotKey(user, slotId);
        let userState: UserSlotState = self.userSlots.get(userKey) ?? UserSlotState{
            isActive: false,
            recycleCount: 0,
            currentNodes: 0
        };

        if (!userState.isActive) {
            userState.isActive = true;
            userState.currentNodes = 1;
        } else {
            userState.currentNodes = userState.currentNodes + 1;
            if (userState.currentNodes >= 3) {
                userState.currentNodes = 0;
                userState.recycleCount = userState.recycleCount + 1;
            }
        }
        self.userSlots.set(userKey, userState);
    }

    fun distributeGramRewards(totalAmount: Int, l1: Address, l2: Address, l3: Address, l4: Address) {
        let adminShare: Int = (totalAmount * 20) / 100;
        let l1Share: Int = (totalAmount * 40) / 100;
        let l2Share: Int = (totalAmount * 20) / 100;
        let l3Share: Int = (totalAmount * 10) / 100;
        let l4Share: Int = (totalAmount * 10) / 100;

        self.sendGram(self.adminFeeWallet, adminShare);
        self.sendGram(l1, l1Share);
        self.sendGram(l2, l2Share);
        self.sendGram(l3, l3Share);
        self.sendGram(l4, l4Share);
    }

    fun sendGram(to: Address, amount: Int) {
        if (amount > 0) {
            send(SendParameters{
                to: to,
                value: amount,
                mode: SendPayGasSeparately,
                body: emptyCell()
            });
        }
    }

    fun dispatchJettonTransfer(to: Address, jettonAmount: Int, tonForGas: Int) {
        if (jettonAmount <= 0) {
            return;
        }
        send(SendParameters{
            to: self.popJettonWallet,
            value: tonForGas,
            mode: SendPayGasSeparately,
            body: JettonTransfer{
                queryId: 0,
                amount: jettonAmount,
                destination: to,
                responseDestination: self.owner,
                customPayload: null,
                forwardTonAmount: 1,
                forwardPayload: emptySlice()
            }.toCell()
        });
    }

    fun getUserSlotKey(user: Address, slotId: Int): Int {
        let b: Builder = beginCell();
        b.storeAddress(user);
        b.storeUint(slotId, 8);
        return cellHash(b.endCell());
    }

    get fun getSlotPrice(slotId: Int): Int? {
        return self.slotPrices.get(slotId);
    }

    get fun getUserSlot(user: Address, slotId: Int): UserSlotState {
        let key: Int = self.getUserSlotKey(user, slotId);
        return self.userSlots.get(key) ?? UserSlotState{
            isActive: false,
            recycleCount: 0,
            currentNodes: 0
        };
    }
}
