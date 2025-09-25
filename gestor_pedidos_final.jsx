/*
 * ATENÇÃO: Este código foi adaptado para funcionar dentro de um Elemento Personalizado do Wix.
 * Ele não funciona sozinho, pois depende de receber e enviar mensagens para a página Wix
 * que o contém. A página Wix será responsável por interagir com a base de dados (Coleções CMS).
*/
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlusCircle, Home, ShoppingCart, Users, Gift, BarChart2, Settings, Search, X, Edit, Trash2, Printer, MessageSquare, Clock, CheckCircle, Package, Minus, Plus, XCircle } from 'lucide-react';

// --- AVISO IMPORTANTE ---
// A "estrutura de dados inicial" abaixo serve apenas como exemplo e para
// o código não dar erro. Na implementação final, todos estes dados virão do Wix.
const initialBreadTypes = [];
const initialSauces = [];
const initialIngredients = [];
const initialPaidAddons = [];
const initialProducts = [];
const initialCustomers = [];
const initialOrders = [];

// Função para enviar mensagens para o Wix
function postToWix(message) {
  // A API wixCustomElement é injetada pelo Wix no Elemento Personalizado
  if (window.wixCustomElement) {
    window.wixCustomElement.postMessage(message, "*");
  } else {
    console.log("A executar fora do ambiente Wix. Mensagem:", message);
  }
}

// --- COMPONENTES DA UI (Modal, Header, Sidebar) ---
// (Estes componentes permanecem maioritariamente iguais)
const Modal = ({ children, isOpen, onClose, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b"><h3 className="text-xl font-bold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={24} /></button></div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
const Header = ({ onNewOrder }) => (
  <header className="bg-white shadow-md p-4 flex justify-between items-center"><div className="flex items-center"><div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mr-3"><span className="text-2xl font-bold text-red-600">BL</span></div><h1 className="text-2xl font-bold text-gray-800">Bar Lambada</h1></div><button onClick={onNewOrder} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center shadow-lg hover:bg-red-700 transition-all transform hover:scale-105"><PlusCircle size={20} className="mr-2" />Novo Pedido</button></header>
);
const Sidebar = ({ currentPage, setCurrentPage }) => {
    const navItems = [ { id: 'dashboard', icon: Home, label: 'Painel Principal' }, { id: 'orders', icon: ShoppingCart, label: 'Encomendas' }, { id: 'products', icon: Package, label: 'Produtos' }, { id: 'customers', icon: Users, label: 'Clientes' }, { id: 'promotions', icon: Gift, label: 'Promoções' }, { id: 'stats', icon: BarChart2, label: 'Estatísticas' }, { id: 'settings', icon: Settings, label: 'Configurações' }, ];
    return (<aside className="w-64 bg-gray-800 text-white flex flex-col"><div className="p-4 text-center border-b border-gray-700"><h2 className="text-xl font-semibold">Menu</h2></div><nav className="flex-grow"><ul>{navItems.map(item => (<li key={item.id} className="border-b border-gray-700"><a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(item.id); }} className={`flex items-center py-4 px-6 transition-colors ${currentPage === item.id ? 'bg-red-600' : 'hover:bg-gray-700'}`}><item.icon size={20} className="mr-3" /><span>{item.label}</span></a></li>))}</ul></nav><div className="p-4 text-center text-xs text-gray-400 border-t border-gray-700"><p>Bar Lambada © 1996 - {new Date().getFullYear()}</p><p>Vila Nova de Gaia, Porto</p></div></aside>);
};

// --- PÁGINA PRINCIPAL: DASHBOARD (Criação de Pedidos) ---
const DashboardPage = ({ allData, onOrderCreated }) => {
    const { products: allProducts, customers, sauces, ingredients, paidAddons, breadTypes } = allData;
    const [currentOrder, setCurrentOrder] = useState([]);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isCustomizing, setIsCustomizing] = useState(null);
    const [finalObs, setFinalObs] = useState('');
    const [includeBag, setIncludeBag] = useState(true);
    const [bagPrice, setBagPrice] = useState(0.10);
    const categories = useMemo(() => [...new Set(allProducts.map(p => p.category))], [allProducts]);
    const [activeCategory, setActiveCategory] = useState(categories[0]);
    useEffect(() => { if (categories.length > 0 && !activeCategory) { setActiveCategory(categories[0]); } }, [categories, activeCategory]);
    const handleSelectCustomer = (customer) => { setSelectedCustomer(customer); setCustomerName(customer.name); setCustomerPhone(customer.phone); setCustomerSearch(''); };
    const handleCustomerNameChange = (e) => { setCustomerSearch(e.target.value); setCustomerName(e.target.value); setSelectedCustomer(null); };
    const addToOrder = (product) => { const isCustomizable = product.allowedIngredients || product.allowedPaidAddons || product.allowedSauces || product.breadTypes; const newItem = { product, quantity: 1, key: Date.now(), selectedSauces: [], selectedIngredients: [], selectedPaidAddons: [], breadType: product.breadTypes ? product.breadTypes[0] : null }; setCurrentOrder([...currentOrder, newItem]); if (isCustomizable) setIsCustomizing(newItem); };
    const saveCustomization = (customizedItem) => { setCurrentOrder(currentOrder.map(item => item.key === customizedItem.key ? customizedItem : item)); setIsCustomizing(null); };
    const updateQuantity = (itemKey, delta) => setCurrentOrder(currentOrder.map(item => item.key === itemKey ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
    const total = useMemo(() => { const itemsTotal = currentOrder.reduce((sum, item) => { const productPrice = item.product.price; const addonsPrice = (item.selectedPaidAddons || []).reduce((addonSum, addon) => addonSum + (paidAddons.find(pa => pa._id === addon.id)?.price || 0) * addon.quantity, 0); return sum + (productPrice + addonsPrice) * item.quantity; }, 0); return itemsTotal + (includeBag ? bagPrice : 0); }, [currentOrder, paidAddons, includeBag, bagPrice]);
    const resetOrder = () => { setCurrentOrder([]); setCustomerName(''); setCustomerPhone(''); setSelectedCustomer(null); setCustomerSearch(''); setFinalObs(''); setIncludeBag(true); };
    
    const submitOrder = () => {
        if (currentOrder.length === 0) { alert('Adicione pelo menos um item ao pedido.'); return; }
        
        // ADAPTADO PARA WIX: Envia a mensagem para o Wix tratar
        postToWix({
            type: 'CREATE_ORDER',
            payload: {
                orderData: {
                    customerName: customerName || 'Cliente Takeaway',
                    status: 'A Fazer',
                    total,
                    obs: finalObs,
                    bag: includeBag ? bagPrice : 0,
                },
                items: currentOrder.map(item => ({ // Simplifica o objeto para guardar na DB
                    productId: item.product._id,
                    quantity: item.quantity,
                    identifier: item.identifier || '',
                    obs: item.obs || '',
                    breadType: item.breadType || null,
                    selectedSauces: item.selectedSauces,
                    selectedIngredients: item.selectedIngredients,
                    selectedPaidAddons: item.selectedPaidAddons
                })),
                customerData: {
                    selectedCustomerId: selectedCustomer?._id,
                    newCustomerName: selectedCustomer ? null : customerName,
                    newCustomerPhone: selectedCustomer ? null : customerPhone,
                }
            }
        });
        
        onOrderCreated(); // Avisa o App principal para mudar de página
        resetOrder();
    };

    const filteredProducts = allProducts.filter(p => p.category === activeCategory);
    const filteredCustomers = customerSearch ? customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)) : [];

    return ( <div className="p-6 grid grid-cols-12 gap-6 h-full bg-gray-50"> <div className="col-span-7 bg-white p-4 rounded-lg shadow-md flex flex-col"> <div className="flex space-x-2 border-b pb-2 flex-wrap">{categories.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-lg font-semibold transition-colors mb-2 ${activeCategory === cat ? 'bg-red-600 text-white' : 'bg-gray-200 hover:bg-yellow-400'}`}>{cat}</button>)}</div> <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto flex-grow pt-4">{filteredProducts.map(product => <div key={product._id} onClick={() => addToOrder(product)} className="border rounded-lg p-3 text-center cursor-pointer hover:shadow-xl hover:border-red-500 transition-all transform hover:-translate-y-1 bg-white flex flex-col justify-between"><p className="font-bold text-gray-800">{product.name}</p><p className="text-sm text-gray-600 mt-1">€{product.price.toFixed(2)}</p></div>)}</div> </div> <div className="col-span-5 bg-white p-4 rounded-lg shadow-md flex flex-col h-full"> <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Pedido Atual</h3> <div className="relative mb-2"><input type="text" placeholder="Pesquisar ou Nome do Cliente" value={customerName} onChange={handleCustomerNameChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>{filteredCustomers.length > 0 && <ul className="absolute z-10 w-full bg-white border mt-1 rounded-md shadow-lg max-h-40 overflow-y-auto">{filteredCustomers.map(c => <li key={c._id} onClick={() => handleSelectCustomer(c)} className="p-2 cursor-pointer hover:bg-gray-100">{c.name} ({c.phone})</li>)}</ul>}</div> <input type="text" placeholder="Telefone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm mb-4"/> <div className="flex-grow overflow-y-auto border-t border-b py-2">{currentOrder.length === 0 ? <p className="text-gray-500 text-center py-8">O seu pedido está vazio.</p> : <ul className="divide-y divide-gray-200">{currentOrder.map((item) => <OrderItem key={item.key} item={item} onUpdateQuantity={updateQuantity} onCustomize={() => setIsCustomizing(item)} onRemove={() => setCurrentOrder(currentOrder.filter(i => i.key !== item.key))} sauces={sauces} ingredients={ingredients} paidAddons={paidAddons}/>)}</ul>}</div> <div className="mt-auto pt-4 border-t"><textarea placeholder="Observação final (alergias, etc.)" value={finalObs} onChange={e => setFinalObs(e.target.value)} className="block w-full border-gray-300 rounded-md shadow-sm mb-2" rows="2"></textarea><div className="flex justify-between items-center mb-2"><label className="flex items-center"><input type="checkbox" checked={includeBag} onChange={(e) => setIncludeBag(e.target.checked)} className="h-4 w-4 text-red-600 rounded mr-2"/>Incluir Saco</label><div className="flex items-center">€<input type="number" value={bagPrice} onChange={e => setBagPrice(parseFloat(e.target.value) || 0)} className="w-20 ml-1 border-gray-300 rounded-md shadow-sm text-right"/></div></div><div className="flex justify-between items-center mb-4"><span className="text-lg font-bold">Total:</span><span className="text-2xl font-bold text-red-600">€{total.toFixed(2)}</span></div><div className="flex space-x-2"><button onClick={resetOrder} className="w-full bg-gray-300 font-bold py-3 rounded-lg hover:bg-gray-400">Limpar</button><button onClick={submitOrder} className="w-full bg-yellow-400 font-bold py-3 rounded-lg hover:bg-yellow-500">Finalizar Pedido</button></div></div> </div> {isCustomizing && <CustomizationModal isOpen={!!isCustomizing} onClose={() => setIsCustomizing(null)} item={isCustomizing} onSave={saveCustomization} allSauces={sauces} allIngredients={ingredients} allPaidAddons={paidAddons} allBreadTypes={breadTypes} />} </div> );
};
const OrderItem = ({ item, onUpdateQuantity, onCustomize, onRemove, sauces, ingredients, paidAddons }) => { const details = useMemo(() => { const format = (list, source) => list.map(sel => { const itemDetails = source.find(s => s._id === sel.id); if (!itemDetails) return null; if (sel.quantity > 1) return `${sel.quantity}x ${itemDetails.name}`; if (sel.intensity && sel.intensity !== 'Normal') return `${sel.intensity} ${itemDetails.name}`; return itemDetails.name; }).filter(Boolean).join(', '); return { sauces: format(item.selectedSauces, sauces), ingredients: format(item.selectedIngredients, ingredients), paidAddons: format(item.selectedPaidAddons, paidAddons), } }, [item, sauces, ingredients, paidAddons]); return (<li className="py-3 flex flex-col"><div className="flex justify-between items-center"><div className="flex-1"><p className="font-semibold">{item.quantity}x {item.product.name}{item.identifier && <span className="ml-2 text-red-600 font-bold">({item.identifier})</span>}</p>{details.paidAddons && <p className="text-xs text-blue-600 pl-2">Adicionais: {details.paidAddons}</p>}{details.ingredients && <p className="text-xs text-gray-500 pl-2">Ingredientes: {details.ingredients}</p>}{details.sauces && <p className="text-xs text-gray-500 pl-2">Molhos: {details.sauces}</p>}{item.obs && <p className="text-xs text-purple-600 pl-2">Obs: {item.obs}</p>}</div><div className="flex items-center space-x-2"><button onClick={() => onUpdateQuantity(item.key, -1)} className="p-1 rounded-full bg-gray-200"><Minus size={14}/></button><button onClick={() => onUpdateQuantity(item.key, 1)} className="p-1 rounded-full bg-gray-200"><Plus size={14}/></button><button onClick={onCustomize} className="text-blue-500"><Edit size={16} /></button><button onClick={onRemove} className="text-red-500"><Trash2 size={16} /></button></div></div></li>); };
const CustomizationModal = ({ isOpen, onClose, item, onSave, allSauces, allIngredients, allPaidAddons, allBreadTypes }) => { const [details, setDetails] = useState(JSON.parse(JSON.stringify(item))); const [activeIntensityEditor, setActiveIntensityEditor] = useState(null); const handleSelection = (sourceItem, type) => { const newDetails = {...details}; const selectionArray = newDetails[type]; const existingIndex = selectionArray.findIndex(s => s.id === sourceItem._id); if (existingIndex > -1) { selectionArray.splice(existingIndex, 1); if(activeIntensityEditor?.id === sourceItem._id) setActiveIntensityEditor(null); } else { selectionArray.push({ id: sourceItem._id, quantity: 1, intensity: 'Normal' }); if (sourceItem.hasIntensity) setActiveIntensityEditor({...sourceItem, type, id: sourceItem._id}); else setActiveIntensityEditor(null); } setDetails(newDetails); }; const handleQuantityChange = (sourceItem, change) => { const newDetails = {...details}; const selectionArray = newDetails.selectedPaidAddons; let existingItem = selectionArray.find(s => s.id === sourceItem._id); if (!existingItem) return; const newQuantity = existingItem.quantity + change; if (newQuantity <= 0) { newDetails.selectedPaidAddons = selectionArray.filter(s => s.id !== sourceItem._id); } else { existingItem.quantity = newQuantity; } setDetails(newDetails); }; const handleIntensityChange = (level) => { const { id, type } = activeIntensityEditor; const newDetails = {...details}; const existingItem = newDetails[type].find(s => s.id === id); if (existingItem) existingItem.intensity = level; setDetails(newDetails); setActiveIntensityEditor(null); }; const renderSection = (title, items, allowedIds, type) => { if (!allowedIds || allowedIds.length === 0) return null; const allowedItems = items.filter(i => allowedIds.includes(i._id)); return ( <div className="py-3 border-t"><h4 className="text-md font-semibold text-gray-800 mb-2">{title}</h4><div className="flex flex-wrap gap-2">{allowedItems.map(currentItem => { const selection = details[type]?.find(s => s.id === currentItem._id); const isSelected = !!selection; if (currentItem.isQuantifiable) { return <div key={currentItem._id} className={`flex items-center rounded-full border transition-all ${isSelected ? 'border-red-600 bg-red-50' : 'border-gray-300 bg-white'}`}><span className="pl-4 pr-2 py-1 cursor-pointer" onClick={() => handleSelection(currentItem, type)}>{currentItem.name} (+€{currentItem.price.toFixed(2)})</span>{isSelected && <div className="flex items-center space-x-1 pr-2"><button onClick={() => handleQuantityChange(currentItem, -1)} className="p-1 rounded-full bg-gray-200"><Minus size={14}/></button><span className="font-bold w-4 text-center">{selection.quantity}</span><button onClick={() => handleQuantityChange(currentItem, 1)} className="p-1 rounded-full bg-gray-200"><Plus size={14}/></button></div>}</div> } return <button key={currentItem._id} onClick={() => handleSelection(currentItem, type)} className={`px-4 py-2 text-sm rounded-full border ${isSelected ? 'bg-red-600 text-white border-red-600' : 'bg-gray-100 hover:bg-gray-200'}`}>{currentItem.name}</button> })}</div> {activeIntensityEditor && allowedIds.includes(activeIntensityEditor.id) && type === activeIntensityEditor.type && ( <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center"><p className="font-semibold mb-2">Intensidade para <span className="text-red-600">{activeIntensityEditor.name}</span></p><div className="flex justify-center space-x-2">{['Pouco', 'Normal', 'Muito'].map(level => <button key={level} onClick={() => handleIntensityChange(level)} className="px-4 py-2 rounded-md bg-white border hover:bg-yellow-100">{level}</button>)}</div></div> )}</div> ) }; return ( <Modal isOpen={isOpen} onClose={onClose} title={`Personalizar: ${details.product.name}`}><div className="space-y-2"><input type="text" placeholder="Identificador (Ex: 'Pai', 'Maria')" value={details.identifier || ''} onChange={e => setDetails({...details, identifier: e.target.value})} className="block w-full border-gray-300 rounded-md"/>{details.product.breadTypes && <div className="py-3 border-t"><h4 className="text-md font-semibold text-gray-800 mb-2">Tipo de Pão</h4><div className="flex flex-wrap gap-x-4 gap-y-2">{allBreadTypes.filter(bt => details.product.breadTypes.includes(bt._id)).map(bread => <label key={bread._id} className="flex items-center space-x-2"><input type="radio" name="breadType" value={bread._id} checked={details.breadType === bread._id} onChange={e => setDetails({...details, breadType: e.target.value})}/><span>{bread.name}</span></label>)}</div></div>}{renderSection('Adicionais (Pagos)', allPaidAddons, details.product.allowedPaidAddons, 'selectedPaidAddons')}{renderSection('Ingredientes (Grátis)', allIngredients, details.product.allowedIngredients, 'selectedIngredients')}{renderSection('Molhos', allSauces, details.product.allowedSauces, 'selectedSauces')}<textarea placeholder="Observações do item..." value={details.obs || ''} onChange={e => setDetails({...details, obs: e.target.value})} className="block w-full border-gray-300 rounded-md mt-3" rows="2"></textarea><button onClick={() => onSave(details)} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 mt-4">Confirmar Personalização</button></div></Modal> ); };

// --- PÁGINAS ADICIONAIS ---
const OrderCard = ({ order, onStatusChange, onCancel }) => { const statusConfig = { 'A Fazer': 'bg-blue-100 text-blue-800', 'Em Preparo': 'bg-yellow-100 text-yellow-800', 'Pronto': 'bg-green-100 text-green-800', 'Cancelado': 'bg-red-100 text-red-800' }; const nextStatus = { 'A Fazer': 'Em Preparo', 'Em Preparo': 'Pronto' }; return (<div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full"><div className="flex justify-between items-start border-b pb-2 mb-2"><div><h4 className="font-bold">{order.customerName}</h4><p className="text-xs text-gray-500">#{order.orderNumber} - {new Date(order._createdDate).toLocaleTimeString('pt-PT')}</p></div><span className={`text-sm font-semibold px-2 py-1 rounded-full ${statusConfig[order.status]}`}>{order.status}</span></div><ul className="flex-grow space-y-1 text-sm overflow-y-auto max-h-48 mb-2">{order.items?.map((item, index) => (<li key={index}> {item.quantity}x {item.productName} {item.identifier && `(${item.identifier})`} </li>))}</ul><div className="border-t pt-2 mt-auto"><div className="flex justify-between font-bold text-lg mb-3"><span>Total:</span><span>€{order.total.toFixed(2)}</span></div>{nextStatus[order.status] && <button onClick={() => onStatusChange(order._id, nextStatus[order.status])} className="w-full bg-yellow-400 font-semibold py-2 rounded-md hover:bg-yellow-500 transition-colors text-sm mb-2">Mover para "{nextStatus[order.status]}"</button>}{order.status !== 'Cancelado' && order.status !== 'Pronto' && <button onClick={() => onCancel(order._id)} className="w-full bg-red-500 text-white font-semibold py-2 rounded-md hover:bg-red-600 transition-colors text-sm">Cancelar</button>}</div></div>); };
const OrdersPage = ({ orders }) => { const handleStatusChange = (orderId, newStatus) => { postToWix({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, newStatus } }); }; const handleCancel = (orderId) => { if (window.confirm('Tem a certeza que deseja cancelar este pedido?')) handleStatusChange(orderId, 'Cancelado'); }; const columns = { 'A Fazer': orders.filter(o => o.status === 'A Fazer'), 'Em Preparo': orders.filter(o => o.status === 'Em Preparo'), 'Pronto': orders.filter(o => o.status === 'Pronto') }; return ( <div className="p-6 bg-gray-50 h-full"><h2 className="text-2xl font-bold mb-4">Painel de Encomendas</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">{Object.entries(columns).map(([title, ordersInColumn]) => (<div key={title} className="bg-gray-100 rounded-lg p-4 flex flex-col"><h3 className="text-lg font-bold mb-4 text-center border-b-4 border-red-500 pb-2">{title} ({ordersInColumn.length})</h3><div className="space-y-4 overflow-y-auto flex-grow">{ordersInColumn.length > 0 ? ordersInColumn.sort((a,b) => a.orderNumber - b.orderNumber).map(order => <OrderCard key={order._id} order={order} onStatusChange={handleStatusChange} onCancel={handleCancel} />) : <p className="text-gray-500 text-center pt-10">Nenhum pedido.</p>}</div></div>))}</div></div> ); };
const ManagementTable = ({ title, items, columns }) => ( <div className="bg-white p-4 rounded-lg shadow mb-6"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">{title}</h3><button onClick={() => postToWix({ type: 'ADD_ITEM', payload: { collection: title } })} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center text-sm"><Plus size={16} className="mr-2"/> Adicionar</button></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b bg-gray-50">{columns.map(col => <th key={col.key} className="p-3">{col.header}</th>)}<th className="p-3">Ações</th></tr></thead><tbody>{items.map(item => (<tr key={item._id} className="border-b hover:bg-gray-50">{columns.map(col => <td key={col.key} className="p-3">{col.render ? col.render(item) : item[col.key]}</td>)}<td className="p-3 flex space-x-2"><button onClick={() => postToWix({ type: 'EDIT_ITEM', payload: { item, collection: title }})} className="text-blue-600"><Edit size={18}/></button><button onClick={() => postToWix({ type: 'DELETE_ITEM', payload: { itemId: item._id, collection: title }})} className="text-red-600"><Trash2 size={18}/></button></td></tr>))}</tbody></table></div></div> );
const ProductsPage = ({ allData }) => { const { products, ingredients, paidAddons, sauces, breadTypes } = allData; const getType = (item) => { if(item.isQuantifiable) return 'Quantificável'; if(item.hasIntensity) return 'Intensidade'; return 'Simples'; }; return ( <div className="p-6 bg-gray-50 h-full overflow-y-auto"><h2 className="text-3xl font-bold mb-6">Gestão de Itens</h2> <ManagementTable title="Produtos" items={products} columns={[{ header: 'Nome', key: 'name' }, { header: 'Categoria', key: 'category' }, { header: 'Preço', key: 'price', render: item => `€${item.price?.toFixed(2)}` }]} /> <ManagementTable title="Adicionais" items={paidAddons} columns={[{ header: 'Nome', key: 'name' }, { header: 'Preço', key: 'price', render: item => `€${item.price.toFixed(2)}` }, { header: 'Tipo', key: 'type', render: getType }]} /> <ManagementTable title="Ingredientes" items={ingredients} columns={[{ header: 'Nome', key: 'name' }, { header: 'Tipo', key: 'type', render: getType }]} /> <ManagementTable title="Molhos" items={sauces} columns={[{ header: 'Nome', key: 'name' }, { header: 'Tipo', key: 'type', render: getType }]} /> <ManagementTable title="Pães" items={breadTypes} columns={[{ header: 'Nome', key: 'name' }]} /></div> ); };
const CustomersPage = ({ allData }) => { return (<div className="p-6"><h2 className="text-2xl font-bold">Clientes</h2><ManagementTable title="Clientes" items={allData.customers} columns={[{ header: 'Nome', key: 'name' }, { header: 'Telefone', key: 'phone' }]} /></div>) };
const PlaceholderPage = ({title}) => <div className="p-6"><h2 className="text-2xl font-bold">{title}</h2><p className="mt-4 text-gray-600">Esta secção será implementada em futuras versões.</p></div>;

// --- COMPONENTE PRINCIPAL DA APLICAÇÃO ---
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [allData, setAllData] = useState({ products: [], customers: [], orders: [], ingredients: [], paidAddons: [], sauces: [], breadTypes: [] });
  const [isLoading, setIsLoading] = useState(true);

  // ADAPTADO PARA WIX: Ouve as mensagens da página Wix
  useEffect(() => {
    const handleWixMessage = (event) => {
      if (event.data) {
        setAllData(event.data);
        setIsLoading(false);
      }
    };
    window.addEventListener("message", handleWixMessage);
    // Pede os dados iniciais ao Wix assim que o React carrega
    postToWix({ type: 'GET_INITIAL_DATA' });
    return () => window.removeEventListener("message", handleWixMessage);
  }, []);

  if (isLoading) {
    return <div className="flex h-screen w-screen justify-center items-center"><p className="text-xl">A carregar dados do Bar Lambada...</p></div>
  }
  
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage allData={allData} onOrderCreated={() => setCurrentPage('orders')} />;
      case 'orders': return <OrdersPage orders={allData.orders} />;
      case 'products': return <ProductsPage allData={allData} />;
      case 'customers': return <CustomersPage allData={allData} />;
      case 'promotions': return <PlaceholderPage title="Promoções" />;
      case 'stats': return <PlaceholderPage title="Estatísticas" />;
      case 'settings': return <PlaceholderPage title="Configurações" />;
      default: return <DashboardPage allData={allData} onOrderCreated={() => setCurrentPage('orders')} />;
    }
  };

  return (<div className="flex h-screen bg-gray-100 font-sans"><Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} /><main className="flex-1 flex flex-col"><Header onNewOrder={() => setCurrentPage('dashboard')} /><div className="flex-1 overflow-y-auto">{renderPage()}</div></main></div>);
}
