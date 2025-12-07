let comandaAtual = null;
let mesaAtual = null;

// Carrega mesas e pratos ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarMesas();
    carregarPratos();
    
    // Adiciona listener para detectar mudança na seleção de mesa
    const mesaSelect = document.getElementById('mesaSelect');
    mesaSelect.addEventListener('change', async function() {
        const mesaId = this.value;
        if (mesaId) {
            // Verifica se a mesa já tem comanda aberta
            await verificarComandaAberta(parseInt(mesaId));
        } else {
            // Esconde os cards se nenhuma mesa estiver selecionada
            document.getElementById('pedidoCard').style.display = 'none';
            document.getElementById('pedidosCard').style.display = 'none';
            comandaAtual = null;
            mesaAtual = null;
        }
    });
});

async function carregarMesas() {
    try {
        const response = await fetch('/api/mesas');
        const mesas = await response.json();
        const select = document.getElementById('mesaSelect');
        select.innerHTML = '<option value="">Selecione uma mesa</option>';
        mesas.forEach(mesa => {
            const option = document.createElement('option');
            option.value = mesa.id;
            option.textContent = `Mesa ${mesa.numero}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar mesas:', error);
        alert('Erro ao carregar mesas');
    }
}

async function carregarPratos() {
    try {
        const response = await fetch('/api/pratos');
        const pratos = await response.json();
        const select = document.getElementById('pratoSelect');
        select.innerHTML = '<option value="">Selecione um prato</option>';
        pratos.forEach(prato => {
            const option = document.createElement('option');
            option.value = prato.id;
            option.textContent = `${prato.descricao} - R$ ${prato.valor.toFixed(2)}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar pratos:', error);
        alert('Erro ao carregar pratos');
    }
}

async function verificarComandaAberta(mesaId) {
    try {
        const response = await fetch(`/api/comandas/${mesaId}`);
        if (response.ok) {
            const data = await response.json();
            comandaAtual = data.comanda.id;
            mesaAtual = mesaId;
            document.getElementById('pedidoCard').style.display = 'block';
            document.getElementById('pedidosCard').style.display = 'block';
            document.getElementById('numeroMesa').textContent = document.getElementById('mesaSelect').selectedOptions[0].text;
            exibirPedidos(data.pedidos);
        }
        // Se não tiver comanda aberta, não faz nada (deixa o usuário abrir)
    } catch (error) {
        // Ignora erros silenciosamente - a mesa simplesmente não tem comanda aberta
        console.log('Mesa não possui comanda aberta');
    }
}

async function abrirComanda() {
    const mesaId = document.getElementById('mesaSelect').value;
    if (!mesaId) {
        alert('Selecione uma mesa');
        return;
    }

    try {
        const response = await fetch('/api/comandas/abrir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesa_id: parseInt(mesaId) })
        });

        if (response.ok) {
            const data = await response.json();
            comandaAtual = data.id;
            mesaAtual = parseInt(mesaId);
            document.getElementById('pedidoCard').style.display = 'block';
            document.getElementById('pedidosCard').style.display = 'block';
            document.getElementById('numeroMesa').textContent = document.getElementById('mesaSelect').selectedOptions[0].text;
            carregarPedidos();
            alert('Comanda aberta com sucesso!');
        } else {
            const error = await response.json();
            // Se a mesa já possui comanda aberta, carrega os pedidos existentes
            if (error.error && error.error.includes('já possui comanda aberta')) {
                mesaAtual = parseInt(mesaId);
                document.getElementById('pedidoCard').style.display = 'block';
                document.getElementById('pedidosCard').style.display = 'block';
                document.getElementById('numeroMesa').textContent = document.getElementById('mesaSelect').selectedOptions[0].text;
                await carregarPedidos();
                alert('Comanda já estava aberta. Pedidos carregados!');
            } else {
                alert(error.error || 'Erro ao abrir comanda');
            }
        }
    } catch (error) {
        console.error('Erro ao abrir comanda:', error);
        alert('Erro ao abrir comanda');
    }
}

async function adicionarPedido() {
    if (!comandaAtual) {
        alert('Abra uma comanda primeiro');
        return;
    }

    const pratoId = document.getElementById('pratoSelect').value;
    const quantidade = parseInt(document.getElementById('quantidadeInput').value) || 1;
    const observacoes = document.getElementById('observacoesInput').value;

    if (!pratoId) {
        alert('Selecione um prato');
        return;
    }

    try {
        const response = await fetch('/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                comanda_id: comandaAtual,
                prato_id: parseInt(pratoId),
                quantidade: quantidade,
                observacoes: observacoes
            })
        });

        if (response.ok) {
            document.getElementById('pratoSelect').value = '';
            document.getElementById('quantidadeInput').value = '1';
            document.getElementById('observacoesInput').value = '';
            carregarPedidos();
            alert('Pedido adicionado com sucesso!');
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao adicionar pedido');
        }
    } catch (error) {
        console.error('Erro ao adicionar pedido:', error);
        alert('Erro ao adicionar pedido');
    }
}

async function carregarPedidos() {
    if (!mesaAtual) {
        // Tenta carregar a comanda da mesa selecionada
        const mesaId = document.getElementById('mesaSelect').value;
        if (mesaId) {
            mesaAtual = parseInt(mesaId);
        } else {
            return;
        }
    }

    try {
        const response = await fetch(`/api/comandas/${mesaAtual}`);
        if (response.ok) {
            const data = await response.json();
            comandaAtual = data.comanda.id;
            exibirPedidos(data.pedidos);
        } else {
            const error = await response.json();
            if (error.error && error.error.includes('Nenhuma comanda aberta')) {
                document.getElementById('pedidosList').innerHTML = '<p class="text-muted">Nenhuma comanda aberta para esta mesa</p>';
            } else {
                document.getElementById('pedidosList').innerHTML = '<p class="text-muted">Nenhum pedido encontrado</p>';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        document.getElementById('pedidosList').innerHTML = '<p class="text-danger">Erro ao carregar pedidos</p>';
    }
}

function exibirPedidos(pedidos) {
    const container = document.getElementById('pedidosList');
    
    if (pedidos.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum pedido ainda</p>';
        return;
    }

    let html = '<table class="table table-striped"><thead><tr><th>Prato</th><th>Quantidade</th><th>Observações</th><th>Valor Unit.</th><th>Total</th><th>Ações</th></tr></thead><tbody>';
    
    pedidos.forEach(pedido => {
        const total = pedido.quantidade * pedido.prato_valor;
        html += `
            <tr>
                <td>${pedido.prato_descricao}</td>
                <td>${pedido.quantidade}</td>
                <td>${pedido.observacoes || '-'}</td>
                <td>R$ ${pedido.prato_valor.toFixed(2)}</td>
                <td>R$ ${total.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="editarPedido(${pedido.id}, ${pedido.quantidade}, '${pedido.observacoes || ''}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="excluirPedido(${pedido.id})">Excluir</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

async function editarPedido(pedidoId, quantidadeAtual, observacoesAtual) {
    const novaQuantidade = prompt('Nova quantidade:', quantidadeAtual);
    if (novaQuantidade === null) return;
    
    const novasObservacoes = prompt('Novas observações:', observacoesAtual);
    if (novasObservacoes === null) return;

    try {
        const response = await fetch(`/api/pedidos/${pedidoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quantidade: parseInt(novaQuantidade),
                observacoes: novasObservacoes
            })
        });

        if (response.ok) {
            carregarPedidos();
            alert('Pedido atualizado com sucesso!');
        } else {
            alert('Erro ao atualizar pedido');
        }
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        alert('Erro ao atualizar pedido');
    }
}

async function excluirPedido(pedidoId) {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;

    try {
        const response = await fetch(`/api/pedidos/${pedidoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            carregarPedidos();
            alert('Pedido excluído com sucesso!');
        } else {
            alert('Erro ao excluir pedido');
        }
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        alert('Erro ao excluir pedido');
    }
}

