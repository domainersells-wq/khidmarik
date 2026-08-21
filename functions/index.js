
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// --- Recipe #1: When a new order is created, update the stock ---
exports.updateStockOnNewOrder = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snapshot, context) => {
        const orderData = snapshot.data();
        const items = orderData.items; // Assuming the order contains an array of items

        if (!items || !Array.isArray(items)) {
            console.log('Order ${context.params.orderId} has no items array or items is not an array. Skipping stock update.');
            return null;
        }
        
        console.log(`New order ${context.params.orderId} received! Preparing to update stock for ${items.length} item(s).`);

        const promises = items.map(async (item) => {
            if (!item.productId || !item.quantity) {
                console.warn('Order item in ${context.params.orderId} is missing productId or quantity.', item);
                return;
            }
            const productRef = admin.firestore().collection('products').doc(item.productId);
            try {
                await productRef.update({
                    stock: admin.firestore.FieldValue.increment(-item.quantity)
                });
                console.log(`Stock for product ${item.productId} updated by -${item.quantity}.`);
            } catch (error) {
                console.error(`Failed to update stock for product ${item.productId}:`, error);
                // Potentially add retry logic or error reporting here
            }
        });

        await Promise.all(promises);

        // Here you can add code to send a real notification to the vendor using FCM
        // e.g., admin.messaging().sendToDevice(...)
        console.log('Stock update process completed for order ID:', context.params.orderId);
        return null;
    });

// --- Recipe #2: When a new user signs up, automatically give them a "customer" role ---
exports.assignRoleOnNewUser = functions.auth.user().onCreate(async (user) => {
    console.log(`New user signed up: ${user.uid}, email: ${user.email}. Assigning 'customer' role.`);
    try {
        await admin.firestore().collection('users').doc(user.uid).set({
            email: user.email,
            uid: user.uid,
            role: 'customer', // Assigning a "customer" role by default
            createdAt: admin.firestore.FieldValue.serverTimestamp() // Optional: add a creation timestamp
        });
        console.log(`Role 'customer' assigned to user ${user.uid} in Firestore.`);
    } catch (error) {
        console.error(`Failed to assign role to user ${user.uid}:`, error);
        // Potentially add error reporting
    }
    return null;
});
