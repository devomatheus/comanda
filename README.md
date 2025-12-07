# Sistema de Comanda

Sistema de gerenciamento de comandas para restaurante desenvolvido com Flask e SQLite3.

## Funcionalidades

### Tela do Garçom
- Abrir comanda para uma mesa
- Adicionar pedidos (pratos com quantidade e observações)
- Editar pedidos existentes
- Excluir pedidos

### Tela da Cozinha
- Visualizar todos os pedidos em ordem de chegada
- Marcar pedidos como feitos
- Pedidos feitos aparecem no final da lista com visual diferenciado

### Tela do Caixa
- Criar e gerenciar pratos (descrição e valor)
- Criar e gerenciar mesas
- Visualizar todas as mesas abertas
- Ver detalhes de cada comanda (pedidos e totais)
- Encerrar comandas e visualizar o total

## Instalação

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Execute o aplicativo:
```bash
python app.py
```

3. Acesse no navegador:
- Página inicial: `http://localhost:5000`
- Tela do Garçom: `http://localhost:5000/garcom`
- Tela da Cozinha: `http://localhost:5000/cozinha`
- Tela do Caixa: `http://localhost:5000/caixa`

## Acesso na Rede Local

O servidor está configurado para aceitar conexões de qualquer IP na rede local (`0.0.0.0`). Para acessar de outro dispositivo na mesma rede:

1. Descubra o IP do servidor:
```bash
hostname -I
```

2. Acesse de outro dispositivo usando: `http://[IP_DO_SERVIDOR]:5000`

## Estrutura do Banco de Dados

- **pratos**: Armazena os pratos do cardápio
- **mesas**: Armazena as mesas do restaurante
- **comandas**: Armazena as comandas abertas/fechadas
- **pedidos**: Armazena os pedidos de cada comanda

O banco de dados SQLite3 será criado automaticamente como `comanda.db` na primeira execução.

## Tecnologias Utilizadas

- Flask (Backend)
- SQLite3 (Banco de dados)
- Bootstrap 5 (Frontend)
- JavaScript (Interatividade)
- Flask-CORS (Acesso na rede local)

