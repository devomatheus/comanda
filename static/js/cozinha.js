let intervaloAtualizacao = null;

// Carrega pedidos ao iniciar e a cada 5 segundos
document.addEventListener('DOMContentLoaded', function() {
    carregarPedidos();
    intervaloAtualizacao = setInterval(carregarPedidos, 5000);
});

// Limpa o intervalo ao sair da página
window.addEventListener('beforeunload', function() {
    if (intervaloAtualizacao) {
        clearInterval(intervaloAtualizacao);
    }
});

async function carregarPedidos() {
    try {
        const response = await fetch('/api/cozinha/pedidos');
        const pedidos = await response.json();
        exibirPedidos(pedidos);
    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
    }
}

function exibirPedidos(pedidos) {
    const container = document.getElementById('pedidosList');
    
    if (pedidos.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum pedido no momento</p>';
        return;
    }

    let html = '';
    
    pedidos.forEach(pedido => {
        const total = pedido.quantidade * pedido.prato_valor;
        const classeFeito = pedido.feito ? 'pedido-feito' : '';
        const dataPedido = new Date(pedido.data_pedido).toLocaleString('pt-BR');
        
        html += `
            <div class="card mb-3 ${classeFeito}" id="pedido-${pedido.id}">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2">
                            <strong>Mesa ${pedido.mesa_numero}</strong>
                        </div>
                        <div class="col-md-4">
                            <h6>${pedido.prato_descricao}</h6>
                            <small class="text-muted">Qtd: ${pedido.quantidade}</small>
                            ${pedido.observacoes ? `<br><small class="text-muted">Obs: ${pedido.observacoes}</small>` : ''}
                        </div>
                        <div class="col-md-2">
                            <small class="text-muted">Pedido: ${dataPedido}</small>
                        </div>
                        <div class="col-md-2">
                            <strong>R$ ${total.toFixed(2)}</strong>
                        </div>
                        <div class="col-md-2 text-end">
                            ${!pedido.feito ? 
                                `<button class="btn btn-success btn-sm" onclick="marcarFeito(${pedido.id})">Marcar como Feito</button>` :
                                `<span class="badge bg-secondary">Feito</span>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function marcarFeito(pedidoId) {
    try {
        const response = await fetch(`/api/cozinha/pedidos/${pedidoId}/feito`, {
            method: 'PUT'
        });

        if (response.ok) {
            carregarPedidos();
        } else {
            alert('Erro ao marcar pedido como feito');
        }
    } catch (error) {
        console.error('Erro ao marcar pedido como feito:', error);
        alert('Erro ao marcar pedido como feito');
    }
}

