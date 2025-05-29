const interface = document.querySelector("#interface");
const addProd = document.querySelector("#add-prod");
const delProdButtons = document.querySelectorAll('.del-prod');
const clearProd = document.querySelector('#clear-prod');

// add products
function addNewProd() {
    
}

function delOne(event) {
    const contentArea = event.target.closest('.content-area');

    if (contentArea) {
        contentArea.remove()
    }
}

delProdButtons.forEach(button => {
    button.addEventListener('click', delOne);
})