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

// audio files for user feedback
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

let currentUser = null;

// data persistence functions for localStorage
function deleteProductFromLocalStorage(productName) {
    // This function is kept for consistency but doesn't do anything with localStorage
}

// data persistence functions for Firestore
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
            newProduct.dataset.docId = doc.id; // stores the document ID
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

async function updateProductStateInFirestore(docId, isChecked) {
    try {
        await window.updateDoc(window.doc(window.db, `users/${currentUser.uid}/shoppingLists`, docId), {
            checked: isChecked
        });
    } catch (e) {
        console.error("error updating product state in firestore: ", e);
    }
}

// handles user login
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        try {
            await window.signInWithEmailAndPassword(window.auth, email, password);
            closeAnyModal(loginModal);
        } catch (error) {
            console.error("login error:", error.message);
            alert("login error: " + error.message);
        }
    });
}

// handles user signup
if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = signupForm.name.value;
        const email = signupForm.email.value;
        const password = signupForm.password.value;
        try {
            const userCredential = await window.createUserWithEmailAndPassword(window.auth, email, password);
            let user = userCredential.user;
            
            // Updates the user profile with the collected name
            await window.updateProfile(user, {
                displayName: name
            });

            // Forces the user data to reload to ensure displayName is available in the session.
            await user.reload(); 
            user = window.auth.currentUser; // Updates the 'user' variable with the reloaded data

            closeAnyModal(signupModal);
            
            // Adds a log to confirm that the name was set
            console.log("Profile updated successfully. DisplayName:", user.displayName);
        } catch (error) {
            console.error("signup error:", error.message);
            alert("signup error: " + error.message);
        }
    });
}

// handles user logout
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        window.signOut(window.auth)
            .then(() => {
                console.log("user successfully logged out.");
                localStorage.removeItem('welcomeModalSeen');
            })
            .catch(error => console.error("error logging out:", error.message));
    });
}

// firestore auth state observer
window.onAuthStateChanged(window.auth, user => {
    if (user) {
        // user is logged in
        currentUser = user;
        // Displays the user's name if available, otherwise uses the email.
        const userName = user.displayName || user.email;
        userGreeting.textContent = `Olá, ${userName}!`;
        document.querySelector(".user-info").classList.remove("hidden");
        userGreeting.classList.remove("display-none");
        logoutButton.classList.remove("display-none");
        if (backToLoginButton) backToLoginButton.classList.add("display-none");
        recoverProductsButton.classList.add("hidden"); 
        
        loadShoppingListFromFirestore();
    } else {
        // user is logged out (guest mode)
        currentUser = null;
        document.querySelector(".user-info").classList.remove("hidden");
        userGreeting.classList.remove("display-none");
        userGreeting.textContent = `Modo Convidado`;
        if (backToLoginButton) backToLoginButton.classList.remove("display-none");
        logoutButton.classList.add("display-none");
        recoverProductsButton.classList.add("hidden");
        
        clearInterface(false);
    }
});

// functions to open and close authentication modals
function openLoginModal() {
    welcomeModal.classList.add("hidden");
    loginModal.classList.remove("hidden");
    loginModal.querySelector(".modal-content").classList.add("scale-in");
    setTimeout(() => loginModal.querySelector(".modal-content").classList.remove("scale-in"), 300);
    localStorage.setItem('welcomeModalSeen', 'true');
    document.querySelector(".user-info").classList.remove("hidden"); 
}

function openSignupModal() {
    welcomeModal.classList.add("hidden");
    signupModal.classList.remove("hidden");
    signupModal.querySelector(".modal-content").classList.add("scale-in");
    setTimeout(() => signupModal.querySelector(".modal-content").classList.remove("scale-in"), 300);
    localStorage.setItem('welcomeModalSeen', 'true');
    document.querySelector(".user-info").classList.remove("hidden"); 
}

function closeAnyModal(modalElement) {
    modalElement.querySelector('.modal-content').classList.add('scale-out');
    setTimeout(() => {
        modalElement.classList.add('hidden');
        modalElement.querySelector('.modal-content').classList.remove('scale-out');
    }, 300);
}

// event listeners for welcome modal buttons
if (loginWelcomeButton) loginWelcomeButton.addEventListener('click', openLoginModal);
if (signupWelcomeButton) signupWelcomeButton.addEventListener('click', openSignupModal);
if (guestButton) guestButton.addEventListener('click', () => {
    welcomeModal.classList.add('hidden');
    localStorage.setItem('welcomeModalSeen', 'true');
    clearInterface(false);
    document.querySelector(".user-info").classList.remove("hidden"); 
});
if (closeLoginModalButton) closeLoginModalButton.addEventListener('click', () => closeAnyModal(loginModal));
if (closeSignupModalButton) closeSignupModalButton.addEventListener('click', () => closeAnyModal(signupModal));
if (closeModalButton) closeModalButton.addEventListener('click', () => closeAnyModal(addProductModal));
if (backToLoginButton) {
    backToLoginButton.addEventListener('click', () => {
        localStorage.removeItem('welcomeModalSeen');
        welcomeModal.classList.remove("hidden");
        document.querySelector(".user-info").classList.add("hidden"); 
    });
}


// creates a new product element
function createProductElement(name, quantity) {
    // creates item content
    const contentArea = document.createElement("section");
    contentArea.className = "content-area";

    const productArea = document.createElement("section");
    productArea.className = "prod-area";

    // checkbox
    const checkDiv = document.createElement("label"); // use label for better accessibility
    checkDiv.className = "check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "prod-checkbox";

    const customCheckbox = document.createElement("span");
    customCheckbox.className = "check-custom";

    // function to toggle checkbox state and update storage
    const toggleCheckState = () => {
        const isChecked = checkbox.checked;
        
        productArea.classList.toggle('checked', isChecked);
        nameDiv.classList.toggle('checked', isChecked);
        qtDiv.classList.toggle('checked', isChecked);
        
        // updates the state in storage
        if (currentUser) {
            const docId = contentArea.dataset.docId;
            if (docId) {
                updateProductStateInFirestore(docId, isChecked);
            }
        }
    };
    
    productArea.addEventListener('click', (e) => {
        // prevents the click on the checkbox from triggering the event twice
        if (e.target.closest('.check')) return;
        checkbox.checked = !checkbox.checked;
        toggleCheckState();
    });

    checkbox.addEventListener('change', toggleCheckState);

    checkDiv.appendChild(checkbox);
    checkDiv.appendChild(customCheckbox);

    // product name
    const nameDiv = document.createElement("div");
    nameDiv.className = "prod-name";
    nameDiv.textContent = name;

    // quantity
    const quantityDiv = document.createElement("div");
    quantityDiv.className = "prod-qt";
    quantityDiv.textContent = `${quantity}`;

    // delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "del-prod";

    const deleteIcon = document.createElement("span");
    deleteIcon.className = "material-symbols-rounded";
    delIcon.textContent = "delete";

    deleteButton.appendChild(deleteIcon);
    deleteButton.addEventListener('click', deleteOneProduct);

    // element structure
    const leftSide = document.createElement("div");
    leftSide.className = "left-side";
    leftSide.appendChild(checkDiv);
    leftSide.appendChild(nameDiv);

    productArea.appendChild(leftSide);
    productArea.appendChild(quantityDiv);

    contentArea.appendChild(productArea);
    contentArea.appendChild(deleteButton);

    return contentArea;
}

// function to delete one product
function deleteOneProduct(event) {
    const contentArea = event.target.closest('.content-area');
    if (contentArea) {
        contentArea.classList.add('scale-out');
        playBubbleSound();
        setTimeout(() => {
            // deletion logic
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

// function to open the form modal
function openModal() {
    const modalContent = addProductModal.querySelector(".modal-content");
    modalContent.classList.add("scale-in");
    addProductModal.classList.remove("hidden");
    setTimeout(() => {
        modalContent.classList.remove("scale-in");
    }, 300);
}

// functions for confirm/error message animations
function confirmFadeIn() {
    // adding a product removes the no products message
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

// function to add a new product
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

// function to check if the interface is empty
function checkIfInterfaceIsEmpty() {
    const contentAreas = document.querySelectorAll('.content-area');
    const noProductsDiv = document.querySelector('.no-products');

    if (contentAreas.length === 0) {
        noProductsDiv.classList.remove('hidden');
    } else {
        noProductsDiv.classList.add('hidden');
    }
}

// function to clear the interface
function clearInterface(clearFromStorage = true) {
    shoppingListInterface.innerHTML = "";
    if (clearFromStorage) {
        if (currentUser) {
            // add logic to delete the collection in firestore
            // this can be complex; it's better to delete item by item or use cloud functions.
            // for now, we just clear the interface.
        }
    }
    checkIfInterfaceIsEmpty();
}

// logic for the recover button (only for guest mode)
if (recoverProductsButton) {
    recoverProductsButton.addEventListener('click', () => {
        // This button now does nothing in guest mode, as there's no data to recover.
    });
}

// button events
addFirstProductButton.addEventListener("click", openModal);
addProductButton.addEventListener("click", openModal);

deleteProductButtons.forEach(button => {
    button.addEventListener('click', deleteOneProduct);
});

confirmButton.addEventListener('click', addNewProduct);

clearProductsButton.addEventListener('click', () => {
    clearInterface();
    playClearSound();
});

// load interface on DOM content loaded
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