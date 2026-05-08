const firebaseConfig = {
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
