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
    const list = document.getElementById('product-list');
    list.innerHTML = `<p>Loading Garage...</p>`;

    db.ref('products').on('value', snap => {
        const data = snap.val();
        list.innerHTML = '';
        if (!data) return;
        for (let id in data) {
            const p = data[id];
            if (p.category === category) {
                list.innerHTML += `
                <div class="p-card" onclick="openProduct('${id}')">
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
        document.getElementById('detail-name').innerText = p.name;
        document.getElementById('detail-desc').innerText = p.desc;
        document.getElementById('detail-price').innerText = '₹' + p.price;
        document.getElementById('detail-old').innerText = '₹' + p.oldPrice;
        document.getElementById('detail-stock').innerText = p.stock;
        document.getElementById('detail-category').innerText = p.category;
        document.getElementById('main-detail-img').src = p.img1;
        
        // Gallery setup
        const thumbs = document.getElementById('detail-thumbs');
        thumbs.innerHTML = '';
        const images = [p.img1, p.img2, p.img3].filter(i => i && i.trim() !== "");
        images.forEach(url => {
            thumbs.innerHTML += `<img src="${url}" class="thumb" onclick="document.getElementById('main-detail-img').src='${url}'">`;
        });

        document.getElementById('whatsapp-link').href = `https://wa.me/91XXXXXXXXXX?text=I want to buy ${p.name}`;
        showView('detail');
    });
}
