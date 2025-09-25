import wixData from 'wix-data';

async function loadAllData() {
    const [products, customers, sauces, ingredients, paidAddons, breadTypes, orders] = await Promise.all([
        wixData.query("Produtos").find(), wixData.query("Clientes").find(),
        wixData.query("Molhos").find(), wixData.query("Ingredientes").find(),
        wixData.query("Adicionais").find(), wixData.query("Paes").find(),
        wixData.query("Pedidos").find()
    ]);

    const populatedOrders = orders.items.map(order => {
         const orderItems = (order.items || []).map(item => {
             const product = products.items.find(p => p._id === item.productId);
             return {...item, productName: product ? product.name : 'Produto Removido'};
         });
         return {...order, items: orderItems};
    });

    return {
        products: products.items, customers: customers.items, sauces: sauces.items,
        ingredients: ingredients.items, paidAddons: paidAddons.items,
        breadTypes: breadTypes.items, orders: populatedOrders
    };
}

async function sendDataToApp() {
    const allData = await loadAllData();
    $w('#gestorApp').postMessage(allData);
}

function getCollectionName(uiTitle) {
    const titleMap = {
        "Produtos": "Produtos", "Adicionais": "Adicionais", "Ingredientes": "Ingredientes",
        "Molhos": "Molhos", "Pães": "Paes", "Clientes": "Clientes"
    };
    return titleMap[uiTitle];
}

$w.onReady(function () {
    sendDataToApp();

    $w('#gestorApp').onMessage(async (event) => {
        const { type, payload } = event.data;

        if (type === 'GET_INITIAL_DATA' || type === 'UPDATE_ORDER_STATUS' || type === 'CREATE_ORDER' || type === 'DELETE_ITEM') {
            if (type === 'UPDATE_ORDER_STATUS') {
                await wixData.update("Pedidos", { _id: payload.orderId, status: payload.newStatus });
            }

            if (type === 'DELETE_ITEM') {
                const collectionName = getCollectionName(payload.collection);
                if (collectionName && payload.itemId) {
                    await wixData.remove(collectionName, payload.itemId);
                }
            }

            if (type === 'CREATE_ORDER') {
                let customerId = payload.customerData.selectedCustomerId;
                if (!customerId && payload.customerData.newCustomerName) {
                    const newCustomer = await wixData.insert("Clientes", {
                        name: payload.customerData.newCustomerName, phone: payload.customerData.newCustomerPhone
                    });
                    customerId = newCustomer._id;
                }

                const lastOrder = await wixData.query("Pedidos").descending("orderNumber").limit(1).find();
                const newOrderNumber = lastOrder.items.length > 0 ? lastOrder.items[0].orderNumber + 1 : 1;
                
                const newOrder = {
                    ...payload.orderData,
                    orderNumber: newOrderNumber,
                    items: payload.items,
                    cliente: customerId ? [customerId] : []
                };
                await wixData.insert("Pedidos", newOrder);
            }
            
            await sendDataToApp();
        }
    });
});
