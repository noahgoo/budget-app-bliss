const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { PlaidApi, PlaidEnvironments } = require("plaid");

admin.initializeApp();

const plaidClient = new PlaidApi({
  clientID: functions.config().plaid.client_id,
  secret: functions.config().plaid.secret,
  env: PlaidEnvironments.sandbox,
});

exports.createLinkToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const userId = context.auth.uid;

  const plaidRequest = {
    user: {
      client_user_id: userId,
    },
    client_name: "Budget Tracker",
    products: ["transactions"],
    country_codes: ["US"],
    language: "en",
  };

  try {
    const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
    return createTokenResponse.data;
  } catch (error) {
    throw new functions.https.HttpsError("internal", "Error creating link token", error.message);
  }
});

exports.exchangePublicToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const { public_token, userId } = data;

  try {
    const response = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = response.data;

    await admin.firestore().collection("users").doc(userId).collection("plaid_items").doc(item_id).set({
      access_token,
      last_synced: null,
    });

    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError("internal", "Error exchanging public token", error.message);
  }
});

exports.syncTransactions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const userId = context.auth.uid;
  const plaidItemsRef = admin.firestore().collection("users").doc(userId).collection("plaid_items");
  const snapshot = await plaidItemsRef.get();

  if (snapshot.empty) {
    return { success: true, message: "No Plaid items to sync." };
  }

  for (const doc of snapshot.docs) {
    const { access_token, last_synced } = doc.data();
    let cursor = last_synced;

    let hasMore = true;
    while (hasMore) {
      const request = {
        access_token: access_token,
        cursor: cursor,
      };
      const response = await plaidClient.transactionsSync(request);
      const { added, modified, removed, next_cursor } = response.data;

      for (const transaction of added) {
        await admin.firestore().collection("users").doc(userId).collection("transactions").doc(transaction.transaction_id).set({
          amount: transaction.amount,
          category: transaction.category ? transaction.category[0] : "Uncategorized",
          date: new Date(transaction.date),
          description: transaction.name,
          type: transaction.amount > 0 ? "income" : "expense",
        });
      }

      // Handle modified and removed transactions as needed

      cursor = next_cursor;
      hasMore = response.data.has_more;
    }

    await doc.ref.update({ last_synced: cursor });
  }

  return { success: true };
});