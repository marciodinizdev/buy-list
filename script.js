const interface = document.querySelector("#interface");
const confirmBtn = document.querySelector(".confirm-btn");
const addProd = document.querySelector("#add-prod");
const delProdButtons = document.querySelectorAll('.del-prod');
const clearProd = document.querySelector('#clear-prod');
const closeModalBtn = document.querySelector("#close-modal");
const confirmMsg = document.querySelector(".confirm-msg");
const errorMsg = document.querySelector(".error-msg");
const addFirstProd = document.querySelector('#add-first-prod');
const noProd = document.querySelector(".no-products");

const modal = document.querySelector(".modal");
const modalContent = document.querySelector(".modal-content");

const bubble = new Audio('./assets/bubble2.mp3');
function playBubble() {
    bubble.currentTime = 0;
    bubble.play();
}

// create a new product
function createProd(name, quantity) {
    // create item content
    const contentArea = document.createElement("section");
    contentArea.className = "content-area";

    const prodArea = document.createElement("section");
    prodArea.className = "prod-area";

    // checkbox
    const checkDiv = document.createElement("div");
    checkDiv.className = "check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "prod-checkbox";
    checkbox.addEventListener('change', () => {
        nameDiv.classList.toggle('checked', checkbox.checked);
    });

    checkDiv.appendChild(checkbox);

    // product name
    const nameDiv = document.createElement("div");
    nameDiv.className = "prod-name";
    nameDiv.textContent = name;

    // quantity
    const qtDiv = document.createElement("div");
    qtDiv.className = "prod-qt";
    qtDiv.textContent = `- ${quantity}`;

    // del btn
    const delBtn = document.createElement("button");
    delBtn.className = "del-prod";

    const delIcon = document.createElement("span");
    delIcon.className = "material-symbols-rounded";
    delIcon.textContent = "delete";

    delBtn.appendChild(delIcon);
    delBtn.addEventListener('click', delOne);

    // structure
    const leftSide = document.createElement("div");
    leftSide.className = "left-side";
    leftSide.appendChild(checkDiv);
    leftSide.appendChild(nameDiv);

    prodArea.appendChild(leftSide);
    prodArea.appendChild(qtDiv);

    contentArea.appendChild(prodArea);
    contentArea.appendChild(delBtn);

    return contentArea;
}

// Function delete one product
function delOne(event) {
    const contentArea = event.target.closest('.content-area');
    
    if (contentArea) {
        contentArea.classList.add('scale-out');
        setTimeout(() => {
            contentArea.remove();
            checkEmptyInterface();
            playBubble();
        }, 300);
    }
}

// function open form modal
function openModal() {
    modalContent.classList.add("scale-in");
    modal.classList.remove("hidden");
    setTimeout(() => {
        modalContent.classList.remove("scale-in");
    }, 300);
}

// close modal
function closeModal() {
    modalContent.classList.add('scale-out');
    setTimeout(() => {
        modal.classList.add('hidden');
        modalContent.classList.remove('scale-out');
    }, 300);
}

// funcitons for confirm/error msg animations
function confirmFadeIn() {
    // add product removes noProd btn
    noProd.classList.add('hidden');

    errorMsg.classList.add('hidden');
    confirmMsg.classList.remove("hidden");
    confirmMsg.classList.add('fade-in');
    setTimeout(() => {
        confirmMsg.classList.add("hidden");
        confirmMsg.classList.remove('fade-in');
    }, 7000);
}
// funcitons for confirm/error msg animations
function errorFadeIn() {
    confirmMsg.classList.add('hidden');
    errorMsg.classList.remove("hidden");
    errorMsg.classList.add('error-alert');
    setTimeout(() => {
        errorMsg.classList.add("hidden");
        errorMsg.classList.remove('error-alert');
    }, 7000);
}


// function add new product
function addNewProd() {
    const nameInput = document.querySelector('#prod-field');
    const qtdInput = document.querySelector('#qtd-field');

    const name = nameInput.value.trim();
    const quantity = qtdInput.value.trim();

    closeModal();
    
    if (name && quantity && parseInt(quantity) > 0) {
        setTimeout(() => {
            
            const newProduct = createProd(name, quantity);
            interface.appendChild(newProduct);
            confirmFadeIn();
            checkEmptyInterface();
            nameInput.value = '';
            qtdInput.value = '';
            newProduct.classList.add('scale-in');
            setTimeout(() => {
                bubble.play();
                newProduct.classList.remove('scale-in');
            }, 300);
        }, 300);
    } else {
        setTimeout(() => {
            errorFadeIn();
        }, 300);
    }
}

// Function to check empty interface
function checkEmptyInterface() {
    const contentAreas = document.querySelectorAll('.content-area');
    const noProducts = document.querySelector('.no-products');

    if (contentAreas.length === 0) {
        noProducts.classList.remove('hidden');
    } else {
        noProducts.classList.add('hidden');
    }
}

// btn event
addFirstProd.addEventListener("click", openModal);
addProd.addEventListener("click", openModal);

delProdButtons.forEach(button => {
    button.addEventListener('click', delOne);
});

closeModalBtn.addEventListener('click', closeModal);

confirmBtn.addEventListener('click', addNewProd);


// load interface
document.addEventListener('DOMContentLoaded', checkEmptyInterface);