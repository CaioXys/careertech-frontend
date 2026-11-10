import html from './career-quiz.html?raw';
import './career-quiz.css';
import { auth } from '../../../core/auth.js';

const questions = [
  {
    text: 'Qual atividade parece mais interessante para você?',
    options: [
      { label: 'Montar, consertar ou construir algo', area: 'pratico' },
      { label: 'Investigar uma pergunta e descobrir a resposta', area: 'investigativo' },
      { label: 'Criar uma ideia, imagem, texto ou projeto', area: 'criativo' },
      { label: 'Ajudar alguém a aprender ou resolver um problema', area: 'social' },
    ],
  },
  {
    text: 'Em um trabalho em grupo, qual papel você costuma gostar?',
    options: [
      { label: 'Organizar tarefas e colocar o plano em prática', area: 'organizado' },
      { label: 'Analisar informações antes de decidir', area: 'investigativo' },
      { label: 'Apresentar ideias e convencer o grupo', area: 'empreendedor' },
      { label: 'Ouvir as pessoas e aproximar o grupo', area: 'social' },
    ],
  },
  {
    text: 'O que você escolheria fazer em um projeto livre?',
    options: [
      { label: 'Criar um objeto, protótipo ou solução prática', area: 'pratico' },
      { label: 'Pesquisar um tema que sempre quis entender', area: 'investigativo' },
      { label: 'Produzir algo original para compartilhar', area: 'criativo' },
      { label: 'Organizar uma ação para melhorar a comunidade', area: 'social' },
    ],
  },
  {
    text: 'Que tipo de desafio mais chama sua atenção?',
    options: [
      { label: 'Descobrir por que algo não está funcionando', area: 'investigativo' },
      { label: 'Transformar uma ideia em algo concreto', area: 'pratico' },
      { label: 'Encontrar uma forma nova de se expressar', area: 'criativo' },
      { label: 'Mobilizar pessoas em torno de uma oportunidade', area: 'empreendedor' },
    ],
  },
  {
    text: 'Qual ambiente de atividade parece mais confortável?',
    options: [
      { label: 'Um espaço com ferramentas, materiais e projetos', area: 'pratico' },
      { label: 'Um lugar tranquilo para estudar e comparar dados', area: 'investigativo' },
      { label: 'Um ambiente flexível para criar e experimentar', area: 'criativo' },
      { label: 'Um espaço colaborativo, com conversa e troca', area: 'social' },
    ],
  },
  {
    text: 'O que costuma dar mais satisfação no fim de uma tarefa?',
    options: [
      { label: 'Ver que algo ficou pronto e funcionando', area: 'pratico' },
      { label: 'Entender algo que antes parecia complicado', area: 'investigativo' },
      { label: 'Olhar para um resultado com a minha identidade', area: 'criativo' },
      { label: 'Saber que contribuí para o bem-estar de alguém', area: 'social' },
    ],
  },
  {
    text: 'Qual atividade você gostaria de experimentar?',
    options: [
      { label: 'Planejar e acompanhar um projeto do início ao fim', area: 'organizado' },
      { label: 'Criar uma campanha ou apresentar uma proposta', area: 'empreendedor' },
      { label: 'Desenhar, escrever, fotografar ou criar conteúdo', area: 'criativo' },
      { label: 'Ensinar, orientar ou apoiar outras pessoas', area: 'social' },
    ],
  },
  {
    text: 'Quando precisa tomar uma decisão, o que ajuda mais?',
    options: [
      { label: 'Testar possibilidades na prática', area: 'pratico' },
      { label: 'Buscar evidências e comparar alternativas', area: 'investigativo' },
      { label: 'Imaginar caminhos diferentes', area: 'criativo' },
      { label: 'Conversar com quem será impactado', area: 'social' },
    ],
  },
];

const areas = {
  pratico: { title: 'Prático e realizador', description: 'Você parece se interessar por atividades concretas, ferramentas e soluções que saem do papel.', examples: 'Tecnologia, engenharia, produção e áreas técnicas' },
  investigativo: { title: 'Investigativo e curioso', description: 'Pesquisar, analisar e compreender como as coisas funcionam pode combinar com seus interesses.', examples: 'Ciência, dados, saúde e pesquisa' },
  criativo: { title: 'Criativo e expressivo', description: 'Criar, imaginar possibilidades e comunicar ideias parece ter espaço importante para você.', examples: 'Design, comunicação, artes e desenvolvimento de produtos' },
  social: { title: 'Colaborativo e cuidador', description: 'A troca com pessoas e a possibilidade de contribuir para o desenvolvimento delas aparecem nas suas respostas.', examples: 'Educação, saúde, serviço social e atendimento' },
  empreendedor: { title: 'Empreendedor e articulador', description: 'Mobilizar pessoas, defender ideias e enxergar oportunidades pode motivar você.', examples: 'Negócios, gestão, marketing e projetos' },
  organizado: { title: 'Organizado e planejador', description: 'Estruturar tarefas, acompanhar processos e transformar planos em entregas pode ser algo que você valoriza.', examples: 'Administração, operações, finanças e planejamento' },
};

const storageKey = (user) => `careertech:career-quiz:${user?.id ?? user?.email ?? 'student'}`;

export default {
  title: 'Questionário vocacional',
  html,

  mount(root) {
    const quizRoot = root.querySelector('[data-quiz-root]');
    const views = Object.fromEntries([...quizRoot.querySelectorAll('[data-quiz-view]')].map((view) => [view.dataset.quizView, view]));
    const answers = Array(questions.length).fill(null);
    const user = auth.getUser();
    let current = 0;

    const showView = (name) => {
      Object.entries(views).forEach(([key, view]) => {
        view.hidden = key !== name;
      });
    };

    const renderQuestion = () => {
      const question = questions[current];
      const step = current + 1;
      const percent = Math.round((step / questions.length) * 100);
      quizRoot.querySelector('[data-quiz-step]').textContent = `PERGUNTA ${step} DE ${questions.length}`;
      quizRoot.querySelector('[data-quiz-percent]').textContent = `${percent}%`;
      quizRoot.querySelector('[data-quiz-progress]').style.width = `${percent}%`;
      quizRoot.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(step));
      quizRoot.querySelector('[data-quiz-question]').textContent = question.text;
      quizRoot.querySelector('[data-quiz-error]').hidden = true;
      quizRoot.querySelector('[data-quiz-back]').disabled = current === 0;
      const options = quizRoot.querySelector('[data-quiz-options]');
      options.replaceChildren(...question.options.map((option, index) => {
        const label = document.createElement('label');
        label.className = 'career-quiz-page__option';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'career-quiz-answer';
        input.value = String(index);
        input.checked = answers[current] === index;
        const marker = document.createElement('span');
        marker.className = 'career-quiz-page__radio';
        const text = document.createElement('span');
        text.className = 'career-quiz-page__option-text';
        text.textContent = option.label;
        label.append(input, marker, text);
        return label;
      }));
      quizRoot.querySelector('[data-quiz-next]').innerHTML = current === questions.length - 1
        ? 'Ver resultado <span aria-hidden="true">→</span>'
        : 'Próxima pergunta <span aria-hidden="true">→</span>';
      showView('question');
      quizRoot.querySelector('[data-quiz-question]').focus?.();
    };

    const showResult = () => {
      const scores = {};
      answers.forEach((answer, index) => {
        const area = questions[index].options[answer].area;
        scores[area] = (scores[area] ?? 0) + 1;
      });
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const [topKey, topScore] = sorted[0];
      const top = areas[topKey];
      quizRoot.querySelector('[data-result-title]').textContent = top.title;
      quizRoot.querySelector('[data-result-copy]').textContent = `${top.description} Você marcou esse tipo de interesse em ${topScore} ${topScore === 1 ? 'resposta' : 'respostas'}. Considere explorar: ${top.examples}.`;
      const scoresRoot = quizRoot.querySelector('[data-result-scores]');
      scoresRoot.replaceChildren(...sorted.map(([key, score]) => {
        const row = document.createElement('div');
        row.className = 'career-quiz-page__score';
        const copy = document.createElement('div');
        copy.className = 'career-quiz-page__score-copy';
        const label = document.createElement('span');
        label.textContent = areas[key].title;
        const value = document.createElement('strong');
        value.textContent = `${score} ${score === 1 ? 'resposta' : 'respostas'}`;
        copy.append(label, value);
        const track = document.createElement('div');
        track.className = 'career-quiz-page__score-track';
        track.setAttribute('aria-hidden', 'true');
        const fill = document.createElement('span');
        fill.style.width = `${(score / questions.length) * 100}%`;
        track.append(fill);
        row.append(copy, track);
        return row;
      }));
      localStorage.setItem(storageKey(user), JSON.stringify({ answers, completedAt: new Date().toISOString() }));
      showView('result');
    };

    const startButton = quizRoot.querySelector('[data-quiz-start]');
    const backButton = quizRoot.querySelector('[data-quiz-back]');
    const nextButton = quizRoot.querySelector('[data-quiz-next]');
    const restartButton = quizRoot.querySelector('[data-quiz-restart]');
    const selectAnswer = (event) => {
      if (event.target.matches('input[type="radio"]')) {
        answers[current] = Number(event.target.value);
        quizRoot.querySelector('[data-quiz-error]').hidden = true;
      }
    };
    const start = () => {
      current = 0;
      renderQuestion();
    };
    const goBack = () => {
      if (current > 0) {
        current -= 1;
        renderQuestion();
      }
    };
    const goNext = () => {
      if (answers[current] === null) {
        quizRoot.querySelector('[data-quiz-error]').hidden = false;
        return;
      }
      if (current < questions.length - 1) {
        current += 1;
        renderQuestion();
        return;
      }
      showResult();
    };
    const restart = () => {
      answers.fill(null);
      start();
    };

    startButton.addEventListener('click', start);
    backButton.addEventListener('click', goBack);
    nextButton.addEventListener('click', goNext);
    restartButton.addEventListener('click', restart);
    quizRoot.querySelector('[data-quiz-options]').addEventListener('change', selectAnswer);

    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey(user)) ?? 'null');
    } catch {
      saved = null;
    }
    if (Array.isArray(saved?.answers) && saved.answers.length === questions.length && saved.answers.every((answer) => Number.isInteger(answer) && questions.every((question) => question.options[answer]))) {
      saved.answers.forEach((answer, index) => { answers[index] = answer; });
      showResult();
    }

    return () => {
      startButton.removeEventListener('click', start);
      backButton.removeEventListener('click', goBack);
      nextButton.removeEventListener('click', goNext);
      restartButton.removeEventListener('click', restart);
      quizRoot.querySelector('[data-quiz-options]').removeEventListener('change', selectAnswer);
    };
  },
};
