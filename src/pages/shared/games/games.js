import html from './games.html?raw';
import './games.css';
import { auth } from '../../../core/auth.js';

const subjects = {
  development: {
    title: 'Desenvolvimento',
    courseId: 1,
    courseTitle: 'Fundamentos da Computação e Lógica de Programação',
    showConsole: true,
    initialStep: 2,
    description: 'Desafio: pratique lógica e fundamentos de JavaScript.',
    lastActivity: { datetime: '2026-11-20T14:32:00', label: '20 nov. 2026, 14:32' },
    exercises: [
      {
        prompt: 'Complete a atribuição para mostrar uma saudação no console.',
        code: "const saudacao = ___;\nconsole.log(saudacao);",
        options: ["'Olá, mundo!'", 'Olá, mundo!', '2 + 3'],
        answer: 0,
        hint: 'Uma string precisa estar entre aspas para ser exibida como texto.',
        expected: 'Olá, mundo!',
      },
      {
        prompt: 'Acesse o primeiro item da lista e mostre seu nome.',
        code: "const linguagens = [\n  'JavaScript',\n  'Python',\n  'Java',\n];\nconsole.log(linguagens[___]);",
        options: ['1', '0', '3'],
        answer: 1,
        hint: 'Lembre-se de qual número representa a primeira posição de uma lista.',
        expected: 'JavaScript',
      },
      {
        prompt: 'Use a condição correta para identificar uma temperatura acima de 30 graus.',
        code: "const temperatura = 35;\nif (temperatura ___ 30) {\n  console.log('Está quente');\n}",
        options: ['<', '===', '>'],
        answer: 2,
        hint: 'Compare se 35 é maior ou menor que 30.',
        expected: 'Está quente',
      },
      {
        prompt: 'Complete a função para dobrar o valor recebido.',
        code: 'function dobrar(valor) {\n  return valor ___ 2;\n}\nconsole.log(dobrar(4));',
        options: ['+', '**', '*'],
        answer: 2,
        hint: 'A operação deve multiplicar o valor por dois, sem elevar ao quadrado.',
        expected: '8',
      },
    ],
  },
  database: {
    title: 'Banco de dados',
    courseId: 6,
    courseTitle: 'Banco de Dados e SQL',
    showConsole: true,
    initialStep: 3,
    description: 'Desafio: escreva consultas e filtre registros com SQL.',
    lastActivity: { datetime: '2026-11-19T10:15:00', label: '19 nov. 2026, 10:15' },
    exercises: [
      {
        prompt: 'Consulte os alunos com nota igual ou superior a 8.',
        code: 'SELECT nome\nFROM alunos\nWHERE nota >= ___;',
        options: ['8', '7', '9'],
        answer: 0,
        hint: 'Use o limite indicado no enunciado e compare com a coluna nota.',
        expected: 'nome\nAna\nCarla',
      },
      {
        prompt: 'Insira Eva no curso de JavaScript com nota 8,0.',
        code: "INSERT INTO alunos (nome, curso, nota)\nVALUES ('Eva', 'JavaScript', ___);",
        options: ['9.0', '8.0', '7.0'],
        answer: 1,
        hint: 'O último valor corresponde à nota informada para Eva.',
        expected: '1 linha adicionada\nEva | JavaScript | 8,0',
      },
      {
        prompt: 'Atualize a nota de Diego para 7,5.',
        code: 'UPDATE alunos\nSET nota = ___\nWHERE nome = \'Diego\';',
        options: ['8.5', '9.5', '7.5'],
        answer: 2,
        hint: 'Defina no comando UPDATE a nova nota indicada no enunciado.',
        expected: '1 linha atualizada\nDiego | Python | 7,5',
      },
      {
        prompt: 'Calcule a média das notas de cada curso.',
        code: 'SELECT ___, AVG(nota) AS media\nFROM alunos\nGROUP BY curso\nORDER BY curso;',
        options: ['nome', 'curso', 'nota'],
        answer: 1,
        hint: 'O campo selecionado deve ser o mesmo usado para agrupar os registros.',
        expected: 'curso | média\nPython | 7,85\nSQL | 7,75',
      },
    ],
  },
  infrastructure: {
    title: 'Infraestrutura',
    courseId: 18,
    courseTitle: 'Redes de Computadores',
    initialStep: 2,
    description: 'Desafio: conheça redes, DNS e os serviços da web.',
    lastActivity: { datetime: '2026-11-18T16:40:00', label: '18 nov. 2026, 16:40' },
    exercises: [
      {
        prompt: 'Complete a função do DNS na navegação.',
        code: 'DNS traduz nomes de domínio em ___.',
        options: ['endereços IP', 'senhas de usuários', 'arquivos HTML'],
        answer: 0,
        hint: 'O DNS permite que o navegador encontre o servidor associado a um domínio.',
        expected: 'endereços IP',
      },
      {
        prompt: 'Qual protocolo protege a conexão entre o navegador e um site?',
        code: 'Uma conexão segura usa o protocolo ___.',
        options: ['HTTP', 'HTTPS', 'FTP'],
        answer: 1,
        hint: 'Procure a versão do HTTP que adiciona criptografia à conexão.',
        expected: 'HTTPS',
      },
      {
        prompt: 'Qual serviço recebe e responde às solicitações de uma aplicação web?',
        code: 'O navegador envia a solicitação para o ___.',
        options: ['servidor', 'monitor', 'teclado'],
        answer: 0,
        hint: 'Esse serviço hospeda a aplicação e responde às solicitações dos clientes.',
        expected: 'servidor',
      },
      {
        prompt: 'Qual opção representa um endereço IPv4 válido?',
        code: 'Exemplo de endereço IPv4: ___.',
        options: ['192.168.1.10', '192.168.1.999', 'www.exemplo.com'],
        answer: 0,
        hint: 'Um IPv4 tem quatro números entre 0 e 255, separados por pontos.',
        expected: '192.168.1.10',
      },
    ],
  },
};

const dailySubject = {
  title: 'Desafio diário',
  exercises: [
    {
      prompt: 'Qual atribuição funciona para atualizar uma variável declarada com let?',
      code: 'let pontos = 3;\nconst total = pontos;\n___;',
      options: ['pontos = 4', 'total = 4', 'const = 4'],
      answer: 0,
      hint: 'A variável total foi declarada com const e não pode receber uma nova atribuição.',
      expected: 'pontos = 4;',
    },
  ],
};

const subjectIds = Object.keys(subjects);
const storageKey = (user) => `careertech:games:${user?.id ?? user?.email ?? 'anonymous'}`;
const dashboardStorageKey = (user) => `careertech:games-dashboard:${user?.id ?? user?.email ?? 'anonymous'}`;

const dashboardData = {
  version: 2,
  streakDays: 12,
  dailyChallengeCompleted: 0,
  practicedDays: [0, 1, 2, 4, 5],
  currentDay: (new Date().getDay() + 6) % 7,
};

function loadCompletedSubjects(key) {
  let saved;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return new Set();
    saved = JSON.parse(raw);
  } catch (cause) {
    console.error('Não foi possível ler o progresso dos jogos:', cause);
    return new Set();
  }

  if (!Array.isArray(saved) || saved.some((subject) => !subjectIds.includes(subject))) {
    console.error('O progresso salvo dos jogos tem um formato inválido.');
    return new Set();
  }

  return new Set(saved);
}

function loadDashboard(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!saved || typeof saved !== 'object') {
      return { ...dashboardData, practicedDays: [...dashboardData.practicedDays] };
    }
    const practicedDays = Array.isArray(saved.practicedDays)
      ? saved.practicedDays.filter((day) => Number.isInteger(day) && day >= 0 && day < 7)
      : dashboardData.practicedDays;
    return {
      version: dashboardData.version,
      streakDays: dashboardData.streakDays,
      dailyChallengeCompleted: saved.version === dashboardData.version
        && saved.dailyChallengeCompleted === 1
        ? 1
        : 0,
      practicedDays: [...new Set(practicedDays)],
      currentDay: dashboardData.currentDay,
    };
  } catch (cause) {
    console.error('Não foi possível ler os dados do painel de jogos:', cause);
    return { ...dashboardData, practicedDays: [...dashboardData.practicedDays] };
  }
}

function createStep(step, currentStep, totalSteps) {
  const item = document.createElement('li');
  const segment = document.createElement('span');
  const isComplete = step < currentStep;
  const isCurrent = step === currentStep;

  item.className = 'games-page__step';
  segment.className = 'games-page__step-segment';
  segment.setAttribute('aria-hidden', 'true');

  if (isComplete) item.classList.add('games-page__step--complete');
  if (isCurrent) {
    item.classList.add('games-page__step--current');
    item.setAttribute('aria-current', 'step');
  }

  item.setAttribute('aria-label', isComplete
    ? `Passo ${step}, concluído`
    : isCurrent
      ? `Passo ${step} de ${totalSteps}, atual`
      : `Passo ${step} de ${totalSteps}, a seguir`);
  item.append(segment);
  return item;
}

function createOption(option, index, selectedIndex) {
  const button = document.createElement('button');
  button.className = 'games-page__option';
  button.type = 'button';
  button.dataset.optionIndex = String(index);
  const letter = document.createElement('span');
  const label = document.createElement('span');
  letter.className = 'games-page__option-letter';
  letter.setAttribute('aria-hidden', 'true');
  letter.textContent = String.fromCharCode(65 + index);
  label.className = 'games-page__option-label';
  label.textContent = option;
  button.append(letter, label);
  button.setAttribute('aria-pressed', String(index === selectedIndex));
  return button;
}

function appendSyntax(target, source) {
  const tokenPattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:const|function|return|if|SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|GROUP|BY|ORDER|AS|AVG)\b)/g;
  let position = 0;
  let match = tokenPattern.exec(source);

  while (match) {
    if (match.index > position) {
      target.append(document.createTextNode(source.slice(position, match.index)));
    }

    const token = document.createElement('span');
    const isString = match[0].startsWith('"') || match[0].startsWith("'");
    token.className = isString
      ? 'games-page__syntax-string'
      : 'games-page__syntax-keyword';
    token.textContent = match[0];
    target.append(token);
    position = tokenPattern.lastIndex;
    match = tokenPattern.exec(source);
  }

  if (position < source.length) {
    target.append(document.createTextNode(source.slice(position)));
  }
}

export default {
  title: 'Jogos',
  html,

  mount(root) {
    const views = Object.fromEntries(
      [...root.querySelectorAll('[data-games-view]')].map((view) => [view.dataset.gamesView, view]),
    );
    const cards = [...root.querySelectorAll('[data-subject-card]')];
    const steps = root.querySelector('[data-game-steps]');
    const exerciseLayout = root.querySelector('.games-page__exercise-layout');
    const title = root.querySelector('[data-game-title]');
    const courseLink = root.querySelector('[data-game-course-link]');
    const courseName = root.querySelector('[data-game-course-name]');
    const stepCopy = root.querySelector('[data-game-step-copy]');
    const question = root.querySelector('[data-game-question]');
    const code = root.querySelector('[data-game-code]');
    const codeWrapper = root.querySelector('[data-game-code-wrapper]');
    const table = root.querySelector('[data-game-table]');
    const gameConsole = root.querySelector('[data-game-console]');
    const output = root.querySelector('[data-game-output]');
    const options = root.querySelector('[data-game-options]');
    const feedback = root.querySelector('[data-game-feedback]');
    const xp = root.querySelector('[data-game-xp]');
    const verifyButton = root.querySelector('[data-game-verify]');
    const nextButton = root.querySelector('[data-game-next]');
    const completionMessage = root.querySelector('[data-game-completion]');
    const streak = root.querySelector('[data-streak]');
    const streakCount = root.querySelector('[data-streak-count]');
    const streakNote = root.querySelector('[data-streak-note]');
    const dailyCard = root.querySelector('[data-daily-card]');
    const dailyDescription = root.querySelector('[data-daily-description]');
    const dailyOpen = root.querySelector('[data-daily-open]');
    const dailyCompleted = root.querySelector('[data-daily-completed]');
    const weekDays = root.querySelector('[data-week-days]');
    const weekCount = root.querySelector('[data-week-count]');
    const storageId = storageKey(auth.getUser());
    const dashboardStorageId = dashboardStorageKey(auth.getUser());
    const completedSubjects = loadCompletedSubjects(storageId);
    const dashboardState = loadDashboard(dashboardStorageId);
    const startingSteps = Object.fromEntries(subjectIds.map((id) => [
      id,
      completedSubjects.has(id) ? 4 : subjects[id].initialStep,
    ]));
    const lastActivities = Object.fromEntries(subjectIds.map((id) => [
      id,
      { ...subjects[id].lastActivity },
    ]));
    let activeSubject = null;
    let currentStep = 1;
    let selectedOption = null;
    let activeCard = null;

    function getActiveSubject() {
      return activeSubject === 'daily' ? dailySubject : subjects[activeSubject];
    }

    function getActiveExercise() {
      return getActiveSubject().exercises[currentStep - 1];
    }

    function saveDashboard() {
      try {
        localStorage.setItem(dashboardStorageId, JSON.stringify(dashboardState));
      } catch (cause) {
        console.error('Não foi possível salvar os dados do painel de jogos:', cause);
      }
    }

    function renderDailyGoal() {
      const completed = dashboardState.dailyChallengeCompleted === 1 ? 1 : 0;
      streak.classList.toggle('is-complete', completed === 1);
      streakCount.textContent = String(dashboardState.streakDays);
      streak.setAttribute(
        'aria-label',
        `Sequência atual: ${dashboardState.streakDays} dias${completed ? ', desafio diário concluído' : ''}`,
      );
      streakNote.textContent = completed
        ? 'Desafio diário concluído!'
        : 'Pratique hoje para manter sua sequência.';
      dailyCard.classList.toggle('is-complete', completed === 1);
      dailyOpen.hidden = completed === 1;
      dailyCompleted.hidden = completed !== 1;
      dailyDescription.textContent = completed
        ? 'Desafio concluído! Sua sequência está em dia.'
        : 'Mantenha sua sequência respondendo a um exercício rápido.';
    }

    function renderWeek() {
      const labels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      const practicedDays = dashboardState.practicedDays.length;
      weekCount.textContent = `${practicedDays} de 7 dias`;
      weekDays.setAttribute(
        'aria-label',
        `${practicedDays} de 7 dias praticados nesta semana`,
      );
      weekDays.replaceChildren(...labels.map((label, index) => {
        const day = document.createElement('span');
        const marker = document.createElement('span');
        const weekdayIndex = (index + 6) % 7;
        day.className = 'games-page__week-day';
        if (dashboardState.practicedDays.includes(weekdayIndex)) day.classList.add('is-practiced');
        if (weekdayIndex === dashboardState.currentDay) day.classList.add('is-current');
        marker.textContent = label;
        day.append(marker);
        return day;
      }));
    }

    function renderDashboard() {
      renderDailyGoal();
      renderWeek();
    }

    function renderSubjectCards() {
      cards.forEach((card) => {
        const subjectId = card.dataset.subjectCard;
        const isCompleted = completedSubjects.has(subjectId);
        const status = card.querySelector('[data-subject-status]');
        const lastActivity = card.querySelector('[data-subject-last-activity]');
        const action = card.querySelector('[data-game-subject]');
        const progressTrack = card.querySelector('[role="progressbar"]');
        const progressSegments = [...progressTrack.querySelectorAll('span')];
        const progressLabel = card.querySelector('[data-subject-progress-label]');
        const progressPercent = card.querySelector('[data-subject-progress-percent]');
        const completedSteps = isCompleted ? 4 : Math.max(0, startingSteps[subjectId] - 1);
        const percent = Math.round((completedSteps / 4) * 100);

        card.classList.toggle('games-page__continue-card--complete', isCompleted);
        status.classList.toggle('is-complete', isCompleted);
        status.textContent = isCompleted ? 'CONCLUÍDO' : 'CONTINUAR JOGANDO';
        lastActivity.dateTime = lastActivities[subjectId].datetime;
        lastActivity.textContent = `Última atividade · ${lastActivities[subjectId].label}`;
        action.hidden = isCompleted;
        progressLabel.textContent = isCompleted
          ? '4 de 4 etapas concluídas'
          : `Etapa ${startingSteps[subjectId]} de 4 · ${completedSteps} concluídas`;
        progressPercent.textContent = `${percent}%`;
        progressTrack.setAttribute('aria-valuenow', String(completedSteps));
        progressTrack.setAttribute(
          'aria-label',
          `Progresso em ${subjects[subjectId].title}: ${completedSteps} de 4 etapas concluídas`,
        );
        progressSegments.forEach((segment, index) => {
          segment.classList.toggle('is-complete', index < completedSteps);
          segment.classList.toggle('is-current', !isCompleted && index === completedSteps);
        });
      });
      renderDashboard();
    }

    function renderCode(exercise) {
      if (activeSubject === 'development') {
        const lines = exercise.code.split('\n').map((line, lineIndex) => {
          const codeLine = document.createElement('span');
          const lineContent = document.createElement('span');
          const gapIndex = line.indexOf('___');
          codeLine.className = 'games-page__code-line';
          codeLine.dataset.lineNumber = String(lineIndex + 1);
          lineContent.className = 'games-page__code-line-content';

          if (gapIndex === -1) {
            appendSyntax(lineContent, line);
          } else {
            appendSyntax(lineContent, line.slice(0, gapIndex));
            const gap = selectedOption === null
              ? document.createElement('span')
              : document.createElement('button');
            gap.className = selectedOption === null
              ? 'games-page__code-gap'
              : 'games-page__code-gap games-page__code-gap--filled';
            gap.textContent = selectedOption === null
              ? '___'
              : exercise.options[selectedOption];
            if (selectedOption !== null) {
              gap.type = 'button';
              gap.dataset.clearSelection = '';
              gap.setAttribute('aria-label', 'Limpar resposta selecionada');
            }
            lineContent.append(gap);
            appendSyntax(lineContent, line.slice(gapIndex + 3));
          }

          codeLine.append(lineContent);
          return codeLine;
        });
        code.replaceChildren(...lines);
        return;
      }

      const gapIndex = exercise.code.indexOf('___');
      const beforeGap = document.createTextNode(exercise.code.slice(0, gapIndex));
      const afterGap = document.createTextNode(exercise.code.slice(gapIndex + 3));
      let gap;
      if (selectedOption === null) {
        gap = document.createElement('span');
        gap.textContent = '___';
      } else {
        gap = document.createElement('button');
        gap.type = 'button';
        gap.dataset.clearSelection = '';
        gap.setAttribute('aria-label', 'Limpar resposta selecionada');
        gap.textContent = exercise.options[selectedOption];
      }
      gap.className = 'games-page__code-gap';
      code.replaceChildren(beforeGap, gap, afterGap);
    }

    function renderExercise() {
      const subject = getActiveSubject();
      const exercise = subject.exercises[currentStep - 1];
      const totalSteps = subject.exercises.length;
      const isDailyComplete = activeSubject === 'daily' && dashboardState.dailyChallengeCompleted === 1;
      title.textContent = subject.title;
      courseLink.hidden = !subject.courseId;
      if (subject.courseId) {
        courseLink.href = `#/courses/${encodeURIComponent(String(subject.courseId))}`;
        courseName.textContent = `Curso: ${subject.courseTitle}`;
        courseLink.setAttribute('aria-label', `Abrir curso ${subject.courseTitle}`);
      } else {
        courseLink.removeAttribute('href');
        courseName.textContent = '';
        courseLink.removeAttribute('aria-label');
      }
      stepCopy.textContent = `Passo ${currentStep} de ${totalSteps}`;
      stepCopy.hidden = false;
      question.textContent = exercise.prompt;
      output.textContent = exercise.expected;
      const hasConsole = Boolean(subject.showConsole);
      gameConsole.hidden = !hasConsole;
      exerciseLayout.classList.toggle('games-page__exercise-layout--with-console', hasConsole);
      exerciseLayout.classList.toggle('games-page__exercise-layout--plain', !hasConsole);
      codeWrapper.hidden = !hasConsole;
      table.hidden = activeSubject !== 'database';
      steps.style.gridTemplateColumns = `repeat(${totalSteps}, minmax(0, 1fr))`;
      steps.replaceChildren(...Array.from({ length: totalSteps }, (_, index) =>
        createStep(index + 1, currentStep, totalSteps),
      ));
      options.replaceChildren(...exercise.options.map((option, index) =>
        createOption(option, index, selectedOption),
      ));
      feedback.hidden = true;
      feedback.textContent = '';
      feedback.className = 'games-page__feedback';
      xp.hidden = true;
      xp.textContent = `+${activeSubject === 'daily' ? 20 : 50} XP`;
      verifyButton.hidden = false;
      verifyButton.disabled = selectedOption === null;
      nextButton.hidden = true;
      options.querySelectorAll('button').forEach((option) => {
        option.disabled = isDailyComplete;
      });
      if (isDailyComplete) {
        verifyButton.hidden = true;
        showFeedback('Você já concluiu o desafio diário.', 'success');
      }
      renderCode(exercise);
      question.focus();
    }

    function showView(name) {
      Object.entries(views).forEach(([viewName, view]) => {
        view.hidden = viewName !== name;
      });
    }

    function showFeedback(message, state) {
      feedback.textContent = message;
      feedback.className = `games-page__feedback games-page__feedback--${state}`;
      feedback.hidden = false;
    }

    function recordActivity() {
      if (activeSubject !== 'daily') {
        lastActivities[activeSubject] = {
          datetime: new Date().toISOString(),
          label: 'agora',
        };
      }
      if (!dashboardState.practicedDays.includes(dashboardState.currentDay)) {
        dashboardState.practicedDays.push(dashboardState.currentDay);
      }
      saveDashboard();
      renderDashboard();
    }

    function onSubjectClick(event) {
      const card = event.currentTarget.closest('[data-subject-card]');
      if (!card || completedSubjects.has(card.dataset.subjectCard)) return;
      activeCard = event.currentTarget;
      activeSubject = card.dataset.subjectCard;
      currentStep = startingSteps[activeSubject];
      selectedOption = null;
      completionMessage.hidden = true;
      showView('game');
      renderExercise();
    }

    function onDailyClick(event) {
      activeCard = event.currentTarget;
      activeSubject = 'daily';
      currentStep = 1;
      selectedOption = null;
      completionMessage.hidden = true;
      showView('game');
      renderExercise();
    }

    function onOptionClick(event) {
      const button = event.target.closest('[data-option-index]');
      if (!button || !options.contains(button) || button.disabled) return;
      selectedOption = Number(button.dataset.optionIndex);
      options.querySelectorAll('[data-option-index]').forEach((option) => {
        option.setAttribute('aria-pressed', String(option === button));
      });
      renderCode(getActiveExercise());
      verifyButton.disabled = false;
      if (!xp.hidden) return;
      feedback.hidden = true;
      feedback.textContent = '';
    }

    function onGapClick(event) {
      const gap = event.target.closest('[data-clear-selection]');
      if (!gap || !code.contains(gap) || !xp.hidden) return;
      const clearedOption = selectedOption;
      selectedOption = null;
      renderCode(getActiveExercise());
      options.querySelectorAll('[data-option-index]').forEach((option) => {
        option.setAttribute('aria-pressed', 'false');
      });
      verifyButton.disabled = true;
      feedback.hidden = true;
      feedback.textContent = '';
      options.querySelector(`[data-option-index="${clearedOption}"]`)?.focus();
    }

    function onVerify() {
      if (selectedOption === null) {
        showFeedback('Escolha uma opção antes de verificar.', 'error');
        return;
      }

      const exercise = getActiveExercise();
      if (selectedOption !== exercise.answer) {
        recordActivity();
        showFeedback(`Ainda não. Dica: ${exercise.hint}`, 'hint');
        options.classList.remove('games-page__options--shake');
        void options.offsetWidth;
        options.classList.add('games-page__options--shake');
        return;
      }

      if (activeSubject === 'daily') dashboardState.dailyChallengeCompleted = 1;
      recordActivity();
      showFeedback('Muito bem! Você completou este desafio.', 'success');
      xp.hidden = false;
      verifyButton.hidden = true;
      nextButton.hidden = false;
      options.querySelectorAll('button').forEach((option) => {
        option.disabled = true;
      });
      code.querySelector('[data-clear-selection]')?.setAttribute('disabled', '');
      const totalSteps = getActiveSubject().exercises.length;
      const isLastStep = currentStep === totalSteps;
      nextButton.textContent = isLastStep
        ? (activeSubject === 'daily' ? 'Concluir desafio' : 'Concluir matéria')
        : 'Próximo passo';
      if (!isLastStep) {
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        nextButton.append(arrow);
      }
    }

    function onNext() {
      const totalSteps = getActiveSubject().exercises.length;
      if (currentStep < totalSteps) {
        currentStep += 1;
        if (activeSubject !== 'daily') startingSteps[activeSubject] = currentStep;
        selectedOption = null;
        renderExercise();
        return;
      }

      if (activeSubject === 'daily') {
        completionMessage.textContent = 'Desafio diário concluído! Sua sequência está em dia.';
        completionMessage.hidden = false;
        showView('list');
        views.list.focus();
        return;
      }

      completedSubjects.add(activeSubject);
      let saved = true;
      try {
        localStorage.setItem(storageId, JSON.stringify([...completedSubjects]));
      } catch (cause) {
        saved = false;
        console.error('Não foi possível salvar o progresso dos jogos:', cause);
      }

      const completedTitle = subjects[activeSubject].title;
      renderSubjectCards();
      completionMessage.textContent = saved
        ? `${completedTitle} concluído! A matéria já está disponível na sua lista.`
        : `${completedTitle} concluído nesta sessão, mas não foi possível salvar seu progresso neste dispositivo.`;
      completionMessage.hidden = false;
      showView('list');
      views.list.focus();
    }

    function onBack() {
      showView('list');
      if (activeSubject !== 'daily') {
        startingSteps[activeSubject] = currentStep;
        renderSubjectCards();
      }
      activeCard?.focus();
    }

    function onOptionKeydown(event) {
      if (activeSubject !== 'development') return;
      const currentOption = event.target.closest('[data-option-index]');
      if (!currentOption || !options.contains(currentOption)) return;
      const directions = {
        ArrowDown: 1,
        ArrowRight: 1,
        ArrowUp: -1,
        ArrowLeft: -1,
      };
      const direction = directions[event.key];
      if (!direction) return;
      const availableOptions = [...options.querySelectorAll('[data-option-index]:not(:disabled)')];
      const currentIndex = availableOptions.indexOf(currentOption);
      if (currentIndex === -1) return;
      event.preventDefault();
      const nextIndex = (currentIndex + direction + availableOptions.length) % availableOptions.length;
      availableOptions[nextIndex].focus();
    }

    cards.forEach((card) => card.querySelector('[data-game-subject]').addEventListener('click', onSubjectClick));
    dailyOpen.addEventListener('click', onDailyClick);
    options.addEventListener('click', onOptionClick);
    options.addEventListener('keydown', onOptionKeydown);
    code.addEventListener('click', onGapClick);
    verifyButton.addEventListener('click', onVerify);
    nextButton.addEventListener('click', onNext);
    root.querySelector('[data-game-back]').addEventListener('click', onBack);
    renderSubjectCards();

    return () => {
      cards.forEach((card) => card.querySelector('[data-game-subject]').removeEventListener('click', onSubjectClick));
      dailyOpen.removeEventListener('click', onDailyClick);
      options.removeEventListener('click', onOptionClick);
      options.removeEventListener('keydown', onOptionKeydown);
      code.removeEventListener('click', onGapClick);
      verifyButton.removeEventListener('click', onVerify);
      nextButton.removeEventListener('click', onNext);
      root.querySelector('[data-game-back]').removeEventListener('click', onBack);
    };
  },
};
