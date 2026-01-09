// Carrega histórico ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarHistorico();
});

async function carregarHistorico() {
    try {
        const response = await fetch('/api/comandas/fechadas');
        const comandas = await response.json();
        exibirHistorico(comandas);
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        document.getElementById('historicoList').innerHTML = 
            '<p class="text-danger">Erro ao carregar histórico</p>';
    }
}

function exibirHistorico(comandas) {
    const container = document.getElementById('historicoList');
    
    if (comandas.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma comanda encerrada ainda</p>';
        return;
    }

    let html = '';
    
    comandas.forEach(item => {
        const comanda = item.comanda;
        const pedidos = item.pedidos;
        const mesaNumero = item.mesa_numero;
        
        // Formata datas
        const dataAbertura = comanda.data_abertura ? 
            new Date(comanda.data_abertura).toLocaleString('pt-BR') : '-';
        const dataFechamento = comanda.data_fechamento ? 
            new Date(comanda.data_fechamento).toLocaleString('pt-BR') : '-';
        
        // Calcula total dos pedidos
        let totalPedidos = 0;
        pedidos.forEach(pedido => {
            totalPedidos += pedido.quantidade * pedido.prato_valor;
        });
        
        // Usa o total da comanda ou calcula se não tiver
        const total = comanda.total || totalPedidos;
        
        html += `
            <div class="card comanda-card">
                <div class="card-header bg-light">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h5 class="mb-0">Mesa ${mesaNumero}</h5>
                        </div>
                        <div class="col-md-6 text-end">
                            <strong class="text-success">Total: R$ ${total.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="data-info mb-3">
                        <strong>Abertura:</strong> ${dataAbertura}<br>
                        <strong>Fechamento:</strong> ${dataFechamento}
                    </div>
                    
                    ${pedidos.length > 0 ? `
                        <h6 class="mb-3">Pedidos:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Prato</th>
                                        <th>Quantidade</th>
                                        <th>Observações</th>
                                        <th>Valor Unit.</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                    ` : '<p class="text-muted">Nenhum pedido registrado</p>'}
        `;
        
        // Adiciona os pedidos
        pedidos.forEach(pedido => {
            const subtotal = pedido.quantidade * pedido.prato_valor;
            html += `
                <tr>
                    <td>${pedido.prato_descricao}</td>
                    <td>${pedido.quantidade}</td>
                    <td>${pedido.observacoes || '-'}</td>
                    <td>R$ ${pedido.prato_valor.toFixed(2)}</td>
                    <td>R$ ${subtotal.toFixed(2)}</td>
                </tr>
            `;
        });
        
        if (pedidos.length > 0) {
            html += `
                                </tbody>
                            </table>
                        </div>
            `;
        }
        
        html += `
                    <div class="total-box">
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Total de Itens:</strong> ${pedidos.reduce((sum, p) => sum + p.quantidade, 0)}
                            </div>
                            <div class="col-md-6 text-end">
                                <strong class="text-success fs-5">Total: R$ ${total.toFixed(2)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

