// Vérification de la connexion
if (!localStorage.getItem('adminLoggedIn')) {
    window.location.href = 'login.html';
}

// Variables globales
let products = [];
let currentEditIndex = -1;
const CONVERSION_RATE = 655.957; // Taux de conversion fixe EUR vers FCFA
const STORAGE_KEY = 'parfums_data';
const EXCEL_FILE = '../assets/Gestion_Parfums_Zara.xlsx';

// Fonction pour afficher une notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Fonction pour vérifier si une ligne est vide
function isRowEmpty(row) {
    return !row || row.every(cell => cell === undefined || cell === null || cell === '');
}

// Fonction pour charger les données depuis le fichier Excel
async function loadExcelData() {
    try {
        console.log('Tentative de chargement du fichier Excel...');
        const response = await fetch(EXCEL_FILE);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log('Fichier Excel chargé, taille:', arrayBuffer.byteLength);
        
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        console.log('Feuilles disponibles:', workbook.SheetNames);
        
        // Utiliser spécifiquement la feuille "Sheet1"
        const worksheet = workbook.Sheets['Sheet1'];
        if (!worksheet) {
            throw new Error('Feuille "Sheet1" non trouvée dans le fichier Excel');
        }
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        console.log('Données lues:', jsonData.length, 'lignes');
        
        // Ignorer l'en-tête et filtrer les lignes vides
        products = jsonData.slice(1).filter(row => !isRowEmpty(row));
        console.log('Produits filtrés:', products.length);
        
        if (products.length === 0) {
            console.log('Aucun produit trouvé dans le fichier Excel');
            loadFromLocalStorage();
            return;
        }
        
        // Sauvegarder dans le localStorage
        saveData();
        
        updateTable();
        updateStats();
        showNotification('Données chargées depuis le fichier Excel');
    } catch (error) {
        console.error('Erreur lors du chargement du fichier Excel:', error);
        showNotification('Erreur lors du chargement du fichier Excel, utilisation des données locales', 'error');
        loadFromLocalStorage();
    }
}

// Fonction pour charger les données depuis le localStorage
function loadFromLocalStorage() {
    try {
        console.log('Tentative de chargement depuis le localStorage...');
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            products = JSON.parse(savedData);
            console.log('Données chargées depuis le localStorage:', products.length, 'produits');
            updateTable();
            updateStats();
            showNotification('Données chargées depuis la sauvegarde locale');
        } else {
            console.log('Aucune donnée trouvée dans le localStorage');
            products = [];
            updateTable();
            updateStats();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

// Fonction pour sauvegarder les données dans le localStorage
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
    }
}

// Fonction pour exporter les données en Excel
async function exportToExcel() {
    try {
        // D'abord, charger le fichier Excel existant
        const response = await fetch(EXCEL_FILE);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Récupérer la feuille "Sheet1"
        const worksheet = workbook.Sheets['Sheet1'];
        if (!worksheet) {
            throw new Error('Feuille "Sheet1" non trouvée dans le fichier Excel');
        }

        // Préparer les données à exporter
        const header = ['Nom du parfum', 'Prix en euro', 'Taux de conversion', 'Prix en CFA', 'Poid(g)', 'Frais d\'expédition(fcfa)', 'Prix final de vente', 'Quantité en stock', 'image'];
        
        // Convertir les données en format compatible avec XLSX
        const dataToExport = [header];
        products.forEach(product => {
            const row = [];
            for (let i = 0; i < 9; i++) {
                // Préserver les formules existantes si elles existent
                const cellRef = XLSX.utils.encode_cell({ r: dataToExport.length, c: i });
                const existingCell = worksheet[cellRef];
                
                if (existingCell && existingCell.f) {
                    // Si une formule existe, la préserver
                    row.push({ v: existingCell.v, f: existingCell.f });
                } else {
                    // Sinon, utiliser la valeur du produit
                    row.push(product[i] || '');
                }
            }
            dataToExport.push(row);
        });

        // Mettre à jour la feuille avec les nouvelles données
        XLSX.utils.sheet_add_aoa(worksheet, dataToExport, { origin: 'A1' });

        // Préserver toutes les autres feuilles du workbook
        const newWorkbook = XLSX.utils.book_new();
        workbook.SheetNames.forEach(sheetName => {
            if (sheetName === 'Sheet1') {
                XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
            } else {
                // Copier les autres feuilles telles quelles
                XLSX.utils.book_append_sheet(newWorkbook, workbook.Sheets[sheetName], sheetName);
            }
        });

        // Sauvegarder le fichier
        XLSX.writeFile(newWorkbook, EXCEL_FILE);
        showNotification('Fichier Excel exporté avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        showNotification('Erreur lors de l\'export', 'error');
    }
}

// Fonction pour mettre à jour le tableau
function updateTable() {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="no-products">
                    <i class="fas fa-box-open"></i>
                    <p>Aucun parfum trouvé</p>
                </td>
            </tr>
        `;
        return;
    }

    products.forEach((product, index) => {
        // Vérifier si le produit a toutes les données nécessaires
        if (!product[0] || !product[1] || !product[4]) {
            return; // Ignorer les produits incomplets
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap" data-label="Nom du parfum">${product[0]}</td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Prix en euro">${product[1]} €</td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Taux de conversion">${product[2] || CONVERSION_RATE}</td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Prix en CFA">${product[3] || (product[1] * CONVERSION_RATE).toFixed(0)} FCFA</td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Poids">${product[4]} g</td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Frais d'expédition">${product[5] || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Prix final">${product[6] || ''}</td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Stock">${product[7] || 0}</td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Image">
                <img src="${product[8] || 'placeholder.jpg'}" alt="${product[0]}" class="product-image">
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Actions">
                <button class="action-btn edit-btn mr-2" onclick="editProduct(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProduct(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Fonction pour mettre à jour les statistiques
function updateStats() {
    const totalProducts = products.length;
    const totalValueEur = products.reduce((sum, product) => sum + (parseFloat(product[1]) || 0), 0);
    const totalValueCfa = totalValueEur * CONVERSION_RATE;
    const totalStock = products.reduce((sum, product) => sum + (parseInt(product[7]) || 0), 0);

    document.getElementById('total-products').textContent = totalProducts;
    document.getElementById('total-value-eur').textContent = `${totalValueEur.toFixed(2)} €`;
    document.getElementById('total-value-cfa').textContent = `${totalValueCfa.toFixed(0)} FCFA`;
    document.getElementById('total-stock').textContent = totalStock;
}

// Fonction pour ajouter un nouveau produit
function addProduct(event) {
    event.preventDefault();
    const form = event.target;
    const priceEur = parseFloat(form.price_eur.value);
    const priceCfa = priceEur * CONVERSION_RATE;

    const newProduct = [
        form.name.value,                    // Nom du parfum
        priceEur,                          // Prix en euro
        CONVERSION_RATE,                   // Taux de conversion
        priceCfa,                          // Prix en CFA
        parseFloat(form.weight.value),     // Poids (g)
        '',                                // Frais d'expédition (vide)
        '',                                // Prix final de vente (vide)
        parseInt(form.stock.value),        // Quantité en stock
        form.image.value                   // Lien image
    ];

    if (currentEditIndex === -1) {
        products.push(newProduct);
    } else {
        products[currentEditIndex] = newProduct;
        currentEditIndex = -1;
    }

    updateTable();
    updateStats();
    saveData();
    closeModal();
    showNotification('Produit ajouté avec succès');
}

// Fonction pour éditer un produit
function editProduct(index) {
    currentEditIndex = index;
    const product = products[index];
    const form = document.getElementById('product-form');
    
    form.name.value = product[0] || '';
    form.price_eur.value = product[1] || '';
    form.weight.value = product[4] || '';
    form.stock.value = product[7] || '';
    form.image.value = product[8] || '';
    
    document.getElementById('modal-title').textContent = 'Modifier le parfum';
    openModal();
}

// Fonction pour supprimer un produit
function deleteProduct(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce parfum ?')) {
        products.splice(index, 1);
        updateTable();
        updateStats();
        saveData();
        showNotification('Produit supprimé avec succès');
    }
}

// Fonctions pour gérer le modal
function openModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('product-modal');
    modal.classList.add('hidden');
    document.getElementById('product-form').reset();
    document.getElementById('modal-title').textContent = 'Ajouter un parfum';
    currentEditIndex = -1;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadExcelData(); // Charger depuis le fichier Excel au démarrage
    
    // Gestion du formulaire
    document.getElementById('product-form').addEventListener('submit', addProduct);
    
    // Boutons du modal
    document.getElementById('add-product-btn').addEventListener('click', openModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);

    // Fermer le modal en cliquant en dehors
    document.getElementById('product-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    });

    // Fermer le modal avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !document.getElementById('product-modal').classList.contains('hidden')) {
            closeModal();
        }
    });

    // Fonction de déconnexion
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('adminLoggedIn');
        window.location.href = 'login.html';
    });
}); 