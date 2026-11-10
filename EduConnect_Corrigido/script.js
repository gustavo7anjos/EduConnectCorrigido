// Correções de qualidade: validação, armazenamento local, busca, exclusão e contagem.
const formulario = document.querySelector('#form-cadastro');
const lista = document.querySelector('#lista');
const busca = document.querySelector('#busca');
const total = document.querySelector('#total');
const aviso = document.querySelector('#aviso');
const vazio = document.querySelector('#vazio');
const campoNome = document.querySelector('#nome');
const campoEmail = document.querySelector('#email');
const campoCurso = document.querySelector('#curso');
const CHAVE = 'educonnect_interessados_v1';

function carregarInteressados() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE) || '[]');
    if (!Array.isArray(dados)) return [];
    return dados.filter(p => p && Number.isSafeInteger(p.id) && p.id > 0 &&
      typeof p.nome === 'string' && typeof p.email === 'string' && typeof p.curso === 'string');
  } catch (erro) {
    console.warn('Não foi possível carregar os cadastros locais.', erro);
    return [];
  }
}
let interessados = carregarInteressados();
let proximoId = Math.max(0, ...interessados.map(p => p.id)) + 1;

function salvarInteressados(novosDados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(novosDados));
    return true;
  } catch (erro) {
    console.error('Falha ao salvar os dados.', erro);
    aviso.textContent = 'Não foi possível salvar os dados neste navegador.';
    return false;
  }
}

function criarTexto(tag, classe, texto) {
  const elemento = document.createElement(tag);
  if (classe) elemento.className = classe;
  elemento.textContent = texto;
  return elemento;
}

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function desenharLista() {
  lista.replaceChildren();
  const pesquisa = normalizar(busca.value.trim());
  const filtrados = interessados.filter(pessoa => normalizar(pessoa.nome).includes(pesquisa));
  filtrados.forEach(pessoa => {
    const item = criarTexto('li', 'registro', '');
    const informacoes = document.createElement('div');
    informacoes.append(
      criarTexto('strong', '', pessoa.nome),
      criarTexto('small', '', pessoa.email),
      criarTexto('small', '', pessoa.curso)
    );
    const botao = criarTexto('button', 'excluir', 'Excluir');
    botao.type = 'button';
    botao.setAttribute('aria-label', `Excluir cadastro de ${pessoa.nome}`);
    botao.addEventListener('click', () => excluirInteressado(pessoa.id));
    item.append(informacoes, botao);
    lista.appendChild(item);
  });
  total.textContent = `${interessados.length} ${interessados.length === 1 ? 'registro' : 'registros'}`;
  vazio.hidden = filtrados.length > 0;
}

function excluirInteressado(id) {
  const novosDados = interessados.filter(pessoa => pessoa.id !== id);
  if (novosDados.length === interessados.length) return;
  if (!salvarInteressados(novosDados)) return;
  interessados = novosDados;
  aviso.textContent = 'Registro excluído.';
  desenharLista();
}

formulario.addEventListener('submit', evento => {
  evento.preventDefault();
  const nome = campoNome.value.trim().replace(/\s+/g, ' ');
  const email = campoEmail.value.trim().toLowerCase();
  const curso = campoCurso.value;

  if (!nome || !email || !curso) {
    aviso.textContent = 'Preencha todos os campos obrigatórios.';
    if (!nome) campoNome.focus();
    else if (!email) campoEmail.focus();
    else campoCurso.focus();
    return;
  }
  campoEmail.value = email;
  if (!campoEmail.checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    aviso.textContent = 'Informe um e-mail válido.';
    campoEmail.focus();
    return;
  }
  if (interessados.some(pessoa => pessoa.email.toLowerCase() === email)) {
    aviso.textContent = 'Já existe um interessado cadastrado com esse e-mail.';
    campoEmail.focus();
    return;
  }

  const novosDados = [...interessados, { id: proximoId, nome, email, curso }];
  if (!salvarInteressados(novosDados)) return;
  interessados = novosDados;
  proximoId++;
  aviso.textContent = 'Interessado cadastrado com sucesso!';
  formulario.reset();
  desenharLista();
});

busca.addEventListener('input', desenharLista);
desenharLista();
