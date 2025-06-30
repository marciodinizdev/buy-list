// DOM element references
const shoppingListInterface = document.querySelector("#interface");
const confirmButton = document.querySelector("#ok-modal");
const addProductButton = document.querySelector("#add-prod");
const deleteProductButtons = document.querySelectorAll('.del-prod');
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

// references for authentication elements
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
const recoverProductsButton = document.querySelector("#recover-prod");
const closeLoginModalButton = document.querySelector("#close-login-modal");
const closeSignupModalButton = document.querySelector("#close-signup-modal");
const backToLoginButton = document.querySelector("#back-to-login-btn");

// Referências para o novo modal de confirmação de limpeza
const confirmClearModal = document.querySelector("#confirm-clear-modal");
const confirmClearButton = document.querySelector("#confirm-clear-btn");
const cancelClearButton = document.querySelector("#cancel-clear-btn");
const closeConfirmClearModalButton = document.querySelector("#close-confirm-clear-modal");


let currentUser = null;

async function saveProductToFirestore(product) {
    try {
        const docRef = await window.addDoc(window.collection(window.db, `users/${currentUser.uid}/shoppingLists`), product);
        console.log("product added to firestore with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("error adding product to firestore: ", e);
    }
}

async function loadShoppingListFromFirestore() {
    clearInterface(false);
    if (!currentUser) return;

    try {
        const querySnapshot = await window.getDocs(window.collection(window.db, `users/${currentUser.uid}/shoppingLists`));
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const newProduct = createProductElement(product.name, product.quantity);
            newProduct.dataset.docId = doc.id;
            shoppingListInterface.appendChild(newProduct);
            if (product.checked) {
                newProduct.querySelector('.prod-checkbox').checked = true;
                newProduct.querySelector('.prod-area').classList.add('checked');
                newProduct.querySelector('.prod-name').classList.add('checked');
                newProduct.querySelector('.prod-qt').classList.add('checked');
            }
        });
        checkIfInterfaceIsEmpty();
    } catch (e) {
        console.error("error loading list from firestore: ", e);
    }
}

async function deleteProductFromFirestore(docId) {
    try {
        await window.deleteDoc(window.doc(window.db, `users/${currentUser.uid}/shoppingLists`, docId));
        console.log("product removed from firestore.");
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
        console.log("All products removed from firestore.");
    } catch (e) {
        console.error("Error removing all products from firestore: ", e);
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
            
            console.log("Profile updated successfully. DisplayName:", user.displayName);

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
                clearInterface();
                console.log("user successfully logged out.");
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
        recoverProductsButton.classList.add("hidden"); 
        loadShoppingListFromFirestore();
    } else {
        currentUser = null;
        document.querySelector(".user-info").classList.remove("hidden");
        userGreeting.classList.remove("display-none");
        userGreeting.innerHTML = `Modo <span style="color:#523cb4; font-weight: bold;" >VISITANTE</span>`;
        if (backToLoginButton) backToLoginButton.classList.remove("display-none");
        logoutButton.classList.add("display-none");
        recoverProductsButton.classList.add("hidden");
        clearInterface(false);
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

// Nova função para abrir o modal de confirmação de limpeza
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
        clearInterface(false);
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
// Event listener para fechar o novo modal de confirmação de limpeza
if (closeConfirmClearModalButton) closeModalButton.addEventListener('click', () => closeAnyModal(confirmClearModal));

if (backToLoginButton) {
    backToLoginButton.addEventListener('click', () => {
        welcomeModal.classList.remove("hidden");
        const content = welcomeModal.querySelector(".modal-content");
        void content.offsetWidth;
        content.classList.add("scale-in");
        setTimeout(() => content.classList.remove("scale-in"), 300);
    });
}

function createProductElement(name, quantity) {
    const contentArea = document.createElement("section");
    contentArea.className = "content-area";

    const productArea = document.createElement("section");
    productArea.className = "prod-area";

    const checkDiv = document.createElement("label");
    checkDiv.className = "check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "prod-checkbox";

    const customCheckbox = document.createElement("span");
    customCheckbox.className = "check-custom";

    const toggleCheckState = () => {
        const isChecked = checkbox.checked;
        productArea.classList.toggle('checked', isChecked);
        nameDiv.classList.toggle('checked', isChecked);
        qtDiv.classList.toggle('checked', isChecked);
        if (currentUser) {
            const docId = contentArea.dataset.docId;
            if (docId) {
                updateProductStateInFirestore(docId, isChecked);
            }
        }
    };

    productArea.addEventListener('click', (e) => {
        if (e.target.closest('.check')) return;
        checkbox.checked = !checkbox.checked;
        toggleCheckState();
    });

    checkbox.addEventListener('change', toggleCheckState);

    checkDiv.appendChild(checkbox);
    checkDiv.appendChild(customCheckbox);

    const nameDiv = document.createElement("div");
    nameDiv.className = "prod-name";
    nameDiv.textContent = name;

    const qtDiv = document.createElement("div");
    qtDiv.className = "prod-qt";
    qtDiv.textContent = `${quantity}`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "del-prod";

    const deleteIcon = document.createElement("span");
    deleteIcon.className = "material-symbols-rounded";
    deleteIcon.textContent = "delete";

    deleteButton.appendChild(deleteIcon);
    deleteButton.addEventListener('click', deleteOneProduct);

    const leftSide = document.createElement("div");
    leftSide.className = "left-side";
    leftSide.appendChild(checkDiv);
    leftSide.appendChild(nameDiv);

    productArea.appendChild(leftSide);
    productArea.appendChild(qtDiv);

    contentArea.appendChild(productArea);
    contentArea.appendChild(deleteButton);

    return contentArea;
}

function deleteOneProduct(event) {
    const contentArea = event.target.closest('.content-area');
    if (contentArea) {
        contentArea.classList.add('scale-out');
        playBubbleSound();
        setTimeout(() => {
            if (currentUser) {
                const docId = contentArea.dataset.docId;
                if (docId) {
                    deleteProductFromFirestore(docId);
                }
            }
            contentArea.remove();
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
            let docId = null;

            if (currentUser) {
                docId = await saveProductToFirestore(productData);
            }
            const newProductElement = createProductElement(name, quantity);
            if (docId) {
                newProductElement.dataset.docId = docId;
            }
            shoppingListInterface.appendChild(newProductElement);
            confirmFadeIn();
            checkIfInterfaceIsEmpty();
            nameInput.value = '';
            quantityInput.value = '1';
            newProductElement.classList.add('scale-in');
            setTimeout(() => {
                newProductElement.classList.remove('scale-in');
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

// A função clearInterface agora recebe um parâmetro para apagar ou não do storage/Firestore
function clearInterface(clearFromStorage = true) {
    shoppingListInterface.innerHTML = "";
    if (clearFromStorage) {
        if (currentUser) {
            deleteAllProductsFromFirestore(); // Chamada para a nova função de apagar tudo do Firestore
        }
    }
    checkIfInterfaceIsEmpty();
}

if (recoverProductsButton) {
    recoverProductsButton.addEventListener('click', () => {});
}

addFirstProductButton.addEventListener("click", openModal);
addProductButton.addEventListener("click", openModal);

deleteProductButtons.forEach(button => {
    button.addEventListener('click', deleteOneProduct);
});

confirmButton.addEventListener('click', addNewProduct);

// Modifica o evento do clearProductsButton para abrir o modal de confirmação
clearProductsButton.addEventListener('click', openConfirmClearModal);

// Adiciona event listeners para os botões do novo modal de confirmação
confirmClearButton.addEventListener('click', () => {
    closeAnyModal(confirmClearModal); // Fecha o modal de confirmação
    setTimeout(() => { // Pequeno delay para a animação do modal
        clearInterface(true); // Limpa a interface e o Firestore
        playClearSound();
    }, 300);
});

cancelClearButton.addEventListener('click', () => {
    closeAnyModal(confirmClearModal); // Apenas fecha o modal
});

// Listener para o botão de fechar do modal de confirmação
if (closeConfirmClearModalButton) {
    closeConfirmClearModalButton.addEventListener('click', () => {
        closeAnyModal(confirmClearModal);
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
});