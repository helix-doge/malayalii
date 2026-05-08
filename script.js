const firebaseConfig = {
    apiKey: "AIzaSyAJi_p1Uuaa66zXEmlFrST_Rx8zMB3LPmM",
    authDomain: "malluhere.firebaseapp.com",
    projectId: "malluhere",
    databaseURL: "https://malluhere-default-rtdb.firebaseio.com", 
    appId: "1:682697051518:web:f9069b7cefdf87dfaeb72f"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ROUTING SYSTEM
function navigateTo(path) {
    window.location.hash = path; // Simulates URL pathing
    render(path);
}

function render(path) {
    const home = document.getElementById('view-home');
    const shop = document.getElementById('view-shop');

    if (path === '/' || path === '') {
        home.style.display = 'block';
        shop.style.display = 'none';
    } else {
        home.style.display = 'none';
        shop.style.display = 'block';
        const category = path.replace('/', '').replace('-', ' ').toUpperCase();
        loadProducts(category);
    }
}

function loadProducts(category) {
    document.getElementById('current-category').innerText = category;
    db.ref('products').on('value', (snap) => {
        const data = snap.val();
        const list = document.getElementById('product-list');
        list.innerHTML = '';
        for (let id in data) {
            if (data[id].category === category) {
                list.innerHTML += `
                    <div class="product-card">
                        <img src="${data[id].image}">
                        <h3>${data[id].name}</h3>
                        <p class="price">₹${data[id].price}</p>
                        <button class="cta-btn" style="width:100%" onclick="checkout('${data[id].price}')">BUY NOW</button>
                    </div>`;
            }
        }
    });
}

// Initial Load check
window.addEventListener('load', () => render(window.location.hash.replace('#', '')));

function checkout(amount) {
    alert("Razorpay Gateway Initializing for ₹" + amount);
}
