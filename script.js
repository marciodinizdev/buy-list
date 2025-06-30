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
    return currentUser ? `shoppingList_${currentUser.uid}` : 'shoppingListGuest';
}

function saveShoppingListToLocalStorage() {
    const products = [];
    document.querySelectorAll('.content-area').forEach(productElement => {
        products.push({
            name: productElement.querySelector('.prod-name').textContent,
            quantity: productElement.querySelector('.prod-qt').textContent,
            checked: productElement.querySelector('.prod-checkbox').checked,
            docId: productElement.dataset.docId || null
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
    }
}

async function loadShoppingListFromFirestore() {
    if (!currentUser) return;

    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, `users/${currentUser.uid}/shoppingLists`));
        const firebaseProducts = [];
        querySnapshot.forEach(doc => {
            const product = doc.data();
            product.docId = doc.id;
            firebaseProducts.push(product);
        });
        
        clearInterface(false);
        firebaseProducts.forEach(product => {
            const newProduct = createProductElement(product.name, product.quantity, product.checked);
            newProduct.dataset.docId = product.docId;
            shoppingListInterface.appendChild(newProduct);
        });
        saveShoppingListToLocalStorage();
        checkIfInterfaceIsEmpty();
    } catch (e) {
        console.error("error loading list from firestore (possibly offline): ", e);
    }
}

async function deleteProductFromFirestore(docId) {
    try {
        await window.deleteDoc(window.doc(window.db, `users/${currentUser.uid}/shoppingLists`, docId));
    } catch (e) {
        console.error("error removing product from firestore: ", e);
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
    }
}

async function updateProductStateInFirestore(docId, isChecked) {
    try {
        await window.updateDoc(window.doc(window.db, `users/${currentUser.uid}/shoppingLists`, docId), {
            checked: isChecked
        });
    } catch (e) {
        console.error("error updating product state in firestore: ", e);
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
            localStorage.removeItem('shoppingListGuest');
            location.reload(); 
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
            localStorage.removeItem('shoppingListGuest');
            
            location.reload();
        } catch (error) {
            console.error("signup error:", error.message);
            alert("signup error: " + error.message);
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        const userUidToClear = currentUser ? currentUser.uid : null;
        window.signOut(window.auth)
            .then(() => {
                localStorage.removeItem('welcomeModalSeen');
                welcomeModal.classList.remove("hidden");
                const content = welcomeModal.querySelector(".modal-content");
                void content.offsetWidth;
                content.classList.add("scale-in");
                setTimeout(() => content.classList.remove("scale-in"), 300);
                document.querySelector(".user-info").classList.add("hidden");
                clearInterface();
                if (userUidToClear) {
                    localStorage.removeItem(`shoppingList_${userUidToClear}`);
                } else {
                    localStorage.removeItem('shoppingListGuest');
                }
                location.reload();
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
        
        loadShoppingListFromLocalStorage(); 

        if (navigator.onLine) {
            loadShoppingListFromFirestore();
        } else {
            console.log("Offline: Using local data for logged-in user.");
        }

    } else {
        currentUser = null;
        document.querySelector(".user-info").classList.remove("hidden");
        userGreeting.classList.remove("display-none");
        userGreeting.innerHTML = `Modo <span style="color:#523cb4; font-weight: bold;" >VISITANTE</span>`;
        if (backToLoginButton) backToLoginButton.classList.remove("display-none");
        logoutButton.classList.add("display-none");
        
        loadShoppingListFromLocalStorage();
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
            if (currentUser) {
                await updateProductInFirestore(contentArea.dataset.docId, newName, newQuantity, isChecked);
            }
            nameDiv.textContent = newName;
            qtDiv.textContent = newQuantity;
            confirmFadeIn();
            toggleProductEditState(contentArea, false);
            updateProductDisplay(contentArea, isChecked);
            saveShoppingListToLocalStorage();
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
        if (currentUser) {
            const docId = contentArea.dataset.docId;
            if (docId) {
                updateProductStateInFirestore(docId, isChecked);
            }
        }
        saveShoppingListToLocalStorage();
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
            if (currentUser) {
                const docId = contentArea.dataset.docId;
                if (docId) {
                    await deleteProductFromFirestore(docId);
                }
            }
            contentArea.remove();
            saveShoppingListToLocalStorage();
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

            if (currentUser) {
                const docId = await saveProductToFirestore(productData);
                newProductElement = createProductElement(name, quantity, false); 
                if (docId) {
                    newProductElement.dataset.docId = docId;
                }
            } else {
                newProductElement = createProductElement(name, quantity, false);
            }
            
            shoppingListInterface.appendChild(newProductElement);
            confirmFadeIn();
            checkIfInterfaceIsEmpty();
            nameInput.value = '';
            quantityInput.value = '1';
            newProductElement.classList.add('scale-in');
            setTimeout(() => {
                newProductElement.classList.remove('scale-in');
                saveShoppingListToLocalStorage();
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
            deleteAllProductsFromFirestore(); 
        }
        localStorage.removeItem(getLocalStorageKey());
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