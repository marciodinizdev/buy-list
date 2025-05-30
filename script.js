const interface = document.querySelector("#interface");
const confirmBtn = document.querySelector(".confirm-btn");
const addProd = document.querySelector("#add-prod");
const delProdButtons = document.querySelectorAll('.del-prod');
const clearProd = document.querySelector('#clear-prod');
const closeModalBtn = document.querySelector("#close-modal");
const confirmMsg = document.querySelector(".confirm-msg");

const modal = document.querySelector(".modal");
const modalContent = document.querySelector(".modal-content");



// create a new product
function createProd() {

    // create elements
    const contentArea = document.createElement("section");
    contentArea.className = "content-area";

    const prodArea = document.createElement("section");
    prodArea.className = "prod-area";

    const checkDiv = document.createElement("div");
    checkDiv.className = "check";
    checkDiv.textContent = "check";

    const nameDiv = document.createElement("div");
    nameDiv.className = "prod-name";
    nameDiv.textContent = name;

    const qtDiv = document.createElement("div");
    qtDiv.className = "prod-qt";
    qtDiv.textContent = quantity;

    const delBtn = document.createElement("button");
    delBtn.className = "del-prod";

    const delIcon = document.createElement("span");
    delIcon.className = "material-symbols-rounded";
    delIcon.textContent = "delete";

    // structuring
    delBtn.append(delIcon);
    prodArea.append(checkDiv, nameDiv, qtDiv);
    contentArea.append(prodArea, delBtn);

}

// Function delete one product
function delOne(event) {
    const contentArea = event.target.closest('.content-area');

    if (contentArea) {
        contentArea.remove();
        checkEmptyInterface();
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

// funcitons for confirm msg animations
function msgFadeIn() {
    confirmMsg.classList.remove("hidden");
    confirmMsg.classList.add('fade-in');
    setTimeout(() => {
        confirmMsg.classList.add("hidden");
        confirmMsg.classList.remove('fade-in');
    }, 7000);
}

// function add new product
function addNewProd() {
    interface.append(createProd());
    
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
addProd.addEventListener("click", openModal);

delProdButtons.forEach(button => {
    button.addEventListener('click', delOne);
});

closeModalBtn.addEventListener('click', closeModal);
confirmBtn.addEventListener('click', () => {
    closeModal();
    msgFadeIn();
    addNewProd();
});

// load interface
document.addEventListener('DOMContentLoaded', checkEmptyInterface);