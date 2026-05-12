const firebaseConfig = {
    apiKey: "AIzaSyAJi_p1Uuaa66zXEmlFrST_Rx8zMB3LPmM",
    authDomain: "malluhere.firebaseapp.com",
    projectId: "malluhere",
    databaseURL: "https://malluhere-default-rtdb.firebaseio.com",
    appId: "1:682697051518:web:f9069b7cefdf87dfaeb72f"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function showView(id) {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
    window.scrollTo(0,0);
}

function openShop(cat) {
    document.getElementById('active-cat-title').innerText = cat;
    showView('shop');
    const container = document.getElementById('product-display');
    container.innerHTML = `<p>Tuning the garage...</p>`;

    // Consistent path: products
    db.ref('products').on('value', snap => {
        container.innerHTML = '';
        const data = snap.val();
        if(!data) return container.innerHTML = "<p>No items found.</p>";
        
        for (let key in data) {
            const p = data[key];
            if(p.category === cat) {
                container.innerHTML += `
                <div class="product-card" onclick="openProduct('${key}')">
                    <img src="${p.img1}">
                    <h3>${p.name}</h3>
                    <p>₹${p.price}</p>
                </div>`;
            }
        }
    });
}

function openProduct(id) {
    db.ref('products/' + id).once('value', snap => {
        const p = snap.val();
        document.getElementById('det-name').innerText = p.name;
        document.getElementById('det-desc').innerText = p.desc;
        document.getElementById('det-price').innerText = '₹' + p.price;
        document.getElementById('det-old').innerText = '₹' + p.oldPrice;
        document.getElementById('det-stock').innerText = p.stock;
        document.getElementById('det-cat').innerText = p.category;
        document.getElementById('det-img').src = p.img1;
        
        const thumbs = document.getElementById('det-thumbs');
        thumbs.innerHTML = '';
        [p.img1, p.img2, p.img3].forEach(url => {
            if(url) thumbs.innerHTML += `<img src="${url}" class="thumb" onclick="document.getElementById('det-img').src='${url}'">`;
        });

        document.getElementById('wa-btn').href = `https://wa.me/91XXXXXXXXXX?text=I'm interested in buying ${p.name}`;
        showView('detail');
    });
}
