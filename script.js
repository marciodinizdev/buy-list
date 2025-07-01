const shoppingListInterface = document.querySelector("#interface");
const confirmButton = document.querySelector("#ok-modal");
const addProductButton = document.querySelector("#add-prod");
const clearProductsButton = document.querySelector('#clear-prod');
const closeModalButton = document.querySelector("#close-modal");
const confirmMessage = document.querySelector(".confirm-msg");
const errorMessage = document.querySelector(".error-msg");
const addFirstProductButton = document.querySelector('#add-first-prod');
const noProductsMessage = document.querySelector(".no-products");

const addProductModal = document.querySelector("#modal-add-prod");
const modalContent = document.querySelector(".modal-content");

const bubbleSound = new Audio('./assets/bubble2.mp3');
const clearSound = new Audio('./assets/clear.mp3');

function playBubbleSound() {
    bubbleSound.currentTime = 0;
    bubbleSound.play();
}

function playClearSound() {
    clearSound.currentTime = 0;
    clearSound.play();
}

const welcomeModal = document.querySelector("#welcome-modal");
const loginModal = document.querySelector("#login-modal");
const signupModal = document.querySelector("#signup-modal");
const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const loginWelcomeButton = document.querySelector("#login-welcome-btn");
const signupWelcomeButton = document.querySelector("#signup-welcome-btn");
const guestButton = document.querySelector("#guest-btn");
const logoutButton = document.querySelector("#logout-btn");
const userGreeting = document.querySelector("#user-greeting");
const closeLoginModalButton = document.querySelector("#close-login-modal");
const closeSignupModalButton = document.querySelector("#close-signup-modal");
const backToLoginButton = document.querySelector("#back-to-login-btn");

const confirmClearModal = document.querySelector("#confirm-clear-modal");
const confirmClearButton = document.querySelector("#confirm-clear-btn");
const cancelClearButton = document.querySelector("#cancel-clear-btn");
const closeConfirmClearModalButton = document.querySelector("#close-confirm-clear-modal");

const compactListButton = document.querySelector('#compact-list');
const body = document.body;

let isCompactMode = false;

let currentUser = null;

function getLocalStorageKey() {
    // Retorna uma chave diferente para usuários logados e o modo convidado
    return currentUser ? `shoppingList_${currentUser.uid}` : 'shoppingListGuest';
}

function saveShoppingListToLocalStorage() {
    const products = [];
    document.querySelectorAll('.content-area').forEach(productElement => {
        products.push({
            name: productElement.querySelector('.prod-name').textContent,
            quantity: productElement.querySelector('.prod-qt').textContent,
            checked: productElement.querySelector('.prod-checkbox').checked,
            docId: productElement.dataset.docId || null // Garante que o docId seja salvo
        });
    });
    localStorage.setItem(getLocalStorageKey(), JSON.stringify(products));
}

function loadShoppingListFromLocalStorage() {
    clearInterface(false);
    const storedList = localStorage.getItem(getLocalStorageKey());
    if (storedList) {
        const products = JSON.parse(storedList);
        products.forEach(product => {
            const newProduct = createProductElement(product.name, product.quantity, product.checked);
            newProduct.dataset.docId = product.docId;
            shoppingListInterface.appendChild(newProduct);
        });
    }
    checkIfInterfaceIsEmpty();
}

async function saveProductToFirestore(product) {
    try {
        const docRef = await window.addDoc(window.collection(window.db, `users/${currentUser.uid}/shoppingLists`), product);
        return docRef.id;
    } catch (e) {
        console.error("error adding product to firestore: ", e);
        // Se falhar ao adicionar ao Firestore (ex: offline), retorne null para que o docId não seja atribuído
        return null;
    }
}

async function loadShoppingListFromFirestore() {
    clearInterface(false); // Limpa a interface antes de carregar
    if (!currentUser) {
        loadShoppingListFromLocalStorage(); // Se não há usuário logado, carrega apenas do LocalStorage (modo convidado)
        return;
    }

    const localStorageKey = getLocalStorageKey();
    const storedList = localStorage.getItem(localStorageKey);
    let localProducts = storedList ? JSON.parse(storedList) : [];
    let firebaseProducts = [];

    // 1. Carrega produtos do LocalStorage para exibição imediata (cache)
    localProducts.forEach(product => {
        const newProduct = createProductElement(product.name, product.quantity, product.checked);
        newProduct.dataset.docId = product.docId;
        shoppingListInterface.appendChild(newProduct);
    });
    checkIfInterfaceIsEmpty(); // Atualiza a exibição baseado no que foi carregado do LocalStorage

    // 2. Tenta carregar do Firestore para sincronização
    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, `users/${currentUser.uid}/shoppingLists`));
        querySnapshot.forEach(doc => {
            const product = doc.data();
            product.docId = doc.id;
            firebaseProducts.push(product);
        });

        // 3. Mesclar LocalStorage com Firestore
        const mergedProductsMap = new Map();

        // Adiciona produtos do Firebase (fonte da verdade para itens com docId)
        firebaseProducts.forEach(prod => mergedProductsMap.set(prod.docId, prod));

        // Adiciona produtos locais. Se já existirem no Firebase pelo docId, o do Firebase prevalece.
        // Se um produto local não tem docId, ele é uma nova adição offline e será adicionado ao mapa.
        localProducts.forEach(prod => {
            if (prod.docId && mergedProductsMap.has(prod.docId)) {
                // Produto existe no Firebase, garante que a versão do Firebase é a que está no mapa
                // Não faz nada aqui, pois o Firebase já foi adicionado
            } else {
                // Produto local sem docId (novo offline) ou produto local com docId que não está no Firebase (cenário de desync raro)
                // Usamos uma chave única para garantir que novos produtos offline sejam mantidos até a sincronização.
                const key = prod.docId || `local_${prod.name}_${prod.quantity}_${Math.random()}`; // Adiciona random para uniqueness
                if (!mergedProductsMap.has(key)) { // Adiciona apenas se não estiver já presente pelo Firebase docId
                    mergedProductsMap.set(key, prod);
                }
            }
        });

        const finalProducts = Array.from(mergedProductsMap.values());

        // 4. Limpa a interface e adiciona os produtos mesclados e sincronizados
        clearInterface(false); // Limpa novamente para exibir a lista mesclada
        for (const product of finalProducts) {
            let docId = product.docId;
            // Se o produto veio do LocalStorage e não tem docId (foi adicionado offline por usuário logado)
            if (!docId && currentUser) {
                docId = await saveProductToFirestore(product); // Tenta enviar para o Firestore
            }
            const newProductElement = createProductElement(product.name, product.quantity, product.checked);
            if (docId) {
                newProductElement.dataset.docId = docId;
            }
            shoppingListInterface.appendChild(newProductElement);
        }

        saveShoppingListToLocalStorage(); // Salva a lista mesclada e atualizada no LocalStorage
        checkIfInterfaceIsEmpty();

    } catch (e) {
        console.error("Erro ao carregar lista do Firestore (pode estar offline):", e);
        // Se houver um erro ao carregar do Firestore (ex: offline),
        // a lista já foi carregada do LocalStorage no início da função, então nada mais precisa ser feito aqui.
    }
}

async function deleteProductFromFirestore(docId) {
    try {
        await window.deleteDoc(window.doc(window.db, `users/${currentUser.uid}/shoppingLists`, docId));
    } catch (e) {
        console.error("error removing product from firestore: ", e);
        // Em caso de falha (offline), o item será removido localmente, mas não do Firestore.
        // A sincronização de exclusões é mais complexa e exigiria um mecanismo de "fila de operações" offline.
        // Para este escopo, a remoção local é priorizada.
    }
}

async function deleteAllProductsFromFirestore() {
    if (!currentUser) return;

    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, `users/${currentUser.uid}/shoppingLists`));
        const deletePromises = [];
        querySnapshot.forEach(doc => {
            deletePromises.push(window.deleteDoc(window.doc(window.db, `users/${currentUser.uid}/shoppingLists`, doc.id)));
        });
        await Promise.all(deletePromises);
    } catch (e) {
        console.error("Error removing all products from firestore: ", e);
        // Em caso de falha (offline), a lista será limpa localmente, mas não do Firestore.
        // Similar à exclusão individual, uma fila de operações seria necessária para sincronização total.
    }
}

async function updateProductInFirestore(docId, newName, newQuantity, isChecked) {
    try {
        await window.updateDoc(window.doc(window.db, `users/${currentUser.uid}/shoppingLists`, docId), {
            name: newName,
            quantity: newQuantity,
            checked: isChecked
        });
    } catch (e) {
        console.error("Error updating product in Firestore: ", e);
        // Em caso de falha (offline), a atualização ocorrerá localmente, mas não no Firestore.
        // Para sincronizar, você precisaria marcar o item como "pendente de sincronização" e tentar novamente depois.
    }
}

async function updateProductStateInFirestore(docId, isChecked) {
    try {
        await window.updateDoc(window.doc(window.db, `users/${currentUser.uid}/shoppingLists`, docId), {
            checked: isChecked
        });
    } catch (e) {
        console.error("error updating product state in firestore: ", e);
        // Em caso de falha (offline), a atualização ocorrerá localmente, mas não no Firestore.
    }
}

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        try {
            await window.signInWithEmailAndPassword(window.auth, email, password);
            closeAnyModal(loginModal);
            localStorage.setItem('welcomeModalSeen', 'true');
            localStorage.removeItem('shoppingListGuest'); // Limpa a lista de convidado ao logar
            location.reload(); // Recarrega para garantir o carregamento correto da lista do usuário
        } catch (error) {
            console.error("login error:", error.message);
            alert("login error: " + error.message);
        }
    });
}

if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = signupForm.name.value;
        const email = signupForm.email.value;
        const password = signupForm.password.value;
        try {
            const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
            let user = userCredential.user;
            
            await window.updateProfile(user, {
                displayName: name
            });
            
            closeAnyModal(signupModal);
            localStorage.setItem('welcomeModalSeen', 'true');
            localStorage.removeItem('shoppingListGuest'); // Limpa a lista de convidado ao cadastrar
            
            location.reload();
        } catch (error) {
            console.error("signup error:", error.message);
            alert("signup error: " + error.message);
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        window.signOut(window.auth)
            .then(() => {
                localStorage.removeItem('welcomeModalSeen');
                welcomeModal.classList.remove("hidden");
                const content = welcomeModal.querySelector(".modal-content");
                void content.offsetWidth;
                content.classList.add("scale-in");
                setTimeout(() => content.classList.remove("scale-in"), 300);
                document.querySelector(".user-info").classList.add("hidden");
                // Não limpa o LocalStorage do usuário logado aqui, pois ele será sobrescrito pelo modo convidado
                clearInterface(false); // Limpa a interface, mas não o armazenamento
                location.reload(); // Recarrega para mudar para o modo convidado
            })
            .catch(error => console.error("error logging out:", error.message));
    });
}

window.onAuthStateChanged(window.auth, user => {
    if (user) {
        currentUser = user;
        const userName = user.displayName || user.email;
        userGreeting.innerHTML = `Olá, <span style="color:green; font-weight: bold;" >${userName}</span>!`;
        document.querySelector(".user-info").classList.remove("hidden");
        userGreeting.classList.remove("display-none");
        logoutButton.classList.remove("display-none");
        if (backToLoginButton) backToLoginButton.classList.add("display-none");
        loadShoppingListFromFirestore(); // Carrega lista do Firestore (que agora usa LocalStorage como cache)
    } else {
        currentUser = null;
        document.querySelector(".user-info").classList.remove("hidden");
        userGreeting.classList.remove("display-none");
        userGreeting.innerHTML = `Modo <span style="color:#523cb4; font-weight: bold;" >VISITANTE</span>`;
        if (backToLoginButton) backToLoginButton.classList.remove("display-none");
        logoutButton.classList.add("display-none");
        loadShoppingListFromLocalStorage(); // Carrega lista do LocalStorage para modo convidado
    }
});

function openLoginModal() {
    welcomeModal.classList.add("hidden");
    loginModal.classList.remove("hidden");
    const content = loginModal.querySelector(".modal-content");
    void content.offsetWidth;
    content.classList.add("scale-in");
    setTimeout(() => content.classList.remove("scale-in"), 300);
}

function openSignupModal() {
    welcomeModal.classList.add("hidden");
    signupModal.classList.remove("hidden");
    const content = signupModal.querySelector(".modal-content");
    void content.offsetWidth;
    content.classList.add("scale-in");
    setTimeout(() => content.classList.remove("scale-in"), 300);
}

function closeAnyModal(modalElement) {
    const content = modalElement.querySelector('.modal-content');
    content.classList.add('scale-out');
    setTimeout(() => {
        modalElement.classList.add('hidden');
        content.classList.remove('scale-out');
    }, 300);
}

function openConfirmClearModal() {
    const modalContentElement = confirmClearModal.querySelector(".modal-content");
    modalContentElement.classList.add("scale-in");
    confirmClearModal.classList.remove("hidden");
    setTimeout(() => {
        modalContentElement.classList.remove("scale-in");
    }, 300);
}


if (loginWelcomeButton) loginWelcomeButton.addEventListener('click', openLoginModal);
if (signupWelcomeButton) signupWelcomeButton.addEventListener('click', openSignupModal);
if (guestButton) guestButton.addEventListener('click', () => {
    const content = welcomeModal.querySelector(".modal-content");
    content.classList.add("scale-out");
    setTimeout(() => {
        welcomeModal.classList.add("hidden");
        content.classList.remove("scale-out");
        localStorage.setItem('welcomeModalSeen', 'true');
        loadShoppingListFromLocalStorage();
        document.querySelector(".user-info").classList.remove("hidden");
    }, 300);
});

if (closeLoginModalButton) {
    closeLoginModalButton.addEventListener('click', () => {
        closeAnyModal(loginModal);
        setTimeout(() => {
            welcomeModal.classList.remove('hidden');
        }, 300);
    });
}
if (closeSignupModalButton) {
    closeSignupModalButton.addEventListener('click', () => {
        closeAnyModal(signupModal);
        setTimeout(() => {
            welcomeModal.classList.remove('hidden');
        }, 300);
    });
}
if (closeModalButton) closeModalButton.addEventListener('click', () => closeAnyModal(addProductModal));
if (closeConfirmClearModalButton) closeConfirmClearModalButton.addEventListener('click', () => closeAnyModal(confirmClearModal));

if (backToLoginButton) {
    backToLoginButton.addEventListener('click', () => {
        welcomeModal.classList.remove("hidden");
        const content = welcomeModal.querySelector(".modal-content");
        void content.offsetWidth;
        content.classList.add("scale-in");
        setTimeout(() => content.classList.remove("scale-in"), 300);
    });
}

function createProductElement(name, quantity, isChecked = false) {
    const contentArea = document.createElement("section");
    contentArea.className = "content-area";

    const productArea = document.createElement("section");
    productArea.className = "prod-area";

    const leftSide = document.createElement("div");
    leftSide.className = "left-side";

    const checkDiv = document.createElement("label");
    checkDiv.className = "check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "prod-checkbox";
    checkbox.checked = isChecked;

    const customCheckbox = document.createElement("span");
    customCheckbox.className = "check-custom";

    const nameDiv = document.createElement("div");
    nameDiv.className = "prod-name";
    nameDiv.textContent = name;

    const qtDiv = document.createElement("div");
    qtDiv.className = "prod-qt";
    qtDiv.textContent = `${quantity}`;

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "prod-name-input display-none";
    nameInput.value = name;
    nameInput.maxLength = 25;

    const qtInput = document.createElement("input");
    qtInput.type = "number";
    qtInput.className = "prod-qt-input display-none";
    qtInput.value = quantity;
    qtInput.min = "1";
    qtInput.max = "99";
    qtInput.oninput = function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 2);
    };

    const editActionsDiv = document.createElement("div");
    editActionsDiv.className = "edit-actions display-none";

    const saveButton = document.createElement("button");
    saveButton.className = "save-edit-btn";
    saveButton.innerHTML = `<span class="material-symbols-rounded">save</span>`;
    saveButton.addEventListener('click', async () => {
        const newName = nameInput.value.trim();
        const newQuantity = parseInt(qtInput.value.trim());
        const isChecked = checkbox.checked;

        if (newName && newQuantity > 0) {
            if (currentUser && contentArea.dataset.docId) { // Só tenta atualizar o Firestore se tiver docId
                await updateProductInFirestore(contentArea.dataset.docId, newName, newQuantity, isChecked);
            }
            nameDiv.textContent = newName;
            qtDiv.textContent = newQuantity;
            confirmFadeIn();
            toggleProductEditState(contentArea, false);
            updateProductDisplay(contentArea, isChecked);
            saveShoppingListToLocalStorage(); // Sempre salva no LocalStorage após edição
        } else {
            errorFadeIn();
        }
    });

    const cancelButton = document.createElement("button");
    cancelButton.className = "cancel-edit-btn";
    cancelButton.innerHTML = `<span class="material-symbols-rounded">cancel</span>`;
    cancelButton.addEventListener('click', () => {
        nameInput.value = nameDiv.textContent;
        qtInput.value = qtDiv.textContent;
        toggleProductEditState(contentArea, false);
        updateProductDisplay(contentArea, checkbox.checked);
    });

    editActionsDiv.appendChild(saveButton);
    editActionsDiv.appendChild(cancelButton);

    const toggleCheckState = () => {
        const isChecked = checkbox.checked;
        updateProductDisplay(contentArea, isChecked);
        if (currentUser && contentArea.dataset.docId) { // Só tenta atualizar o Firestore se tiver docId
            const docId = contentArea.dataset.docId;
            if (docId) {
                updateProductStateInFirestore(docId, isChecked);
            }
        }
        saveShoppingListToLocalStorage(); // Sempre salva no LocalStorage após mudança de estado
    };

    productArea.addEventListener('click', (e) => {
        if (e.target.closest('.check')) return;
        checkbox.checked = !checkbox.checked;
        toggleCheckState();
    });

    checkbox.addEventListener('change', toggleCheckState);

    checkDiv.appendChild(checkbox);
    checkDiv.appendChild(customCheckbox);

    const deleteButton = document.createElement("button");
    deleteButton.className = "del-prod";
    const deleteIcon = document.createElement("span");
    deleteIcon.className = "material-symbols-rounded";
    deleteIcon.textContent = "delete";
    deleteButton.appendChild(deleteIcon);
    deleteButton.addEventListener('click', deleteOneProduct);

    leftSide.appendChild(checkDiv);
    leftSide.appendChild(nameDiv);
    leftSide.appendChild(nameInput);

    productArea.appendChild(leftSide);
    productArea.appendChild(qtDiv);
    productArea.appendChild(qtInput);
    productArea.appendChild(editActionsDiv);

    contentArea.appendChild(productArea);
    contentArea.appendChild(deleteButton);

    updateProductDisplay(contentArea, isChecked);
    return contentArea;
}

function updateProductDisplay(contentArea, isChecked) {
    const productArea = contentArea.querySelector('.prod-area');
    const nameDiv = contentArea.querySelector('.prod-name');
    const qtDiv = contentArea.querySelector('.prod-qt');
    const checkbox = contentArea.querySelector('.prod-checkbox');

    productArea.classList.toggle('checked', isChecked);
    nameDiv.classList.toggle('checked', isChecked);
    qtDiv.classList.toggle('checked', isChecked);
    checkbox.checked = isChecked;
}

function toggleProductEditState(contentArea, enableEdit) {
    const productArea = contentArea.querySelector('.prod-area');
    const nameDiv = contentArea.querySelector('.prod-name');
    const qtDiv = contentArea.querySelector('.prod-qt');
    const nameInput = contentArea.querySelector('.prod-name-input');
    const qtInput = contentArea.querySelector('.prod-qt-input');
    const editActionsDiv = contentArea.querySelector('.edit-actions');
    const deleteButton = contentArea.querySelector('.del-prod');

    if (enableEdit) {
        productArea.classList.add('edit-mode');
        contentArea.classList.add('edit-mode');
        nameDiv.classList.add('display-none');
        qtDiv.classList.add('display-none');
        nameInput.classList.remove('display-none');
        qtInput.classList.remove('display-none');
        editActionsDiv.classList.remove('display-none');
        if (deleteButton) deleteButton.classList.add('display-none');
    } else {
        productArea.classList.remove('edit-mode');
        contentArea.classList.remove('edit-mode');
        nameDiv.classList.remove('display-none');
        qtDiv.classList.remove('display-none');
        nameInput.classList.add('display-none');
        qtInput.classList.add('display-none');
        editActionsDiv.classList.add('display-none');
        if (deleteButton) deleteButton.classList.remove('display-none');
    }
}

function deleteOneProduct(event) {
    const contentArea = event.target.closest('.content-area');
    if (contentArea) {
        contentArea.classList.add('scale-out');
        playBubbleSound();
        setTimeout(async () => {
            if (currentUser && contentArea.dataset.docId) { // Só tenta deletar do Firestore se tiver docId
                const docId = contentArea.dataset.docId;
                if (docId) {
                    await deleteProductFromFirestore(docId);
                }
            }
            contentArea.remove();
            saveShoppingListToLocalStorage(); // Sempre salva no LocalStorage após exclusão
            checkIfInterfaceIsEmpty();
        }, 300);
    }
}

function openModal() {
    const modalContent = addProductModal.querySelector(".modal-content");
    modalContent.classList.add("scale-in");
    addProductModal.classList.remove("hidden");
    setTimeout(() => {
        modalContent.classList.remove("scale-in");
    }, 300);
}

function confirmFadeIn() {
    noProductsMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    confirmMessage.classList.remove("hidden");
    confirmMessage.classList.add('fade-in');
    setTimeout(() => {
        confirmMessage.classList.add("hidden");
        confirmMessage.classList.remove('fade-in');
    }, 7000);
}

function errorFadeIn() {
    confirmMessage.classList.add('hidden');
    errorMessage.classList.remove("hidden");
    errorMessage.classList.add('error-alert');
    setTimeout(() => {
        errorMessage.classList.add("hidden");
        errorMessage.classList.remove('error-alert');
    }, 7000);
}

async function addNewProduct() {
    const nameInput = document.querySelector('#prod-field');
    const quantityInput = document.querySelector('#qtd-field');

    const name = nameInput.value.trim();
    const quantity = quantityInput.value.trim();

    closeAnyModal(addProductModal);

    if (name && quantity && parseInt(quantity) > 0) {
        setTimeout(async () => {
            playBubbleSound();
            const productData = { name: name, quantity: quantity, checked: false };
            let newProductElement = null;
            let docId = null;

            if (currentUser) {
                docId = await saveProductToFirestore(productData); // Tenta salvar no Firestore
            }
            // Cria o elemento na interface, independentemente de ter um docId ou não
            newProductElement = createProductElement(name, quantity, false); 
            if (docId) {
                newProductElement.dataset.docId = docId; // Atribui o docId se a operação no Firestore foi bem-sucedida
            }
            
            shoppingListInterface.appendChild(newProductElement);
            confirmFadeIn();
            checkIfInterfaceIsEmpty();
            nameInput.value = '';
            quantityInput.value = '1';
            newProductElement.classList.add('scale-in');
            setTimeout(() => {
                newProductElement.classList.remove('scale-in');
                saveShoppingListToLocalStorage(); // Sempre salva no LocalStorage após adicionar
            }, 300);
        }, 300);
    } else {
        setTimeout(() => {
            errorFadeIn();
        }, 300);
    }
}

function checkIfInterfaceIsEmpty() {
    const contentAreas = document.querySelectorAll('.content-area');
    const noProductsDiv = document.querySelector('.no-products');

    if (contentAreas.length === 0) {
        noProductsDiv.classList.remove('hidden');
    } else {
        noProductsDiv.classList.add('hidden');
    }
}

function clearInterface(clearFromStorage = true) {
    shoppingListInterface.innerHTML = "";
    if (clearFromStorage) {
        if (currentUser) {
            deleteAllProductsFromFirestore(); // Tenta apagar todos os produtos do Firestore
        }
        localStorage.removeItem(getLocalStorageKey()); // Sempre remove do LocalStorage, independentemente de estar logado ou não
    }
    checkIfInterfaceIsEmpty();
}

function updateCompactButtonIcon() {
    const iconSpan = compactListButton.querySelector('.material-symbols-rounded');
    if (iconSpan) {
        if (isCompactMode) {
            iconSpan.textContent = 'view_list';
        } else {
            iconSpan.textContent = 'grid_view';
        }
    }
}

addFirstProductButton.addEventListener("click", openModal);
addProductButton.addEventListener("click", openModal);

confirmButton.addEventListener('click', addNewProduct);

clearProductsButton.addEventListener('click', openConfirmClearModal);

confirmClearButton.addEventListener('click', () => {
    closeAnyModal(confirmClearModal);
    setTimeout(() => {
        clearInterface(true);
        playClearSound();
    }, 300);
});

cancelClearButton.addEventListener('click', () => {
    closeAnyModal(confirmClearModal);
});

if (closeConfirmClearModalButton) {
    closeConfirmClearModalButton.addEventListener('click', () => {
        closeAnyModal(confirmClearModal);
    });
}

if (compactListButton) {
    compactListButton.addEventListener('click', () => {
        isCompactMode = !isCompactMode;
        body.classList.toggle('compact-mode', isCompactMode);
        updateCompactButtonIcon();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    checkIfInterfaceIsEmpty();
    
    const welcomeModalSeen = localStorage.getItem('welcomeModalSeen');
    if (!welcomeModalSeen) {
        welcomeModal.classList.remove("hidden");
        document.querySelector(".user-info").classList.add("hidden");
    } else {
        welcomeModal.classList.add("hidden");
        document.querySelector(".user-info").classList.remove("hidden");
    }
    updateCompactButtonIcon();
});


if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso:', registration.scope);
            })
            .catch(error => {
                console.error('Falha no registro do Service Worker:', error);
            });
    });
}