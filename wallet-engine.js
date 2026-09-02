const crypto = require("crypto");
const {
    openDatabase,
    saveDatabase,
    closeDatabase
} = require("./database");

function id(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
}

function requirePositiveInteger(value, field) {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${field}_MUST_BE_POSITIVE_INTEGER`);
    }
}

async function createUser(username, displayName = null) {
    if (!username || typeof username !== "string") {
        throw new Error("USERNAME_REQUIRED");
    }

    const db = await openDatabase();

    const existing = db.exec(`
        SELECT user_id
        FROM users
        WHERE username = ?
        LIMIT 1
    `, [username]);

    if (existing.length && existing[0].values.length) {
        const userId = existing[0].values[0][0];

        await closeDatabase();

        return {
            userId,
            created: false
        };
    }

    const userId = id("usr");
    const walletId = id("wal");

    db.run(`
        INSERT INTO users (
            user_id,
            username,
            display_name
        )
        VALUES (?, ?, ?)
    `, [
        userId,
        username,
        displayName
    ]);

    db.run(`
        INSERT INTO wallets (
            wallet_id,
            user_id,
            currency
        )
        VALUES (?, ?, 'EGP')
    `, [
        walletId,
        userId
    ]);

    saveDatabase();
    await closeDatabase();

    return {
        userId,
        walletId,
        created: true
    };
}

async function getWallet(userId) {
    const db = await openDatabase();

    const result = db.exec(`
        SELECT
            wallet_id,
            user_id,
            currency,
            available_minor,
            reserved_minor,
            status,
            version
        FROM wallets
        WHERE user_id = ?
        LIMIT 1
    `, [userId]);

    await closeDatabase();

    if (!result.length || !result[0].values.length) {
        return null;
    }

    const row = result[0].values[0];

    return {
        walletId: row[0],
        userId: row[1],
        currency: row[2],
        availableMinor: row[3],
        reservedMinor: row[4],
        status: row[5],
        version: row[6]
    };
}

async function creditWallet({
    userId,
    amountMinor,
    type = "deposit",
    referenceType = null,
    referenceId = null,
    idempotencyKey = null,
    description = null
}) {
    requirePositiveInteger(amountMinor, "amountMinor");

    const db = await openDatabase();

    const walletResult = db.exec(`
        SELECT
            wallet_id,
            available_minor,
            status
        FROM wallets
        WHERE user_id = ?
        LIMIT 1
    `, [userId]);

    if (!walletResult.length || !walletResult[0].values.length) {
        await closeDatabase();
        throw new Error("WALLET_NOT_FOUND");
    }

    const [
        walletId,
        before,
        status
    ] = walletResult[0].values[0];

    if (status !== "active") {
        await closeDatabase();
        throw new Error("WALLET_NOT_ACTIVE");
    }

    if (idempotencyKey) {
        const existing = db.exec(`
            SELECT
                transaction_id,
                balance_before_minor,
                balance_after_minor
            FROM wallet_transactions
            WHERE user_id = ?
              AND idempotency_key = ?
            LIMIT 1
        `, [userId, idempotencyKey]);

        if (existing.length && existing[0].values.length) {
            const row = existing[0].values[0];

            await closeDatabase();

            return {
                transactionId: row[0],
                balanceBefore: row[1],
                balanceAfter: row[2],
                duplicate: true
            };
        }
    }

    const after = before + amountMinor;
    const transactionId = id("txn");

    db.run("BEGIN TRANSACTION");

    try {
        db.run(`
            UPDATE wallets
            SET
                available_minor = ?,
                version = version + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE wallet_id = ?
        `, [
            after,
            walletId
        ]);

        db.run(`
            INSERT INTO wallet_transactions (
                transaction_id,
                wallet_id,
                user_id,
                type,
                direction,
                amount_minor,
                balance_before_minor,
                balance_after_minor,
                reference_type,
                reference_id,
                idempotency_key,
                description
            )
            VALUES (?, ?, ?, ?, 'credit', ?, ?, ?, ?, ?, ?, ?)
        `, [
            transactionId,
            walletId,
            userId,
            type,
            amountMinor,
            before,
            after,
            referenceType,
            referenceId,
            idempotencyKey,
            description
        ]);

        db.run("COMMIT");
        saveDatabase();
    } catch (error) {
        try {
            db.run("ROLLBACK");
        } catch (_) {}

        await closeDatabase();
        throw error;
    }

    await closeDatabase();

    return {
        transactionId,
        balanceBefore: before,
        balanceAfter: after,
        duplicate: false
    };
}

async function debitWallet({
    userId,
    amountMinor,
    type = "gift",
    referenceType = null,
    referenceId = null,
    idempotencyKey = null,
    description = null
}) {
    requirePositiveInteger(amountMinor, "amountMinor");

    const db = await openDatabase();

    const walletResult = db.exec(`
        SELECT
            wallet_id,
            available_minor,
            status
        FROM wallets
        WHERE user_id = ?
        LIMIT 1
    `, [userId]);

    if (!walletResult.length || !walletResult[0].values.length) {
        await closeDatabase();
        throw new Error("WALLET_NOT_FOUND");
    }

    const [
        walletId,
        before,
        status
    ] = walletResult[0].values[0];

    if (status !== "active") {
        await closeDatabase();
        throw new Error("WALLET_NOT_ACTIVE");
    }

    if (idempotencyKey) {
        const existing = db.exec(`
            SELECT
                transaction_id,
                balance_before_minor,
                balance_after_minor
            FROM wallet_transactions
            WHERE user_id = ?
              AND idempotency_key = ?
            LIMIT 1
        `, [userId, idempotencyKey]);

        if (existing.length && existing[0].values.length) {
            const row = existing[0].values[0];

            await closeDatabase();

            return {
                transactionId: row[0],
                balanceBefore: row[1],
                balanceAfter: row[2],
                duplicate: true
            };
        }
    }

    if (before < amountMinor) {
        await closeDatabase();
        throw new Error("INSUFFICIENT_BALANCE");
    }

    const after = before - amountMinor;
    const transactionId = id("txn");

    db.run("BEGIN TRANSACTION");

    try {
        db.run(`
            UPDATE wallets
            SET
                available_minor = ?,
                version = version + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE wallet_id = ?
        `, [
            after,
            walletId
        ]);

        db.run(`
            INSERT INTO wallet_transactions (
                transaction_id,
                wallet_id,
                user_id,
                type,
                direction,
                amount_minor,
                balance_before_minor,
                balance_after_minor,
                reference_type,
                reference_id,
                idempotency_key,
                description
            )
            VALUES (?, ?, ?, ?, 'debit', ?, ?, ?, ?, ?, ?, ?)
        `, [
            transactionId,
            walletId,
            userId,
            type,
            amountMinor,
            before,
            after,
            referenceType,
            referenceId,
            idempotencyKey,
            description
        ]);

        db.run("COMMIT");
        saveDatabase();
    } catch (error) {
        try {
            db.run("ROLLBACK");
        } catch (_) {}

        await closeDatabase();
        throw error;
    }

    await closeDatabase();

    return {
        transactionId,
        balanceBefore: before,
        balanceAfter: after,
        duplicate: false
    };
}

module.exports = {
    createUser,
    getWallet,
    creditWallet,
    debitWallet
};
