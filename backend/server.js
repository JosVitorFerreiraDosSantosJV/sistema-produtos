const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// Resolução dinâmica de porta e ambiente
const PORT = Number(process.env.PORT || process.argv[2] || 4000);
const NODE_ENV = process.env.NODE_ENV || process.argv[3] || 'production';

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuração do MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Criação e sincronização da tabela produtos
async function inicializarTabelas() {
  const sql = `
    CREATE TABLE IF NOT EXISTS produtos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      preco DECIMAL(10, 2) NOT NULL,
      quantidade INT DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(sql);

    // Adiciona quantidade caso a tabela antiga não tenha essa coluna
    await pool.query(`
      ALTER TABLE produtos
      ADD COLUMN IF NOT EXISTS quantidade INT DEFAULT 0;
    `).catch(() => {});

    console.log('✅ Banco validado: Tabela "produtos" pronta para uso!');
  } catch (err) {
    console.error(
      '❌ Falha ao verificar/criar tabela "produtos":',
      err.message
    );
  }
}

// Conexão com retentativas automáticas
async function conectarBanco(retentativas = 10, atraso = 3000) {
  for (let i = 1; i <= retentativas; i++) {
    try {
      pool = mysql.createPool(dbConfig);

      const connection = await pool.getConnection();
      connection.release();

      console.log('✅ Conectado ao MySQL com sucesso!');

      await inicializarTabelas();
      return;
    } catch (err) {
      if (pool) {
        await pool.end().catch(() => {});
        pool = null;
      }

      console.log(
        `Tentando conectar ao MySQL (${i}/${retentativas}): ${err.message}`
      );

      if (i < retentativas) {
        await new Promise(resolve => setTimeout(resolve, atraso));
      } else {
        console.error(
          '❌ Falha crítica: não foi possível conectar ao banco de dados.'
        );
      }
    }
  }
}

// Rota de status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    port: PORT,
    mode: NODE_ENV
  });
});

// Listar produtos
app.get('/api/produtos', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Conexão com o banco de dados indisponível');
    }

    const [rows] = await pool.query(
      'SELECT * FROM produtos ORDER BY id DESC'
    );

    res.json(rows);
  } catch (error) {
    console.error('Erro na listagem:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Cadastrar produto
app.post('/api/produtos', async (req, res) => {
  const { nome, preco, quantidade } = req.body;

  if (!nome || preco === undefined) {
    return res.status(400).json({
      error: 'Nome e preço são obrigatórios.'
    });
  }

  try {
    if (!pool) {
      throw new Error('Conexão com o banco de dados indisponível');
    }

    const qtd = Number(quantidade) || 0;

    const [result] = await pool.query(
      'INSERT INTO produtos (nome, preco, quantidade) VALUES (?, ?, ?)',
      [nome, preco, qtd]
    );

    res.status(201).json({
      id: result.insertId,
      nome,
      preco,
      quantidade: qtd
    });
  } catch (error) {
    console.error('Erro ao inserir produto:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, preco, quantidade } = req.body;

  try {
    if (!pool) {
      throw new Error('Conexão com o banco de dados indisponível');
    }

    const qtd = Number(quantidade) || 0;

    const [result] = await pool.query(
      'UPDATE produtos SET nome = ?, preco = ?, quantidade = ? WHERE id = ?',
      [nome, preco, qtd, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    res.json({
      id: Number(id),
      nome,
      preco,
      quantidade: qtd
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Excluir produto
app.delete('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!pool) {
      throw new Error('Conexão com o banco de dados indisponível');
    }

    const [result] = await pool.query(
      'DELETE FROM produtos WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    res.json({ message: 'Produto excluído com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Inicialização do servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log(
    `🚀 Servidor rodando na porta ${PORT} [Modo: ${NODE_ENV.toUpperCase()}]`
  );

  await conectarBanco();
});

