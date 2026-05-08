const firebaseConfig = {
    apiKey: "AIzaSyAJi_p1Uuaa66zXEmlFrST_Rx8zMB3LPmM",
    authDomain: "malluhere.firebaseapp.com",
    projectId: "malluhere",
    databaseURL: "https://malluhere-default-rtdb.firebaseio.com", 
    appId: "1:682697051518:web:f9069b7cefdf87dfaeb72f"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function showView(viewId) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    window.scrollTo(0,0);
}

function openShop(category) {
    document.getElementById('current-cat-name').innerText = category;
    showView('shop');
    loadProducts(category);
}

function loadProducts(category) {
    const list = document.getElementById('product-list');
    list.innerHTML = `<p style="grid-column:1/-1">Scanning the garage...</p>`;

    db.ref('products').on('value', snap => {
        const data = snap.val();
        list.innerHTML = '';
        for (let id in data) {
            const p = data[id];
            if (p.category === category) {
                list.innerHTML += `
                <div class="p-card">
                    <img src="${p.image}">
                    <div class="p-info">
                        <h3>${p.name}</h3>
                        <p style="font-size:12px; color:#888; margin:5px 0;">${p.desc}</p>
                        <div class="price-wrap">
                            <span class="price">₹${p.price}</span>
                            <span class="old-price">₹${p.oldPrice}</span>
                        </div>
                        <p style="color:#4cd964; font-size:11px; margin-top:5px;">Stock: ${p.stock} Units</p>
                    </div>
                    <a href="https://wa.me/91XXXXXXXXXX?text=I want to buy ${p.name}" class="wa-btn">BUY ON WHATSAPP</a>
                </div>`;
            }
        }
    });
}const firebaseConfig = {
    apiKey: "AIzaSyAJi_p1Uuaa66zXEmlFrST_Rx8zMB3LPmM",
    authDomain: "malluhere.firebaseapp.com",
    projectId: "malluhere",
    databaseURL: "https://malluhere-default-rtdb.firebaseio.com", 
    appId: "1:682697051518:web:f9069b7cefdf87dfaeb72f"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function navigateTo(path) {
    window.location.hash = path;
    const isHome = (path === '/' || path === '');
    document.getElementById('view-home').style.display = isHome ? 'block' : 'none';
    document.getElementById('view-shop').style.display = isHome ? 'none' : 'block';
    
    if(!isHome) {
        const cat = path.replace('/', '').replace('-', ' ').toUpperCase();
        loadProducts(cat);
    }
}

function loadProducts(cat) {
    document.getElementById('page-title').innerText = cat;
    const list = document.getElementById('product-list');
    
    db.ref('products').on('value', snap => {
        const data = snap.val();
        list.innerHTML = '';
        for (let id in data) {
            const p = data[id];
            if (p.category === cat) {
                const discount = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
                list.innerHTML += `
                    <div class="p-card">
                        ${discount > 0 ? `<div class="badge">-${discount}%</div>` : ''}
                        <img src="${p.image}">
                        <div class="p-info">
                            <div class="stock-status">● In Stock: ${p.stock} units</div>
                            <h3>${p.name}</h3>
                            <p style="color:#bbb; font-size:12px; height:40px; overflow:hidden;">${p.desc}</p>
                            <div style="margin-top:10px;">
                                <span class="p-price">₹${p.price}</span>
                                <span class="p-old-price">₹${p.oldPrice}</span>
                            </div>
                            <a href="https://wa.me/91XXXXXXXXXX?text=I want to buy ${p.name}" class="wa-btn">ORDER ON WHATSAPP</a>
                        </div>
                    </div>`;
            }
        }
    });
}

window.onhashchange = () => navigateTo(window.location.hash.replace('#', ''));
window.onload = () => navigateTo(window.location.hash.replace('#', ''));
 
