# CareerTech — Front-end (protótipo)

SPA (Single Page Application) em **HTML, CSS e JavaScript puro**, usando o **Vite** apenas como
servidor de desenvolvimento e empacotador. Ainda **não há back-end**: os dados vêm de mocks.

> O back-end será outro repositório (ex.: `careertech-backend`). Este repositório contém só o front.

## Como rodar

Pré-requisito: **Node.js 20.19+** (ou 22.12+). Confira com `node -v`.

```bash
npm install        # instala as dependências (só precisa na primeira vez)
npm run dev        # abre o projeto em http://localhost:4200
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Gera a versão final na pasta `dist/` |
| `npm run preview` | Serve a pasta `dist/` para testar o build |
| `npm run new:page -- grupo/nome` | Cria uma tela nova (HTML + CSS + JS) |

## Como testar os perfis (sem back-end)

Contas falsas (senha `123456`):

| Perfil | E-mail |
|---|---|
| Aluno | `student@careertech.dev` |
| Professor | `teacher@careertech.dev` |
| Administrador | `admin@careertech.dev` |

Atalho para quem ainda não montou a tela de login: abra o console do navegador (F12) e digite

```js
careertech.loginAs('student')    // or 'teacher' | 'admin'
```

O atalho só existe no `npm run dev`, não no build.

---

## ONDE CRIAR AS TELAS

Cada tela é uma **pasta** em `src/pages/<grupo>/<screen>/` com 3 arquivos que já existem como
placeholder. **Edite os arquivos existentes**, não precisa criar nada do zero:

| Arquivo | Para quê |
|---|---|
| `<tela>.html` | Estrutura (HTML) da tela |
| `<tela>.css` | Estilos da tela |
| `<tela>.js` | Comportamento (eventos, chamadas aos services) |

Além das telas, o Design System entra em:

| O quê | Onde |
|---|---|
| Cores, fontes, espaçamentos (tokens) | `src/styles/tokens.css` |
| Moldura das telas públicas (login etc.) | `src/layouts/auth/` |
| Moldura da área logada (cabeçalho + menu) | `src/layouts/app/` |
| Componentes reutilizáveis (botão, card, modal...) | `src/components/` |

### Mapa de telas

Os RFs referem-se ao documento de requisitos (a numeração se repete entre perfis, por isso o prefixo).

**Públicas** (`src/pages/auth/`)

| Pasta | Rota | Requisitos |
|---|---|---|
| `login/` | `#/login` | Aluno RF001-003 · Prof. RF032-036 · ADM RF001-002 |
| `register/` | `#/register` | Aluno RF004-007 · Prof. RF037-040 |
| `forgot-password/` | `#/forgot-password` | Aluno RF006 · Prof. RF035 |

**Aluno e Professor** (`src/pages/shared/`)

| Pasta | Rota | Requisitos |
|---|---|---|
| `home/` | `#/home` | Aluno RF009 · Prof. RF041 |
| `profile/` | `#/profile` | Aluno RF010 · Prof. RF042 |
| `courses/` | `#/courses` | Aluno RF012, 014, 015 · Prof. RF043 |
| `course-details/` | `#/courses/:id` | Aluno RF013 · Prof. RF044-045 |
| `classrooms/` | `#/classrooms` | Aluno RF016 · Prof. RF046-047 |
| `classroom/` | `#/classrooms/:id` | Aluno RF016-018 · Prof. RF046-047 |
| `ai-chat/` | `#/ai-chat` | Aluno RF021 · Prof. RF057 |
| `games/` | `#/games` | Aluno RF022 · Prof. RF058 |
| `social-network/` | `#/social-network` | Aluno RF023-029 · Prof. RF059-065 |
| `certifications/` | `#/certifications` | Aluno RF030 · Prof. RF066 |

**Somente Aluno** (`src/pages/student/`)

| Pasta | Rota | Requisitos |
|---|---|---|
| `career-quiz/` | `#/career-quiz` | RF011 |
| `career-map/` | `#/career-map` | RF019-020 |

**Somente Professor** (`src/pages/teacher/`)

| Pasta | Rota | Requisitos |
|---|---|---|
| `teacher-dashboard/` | `#/teacher/dashboard` | RF048 |
| `classes/` | `#/teacher/classes` | RF049 |
| `lessons/` | `#/teacher/lessons` | RF050-052 |
| `assignments-assessments/` | `#/teacher/assignments-assessments` | RF053-054 |
| `students/` | `#/teacher/students` | RF055-056 |

**Somente Administrador** (`src/pages/admin/`)

| Pasta | Rota | Requisitos |
|---|---|---|
| `users/` | `#/admin/users` | ADM RF002-004 |
| `approvals/` | `#/admin/approvals` | ADM RF006-008 |
| `management/` | `#/admin/management` | ADM RF009-017 |

**Erro** — `src/pages/errors/not-found/` (rota inexistente, 404).

> Logout (RF031, RF067, RF018-ADM) é o botão "Sair" do layout `app`, e as notificações, moderação e
> mentorias do ADM (RF015-017) cabem dentro da tela `management/`. Se o time preferir telas
> separadas, use `new:page`.

### Criar uma tela nova

```bash
npm run new:page -- student/openings --title "Vagas compatíveis" --reqs "RF..."
```

Isso cria `src/pages/student/openings/` com os 3 arquivos. Depois registre a rota em `src/app/routes.js`
(o comando imprime a linha pronta). Se a tela tiver link no menu, adicione em `src/core/menu.js`.

---

## Estrutura do projeto

```
careertech-frontend/
├── index.html              # única página HTML real (a SPA desenha tudo dentro de #app)
├── vite.config.js
├── .env.example            # variáveis de ambiente (mock x API real)
├── scripts/new-page.js     # gerador de telas
├── public/                 # arquivos estáticos (favicon, imagens fixas)
└── src/
    ├── main.js             # ponto de entrada: carrega estilos e liga o router
    ├── app/
    │   ├── router.js       # troca de telas, guards, layouts
    │   └── routes.js       # TABELA DE ROTAS (path -> tela, layout, perfis)
    ├── core/               # base do app, normalmente não precisa mexer
    │   ├── auth.js         # quem está logado
    │   ├── session.js      # guarda a sessão no navegador
    │   ├── guards.js       # regras de acesso por perfil
    │   ├── http.js         # cliente HTTP (JWT) para o back-end futuro
    │   ├── menu.js         # itens de menu de cada perfil
    │   ├── navigate.js     # navigate('/rota')
    │   ├── roles.js        # aluno | professor | admin
    │   └── config.js       # lê o .env
    ├── layouts/            # molduras: auth/ e app/
    ├── pages/              # TELAS (ver "Onde criar as telas")
    ├── components/         # componentes reutilizáveis
    ├── services/           # acesso a dados (mock agora, API depois)
    ├── mocks/              # dados falsos
    ├── styles/             # reset.css, tokens.css, base.css
    └── utils/
```

## Como o código funciona

**Rotas com `#`.** O endereço fica como `index.html#/courses`. O navegador não recarrega a página
ao mudar o `#`, então o JavaScript só troca o conteúdo. Funciona em qualquer hospedagem estática.

**Contrato de uma tela.** Cada `<tela>.js` exporta `{ title, html, mount(root, ctx) }`.
O router insere o `html`, depois chama `mount`, que é onde você liga eventos.
Se `mount` devolver uma função, ela roda ao sair da tela (para limpar listeners e timers).

**Guards.** `routes.js` define quem pode abrir cada rota (`roles`). Sem login vai para `#/login`;
perfil errado volta para a tela inicial dele. Isso é só conveniência de navegação:
a segurança de verdade (RNFs de permissão) precisa ser repetida no back-end.

**Services e mocks.** As telas nunca usam `fetch` direto. Chamam funções de `src/services/`
(ex.: `listCourses()`), que devolvem dados de `src/mocks/` enquanto `VITE_USE_MOCKS=true`.
Quando o back-end existir, mude para `false` no `.env` e as telas continuam iguais.
Para criar um service novo, copie `courses.service.js`.

## Boas práticas (leia antes de criar as telas)

1. **CSS escopado.** Em SPA, o CSS importado por uma tela **continua na página** quando você
   navega. Por isso o elemento raiz de cada tela tem uma classe própria (`.login-page`) e todo o
   CSS fica dentro dela.
2. **Nada de valores soltos.** Use `var(--color-primary)`, `var(--space-3)` etc. (tokens do Design System).
3. **Dados de usuário nunca entram por `innerHTML`.** Posts, comentários e nomes (rede social!) devem
   ser inseridos com `textContent` ou `createElement`, senão abrem brecha para XSS.
4. **Mobile first.** A plataforma precisa ser responsiva (Matriz CSD): escreva o CSS base para celular
   e use `@media (min-width: ...)` para telas maiores.

## Decisões em aberto (para o time)

- **Login único ou separado para o ADM?** O esqueleto usa um login só; o perfil vem da conta.
- **Rotas `#/` ou `/`?** Para URLs sem `#` é preciso configurar a hospedagem (fallback para `index.html`).
- **Contrato da API** (`POST /auth/login` etc.): combinar com quem fizer o back-end. Está comentado em `auth.service.js`.

## Próximos passos

1. Colar os tokens do Design System em `src/styles/tokens.css`.
2. Ajustar os layouts (`src/layouts/`).
3. Criar as telas, começando por `login`, `cadastro` e `home`.
4. Quando o back-end existir: `VITE_USE_MOCKS=false` e `VITE_API_URL`.
