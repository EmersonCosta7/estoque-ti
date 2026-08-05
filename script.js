document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os ícones Lucide
    if (window.lucide) {
        lucide.createIcons();
    }
    
    initTabs();
    preencherDataHoraAtual();
    atualizarTudo();

    initFormDashboard();
    initFormManutencao();
});

// FUNÇÃO PARA ABRIR / MINIMIZAR O MENU NO CELULAR
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}
window.toggleSidebar = toggleSidebar;

// NAVEGAÇÃO ENTRE ABAS
function initTabs() {
    const navButtons = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            // Se estiver no celular (tela menor que 768px), fecha a barra lateral ao clicar
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });
}

// FORMATAR DATA E HORA ATUAL NO FORMULÁRIO DE MANUTENÇÃO
function preencherDataHoraAtual() {
    const now = new Date();
    const dataInput = document.getElementById('manutencao-data');
    const horaInput = document.getElementById('manutencao-hora');
    
    if (dataInput && horaInput) {
        dataInput.value = now.toISOString().split('T')[0];
        horaInput.value = now.toTimeString().slice(0, 5);
    }
}

// ATUALIZAÇÃO GERAL DOS DADOS VIA MYSQL/API
async function atualizarTudo() {
    try {
        const resEquip = await fetch('/equipamentos');
        const equipamentos = await resEquip.json();

        const resManut = await fetch('/manutencoes');
        const manutencoes = await resManut.json();

        renderDashboard(equipamentos, manutencoes);
        renderEmUso(equipamentos);
        renderReserva(equipamentos);
        renderManutencoes(manutencoes);
        renderSelectEquipamentos(equipamentos);
    } catch (err) {
        console.error('Erro ao conectar com a API:', err);
    }
}

// RENDERIZAR PAINEL DASHBOARD E RELATÓRIOS
function renderDashboard(equipamentos, manutencoes) {
    const emUso = equipamentos.filter(e => e.status === 'Em Uso').length;
    const reserva = equipamentos.filter(e => e.status === 'Estoque').length;
    const manut = manutencoes.length;
    const total = equipamentos.length;

    document.getElementById('dash-qtd-uso').innerText = emUso;
    document.getElementById('dash-qtd-reserva').innerText = reserva;
    document.getElementById('dash-qtd-manut-interna').innerText = manut;
    document.getElementById('dash-total-geral').innerText = total;

    const resumoBanner = document.getElementById('resumo-geral-banner');
    if (resumoBanner) {
        resumoBanner.innerText = `Parque tecnológico Cepam: ${total} ativos cadastrados no sistema.`;
    }

    const resumoTexto = document.getElementById('relatorio-resumo-texto');
    if (resumoTexto) {
        resumoTexto.innerHTML = `
            <div style="font-size: 15px; line-height: 1.8;">
                <p><strong>Total de equipamentos cadastrados:</strong> ${total}</p>
                <p><strong>Em Uso:</strong> ${emUso} | <strong>Reserva Técnica:</strong> ${reserva} | <strong>Manutenções:</strong> ${manut}</p>
            </div>
        `;
    }
}

// RENDERIZAR EQUIPAMENTOS EM USO
let todosEquipamentosEmUso = [];
function renderEmUso(equipamentos) {
    todosEquipamentosEmUso = equipamentos.filter(e => e.status === 'Em Uso');
    exibirTabelaEmUso(todosEquipamentosEmUso);
}

function exibirTabelaEmUso(lista) {
    const tbody = document.getElementById('tbody-em-uso');
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748B;">Nenhum equipamento em uso encontrado.</td></tr>`;
        return;
    }

    lista.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td><strong>#${item.id}</strong></td>
                <td>${item.nome}</td>
                <td>${item.marca || '-'} / ${item.modelo || '-'}</td>
                <td>${item.categoria}</td>
                <td><span class="badge-status badge-uso">Em Uso</span></td>
                <td style="text-align: right;" class="no-print">
                    <button class="btn-danger" onclick="excluirEquipamento(${item.id})">Excluir</button>
                </td>
            </tr>
        `;
    });
}

function filtrarEmUso() {
    const termo = document.getElementById('busca-em-uso').value.toLowerCase();
    const filtrados = todosEquipamentosEmUso.filter(e => 
        e.nome.toLowerCase().includes(termo) || 
        (e.marca && e.marca.toLowerCase().includes(termo)) ||
        (e.modelo && e.modelo.toLowerCase().includes(termo))
    );
    exibirTabelaEmUso(filtrados);
}
window.filtrarEmUso = filtrarEmUso;

// RENDERIZAR RESERVA TÉCNICA
function renderReserva(equipamentos) {
    const reserva = equipamentos.filter(e => e.status === 'Estoque');
    const grid = document.getElementById('grid-reserva');
    grid.innerHTML = '';

    if (reserva.length === 0) {
        grid.innerHTML = `<p style="color:#64748B;">Nenhum item na reserva técnica no momento.</p>`;
        return;
    }

    reserva.forEach(item => {
        grid.innerHTML += `
            <div class="inventory-card">
                <div>
                    <h4 style="font-size:15px; margin-bottom:4px;">${item.nome}</h4>
                    <span style="font-size:12px; color:#64748B;">${item.marca || ''} ${item.modelo || ''} • Categoria: ${item.categoria}</span>
                    <div style="margin-top:6px;">
                        <span class="badge-status badge-estoque">Reserva Técnica</span>
                    </div>
                </div>
                <button class="btn-danger no-print" onclick="excluirEquipamento(${item.id})">Excluir</button>
            </div>
        `;
    });
}

// RENDERIZAR TABELA DE MANUTENÇÕES
function renderManutencoes(manutencoes) {
    const tbody = document.getElementById('lista-manutencoes');
    tbody.innerHTML = '';

    if (manutencoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748B;">Nenhuma manutenção registrada.</td></tr>`;
        return;
    }

    manutencoes.forEach(m => {
        const dataFmt = m.data_manutencao ? m.data_manutencao.split('T')[0] : '';
        tbody.innerHTML += `
            <tr>
                <td>${dataFmt} ${m.hora_manutencao || ''}</td>
                <td><strong>${m.equipamento_nome || 'ID #' + m.equipamento_id}</strong></td>
                <td>${m.descricao}</td>
                <td>${m.tecnico}</td>
                <td>${m.setor}</td>
                <td>${m.funcionario}</td>
                <td style="text-align: center;" class="no-print">
                    <button class="btn-danger" onclick="excluirManutencao(${m.id})">Remover</button>
                </td>
            </tr>
        `;
    });
}

// PREENCHER CAIXA DE SELEÇÃO DE EQUIPAMENTOS
function renderSelectEquipamentos(equipamentos) {
    const select = document.getElementById('manutencao-equipamento');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um Equipamento...</option>';
    equipamentos.forEach(item => {
        select.innerHTML += `<option value="${item.id}">${item.nome} (${item.status})</option>`;
    });
}

// SUBMIT: CADASTRO DE EQUIPAMENTO (COM SWEETALERT2)
function initFormDashboard() {
    const formDash = document.getElementById('formCadastroDash');
    if (!formDash) return;

    formDash.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            nome: document.getElementById('dash-nome').value,
            marca: document.getElementById('dash-marca').value,
            modelo: document.getElementById('dash-modelo').value,
            ano: new Date().getFullYear().toString(),
            categoria: document.getElementById('dash-categoria').value,
            status: document.getElementById('dash-status').value
        };

        try {
            const res = await fetch('/cadastrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                formDash.reset();
                atualizarTudo();
                
                Swal.fire({
                    title: 'Sucesso!',
                    text: 'Equipamento cadastrado com sucesso!',
                    icon: 'success',
                    confirmButtonColor: '#E31E24',
                    confirmButtonText: 'Perfeito'
                });
            } else {
                Swal.fire('Erro!', 'Não foi possível salvar o equipamento.', 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Erro!', 'Falha de comunicação com o servidor.', 'error');
        }
    });
}

// SUBMIT: REGISTRO DE MANUTENÇÃO (COM SWEETALERT2)
function initFormManutencao() {
    const formManut = document.getElementById('form-manutencao');
    if (!formManut) return;

    formManut.addEventListener('submit', async (e) => {
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
                formManut.reset();
                preencherDataHoraAtual();
                atualizarTudo();
                
                Swal.fire({
                    title: 'Manutenção Registrada!',
                    text: 'Ordem de serviço salva no banco de dados.',
                    icon: 'success',
                    confirmButtonColor: '#E31E24',
                    confirmButtonText: 'OK'
                });
            } else {
                Swal.fire('Erro!', 'Não foi possível registrar a manutenção.', 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Erro!', 'Falha ao conectar com o servidor.', 'error');
        }
    });
}

// EXCLUSÃO DE EQUIPAMENTO
window.excluirEquipamento = async function(id) {
    Swal.fire({
        title: 'Excluir Equipamento?',
        text: `Deseja realmente remover o equipamento #${id}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E31E24',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/equipamentos/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({
                        title: 'Excluído!',
                        text: 'Equipamento removido com sucesso.',
                        icon: 'success',
                        confirmButtonColor: '#E31E24'
                    });
                    atualizarTudo();
                } else {
                    Swal.fire('Erro!', 'Erro ao tentar excluir.', 'error');
                }
            } catch (err) {
                console.error(err);
                Swal.fire('Erro!', 'Falha de comunicação.', 'error');
            }
        }
    });
};

// EXCLUSÃO DE MANUTENÇÃO
window.excluirManutencao = async function(id) {
    Swal.fire({
        title: 'Remover Manutenção?',
        text: `Deseja apagar a ordem de manutenção #${id}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#E31E24',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/manutencoes/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    Swal.fire({
                        title: 'Removido!',
                        text: 'Registro excluído com sucesso.',
                        icon: 'success',
                        confirmButtonColor: '#E31E24'
                    });
                    atualizarTudo();
                } else {
                    Swal.fire('Erro!', 'Erro ao tentar remover.', 'error');
                }
            } catch (err) {
                console.error(err);
            }
        }
    });
};

// BOTÃO SAIR
window.logout = function() {
    Swal.fire({
        title: 'Sair do sistema?',
        text: 'Deseja encerrar sua sessão?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#E31E24',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Sair',
        cancelButtonText: 'Permanecer'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.reload();
        }
    });
};