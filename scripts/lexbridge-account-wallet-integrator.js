const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SERVER = path.join(ROOT, "server.js");
const WALLET = path.join(ROOT, "wallet-engine.js");
const DATABASE = path.join(ROOT, "database.js");

const report = {
    project: ROOT,
    target: "LexBridge",
    backup: false,
    commit: false,
    push: false,
    changes: [],
    tests: [],
    errors: []
};

function run(label, command) {
    try {
        const output = execSync(command, {
            cwd: ROOT,
            encoding: "utf8",
            stdio: ["ignore", "pipe", "pipe"]
        }).trim();

        report.tests.push({
            name: label,
            status: "PASS",
            output
        });

        return output;
    } catch (error) {
        report.tests.push({
            name: label,
            status: "FAIL",
            output: String(error.stdout || "") + String(error.stderr || "")
        });

        report.errors.push(label);
        return null;
    }
}

function assertFile(file, name) {
    if (!fs.existsSync(file)) {
        throw new Error(`${name}_NOT_FOUND: ${file}`);
    }
}

function patchServer() {
    let s = fs.readFileSync(SERVER, "utf8");

    const original = s;

    if (!s.includes('require("./wallet-engine")')) {
        const anchor = `const { Server } = require("socket.io");`;

        if (!s.includes(anchor)) {
            throw new Error("SERVER_IMPORT_ANCHOR_NOT_FOUND");
        }

        s = s.replace(
            anchor,
            `${anchor}
const {
    createUser,
    getWallet
} = require("./wallet-engine");`,
            1
        );
    }

    if (!s.includes('app.post("/api/account"')) {
        const anchor = `/* ===== PLATFORM HEALTH ===== */`;

        if (!s.includes(anchor)) {
            throw new Error("PLATFORM_HEALTH_ANCHOR_NOT_FOUND");
        }

        const block = `/* ===== ACCOUNT + WALLET FOUNDATION ===== */

/*
 * LexBridge Account + Wallet foundation.
 *
 * This endpoint creates/resolves an account and its wallet.
 * It intentionally does NOT expose public credit/debit operations.
 */

app.post("/api/account", async (req, res) => {
    try {
        const username = String(req.body?.username || "").trim();
        const displayName =
            req.body?.displayName == null
                ? null
                : String(req.body.displayName).trim();

        if (!username) {
            return res.status(400).json({
                success: false,
                error: "USERNAME_REQUIRED"
            });
        }

        if (username.length < 2 || username.length > 50) {
            return res.status(400).json({
                success: false,
                error: "USERNAME_LENGTH_INVALID"
            });
        }

        const account = await createUser(username, displayName);
        const wallet = await getWallet(account.userId);

        if (!wallet) {
            return res.status(500).json({
                success: false,
                error: "WALLET_NOT_FOUND"
            });
        }

        return res.status(account.created ? 201 : 200).json({
            success: true,
            account: {
                userId: account.userId,
                username,
                displayName,
                created: account.created
            },
            wallet: {
                walletId: wallet.walletId,
                currency: wallet.currency,
                availableMinor: wallet.availableMinor,
                reservedMinor: wallet.reservedMinor,
                status: wallet.status,
                version: wallet.version
            }
        });
    } catch (error) {
        console.error("ACCOUNT_OPERATION_ERROR:", error.message);

        return res.status(500).json({
            success: false,
            error: "ACCOUNT_OPERATION_FAILED"
        });
    }
});

app.get("/api/account/:userId/wallet", async (req, res) => {
    try {
        const userId = String(req.params.userId || "").trim();

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: "USER_ID_REQUIRED"
            });
        }

        const wallet = await getWallet(userId);

        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "WALLET_NOT_FOUND"
            });
        }

        return res.json({
            success: true,
            wallet: {
                walletId: wallet.walletId,
                userId: wallet.userId,
                currency: wallet.currency,
                availableMinor: wallet.availableMinor,
                reservedMinor: wallet.reservedMinor,
                status: wallet.status,
                version: wallet.version
            }
        });
    } catch (error) {
        console.error("WALLET_READ_ERROR:", error.message);

        return res.status(500).json({
            success: false,
            error: "WALLET_READ_FAILED"
        });
    }
});

/* ===== END ACCOUNT + WALLET FOUNDATION ===== */

`;

        s = s.replace(anchor, block + anchor, 1);
    }

    if (s !== original) {
        fs.writeFileSync(SERVER, s);
        report.changes.push("server.js: Account + Wallet API integrated");
    } else {
        report.changes.push("server.js: Account + Wallet API already integrated");
    }
}

function main() {
    console.log("========================================");
    console.log("LEXBRIDGE — ACCOUNT + WALLET INTEGRATOR");
    console.log("========================================");
    console.log(`PROJECT: ${ROOT}`);
    console.log("TARGET: server.js");
    console.log("BACKUP: NO");
    console.log("COMMIT: NO");
    console.log("PUSH: NO");
    console.log("SERVER STOP: NO");
    console.log("----------------------------------------");

    assertFile(SERVER, "SERVER");
    assertFile(WALLET, "WALLET_ENGINE");
    assertFile(DATABASE, "DATABASE");

    console.log("FILES: OK");

    patchServer();

    run("server.js syntax", "node --check server.js");
    run("wallet-engine.js syntax", "node --check wallet-engine.js");
    run("database.js syntax", "node --check database.js");

    run(
        "wallet engine functional test",
        "node scripts/test-wallet-engine.js"
    );

    const routes = run(
        "account route inspection",
        "grep -nE 'api/account|createUser|getWallet' server.js"
    );

    if (!routes) {
        report.errors.push("ACCOUNT_ROUTES_NOT_FOUND");
    }

    run(
        "git diff check",
        "git diff -- server.js package.json package-lock.json database.js wallet-engine.js"
    );

    run(
        "git status",
        "git status --short"
    );

    console.log("");
    console.log("========================================");
    console.log("FINAL REPORT");
    console.log("========================================");

    console.log(`PROJECT: ${report.project}`);
    console.log(`CHANGES: ${report.changes.length}`);

    for (const item of report.changes) {
        console.log(`  ✓ ${item}`);
    }

    console.log("");
    console.log("TESTS:");

    for (const test of report.tests) {
        console.log(`  ${test.status === "PASS" ? "✓" : "✗"} ${test.name}`);
    }

    console.log("");
    console.log("OPERATION STATUS:");
    console.log(`  BACKUP: ${report.backup ? "YES" : "NO"}`);
    console.log(`  COMMIT: ${report.commit ? "YES" : "NO"}`);
    console.log(`  PUSH: ${report.push ? "YES" : "NO"}`);
    console.log(`  ERRORS: ${report.errors.length}`);

    if (report.errors.length) {
        for (const error of report.errors) {
            console.log(`  ✗ ${error}`);
        }
    }

    console.log("========================================");

    if (report.errors.length) {
        console.log("STATUS: NEEDS_REVIEW");
        process.exitCode = 1;
    } else {
        console.log("STATUS: ACCOUNT_WALLET_FOUNDATION_OK");
    }
}

main();
