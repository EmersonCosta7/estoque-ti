// =======================================================
// 1. PROTEÇÃO DE PÁGINA E AUTENTICAÇÃO
// =======================================================
const usuarioSalvo = localStorage.getItem('usuarioLogado');

if (!usuarioSalvo) {
    window.location.href = 'login.html';
} else {
    try {
        let usuario;
        
        // Tenta converter de JSON; se já for string pura, trata adequadamente
        try {
            usuario = JSON.parse(usuarioSalvo);
        } catch {
            usuario = { nome: usuarioSalvo };
        }

        const nomeExibicao = (typeof usuario === 'object' && usuario.nome) ? usuario.nome : usuario;

        document.addEventListener('DOMContentLoaded', () => {
            const elementoNome = document.getElementById('nomeUsuario');
            if (elementoNome) {
                elementoNome.innerText = `👤 ${nomeExibicao}`;
            }
        });
    } catch (e) {
        console.error('Erro de autenticação:', e);
        localStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login.html';
}

// ==========================================
// 2. MAPEAMENTO INTELIGENTE DE IMAGENS
// ==========================================
function getImagemPorCategoria(categoria) {
    if (!categoria) return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';
    
    const cat = categoria.toString().trim().toLowerCase();
    
    if (cat.includes('peca') || cat.includes('peça') || cat.includes('componente') || cat.includes('ram') || cat.includes('hardware')) {
        return 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80';
    }
    if (cat.includes('software') || cat.includes('licen')) {
        return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&q=80';
    }
    if (cat.includes('monitor')) {
        return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80';
    }
    if (cat.includes('notebook') || cat.includes('laptop')) {
        return 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80';
    }
    if (cat.includes('periferico') || cat.includes('periférico') || cat.includes('mouse') || cat.includes('teclado')) {
        return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80';
    }
    if (cat.includes('cabo')) {
        return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80';
    }
    if (cat.includes('rede')) {
        return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&q=80';
    }
    
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';
}

let todosEquipamentos = [];

// ==========================================
// 3. FUNÇÕES DE RECARREGAMENTO GERAL
// ==========================================
async function atualizarTudo() {
    await carregarEquipamentos();
    carregarTabelaManutencoes();
}

async function carregarEquipamentos() {
    try {
        const resposta = await fetch('/equipamentos');
        todosEquipamentos = await resposta.json();
        exibirEquipamentos(todosEquipamentos);
        preencherSelectEquipamentos(todosEquipamentos);
    } catch (erro) {
        console.error("Erro ao carregar equipamentos:", erro);
    }
}

function preencherSelectEquipamentos(equipamentos) {
    const select = document.getElementById('manutencao-equipamento');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione um Equipamento...</option>';

    equipamentos.forEach(eq => {
        const option = document.createElement('option');
        option.value = eq.id;
        option.textContent = `[ID: ${eq.id}] ${eq.nome} - ${eq.marca || 'Sem Marca'} (${eq.status})`;
        select.appendChild(option);
    });
}

function exibirEquipamentos(lista) {
    const containerEstoque = document.getElementById('container-estoque');
    const containerEmUso = document.getElementById('container-em-uso');
    const containerEmManutencao = document.getElementById('container-em-manutencao');

    if (!containerEstoque || !containerEmUso) return;

    containerEstoque.innerHTML = '';
    containerEmUso.innerHTML = '';
    if (containerEmManutencao) containerEmManutencao.innerHTML = '';

    lista.forEach(item => {
        const imgUrl = getImagemPorCategoria(item.categoria);

        // Adicionados os botões de ação (Editar e Excluir)
        const cardHTML = `
            <div class="card-item">
                <div>
                    <img src="${imgUrl}" alt="${item.nome}" style="width: 100%; height: 130px; object-fit: cover; border-radius: 8px;">
                    <div style="margin-top: 10px;">
                        <span style="font-size: 11px; background: #f0f0f0; padding: 3px 10px; border-radius: 12px; font-weight: bold;">${item.categoria}</span>
                        <h4 style="margin: 8px 0 6px 0; font-size: 15px; color: #1a202c;">${item.nome}</h4>
                        <p style="font-size: 12px; color: #4a5568; margin: 2px 0;"><strong>Marca:</strong> ${item.marca}</p>
                        <p style="font-size: 12px; color: #4a5568; margin: 2px 0;"><strong>Modelo:</strong> ${item.modelo}</p>
                        <p style="font-size: 12px; color: #718096; margin: 2px 0;">Ano: ${item.ano} | ID: #${item.id}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="btn-edit" style="flex: 1;" onclick="editarItem(${item.id}, '${item.nome}', '${item.marca}', '${item.modelo}', '${item.ano}')">✏️ Editar</button>
                    <button class="btn-delete" style="flex: 1;" onclick="excluirItem(${item.id})">🗑️ Excluir</button>
                </div>
            </div>
        `;

        const statusNormalizado = (item.status || '').toString().trim().toLowerCase();

        if (statusNormalizado.includes('manuten')) {
            if (containerEmManutencao) containerEmManutencao.innerHTML += cardHTML;
        } else if (statusNormalizado === 'em uso' || statusNormalizado === 'uso') {
            containerEmUso.innerHTML += cardHTML;
        } else {
            containerEstoque.innerHTML += cardHTML;
        }
    });
}

function preencherDataHoraAtual() {
    const agora = new Date();
    const dataHoje = agora.toISOString().split('T')[0];
    const horaHoje = agora.toTimeString().split(' ')[0].substring(0, 5);

    const inputData = document.getElementById('manutencao-data');
    const inputHora = document.getElementById('manutencao-hora');

    if (inputData) inputData.value = dataHoje;
    if (inputHora) inputHora.value = horaHoje;
}

async function carregarTabelaManutencoes() {
    try {
        const res = await fetch('/manutencoes');
        const manutencoes = await res.json();

        const tbody = document.getElementById('lista-manutencoes');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (manutencoes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #718096; padding: 15px;">
                        Nenhuma manutenção registrada até o momento.
                    </td>
                </tr>
            `;
            return;
        }

        manutencoes.forEach(m => {
            // Correção de Fuso Horário
            const dataApenas = m.data_manutencao.toString().split('T')[0];
            const [ano, mes, dia] = dataApenas.split('-');
            const dataFormatada = `${dia}/${mes}/${ano}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 10px;">${dataFormatada} ${m.hora_manutencao}</td>
                <td style="padding: 10px;"><strong>${m.equipamento_nome || 'ID ' + m.equipamento_id}</strong></td>
                <td style="padding: 10px;">${m.descricao}</td>
                <td style="padding: 10px;">${m.tecnico}</td>
                <td style="padding: 10px;">${m.setor}</td>
                <td style="padding: 10px;">${m.funcionario}</td>
                <td style="padding: 10px; text-align: center;">
                    <button onclick="excluirManutencao(${m.id})" style="background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        🗑️ Excluir
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar tabela de manutenções:', error);
    }
}

// ==========================================
// 4. AÇÕES DE CADASTRO E EDIÇÃO
// ==========================================
window.filtrarCategoria = function(cat, elemento) {
    document.querySelectorAll('.categoria-btn').forEach(btn => btn.classList.remove('active'));
    if (elemento) {
        elemento.classList.add('active');
    }

    if (cat === 'Todos') {
        exibirEquipamentos(todosEquipamentos);
    } else {
        const filtrados = todosEquipamentos.filter(item => item.categoria === cat);
        exibirEquipamentos(filtrados);
    }
};

window.excluirItem = async function(id) {
    if (confirm("Deseja excluir este item do inventário?")) {
        await fetch(`/equipamentos/${id}`, { method: 'DELETE' });
        atualizarTudo();
    }
};

window.editarItem = async function(id, nomeAtual, marcaAtual, modeloAtual, anoAtual) {
    const novoNome = prompt("Novo nome:", nomeAtual) || nomeAtual;
    const novaMarca = prompt("Nova marca:", marcaAtual) || marcaAtual;
    const novoModelo = prompt("Novo modelo:", modeloAtual) || modeloAtual;
    const novoAno = prompt("Novo ano:", anoAtual) || anoAtual;

    await fetch(`/equipamentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: novoNome, marca: novaMarca, modelo: novoModelo, ano: novoAno })
    });
    atualizarTudo();
};

window.excluirManutencao = async function(id) {
    if (!confirm('Tem certeza de que deseja remover este registro de manutenção?')) {
        return;
    }

    try {
        const res = await fetch(`/manutencoes/${id}`, { method: 'DELETE' });

        if (res.ok) {
            alert('✅ Manutenção removida com sucesso!');
            atualizarTudo();
        } else {
            alert('❌ Erro ao excluir manutenção.');
        }
    } catch (error) {
        console.error('Erro ao excluir manutenção:', error);
    }
};

// ==========================================
// 5. INICIALIZAÇÃO DE EVENTOS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    atualizarTudo();

    // Form de cadastro de equipamentos
    const form = document.getElementById('formCadastro');
    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const payload = {
                nome: document.getElementById('nomeEquipamento').value,
                marca: document.getElementById('marcaEquipamento').value,
                modelo: document.getElementById('modeloEquipamento').value,
                ano: document.getElementById('anoEquipamento').value,
                categoria: document.getElementById('categoriaEquipamento').value,
                status: document.getElementById('statusEquipamento').value
            };

            try {
                const resposta = await fetch('/cadastrar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (resposta.ok) {
                    form.reset();
                    atualizarTudo();
                }
            } catch (erro) {
                console.error("Erro ao cadastrar:", erro);
            }
        });
    }

    // Navegação entre abas
    const btnEquipamentos = document.getElementById('btn-equipamentos');
    const btnManutencao = document.getElementById('btn-manutencao');
    const secaoEquipamentos = document.getElementById('secao-equipamentos');
    const secaoManutencao = document.getElementById('secao-manutencao');
    const formManutencao = document.getElementById('form-manutencao');

    if (btnEquipamentos && btnManutencao) {
        btnEquipamentos.addEventListener('click', () => {
            secaoEquipamentos.classList.remove('hidden');
            secaoManutencao.classList.add('hidden');
            
            btnEquipamentos.style.background = '#2b6cb0';
            btnEquipamentos.style.color = 'white';
            btnManutencao.style.background = '#edf2f7';
            btnManutencao.style.color = '#2d3748';

            atualizarTudo();
        });

        btnManutencao.addEventListener('click', () => {
            secaoEquipamentos.classList.add('hidden');
            secaoManutencao.classList.remove('hidden');
            
            btnManutencao.style.background = '#2b6cb0';
            btnManutencao.style.color = 'white';
            btnEquipamentos.style.background = '#edf2f7';
            btnEquipamentos.style.color = '#2d3748';

            preencherDataHoraAtual();
            atualizarTudo();
        });
    }

    // Form de manutenção
    if (formManutencao) {
        formManutencao.addEventListener('submit', async (e) => {
            e.preventDefault();

            const dados = {
                equipamento_id: document.getElementById('manutencao-equipamento').value,
                descricao: document.getElementById('manutencao-descricao').value,
                tecnico: document.getElementById('manutencao-tecnico').value,
                setor: document.getElementById('manutencao-setor').value,
                funcionario: document.getElementById('manutencao-funcionario').value,
                data_manutencao: document.getElementById('manutencao-data').value,
                hora_manutencao: document.getElementById('manutencao-hora').value
            };

            try {
                const res = await fetch('/manutencoes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });

                if (res.ok) {
                    alert('✅ Manutenção cadastrada com sucesso!');
                    formManutencao.reset();
                    preencherDataHoraAtual();
                    atualizarTudo();
                } else {
                    alert('❌ Erro ao salvar manutenção.');
                }
            } catch (error) {
                console.error('Erro no envio da manutenção:', error);
            }
        });
    }

    // Filtro da tabela
    const inputFiltro = document.getElementById('filtro-manutencao');
    if (inputFiltro) {
        inputFiltro.addEventListener('input', () => {
            const termo = inputFiltro.value.toLowerCase();
            const linhas = document.querySelectorAll('#lista-manutencoes tr');

            linhas.forEach(linha => {
                const textoLinha = linha.textContent.toLowerCase();
                linha.style.display = textoLinha.includes(termo) ? '' : 'none';
            });
        });
    }
});