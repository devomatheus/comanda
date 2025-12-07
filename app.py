from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import database
import sqlite3
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Habilita CORS para acesso na rede local

# Inicializa o banco de dados
database.init_db()

# ========== ROTAS DE API ==========

@app.route('/api/pratos', methods=['GET'])
def listar_pratos():
    """Lista todos os pratos"""
    conn = database.get_db()
    pratos = conn.execute('SELECT * FROM pratos ORDER BY id').fetchall()
    conn.close()
    return jsonify([dict(prato) for prato in pratos])

@app.route('/api/pratos', methods=['POST'])
def criar_prato():
    """Cria um novo prato"""
    data = request.json
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO pratos (descricao, valor) VALUES (?, ?)',
        (data['descricao'], data['valor'])
    )
    conn.commit()
    prato_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': prato_id, 'message': 'Prato criado com sucesso'}), 201

@app.route('/api/mesas', methods=['GET'])
def listar_mesas():
    """Lista todas as mesas"""
    conn = database.get_db()
    mesas = conn.execute('SELECT * FROM mesas ORDER BY numero').fetchall()
    conn.close()
    return jsonify([dict(mesa) for mesa in mesas])

@app.route('/api/mesas', methods=['POST'])
def criar_mesa():
    """Cria uma nova mesa"""
    data = request.json
    conn = database.get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO mesas (numero) VALUES (?)',
            (data['numero'],)
        )
        conn.commit()
        mesa_id = cursor.lastrowid
        conn.close()
        return jsonify({'id': mesa_id, 'message': 'Mesa criada com sucesso'}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Número de mesa já existe'}), 400

@app.route('/api/comandas/abrir', methods=['POST'])
def abrir_comanda():
    """Abre uma comanda para uma mesa"""
    data = request.json
    mesa_id = data['mesa_id']
    
    conn = database.get_db()
    # Verifica se já existe comanda aberta para esta mesa
    comanda_aberta = conn.execute(
        'SELECT * FROM comandas WHERE mesa_id = ? AND aberta = 1'
    , (mesa_id,)).fetchone()
    
    if comanda_aberta:
        conn.close()
        return jsonify({'error': 'Mesa já possui comanda aberta'}), 400
    
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO comandas (mesa_id, aberta) VALUES (?, 1)',
        (mesa_id,)
    )
    conn.commit()
    comanda_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': comanda_id, 'message': 'Comanda aberta com sucesso'}), 201

@app.route('/api/comandas/<int:mesa_id>', methods=['GET'])
def obter_comanda_mesa(mesa_id):
    """Obtém a comanda de uma mesa"""
    conn = database.get_db()
    comanda = conn.execute(
        'SELECT * FROM comandas WHERE mesa_id = ? AND aberta = 1'
    , (mesa_id,)).fetchone()
    
    if not comanda:
        conn.close()
        return jsonify({'error': 'Nenhuma comanda aberta para esta mesa'}), 404
    
    pedidos = conn.execute('''
        SELECT p.*, pr.descricao as prato_descricao, pr.valor as prato_valor
        FROM pedidos p
        JOIN pratos pr ON p.prato_id = pr.id
        WHERE p.comanda_id = ?
        ORDER BY p.data_pedido
    ''', (comanda['id'],)).fetchall()
    
    conn.close()
    return jsonify({
        'comanda': dict(comanda),
        'pedidos': [dict(pedido) for pedido in pedidos]
    })

@app.route('/api/pedidos', methods=['POST'])
def criar_pedido():
    """Cria um novo pedido"""
    data = request.json
    conn = database.get_db()
    
    # Verifica se a comanda está aberta
    comanda = conn.execute(
        'SELECT * FROM comandas WHERE id = ? AND aberta = 1'
    , (data['comanda_id'],)).fetchone()
    
    if not comanda:
        conn.close()
        return jsonify({'error': 'Comanda não encontrada ou fechada'}), 404
    
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO pedidos (comanda_id, prato_id, quantidade, observacoes) VALUES (?, ?, ?, ?)',
        (data['comanda_id'], data['prato_id'], data.get('quantidade', 1), data.get('observacoes', ''))
    )
    conn.commit()
    pedido_id = cursor.lastrowid
    conn.close()
    return jsonify({'id': pedido_id, 'message': 'Pedido criado com sucesso'}), 201

@app.route('/api/pedidos/<int:pedido_id>', methods=['PUT'])
def atualizar_pedido(pedido_id):
    """Atualiza um pedido"""
    data = request.json
    conn = database.get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE pedidos 
        SET quantidade = ?, observacoes = ?
        WHERE id = ?
    ''', (data.get('quantidade', 1), data.get('observacoes', ''), pedido_id))
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Pedido atualizado com sucesso'})

@app.route('/api/pedidos/<int:pedido_id>', methods=['DELETE'])
def excluir_pedido(pedido_id):
    """Exclui um pedido"""
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM pedidos WHERE id = ?', (pedido_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Pedido excluído com sucesso'})

@app.route('/api/cozinha/pedidos', methods=['GET'])
def listar_pedidos_cozinha():
    """Lista todos os pedidos para a cozinha em ordem de chegada"""
    conn = database.get_db()
    pedidos = conn.execute('''
        SELECT p.*, pr.descricao as prato_descricao, pr.valor as prato_valor,
               c.mesa_id, m.numero as mesa_numero
        FROM pedidos p
        JOIN pratos pr ON p.prato_id = pr.id
        JOIN comandas c ON p.comanda_id = c.id
        JOIN mesas m ON c.mesa_id = m.id
        WHERE c.aberta = 1
        ORDER BY p.feito ASC, p.data_pedido ASC
    ''').fetchall()
    
    conn.close()
    return jsonify([dict(pedido) for pedido in pedidos])

@app.route('/api/cozinha/pedidos/<int:pedido_id>/feito', methods=['PUT'])
def marcar_pedido_feito(pedido_id):
    """Marca um pedido como feito"""
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE pedidos SET feito = 1 WHERE id = ?', (pedido_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Pedido marcado como feito'})

@app.route('/api/mesas/abertas', methods=['GET'])
def listar_mesas_abertas():
    """Lista todas as mesas com comandas abertas"""
    conn = database.get_db()
    mesas = conn.execute('''
        SELECT m.*, c.id as comanda_id, c.data_abertura,
               COUNT(p.id) as total_pedidos,
               SUM(p.quantidade * pr.valor) as total_valor
        FROM mesas m
        JOIN comandas c ON m.id = c.mesa_id
        LEFT JOIN pedidos p ON c.id = p.comanda_id
        LEFT JOIN pratos pr ON p.prato_id = pr.id
        WHERE c.aberta = 1
        GROUP BY m.id, c.id
        ORDER BY m.numero
    ''').fetchall()
    
    conn.close()
    return jsonify([dict(mesa) for mesa in mesas])

@app.route('/api/comandas/<int:comanda_id>/fechar', methods=['POST'])
def fechar_comanda(comanda_id):
    """Fecha uma comanda e calcula o total"""
    conn = database.get_db()
    
    # Calcula o total
    total = conn.execute('''
        SELECT COALESCE(SUM(p.quantidade * pr.valor), 0) as total
        FROM pedidos p
        JOIN pratos pr ON p.prato_id = pr.id
        WHERE p.comanda_id = ?
    ''', (comanda_id,)).fetchone()['total']
    
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE comandas 
        SET aberta = 0, total = ?, data_fechamento = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (total, comanda_id))
    
    conn.commit()
    
    # Busca os pedidos para retornar
    pedidos = conn.execute('''
        SELECT p.*, pr.descricao as prato_descricao, pr.valor as prato_valor
        FROM pedidos p
        JOIN pratos pr ON p.prato_id = pr.id
        WHERE p.comanda_id = ?
        ORDER BY p.data_pedido
    ''', (comanda_id,)).fetchall()
    
    conn.close()
    return jsonify({
        'message': 'Comanda fechada com sucesso',
        'total': total,
        'pedidos': [dict(pedido) for pedido in pedidos]
    })

# ========== ROTAS DE TELAS ==========

@app.route('/')
def index():
    """Página inicial com links para as telas"""
    return render_template('index.html')

@app.route('/garcom')
def garcom():
    """Tela do garçom"""
    return render_template('garcom.html')

@app.route('/cozinha')
def cozinha():
    """Tela da cozinha"""
    return render_template('cozinha.html')

@app.route('/caixa')
def caixa():
    """Tela do caixa"""
    return render_template('caixa.html')

@app.route('/cadastro/pratos')
def cadastro_pratos():
    """Tela de cadastro de pratos"""
    return render_template('cadastro_pratos.html')

@app.route('/cadastro/mesas')
def cadastro_mesas():
    """Tela de cadastro de mesas"""
    return render_template('cadastro_mesas.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

