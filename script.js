const interface = document.querySelector("#interface");
const addProd = document.querySelector("#add-prod");
const delProdButtons = document.querySelectorAll('.del-prod');
const clearProd = document.querySelector('#clear-prod');
const closeModalBtn = document.querySelector("#close-modal");
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

// add new Product
function addNewProd() {
    interface.append(createProd());
}

// close modal
function closeModal() {
    modalContent.classList.add('scale-out');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// btn event
addProd.addEventListener("click", addNewProd);

function delOne(event) {
    const contentArea = event.target.closest('.content-area');

    if (contentArea) {
        contentArea.remove();
    }
}

delProdButtons.forEach(button => {
    button.addEventListener('click', delOne);
});

closeModalBtn.addEventListener('click', closeModal);