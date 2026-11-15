import html from './social-network.html?raw';
import './social-network.css';
import { auth } from '../../../core/auth.js';
import { userInitials } from '../../../utils/user-initials.js';

const posts = [
  {
    author: 'Mariana Costa',
    time: 'há 2 horas',
    text: 'Concluí a trilha de lógica de programação! Os exercícios práticos me ajudaram a entender como transformar uma ideia em passos claros.',
    image: '/images/certifications/certificate-cover-placeholder.webp',
    imageAlt: 'Certificado de conclusão da trilha de lógica de programação',
    likes: [48, 260],
    comments: [
      { author: 'Lucas Ferreira', text: 'Parabéns, Mariana! Essa base faz toda a diferença.' },
      { author: 'Ana Beatriz', text: 'Também estou fazendo essa trilha. Muito bom saber que você gostou!' },
    ],
  },
  {
    author: 'Rafael Mendes',
    time: 'há 5 horas',
    text: 'Comecei Fundamentos de Computação e Lógica esta semana. Já estou usando os conceitos para organizar melhor meus estudos.',
    image: '/images/classrooms/course-01-fundamentos-computacao-logica.webp',
    imageAlt: 'Capa do curso Fundamentos de Computação e Lógica',
    likes: [31, 220],
    comments: [
      { author: 'João Pedro', text: 'Ótima escolha para começar! Bons estudos.' },
      { author: 'Camila Rocha', text: 'Essa parte de lógica é muito útil para os próximos cursos.' },
      { author: 'Rafael Mendes', text: 'Valeu pelas dicas, pessoal!' },
    ],
  },
  {
    author: 'Camila Rocha',
    time: 'ontem',
    text: 'Mais uma conquista concluída: finalizei o curso de HTML e CSS na prática. Agora quero aplicar tudo em um projeto próprio.',
    image: '/images/certifications/certificate-cover-placeholder.webp',
    imageAlt: 'Certificado de conclusão do curso de HTML e CSS na prática',
    likes: [62, 310],
    comments: [
      { author: 'Mariana Costa', text: 'Parabéns! Mal posso esperar para ver seu projeto.' },
    ],
  },
  {
    author: 'Lucas Ferreira',
    time: 'ontem',
    text: 'Estou aprendendo orientação a objetos e gostei de ver como esse conteúdo ajuda a estruturar projetos maiores.',
    image: '/images/classrooms/course-03-programacao-orientada-objetos.webp',
    imageAlt: 'Capa do curso Programação Orientada a Objetos',
    likes: [39, 190],
    comments: [
      { author: 'Ana Beatriz', text: 'Esse curso me ajudou bastante a organizar o código.' },
      { author: 'Rafael Mendes', text: 'Estou nessa trilha também. O conteúdo está muito bom.' },
      { author: 'João Pedro', text: 'Depois quero saber o que achou dos projetos práticos!' },
      { author: 'Lucas Ferreira', text: 'Combinado! Estou gostando bastante até agora.' },
    ],
  },
];

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createCommentAvatar() {
  const avatar = document.createElement('span');
  avatar.className = 'social-network-page__comment-avatar';
  avatar.setAttribute('aria-hidden', 'true');

  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');

  const silhouette = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  silhouette.setAttribute('d', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z');
  silhouette.setAttribute('fill', 'currentColor');
  icon.append(silhouette);
  avatar.append(icon);
  return avatar;
}

function renderPost(post) {
  const article = document.createElement('article');
  article.className = 'social-network-page__post';

  const header = document.createElement('header');
  header.className = 'social-network-page__post-header';

  const avatar = createTextElement(
    'span',
    'social-network-page__avatar',
    post.author.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
  );
  avatar.setAttribute('aria-hidden', 'true');

  const authorBlock = document.createElement('div');
  authorBlock.className = 'social-network-page__author';
  authorBlock.append(
    createTextElement('h2', '', post.author),
    createTextElement('span', 'social-network-page__time', post.time),
  );

  const copy = createTextElement('p', 'social-network-page__post-copy', post.text);
  const image = document.createElement('img');
  image.className = 'social-network-page__media';
  image.src = post.image;
  image.alt = post.imageAlt;
  image.loading = 'lazy';

  const [minimumLikes, maximumLikes] = post.likes;
  let likes = Math.floor(Math.random() * (maximumLikes - minimumLikes + 1)) + minimumLikes;
  const footer = document.createElement('div');
  footer.className = 'social-network-page__post-footer';

  const likeButton = document.createElement('button');
  likeButton.className = 'social-network-page__engagement social-network-page__like-button';
  likeButton.type = 'button';
  likeButton.setAttribute('aria-pressed', 'false');
  likeButton.setAttribute('aria-label', `Curtir publicação. ${likes} curtidas`);
  const likeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  likeIcon.classList.add('social-network-page__engagement-icon');
  likeIcon.setAttribute('viewBox', '0 0 24 24');
  likeIcon.setAttribute('aria-hidden', 'true');
  const heartShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  heartShape.setAttribute('d', 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z');
  heartShape.setAttribute('fill', 'none');
  heartShape.setAttribute('stroke', 'currentColor');
  heartShape.setAttribute('stroke-width', '1.8');
  heartShape.setAttribute('stroke-linejoin', 'round');
  likeIcon.append(heartShape);
  const likeCount = createTextElement('span', '', `${likes} curtidas`);
  likeButton.append(likeIcon, likeCount);
  likeButton.addEventListener('click', () => {
    const liked = likeButton.getAttribute('aria-pressed') !== 'true';
    likes += liked ? 1 : -1;
    likeButton.setAttribute('aria-pressed', String(liked));
    likeButton.setAttribute('aria-label', `${liked ? 'Remover curtida' : 'Curtir publicação'}. ${likes} curtidas`);
    likeCount.textContent = `${likes} curtidas`;
  });
  const commentCount = createTextElement(
    'span',
    'social-network-page__engagement',
    `${post.comments.length} comentários`,
  );
  footer.append(likeButton, commentCount);

  const comments = document.createElement('ul');
  comments.className = 'social-network-page__comments';
  comments.setAttribute('aria-label', 'Comentários da publicação');
  post.comments.forEach((comment) => {
    const item = document.createElement('li');
    item.className = 'social-network-page__comment';
    item.append(
      createCommentAvatar(),
      createTextElement('span', 'social-network-page__comment-author', comment.author),
      createTextElement('span', 'social-network-page__comment-copy', comment.text),
    );
    comments.append(item);
  });

  header.append(avatar, authorBlock);
  article.append(header, copy, image, footer, comments);
  return article;
}

export default {
  title: 'Rede social',
  html,

  mount(root) {
    const user = auth.getUser();
    root.querySelector('[data-composer-avatar]').textContent = userInitials(user?.name ?? user?.nome);

    const composerInput = root.querySelector('.social-network-page__composer-input');
    const resizeComposerInput = () => {
      composerInput.style.height = 'auto';
      composerInput.style.height = `${composerInput.scrollHeight}px`;
    };
    composerInput.addEventListener('input', resizeComposerInput);
    resizeComposerInput();

    const feed = root.querySelector('[data-social-feed]');
    feed.replaceChildren(...posts.map(renderPost));

    const attachmentStatus = root.querySelector('[data-attachment-status]');
    root.querySelectorAll('[data-attachment-input]').forEach((input) => {
      input.addEventListener('change', () => {
        const selectedFile = input.files[0];
        attachmentStatus.textContent = selectedFile ? `Arquivo selecionado: ${selectedFile.name}` : '';
      });
    });
  },
};
