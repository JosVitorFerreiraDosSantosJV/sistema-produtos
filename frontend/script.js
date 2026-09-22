const API_URL = "http://localhost:3000";

const form = document.querySelector("form");
const listaProdutos = document.querySelector("#lista-produtos");

let produtoEditando = null;


// ==============================
// CARREGAR PRODUTOS
// ==============================

async function carregarProdutos() {

    const resposta = await fetch(`${API_URL}/produtos`);

    const produtos = await resposta.json();

    listaProdutos.innerHTML = "";

    produtos.forEach(produto => {

        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>R$ ${Number(produto.preco).toFixed(2)}</td>
            <td>${produto.quantidade}</td>

            <td>
                <button onclick="editarProduto(${produto.id}, '${produto.nome}', ${produto.preco}, ${produto.quantidade})">
                    Editar
                </button>

                <button onclick="excluirProduto(${produto.id})">
                    Excluir
                </button>
            </td>
        `;

        listaProdutos.appendChild(linha);
    });
}


// ==============================
// CADASTRAR / EDITAR
// ==============================

form.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    const nome = document.querySelector("#nome").value;
    const preco = document.querySelector("#preco").value;
    const quantidade = document.querySelector("#quantidade").value;


    // EDITAR
    if (produtoEditando !== null) {

        await fetch(`${API_URL}/produtos/${produtoEditando}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nome: nome,
                preco: Number(preco),
                quantidade: Number(quantidade)
            })
        });

        produtoEditando = null;

    }

    // CADASTRAR
    else {

        await fetch(`${API_URL}/produtos`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                nome: nome,
                preco: Number(preco),
                quantidade: Number(quantidade)
            })
        });
    }

    form.reset();

    carregarProdutos();
});


// ==============================
// EDITAR PRODUTO
// ==============================

function editarProduto(id, nome, preco, quantidade) {

    produtoEditando = id;

    document.querySelector("#nome").value = nome;
    document.querySelector("#preco").value = preco;
    document.querySelector("#quantidade").value = quantidade;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ==============================
// EXCLUIR PRODUTO
// ==============================

async function excluirProduto(id) {

    const confirmar = confirm(
        "Tem certeza que deseja excluir este produto?"
    );

    if (!confirmar) {
        return;
    }

    await fetch(`${API_URL}/produtos/${id}`, {

        method: "DELETE"
    });

    carregarProdutos();
}


// ==============================
// INICIAR
// ==============================

carregarProdutos();
