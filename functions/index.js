const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { PlaidApi, PlaidEnvironments, Configuration } = require("plaid");

admin.initializeApp();

// Initialize Firestore with the default database
const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Debug: Log the database configuration
console.log(
  "Firestore database initialized for project:",
  admin.app().options.projectId
);
console.log("Using Firestore database: (default)");

// Initialize Plaid client inside functions to ensure config is available
const getPlaidClient = () => {
  const clientId = functions.config().plaid.client_id;
  const secret = functions.config().plaid.secret;

  if (!clientId || !secret) {
    console.error("Missing Plaid credentials in getPlaidClient");
    throw new Error(
      "Plaid credentials not configured. Please set plaid.client_id and plaid.secret using firebase functions:config:set"
    );
  }

  const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  return new PlaidApi(configuration);
};

exports.createLinkToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  console.log(`Creating link token for user: ${userId}`);

  // Verify credentials are actually available
  const clientId = functions.config().plaid.client_id;
  const secret = functions.config().plaid.secret;

  if (!clientId || !secret) {
    throw new functions.https.HttpsError(
      "internal",
      "Plaid configuration is incomplete"
    );
  }

  const plaidRequest = {
    user: {
      client_user_id: userId,
    },
    client_name: "Budget Tracker",
    products: ["transactions"],
    country_codes: ["US"],
    language: "en",
  };

  console.log("Plaid request:", plaidRequest);

  try {
    console.log("Calling Plaid linkTokenCreate...");
    const plaidClient = getPlaidClient();
    const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
    console.log("Plaid response received:", {
      link_token: createTokenResponse.data.link_token ? "PRESENT" : "MISSING",
      expiration: createTokenResponse.data.expiration,
    });
    return createTokenResponse.data;
  } catch (error) {
    console.error("Plaid linkTokenCreate error:", {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data,
    });
    throw new functions.https.HttpsError(
      "internal",
      "Error creating link token",
      error.message
    );
  }
});

exports.exchangePublicToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  const { public_token } = data;

  try {
    console.log(`Starting exchangePublicToken for user: ${userId}`);

    const plaidClient = getPlaidClient();
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const { access_token, item_id } = response.data;

    console.log(`Plaid token exchange successful, item_id: ${item_id}`);

    // Ensure user document exists
    console.log(`Checking if user document exists for: ${userId}`);
    const userRef = db.collection("users").doc(userId);

    try {
      const userDoc = await userRef.get();
      console.log(`User document exists: ${userDoc.exists}`);

      if (!userDoc.exists) {
        console.log(`Creating user document for: ${userId}`);
        // Create user document if it doesn't exist
        await userRef.set({
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`User document created successfully`);
      }

      console.log(`Saving Plaid item to Firestore: ${item_id}`);
      // Save Plaid item
      await userRef.collection("plaid_items").doc(item_id).set({
        access_token,
        item_id,
        last_synced: null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Plaid item connected for user ${userId}: ${item_id}`);
      return { success: true, item_id };
    } catch (firestoreError) {
      console.error("Firestore error:", {
        code: firestoreError.code,
        message: firestoreError.message,
        details: firestoreError.details,
      });
      throw firestoreError;
    }
  } catch (error) {
    console.error("Error exchanging public token:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error exchanging public token",
      error.message
    );
  }
});

exports.syncTransactions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  const plaidItemsRef = db
    .collection("users")
    .doc(userId)
    .collection("plaid_items");
  const snapshot = await plaidItemsRef.get();

  if (snapshot.empty) {
    return { success: true, message: "No Plaid items to sync." };
  }

  let totalSynced = 0;
  const results = [];

  for (const doc of snapshot.docs) {
    const { access_token, last_synced, item_id } = doc.data();
    let cursor = last_synced;

    let hasMore = true;
    let itemSynced = 0;

    while (hasMore) {
      try {
        const request = {
          access_token: access_token,
          cursor: cursor,
        };
        const plaidClient = getPlaidClient();
        const response = await plaidClient.transactionsSync(request);
        const { added, modified, removed, next_cursor } = response.data;

          // Fetch account names for this item
          const accountsResponse = await plaidClient.accountsGet({
            access_token: access_token,
          });
          const accountsMap = accountsResponse.data.accounts.reduce(
            (acc, account) => {
              acc[account.account_id] = account.name;
              return acc;
            },
            {}
          );

        // Process added transactions
        for (const transaction of added) {
          await db
            .collection("users")
            .doc(userId)
            .collection("transactions")
            .doc(transaction.transaction_id)
            .set({
              amount: transaction.amount,
              category: transaction.category
                ? transaction.category[0]
                : "Uncategorized",
              date: transaction.date,
              desc: transaction.name,
              type: transaction.amount > 0 ? "income" : "expense",
              plaid_id: transaction.transaction_id,
              account_id: transaction.account_id,
              account_name: accountsMap[transaction.account_id] || "",
              pending: transaction.pending,
              created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
          itemSynced++;
        }

        // Handle modified transactions
        for (const transaction of modified) {
          await db
            .collection("users")
            .doc(userId)
            .collection("transactions")
            .doc(transaction.transaction_id)
            .set(
              {
                amount: transaction.amount,
                category: transaction.category
                  ? transaction.category[0]
                  : "Uncategorized",
                desc: transaction.name,
                pending: transaction.pending,
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
        }

        // Handle removed transactions
        for (const transaction of removed) {
          await db
            .collection("users")
            .doc(userId)
            .collection("transactions")
            .doc(transaction.transaction_id)
            .delete();
        }

        cursor = next_cursor;
        hasMore = response.data.has_more;
      } catch (error) {
        console.error(`Error syncing transactions for item ${item_id}:`, error);
        results.push({ item_id, error: error.message });
        break;
      }
    }

    // Update last synced cursor
    await doc.ref.update({
      last_synced: cursor,
      last_sync_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    totalSynced += itemSynced;
    results.push({ item_id, synced: itemSynced });
  }

  console.log(`Synced ${totalSynced} transactions for user ${userId}`);
  return {
    success: true,
    total_synced: totalSynced,
    results,
  };
});

// Get connected Plaid accounts
exports.getConnectedAccounts = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userId = context.auth.uid;
  console.log(`Getting connected accounts for user: ${userId}`);

  try {
    // Check if user document exists first
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      console.log(`User document does not exist for user ${userId}`);
      return { success: true, accounts: [] };
    }

    const plaidItemsRef = db
      .collection("users")
      .doc(userId)
      .collection("plaid_items");
    const snapshot = await plaidItemsRef.get();

    console.log(`Found ${snapshot.docs.length} Plaid items for user ${userId}`);

    if (snapshot.empty) {
      console.log(`No Plaid items found for user ${userId}`);
      return { success: true, accounts: [] };
    }

    const accounts = [];

    for (const doc of snapshot.docs) {
      const { access_token, item_id, last_sync_at } = doc.data();
      console.log(`Processing Plaid item: ${item_id}`);

      if (!access_token) {
        console.error(`No access token for item ${item_id}`);
        accounts.push({
          item_id,
          error: "No access token available",
          last_sync_at: last_sync_at?.toDate?.() || null,
        });
        continue;
      }

      try {
        // Get accounts for this item
        console.log(`Calling Plaid accountsGet for item ${item_id}`);
        const plaidClient = getPlaidClient();
        const accountsResponse = await plaidClient.accountsGet({
          access_token: access_token,
        });

        console.log(`Successfully got accounts for item ${item_id}:`, {
          accountCount: accountsResponse.data.accounts?.length || 0,
        });

        accounts.push({
          item_id,
          accounts: accountsResponse.data.accounts,
          last_sync_at: last_sync_at?.toDate?.() || null,
        });
      } catch (error) {
        console.error(`Error getting accounts for item ${item_id}:`, {
          message: error.message,
          code: error.code,
          status: error.status,
          response: error.response?.data,
        });
        accounts.push({
          item_id,
          error: error.message,
          last_sync_at: last_sync_at?.toDate?.() || null,
        });
      }
    }

    console.log(
      `Returning ${accounts.length} account groups for user ${userId}`
    );
    return { success: true, accounts };
  } catch (error) {
    console.error("Error getting connected accounts:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    // If it's a NOT_FOUND error, return empty accounts instead of throwing
    if (error.code === 5 || error.message.includes("NOT_FOUND")) {
      console.log("Firestore collection not found, returning empty accounts");
      return { success: true, accounts: [] };
    }

    throw new functions.https.HttpsError(
      "internal",
      "Error getting connected accounts",
      error.message
    );
  }
});

// Test function for diagnostics
exports.testConnection = functions.https.onCall(async (data, context) => {
  return {
    success: true,
    message: "Firebase Functions connection successful",
    timestamp: new Date().toISOString(),
    auth: context.auth
      ? {
          uid: context.auth.uid,
          email: context.auth.email,
        }
      : null,
  };
});

// Plaid configuration diagnostic function
exports.testPlaidConfig = functions.https.onCall(async (data, context) => {
  try {
    const clientId = functions.config().plaid?.client_id;
    const secret = functions.config().plaid?.secret;

    const configStatus = {
      clientId: clientId ? "PRESENT" : "MISSING",
      secret: secret ? "PRESENT" : "MISSING",
      clientIdLength: clientId ? clientId.length : 0,
      secretLength: secret ? secret.length : 0,
      availableConfigKeys: Object.keys(functions.config()),
      plaidConfigKeys: Object.keys(functions.config().plaid || {}),
    };

    // Try to create Plaid client
    let plaidClientStatus = "NOT_ATTEMPTED";
    try {
      const plaidClient = getPlaidClient();
      plaidClientStatus = "SUCCESS";
    } catch (error) {
      plaidClientStatus = `FAILED: ${error.message}`;
    }

    return {
      success: true,
      configStatus,
      plaidClientStatus,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
});
