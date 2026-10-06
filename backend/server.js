require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST || "db",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306
};

let db;

function conectarComRetry() {
    db = mysql.createConnection(dbConfig);

    db.connect((err) => {
        if (err) {
            console.error(
                "Erro ao conectar ao MySQL (tentando novamente em 3 segundos):",
                err.message
            );

            setTimeout(conectarComRetry, 3000);
            return;
        }

        console.log("Conectado ao MySQL com sucesso!");
    });

    db.on("error", (err) => {
        console.error("Erro no banco de dados:", err.message);

        if (err.code === "PROTOCOL_CONNECTION_LOST") {
            conectarComRetry();
        }
    });
}

conectarComRetry();

app.get("/", (req, res) => {
    res.json({ mensagem: "API de Produtos funcionando!" });
});

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

app.get("/produtos/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM produtos WHERE id = ?";

    db.query(sql, [id], (err, resultados) => {
        if (err) {
            console.error("Erro ao buscar produto:", err);
            return res.status(500).json({
                erro: "Erro ao buscar produto"
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                erro: "Produto não encontrado"
            });
        }

        res.json(resultados[0]);
    });
});

app.post("/produtos", (req, res) => {
    const { nome, preco, quantidade } = req.body;

    if (!nome || preco === undefined || quantidade === undefined) {
        return res.status(400).json({
            erro: "Todos os campos são obrigatórios"
        });
    }

    const sql = `
        INSERT INTO produtos (nome, preco, quantidade)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [nome, preco, quantidade],
        (err, resultado) => {
            if (err) {
                console.error("Erro ao criar produto:", err);
                return res.status(500).json({
                    erro: "Erro ao criar produto"
                });
            }

            res.status(201).json({
                id: resultado.insertId,
                nome,
                preco,
                quantidade
            });
        }
    );
});

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

app.listen(PORT, () => {
    console.log(`rodando na porta ${PORT}`);
});
