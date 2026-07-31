const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (HTML, CSS, JS, imagens)
app.use(express.static(path.join(__dirname)));

// Conexão com o Banco de Dados MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'cat123',
    database: process.env.DB_NAME || 'estoque'
});

db.connect((err) => {
    if (err) console.error('❌ Erro ao conectar no MySQL:', err);
    else console.log('✅ Conectado ao MySQL com sucesso!');
});

// ==========================================
// 🔑 ROTA DE LOGIN
// ==========================================
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    }

    const query = 'SELECT * FROM usuarios WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro no servidor.' });

        if (results.length === 0) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }

        const usuario = results[0];
        
        let senhaValida = false;
        try {
            senhaValida = await bcrypt.compare(senha, usuario.senha);
        } catch (e) {
            senhaValida = (senha === usuario.senha);
        }

        if (!senhaValida) {
            return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
        }

        res.json({
            mensagem: 'Login realizado com sucesso!',
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
        });
    });
});

// ==========================================
// 📦 ROTAS DE EQUIPAMENTOS (INVENTÁRIO)
// ==========================================

// 📤 BUSCAR TODOS OS EQUIPAMENTOS
app.get('/equipamentos', (req, res) => {
    const query = 'SELECT * FROM equipamentos ORDER BY id DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar dados.' });
        res.json(results);
    });
});

// 📥 CADASTRAR ITEM
app.post('/cadastrar', (req, res) => {
    const { nome, marca, modelo, ano, categoria, status } = req.body;
    
    if (!nome) {
        return res.status(400).json({ erro: 'O nome do equipamento é obrigatório.' });
    }

    const query = 'INSERT INTO equipamentos (nome, marca, modelo, ano, categoria, status) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(query, [
        nome, 
        marca || 'N/I', 
        modelo || 'N/I', 
        ano || 'N/I', 
        categoria || 'Geral', 
        status || 'Em Estoque'
    ], (err, result) => {
        if (err) return res.status(500).json({ erro: 'Erro ao cadastrar.' });
        res.json({ mensagem: 'Sucesso!', id: result.insertId });
    });
});

// 🗑️ EXCLUIR ITEM
app.delete('/equipamentos/:id', (req, res) => {
    const query = 'DELETE FROM equipamentos WHERE id = ?';
    db.query(query, [req.params.id], (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao excluir.' });
        res.json({ mensagem: 'Excluído!' });
    });
});

// ✏️ EDITAR ITEM
app.put('/equipamentos/:id', (req, res) => {
    const { nome, marca, modelo, ano } = req.body;
    const query = 'UPDATE equipamentos SET nome = ?, marca = ?, modelo = ?, ano = ? WHERE id = ?';
    db.query(query, [nome, marca, modelo, ano, req.params.id], (err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao editar.' });
        res.json({ mensagem: 'Atualizado!' });
    });
});

// ==========================================
// 🛠️ ROTAS DE MANUTENÇÃO
// ==========================================

// ➕ REGISTRAR NOVA MANUTENÇÃO
app.post('/manutencoes', (req, res) => {
    const { equipamento_id, descricao, tecnico, setor, funcionario, data_manutencao, hora_manutencao } = req.body;

    if (!equipamento_id) {
        return res.status(400).json({ erro: 'Selecione um equipamento válido.' });
    }

    const sqlInsert = `
        INSERT INTO manutencoes (equipamento_id, descricao, tecnico, setor, funcionario, data_manutencao, hora_manutencao) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sqlInsert, [equipamento_id, descricao, tecnico, setor, funcionario, data_manutencao, hora_manutencao], (err, result) => {
        if (err) {
            console.error("Erro ao inserir manutenção:", err);
            return res.status(500).json({ erro: 'Erro ao registrar manutenção no banco.' });
        }

        const sqlUpdate = `UPDATE equipamentos SET status = 'Em Manutenção' WHERE id = ?`;
        db.query(sqlUpdate, [equipamento_id], (errUpdate) => {
            if (errUpdate) {
                console.error('Erro ao atualizar status do equipamento:', errUpdate);
            }
            res.json({ message: 'Manutenção registrada com sucesso!' });
        });
    });
});

// 📋 LISTAR HISTÓRICO DE MANUTENÇÕES
app.get('/manutencoes', (req, res) => {
    const sql = `
        SELECT m.*, e.nome AS equipamento_nome 
        FROM manutencoes m
        LEFT JOIN equipamentos e ON m.equipamento_id = e.id
        ORDER BY m.id DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar manutenções:', err);
            return res.status(500).json({ erro: 'Erro ao buscar histórico de manutenções.' });
        }
        res.json(results);
    });
});

// 🗑️ EXCLUIR REGISTRO DE MANUTENÇÃO
app.delete('/manutencoes/:id', (req, res) => {
    const { id } = req.params;

    const sqlSelect = 'SELECT equipamento_id FROM manutencoes WHERE id = ?';
    db.query(sqlSelect, [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Registro de manutenção não encontrado.' });
        }

        const equipamento_id = results[0].equipamento_id;
        const sqlDelete = 'DELETE FROM manutencoes WHERE id = ?';

        db.query(sqlDelete, [id], (errDelete) => {
            if (errDelete) {
                return res.status(500).json({ erro: 'Erro ao excluir manutenção.' });
            }

            // Verifica se o equipamento ainda possui outras manutenções ativas
            const sqlCheckOthers = 'SELECT COUNT(*) as qtd FROM manutencoes WHERE equipamento_id = ?';
            db.query(sqlCheckOthers, [equipamento_id], (errCheck, checkRes) => {
                if (!errCheck && checkRes[0].qtd === 0) {
                    const sqlUpdate = `UPDATE equipamentos SET status = 'Em Estoque' WHERE id = ?`;
                    db.query(sqlUpdate, [equipamento_id]);
                }
                res.json({ message: 'Manutenção excluída com sucesso!' });
            });
        });
    });
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(3000, '0.0.0.0', () => {
    console.log('🚀 Servidor rodando na rede em http://192.168.13.174:3000');
});