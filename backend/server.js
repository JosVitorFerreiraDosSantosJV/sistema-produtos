require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Testar conexão com o banco
db.connect((err) => {
    if (err) {
        console.error("Erro ao conectar ao MySQL:", err);
        return;
    }

    console.log("Conectado ao MySQL!");
});

// Rota inicial
app.get("/", (req, res) => {
    res.send("API funcionando!");
});

// Listar produtos
app.get("/produtos", (req, res) => {
    const sql = "SELECT * FROM produtos";

    db.query(sql, (err, resultados) => {
        if (err) {
            console.error("Erro ao buscar produtos:", err);

            return res.status(500).json({
                erro: "Erro ao buscar produtos"
            });
        }

        res.json(resultados);
    });
});

// Cadastrar produto
app.post("/produtos", (req, res) => {
    const { nome, preco, quantidade } = req.body;

    const sql = `
        INSERT INTO produtos (nome, preco, quantidade)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [nome, preco, quantidade],
        (err, resultado) => {
            if (err) {
                console.error("Erro ao cadastrar produto:", err);

                return res.status(500).json({
                    erro: "Erro ao cadastrar produto"
                });
            }

            const produto = {
                id: resultado.insertId,
                nome: nome,
                preco: preco,
                quantidade: quantidade
            };

            res.status(201).json(produto);
        }
    );
});

// Editar produto
app.put("/produtos/:id", (req, res) => {
    const { id } = req.params;
    const { nome, preco, quantidade } = req.body;

    const sql = `
        UPDATE produtos
        SET nome = ?, preco = ?, quantidade = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [nome, preco, quantidade, id],
        (err, resultado) => {
            if (err) {
                console.error("Erro ao editar produto:", err);

                return res.status(500).json({
                    erro: "Erro ao editar produto"
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    erro: "Produto não encontrado"
                });
            }

            res.json({
                id: Number(id),
                nome,
                preco,
                quantidade
            });
        }
    );
});

// Excluir produto
app.delete("/produtos/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM produtos WHERE id = ?";

    db.query(sql, [id], (err, resultado) => {
        if (err) {
            console.error("Erro ao excluir produto:", err);

            return res.status(500).json({
                erro: "Erro ao excluir produto"
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        res.json({
            mensagem: "Produto excluído com sucesso"
        });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`);
});
