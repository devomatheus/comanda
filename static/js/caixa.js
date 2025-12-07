let comandaModalAtual = null;

// Carrega dados ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarPratos();
    carregarMesas();
    carregarMesasAbertas();
});

// ========== GERENCIAR PRATOS ==========

async function carregarPratos() {
    try {
        const response = await fetch('/api/pratos');
        const pratos = await response.json();
        exibirPratos(pratos);
    } catch (error) {
        console.error('Erro ao carregar pratos:', error);
    }
}

function exibirPratos(pratos) {
    const container = document.getElementById('pratosList');
    
    if (pratos.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum prato cadastrado</p>';
        return;
    }

    let html = '<table class="table table-striped"><thead><tr><th>ID</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>';
    pratos.forEach(prato => {
        html += `<tr><td>${prato.id}</td><td>${prato.descricao}</td><td>R$ ${prato.valor.toFixed(2)}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

async function criarPrato() {
    const descricao = document.getElementById('pratoDescricao').value;
    const valor = parseFloat(document.getElementById('pratoValor').value);

    if (!descricao || !valor || valor <= 0) {
        alert('Preencha todos os campos corretamente');
        return;
    }

    try {
        const response = await fetch('/api/pratos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao, valor })
        });

        if (response.ok) {
            document.getElementById('pratoDescricao').value = '';
            document.getElementById('pratoValor').value = '';
            carregarPratos();
            alert('Prato criado com sucesso!');
        } else {
            alert('Erro ao criar prato');
        }
    } catch (error) {
        console.error('Erro ao criar prato:', error);
        alert('Erro ao criar prato');
    }
}

// ========== GERENCIAR MESAS ==========

async function carregarMesas() {
    try {
        const response = await fetch('/api/mesas');
        const mesas = await response.json();
        exibirMesas(mesas);
    } catch (error) {
        console.error('Erro ao carregar mesas:', error);
    }
}

function exibirMesas(mesas) {
    const container = document.getElementById('mesasList');
    
    if (mesas.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma mesa cadastrada</p>';
        return;
    }

    let html = '<table class="table table-striped"><thead><tr><th>ID</th><th>Número</th></tr></thead><tbody>';
    mesas.forEach(mesa => {
        html += `<tr><td>${mesa.id}</td><td>Mesa ${mesa.numero}</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

async function criarMesa() {
    const numero = parseInt(document.getElementById('mesaNumero').value);

    if (!numero || numero <= 0) {
        alert('Digite um número de mesa válido');
        return;
    }

    try {
        const response = await fetch('/api/mesas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero })
        });

        if (response.ok) {
            document.getElementById('mesaNumero').value = '';
            carregarMesas();
            alert('Mesa criada com sucesso!');
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao criar mesa');
        }
    } catch (error) {
        console.error('Erro ao criar mesa:', error);
        alert('Erro ao criar mesa');
    }
}

// ========== MESAS ABERTAS ==========

async function carregarMesasAbertas() {
    try {
        const response = await fetch('/api/mesas/abertas');
        const mesas = await response.json();
        exibirMesasAbertas(mesas);
    } catch (error) {
        console.error('Erro ao carregar mesas abertas:', error);
    }
}

function exibirMesasAbertas(mesas) {
    const container = document.getElementById('mesasAbertasList');
    
    if (mesas.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma mesa aberta no momento</p>';
        return;
    }

    let html = '';
    mesas.forEach(mesa => {
        const total = mesa.total_valor || 0;
        html += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <h5>Mesa ${mesa.numero}</h5>
                        </div>
                        <div class="col-md-3">
                            <small class="text-muted">Pedidos: ${mesa.total_pedidos || 0}</small>
                        </div>
                        <div class="col-md-3">
                            <strong>Total: R$ ${total.toFixed(2)}</strong>
                        </div>
                        <div class="col-md-3 text-end">
                            <button class="btn btn-primary" onclick="verComanda(${mesa.comanda_id}, ${mesa.numero})">Ver Detalhes</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function verComanda(comandaId, mesaNumero) {
    comandaModalAtual = comandaId;
    document.getElementById('modalMesaNumero').textContent = mesaNumero;
    
    try {
        // Busca a mesa_id primeiro
        const response = await fetch('/api/mesas');
        const mesas = await response.json();
        const mesa = mesas.find(m => m.numero === mesaNumero);
        
        if (mesa) {
            const comandaResponse = await fetch(`/api/comandas/${mesa.id}`);
            if (comandaResponse.ok) {
                const data = await comandaResponse.json();
                exibirDetalhesComanda(data.pedidos);
                const modal = new bootstrap.Modal(document.getElementById('comandaModal'));
                modal.show();
            } else {
                alert('Erro ao carregar comanda');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar comanda:', error);
        alert('Erro ao carregar comanda');
    }
}

function exibirDetalhesComanda(pedidos) {
    const container = document.getElementById('comandaDetalhes');
    
    if (pedidos.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum pedido nesta comanda</p>';
        return;
    }

    let html = '<table class="table table-striped"><thead><tr><th>Prato</th><th>Quantidade</th><th>Observações</th><th>Valor Unit.</th><th>Total</th></tr></thead><tbody>';
    let totalGeral = 0;
    
    pedidos.forEach(pedido => {
        const total = pedido.quantidade * pedido.prato_valor;
        totalGeral += total;
        html += `
            <tr>
                <td>${pedido.prato_descricao}</td>
                <td>${pedido.quantidade}</td>
                <td>${pedido.observacoes || '-'}</td>
                <td>R$ ${pedido.prato_valor.toFixed(2)}</td>
                <td>R$ ${total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table><div class="alert alert-info"><strong>Total da Mesa: R$ ${totalGeral.toFixed(2)}</strong></div>`;
    container.innerHTML = html;
}

async function fecharComanda() {
    if (!comandaModalAtual) return;
    
    if (!confirm('Tem certeza que deseja encerrar esta comanda?')) return;

    try {
        const response = await fetch(`/api/comandas/${comandaModalAtual}/fechar`, {
            method: 'POST'
        });

        if (response.ok) {
            const data = await response.json();
            alert(`Comanda encerrada! Total: R$ ${data.total.toFixed(2)}`);
            const modal = bootstrap.Modal.getInstance(document.getElementById('comandaModal'));
            modal.hide();
            carregarMesasAbertas();
            comandaModalAtual = null;
        } else {
            alert('Erro ao encerrar comanda');
        }
    } catch (error) {
        console.error('Erro ao encerrar comanda:', error);
        alert('Erro ao encerrar comanda');
    }
}

