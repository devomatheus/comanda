// Carrega pratos ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    carregarPratos();
});

async function carregarPratos() {
    try {
        const response = await fetch('/api/pratos');
        const pratos = await response.json();
        exibirPratos(pratos);
    } catch (error) {
        console.error('Erro ao carregar pratos:', error);
        document.getElementById('pratosList').innerHTML = '<p class="text-danger">Erro ao carregar pratos</p>';
    }
}

function exibirPratos(pratos) {
    const container = document.getElementById('pratosList');
    
    if (pratos.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhum prato cadastrado ainda</p>';
        return;
    }

    let html = '<table class="table table-striped table-hover"><thead class="table-dark"><tr><th>ID</th><th>Descrição</th><th>Valor</th><th>Data de Cadastro</th></tr></thead><tbody>';
    
    pratos.forEach(prato => {
        const dataCadastro = prato.created_at ? new Date(prato.created_at).toLocaleString('pt-BR') : '-';
        html += `
            <tr>
                <td>${prato.id}</td>
                <td><strong>${prato.descricao}</strong></td>
                <td>R$ ${prato.valor.toFixed(2)}</td>
                <td><small class="text-muted">${dataCadastro}</small></td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

async function criarPrato() {
    const descricao = document.getElementById('pratoDescricao').value.trim();
    const valor = parseFloat(document.getElementById('pratoValor').value);

    if (!descricao) {
        alert('Digite a descrição do prato');
        return;
    }

    if (!valor || valor <= 0) {
        alert('Digite um valor válido maior que zero');
        return;
    }

    try {
        const response = await fetch('/api/pratos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao, valor })
        });

        if (response.ok) {
            // Limpa o formulário
            document.getElementById('formPrato').reset();
            // Recarrega a lista
            carregarPratos();
            alert('Prato cadastrado com sucesso!');
        } else {
            const error = await response.json();
            alert(error.error || 'Erro ao cadastrar prato');
        }
    } catch (error) {
        console.error('Erro ao criar prato:', error);
        alert('Erro ao cadastrar prato. Verifique sua conexão.');
    }
}

