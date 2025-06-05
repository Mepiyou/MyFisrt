// Éléments du DOM
let mobileMenuButton, mobileMenu, cartButton, cartSidebar, closeCart, cartItems, cartCount, cartTotal, whatsappOrder, productsGrid, filterButtons;

// État du panier
let cart = [];

// Initialisation des éléments DOM
function initializeElements() {
    mobileMenuButton = document.getElementById('mobile-menu-button');
    mobileMenu = document.getElementById('mobile-menu');
    cartButton = document.getElementById('cart-button');
    cartSidebar = document.getElementById('cart-sidebar');
    closeCart = document.getElementById('close-cart');
    cartItems = document.getElementById('cart-items');
    cartCount = document.getElementById('cart-count');
    cartTotal = document.getElementById('cart-total');
    whatsappOrder = document.getElementById('whatsapp-order');
    productsGrid = document.getElementById('products-grid');
    filterButtons = document.querySelectorAll('.filter-btn');

    // Initialiser les event listeners seulement si les éléments existent
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        document.querySelectorAll('#mobile-menu a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    if (cartButton && cartSidebar) {
        cartButton.addEventListener('click', () => {
            cartSidebar.classList.remove('translate-x-full');
        });
    }

    if (closeCart && cartSidebar) {
        closeCart.addEventListener('click', () => {
            cartSidebar.classList.add('translate-x-full');
        });
    }

    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const category = btn.dataset.category;
                const products = document.querySelectorAll('#products-grid > div');
                
                products.forEach(product => {
                    if (category === 'all' || product.dataset.category === category) {
                        product.style.display = 'block';
                    } else {
                        product.style.display = 'none';
                    }
                });
            });
        });
    }

    if (whatsappOrder) {
        whatsappOrder.addEventListener('click', handleWhatsAppOrder);
    }
}

// Fonction pour charger et afficher les produits
async function loadProducts() {
    try {
        console.log('Début du chargement des produits...');
        
        const response = await fetch('../assets/Gestion_Parfums_Zara.xlsx');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} - Impossible de charger le fichier Excel`);
        }
        
        const data = await response.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        console.log('Feuilles disponibles:', workbook.SheetNames);
        
        // Essayer de trouver la bonne feuille
        let worksheet;
        const possibleSheetNames = ['Catalogue Zara', 'Gestion-parfum-zara', 'Stock Perso'];
        
        for (const sheetName of possibleSheetNames) {
            if (workbook.Sheets[sheetName]) {
                worksheet = workbook.Sheets[sheetName];
                console.log('Feuille trouvée:', sheetName);
                break;
            }
        }
        
        if (!worksheet) {
            const firstSheetName = workbook.SheetNames[0];
            console.log('Utilisation de la première feuille:', firstSheetName);
            worksheet = workbook.Sheets[firstSheetName];
        }
        
        const products = XLSX.utils.sheet_to_json(worksheet);
        console.log('Produits chargés:', products);
        
        if (products.length === 0) {
            throw new Error('Aucun produit trouvé dans le fichier Excel');
        }
        
        // Normaliser les données des produits
        const normalizedProducts = products.map((product, index) => ({
            id: product.id || `prod_${index + 1}`,
            nom: product.nom || product.Nom || product.PRODUIT || 'Produit sans nom',
            prix: parseFloat(product.prix || product.Prix || product.PRIX || 0),
            categorie: (product.categorie || product.Categorie || product.CATÉGORIE || 'non catégorisé').toLowerCase().trim(),
            image: product.image || product.Image || product.IMAGE || 'placeholder.jpg',
            disponibilite: product.disponibilite !== false
        }));
        
        // Trier les produits par prix
        normalizedProducts.sort((a, b) => (a.prix || 0) - (b.prix || 0));
        
        // Afficher les produits
        if (productsGrid) {
            productsGrid.innerHTML = '';
            normalizedProducts.forEach(product => {
                const card = createProductCard(product);
                productsGrid.appendChild(card);
            });
            
            // Ajouter des animations
            document.querySelectorAll('#products-grid > div').forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <p class="text-red-500 text-lg">Erreur lors du chargement des produits.</p>
                    <p class="text-gray-600 mt-2">Veuillez vérifier que le fichier Excel est bien présent dans le dossier.</p>
                    <p class="text-gray-600 mt-2">Erreur détaillée: ${error.message}</p>
                </div>
            `;
        }
    }
}

// Gestion de la commande WhatsApp
function handleWhatsAppOrder(e) {
    e.preventDefault();
    
    if (cart.length === 0) {
        alert('Votre panier est vide');
        return;
    }
    
    const message = `Bonjour, voici ma commande :\n\n${
        cart.map(item => `- ${item.nom} x${item.quantity} = ${formatPrice(item.prix * item.quantity)}`).join('\n')
    }\n\nTotal : ${formatPrice(cart.reduce((sum, item) => sum + (item.prix * item.quantity), 0))}`;
    
    const whatsappUrl = `https://wa.me/23790632168?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    loadProducts();
    
    // Animation au défilement
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100', 'translate-y-0');
                entry.target.classList.remove('opacity-0', 'translate-y-8');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('section').forEach(section => {
        section.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-1000');
        observer.observe(section);
    });
});

// Fonction pour formater le prix en FCFA
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// Fonction pour afficher une notification rapide
function showQuickNotification(message, button) {
    console.log('🔔 Affichage de la notification:', message);

    // Animation du bouton
    if (button) {
        button.classList.add('clicked');
        setTimeout(() => {
            button.classList.remove('clicked');
        }, 300);
    }

    // Supprimer toute notification existante
    const existingNotification = document.querySelector('.quick-notification');
    if (existingNotification) {
        console.log('🗑️ Suppression de l\'ancienne notification');
        existingNotification.remove();
    }

    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = 'quick-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle icon"></i>
        <span>${message}</span>
    `;
    
    // Ajouter la notification au body
    document.body.appendChild(notification);
    console.log('✅ Notification ajoutée au DOM');
    
    // Forcer le reflow pour s'assurer que l'animation fonctionne
    notification.offsetHeight;
    
    // Supprimer la notification après l'animation
    setTimeout(() => {
        console.log('⏱️ Suppression de la notification après 1300ms');
        notification.remove();
    }, 1300);
}

// Fonction pour ajouter au panier
function addToCart(product, buttonElement) {
    console.log('🛒 Ajout au panier:', product);
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
        console.log('📊 Quantité mise à jour:', existingItem);
        showQuickNotification(`${product.nom} ajouté (${existingItem.quantity})`, buttonElement);
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
        console.log('✨ Nouveau produit ajouté:', product);
        showQuickNotification(`${product.nom} ajouté`, buttonElement);
    }
    
    updateCart();
}

// Fonction pour mettre à jour le panier
function updateCart() {
    console.log('Mise à jour du panier:', cart);
    
    // Mettre à jour le compteur
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Mettre à jour la liste des articles
    cartItems.innerHTML = cart.map(item => `
        <div class="flex items-center space-x-4">
            <img src="${item.image || 'placeholder.jpg'}" alt="${item.nom}" 
                 class="w-20 h-20 object-cover rounded">
            <div class="flex-1">
                <h4 class="font-semibold">${item.nom}</h4>
                <p class="text-secondary">${formatPrice(item.prix)}</p>
                <div class="flex items-center space-x-2 mt-2">
                    <button class="quantity-btn w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                            data-id="${item.id}" data-action="decrease">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                            data-id="${item.id}" data-action="increase">+</button>
                </div>
            </div>
            <button class="remove-btn text-red-500 hover:text-red-700"
                    data-id="${item.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    // Mettre à jour le total
    const total = cart.reduce((sum, item) => sum + (item.prix * item.quantity), 0);
    cartTotal.textContent = formatPrice(total);
    
    // Ajouter les événements pour les boutons de quantité
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            const item = cart.find(item => item.id === id);
            
            if (action === 'increase') {
                item.quantity += 1;
            } else if (action === 'decrease') {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    cart = cart.filter(item => item.id !== id);
                }
            }
            updateCart();
        });
    });
    
    // Ajouter les événements pour les boutons de suppression
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            cart = cart.filter(item => item.id !== id);
            updateCart();
        });
    });
}

// Fonction pour afficher le panier
function showCart() {
    cartSidebar.classList.remove('translate-x-full');
}

// Fonction pour créer une carte produit
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'group relative bg-white rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 hover:-translate-y-2';
    
    // Normaliser la catégorie pour la gestion des filtres
    let category = product.categorie.toLowerCase().trim();
    // Gérer les variations possibles des catégories
    if (category.includes('coffret') || category.includes('set')) {
        category = 'coffret';
    } else if (category.includes('enfant') || category.includes('kid')) {
        category = 'enfant';
    }
    card.dataset.category = category;

    // Créer un ID unique pour le produit s'il n'en a pas
    if (!product.id) {
        product.id = `prod_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    card.innerHTML = `
        <div class="relative overflow-hidden">
            <img src="${product.image || 'placeholder.jpg'}" alt="${product.nom}" 
                 class="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105">
            ${!product.disponibilite ? 
                '<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-xl">Rupture de stock</div>' : ''}
        </div>
        <div class="p-6">
            <h3 class="text-xl font-playfair mb-2">${product.nom}</h3>
            <p class="text-2xl text-secondary font-semibold mb-4">${formatPrice(product.prix)}</p>
            <p class="text-sm mb-4 ${product.disponibilite ? 'text-green-600' : 'text-red-600'}">
                ${product.disponibilite ? 'En stock' : 'Rupture de stock'}
            </p>
            ${product.disponibilite ? `
                <button class="add-to-cart-btn w-full bg-primary text-white py-2 rounded-lg hover:bg-secondary transition-colors"
                        data-product='${JSON.stringify({
                            id: product.id,
                            nom: product.nom,
                            prix: product.prix,
                            image: product.image,
                            categorie: category
                        })}'>
                    <i class="fas fa-shopping-cart mr-2"></i>Ajouter au panier
                </button>
            ` : ''}
        </div>
    `;

    // Ajouter l'événement d'ajout au panier
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productData = JSON.parse(e.currentTarget.dataset.product);
            addToCart(productData, e.currentTarget);
        });
    }

    return card;
} 