const delProdButtons = document.querySelectorAll('.del-prod');
const clearProd = document.querySelector('#clear-prod');

function delOne(event) {
    const contentArea = event.target.closest('.content-area');

    if (contentArea) {
        contentArea.remove()
    }
}

delProdButtons.forEach(button => {
    button.addEventListener('click', delOne);
})