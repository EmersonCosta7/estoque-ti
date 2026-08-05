const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));

// CONEXÃO MYSQL (Lê do Railway via process.env ou usa padrão local)
const db = mysql.createConnection({
    host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || 'cat123',
    database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'estoque',
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
});

db.connect(err => {
    if (err) {
        console.error('❌ Erro ao conectar ao MySQL:', err);
    } else {
        console.log('✅ Conectado ao MySQL com sucesso!');
    }
});

// ===================================
// ROTAS DE EQUIPAMENTOS
// ===================================

// Buscar todos os equipamentos
app.get('/equipamentos', (req, res) => {
    db.query('SELECT * FROM equipamentos ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Cadastrar novo equipamento
app.post('/cadastrar', (req, res) => {
    const { nome, marca, modelo, ano, categoria, status } = req.body;
    const sql = 'INSERT INTO equipamentos (nome, marca, modelo, ano, categoria, status) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [nome, marca || 'N/I', modelo || 'N/I', ano || '2026', categoria || 'Geral', status || 'Estoque'], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ message: 'Equipamento cadastrado com sucesso!', id: result.insertId });
    });
});

// Deletar equipamento por ID
app.delete('/equipamentos/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM equipamentos WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Equipamento deletado com sucesso!' });
    });
});

// ===================================
// ROTAS DE MANUTENÇÃO
// ===================================

// Buscar manutenções com dados do equipamento
app.get('/manutencoes', (req, res) => {
    const sql = `
        SELECT m.*, e.nome AS equipamento_nome 
        FROM manutencoes m 
        LEFT JOIN equipamentos e ON m.equipamento_id = e.id 
        ORDER BY m.id DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Cadastrar manutenção
app.post('/manutencoes', (req, res) => {
    const { equipamento_id, descricao, tecnico, setor, funcionario, data_manutencao, hora_manutencao } = req.body;
    const sql = 'INSERT INTO manutencoes (equipamento_id, descricao, tecnico, setor, funcionario, data_manutencao, hora_manutencao) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [equipamento_id, descricao, tecnico, setor, funcionario, data_manutencao, hora_manutencao], (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ message: 'Manutenção salva!' });
    });
});

// Deletar manutenção por ID
app.delete('/manutencoes/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM manutencoes WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Manutenção deletada com sucesso!' });
    });
});

// Rota principal (Serve o index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicializar Servidor (Obrigatório '0.0.0.0' para o Railway)
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});