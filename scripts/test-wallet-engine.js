"use strict";

const {
    createUser,
    getWallet,
    creditWallet,
    debitWallet
} = require("../wallet-engine");

async function main() {
    const username = `wallet_test_${Date.now()}`;

    console.log("========================================");
    console.log("LEXBRIDGE — WALLET ENGINE TEST");
    console.log("========================================");

    console.log("TEST_USER=" + username);

    const account = await createUser(
        username,
        "LexBridge Wallet Test"
    );

    if (!account || !account.userId) {
        throw new Error("USER_CREATION_FAILED");
    }

    console.log("USER_CREATED=true");
    console.log("USER_ID=" + account.userId);

    let wallet = await getWallet(account.userId);

    if (!wallet) {
        throw new Error("WALLET_NOT_CREATED");
    }

    console.log("INITIAL_BALANCE=" + wallet.availableMinor);

    if (wallet.availableMinor !== 0) {
        throw new Error(
            `INITIAL_BALANCE_INVALID:${wallet.availableMinor}`
        );
    }

    const credit = await creditWallet({
        userId: account.userId,
        amountMinor: 10000,
        type: "deposit",
        referenceType: "test",
        referenceId: "wallet-engine-test",
        idempotencyKey: "credit-test-001",
        description: "LexBridge wallet test credit"
    });

    console.log("AFTER_CREDIT=" + credit.balanceAfter);

    if (credit.balanceAfter !== 10000) {
        throw new Error(
            `CREDIT_FAILED:${credit.balanceAfter}`
        );
    }

    const duplicateCredit = await creditWallet({
        userId: account.userId,
        amountMinor: 10000,
        type: "deposit",
        referenceType: "test",
        referenceId: "wallet-engine-test",
        idempotencyKey: "credit-test-001",
        description: "Duplicate test credit"
    });

    console.log("DUPLICATE_CREDIT=" + (
        duplicateCredit.duplicate === true
    ));

    if (duplicateCredit.duplicate !== true) {
        throw new Error("IDEMPOTENCY_CREDIT_FAILED");
    }

    wallet = await getWallet(account.userId);

    if (wallet.availableMinor !== 10000) {
        throw new Error(
            `DUPLICATE_CREDIT_CHANGED_BALANCE:${wallet.availableMinor}`
        );
    }

    const debit = await debitWallet({
        userId: account.userId,
        amountMinor: 2500,
        type: "withdrawal",
        referenceType: "test",
        referenceId: "wallet-engine-test-debit",
        idempotencyKey: "debit-test-001",
        description: "LexBridge wallet test debit"
    });

    console.log("AFTER_DEBIT=" + debit.balanceAfter);

    if (debit.balanceAfter !== 7500) {
        throw new Error(
            `DEBIT_FAILED:${debit.balanceAfter}`
        );
    }

    const duplicateDebit = await debitWallet({
        userId: account.userId,
        amountMinor: 2500,
        type: "withdrawal",
        referenceType: "test",
        referenceId: "wallet-engine-test-debit",
        idempotencyKey: "debit-test-001",
        description: "Duplicate test debit"
    });

    console.log("DUPLICATE_DEBIT=" + (
        duplicateDebit.duplicate === true
    ));

    if (duplicateDebit.duplicate !== true) {
        throw new Error("IDEMPOTENCY_DEBIT_FAILED");
    }

    wallet = await getWallet(account.userId);

    if (wallet.availableMinor !== 7500) {
        throw new Error(
            `DUPLICATE_DEBIT_CHANGED_BALANCE:${wallet.availableMinor}`
        );
    }

    let insufficientBlocked = false;

    try {
        await debitWallet({
            userId: account.userId,
            amountMinor: 100000,
            type: "withdrawal",
            referenceType: "test",
            referenceId: "insufficient-test",
            idempotencyKey: "insufficient-test-001",
            description: "Insufficient balance test"
        });
    } catch (err) {
        insufficientBlocked = true;
        console.log(
            "INSUFFICIENT_BALANCE_ERROR=" +
            (err.message || String(err))
        );
    }

    if (!insufficientBlocked) {
        throw new Error("INSUFFICIENT_BALANCE_GUARD_FAILED");
    }

    wallet = await getWallet(account.userId);

    console.log("FINAL_BALANCE=" + wallet.availableMinor);

    if (wallet.availableMinor !== 7500) {
        throw new Error(
            `FINAL_BALANCE_INVALID:${wallet.availableMinor}`
        );
    }

    console.log("INSUFFICIENT_BALANCE_GUARD_OK");
    console.log("WALLET_ENGINE_TEST_OK");
    console.log("========================================");
}

main().catch(err => {
    console.error("WALLET_ENGINE_TEST_FAILED");
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
});
