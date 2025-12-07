// Carrega mesas ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarMesas();
});

async function carregarMesas() {
    try {
        const response = await fetch('/api/mesas');
        const mesas = await response.json();
        exibirMesas(mesas);
    } catch (error) {
        console.error('Erro ao carregar mesas:', error);
        document.getElementById('mesasList').innerHTML = '<p class="text-danger">Erro ao carregar mesas</p>';
    }
}

function exibirMesas(mesas) {
    const container = document.getElementById('mesasList');
    
    if (mesas.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma mesa cadastrada ainda</p>';
        return;
    }

    let html = '<table class="table table-striped table-hover"><thead class="table-dark"><tr><th>ID</th><th>Número da Mesa</th><th>Data de Cadastro</th></tr></thead><tbody>';
    
    mesas.forEach(mesa => {
        const dataCadastro = mesa.created_at ? new Date(mesa.created_at).toLocaleString('pt-BR') : '-';
        html += `
            <tr>
                <td>${mesa.id}</td>
                <td><strong>Mesa ${mesa.numero}</strong></td>
                <td><small class="text-muted">${dataCadastro}</small></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

async function criarMesa() {
    const numero = parseInt(document.getElementById('mesaNumero').value);

    if (!numero || numero <= 0) {
        alert('Digite um número de mesa válido maior que zero');
        return;
    }

    try {
        const response = await fetch('/api/mesas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero })
        });

        if (response.ok) {
            // Limpa o formulário
            document.getElementById('formMesa').reset();
            // Recarrega a lista
            carregarMesas();
            alert('Mesa cadastrada com sucesso!');
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao cadastrar mesa');
        }
    } catch (error) {
        console.error('Erro ao criar mesa:', error);
        alert('Erro ao cadastrar mesa. Verifique sua conexão.');
    }
}

