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
    const target = document.getElementById('view-' + id);
    if(target) target.classList.add('active');
    window.scrollTo(0,0);
}

function openShop(cat) {
    document.getElementById('active-cat-title').innerText = cat;
    showView('shop');
    const display = document.getElementById('product-display');
    display.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #777;">Loading ${cat} Garage...</p>`;

    // Syncing from 'products' node
    db.ref('products').on('value', snap => {
        display.innerHTML = '';
        const items = snap.val();
        if(!items) return display.innerHTML = "<p>Coming Soon!</p>";
        
        for (let key in items) {
            const p = items[key];
            if(p.category === cat) {
                display.innerHTML += `
                <div class="p-card" onclick="openProduct('${key}')">
                    <img src="${p.img1}">
                    <h3>${p.name}</h3>
                    <p style="color: gold; font-weight: bold;">₹${p.price}</p>
                </div>`;
            }
        }
    });
}

function openProduct(id) {
    db.ref('products/' + id).once('value', snap => {
        const p = snap.val();
        if(!p) return;

        document.getElementById('det-name').innerText = p.name;
        document.getElementById('det-desc').innerText = p.desc;
        document.getElementById('det-price').innerText = '₹' + p.price;
        document.getElementById('det-old').innerText = '₹' + p.oldPrice;
        document.getElementById('det-stock').innerText = p.stock;
        document.getElementById('det-cat').innerText = p.category;
        document.getElementById('det-img').src = p.img1;
        
        const thumbs = document.getElementById('det-thumbs');
        thumbs.innerHTML = '';
        const images = [p.img1, p.img2, p.img3].filter(i => i && i.trim() !== "");
        images.forEach(url => {
            thumbs.innerHTML += `<img src="${url}" class="thumb" onclick="document.getElementById('det-img').src='${url}'">`;
        });

        document.getElementById('wa-link').href = `https://wa.me/91XXXXXXXXXX?text=I am interested in buying ${p.name}`;
        showView('detail');
    });
}
