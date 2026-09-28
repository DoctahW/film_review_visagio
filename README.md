<div align="center">

# One More Movie

[Rodando](#rodando) • [Estado atual](#estado-atual) • [Estrutura](#estrutura-do-projeto) • [Banco de dados](#banco-de-dados-e-migrações) • [Contribuir](#contribuir)

![Em desenvolvimento](https://img.shields.io/badge/status-em%20desenvolvimento-orange?style=flat-square)
![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)

</div>

---

### Sumário
- [Introdução](#introdução)
- [Estado atual](#estado-atual)
- [Stack](#stack)
- [Rodando](#rodando)
- [Testes e qualidade](#testes-e-qualidade)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Banco de dados e migrações](#banco-de-dados-e-migrações)
- [Contribuir](#contribuir)


# Introdução

O One More Movie é um catálogo de filmes com avaliações de usuários, feito para
a atividade do **RocketLab 2026.2** da Visagio. Um backend em FastAPI expõe a
API de filmes, gêneros e avaliações sobre um banco em esquema estrela, e um
frontend em React tem um site público para navegar pelo catálogo e uma área
administrativa para manter os filmes.

Este README documenta o que **existe e funciona agora**.


# Estado atual

O que já está implementado e testado:

- **Carga dos CSVs**: um script de seed lê os CSVs da camada Diamond e
  popula o banco. A tabela de resumo das avaliações (`dim_reviews`) não vem do
  CSV: é recalculada a partir das avaliações individuais.
- **API de catálogo** (`/api/v1`):
  - `GET /movies`: lista paginada com busca por trecho do título ou nome de
    diretor, filtros por gênero, ano, só lançados e mínimo de votos, e
    ordenação por título, ano, média, popularidade ou lançamento.
  - `GET /movies/{id}`: detalhe do filme com elenco, gêneros e desempenho.
  - `POST`, `PUT` e `DELETE /movies`: cadastro, edição e remoção de filmes.
  - `GET` e `POST /movies/{id}/reviews`: avaliações paginadas de um filme e
    criação de avaliação (0–10), recalculando a média do filme.
  - `GET /reviews`: feed das avaliações mais recentes de todos os filmes.
  - `GET /genres`: gêneros em ordem alfabética.
- **Site público**: home com carrossel de filmes em alta e avaliações
  recentes, catálogo em grade com busca e filtros sincronizados com a URL, e
  página de detalhe do filme com elenco, desempenho, avaliações e formulário
  para avaliar.
- **Área administrativa** (`/admin`): lista de filmes, formulários de criação
  e edição com prévia do pôster, e remoção com confirmação.
- **Design system**: tema escuro, primitivos em Base UI (botões, campos,
  diálogos, toasts, menus, avaliação por estrelas, paginação…) documentados
  no Storybook.
- **Cliente da API gerado**: o frontend consome a API por um cliente gerado a
  partir do OpenAPI, com validação das respostas em Zod.

O que **ainda não existe**:

- Autenticação: a área administrativa é aberta para quem acessar `/admin`.
- CI e deploy: lint, typecheck e testes rodam só localmente.

# Stack

**Backend**

- [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/)
- [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (async, via aiosqlite) e [Alembic](https://alembic.sqlalchemy.org/) para as migrações
- [Pydantic](https://docs.pydantic.dev/) + pydantic-settings
- [pytest](https://docs.pytest.org/) e [Ruff](https://docs.astral.sh/ruff/)

**Frontend**

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [TanStack Router](https://tanstack.com/router), [Query](https://tanstack.com/query) e [Form](https://tanstack.com/form)
- [Tailwind CSS](https://tailwindcss.com/) v4 e [Base UI](https://base-ui.com/)
- [Hey API](https://heyapi.dev/) para gerar o cliente a partir do OpenAPI e [Zod](https://zod.dev/) para validar
- [Vitest](https://vitest.dev/) + Testing Library e [Storybook](https://storybook.js.org/)

# Rodando

Nos dois caminhos abaixo, os CSVs ficam em `backend/database_csv/` (eles não
são versionados). A carga espera estes arquivos:

```text
dim_movies.csv            dim_genres.csv            dim_companies.csv
dim_people.csv            bridge_movie_genre.csv    bridge_movie_company.csv
bridge_movie_person.csv   fact_movies_performance.csv
movies_reviews.csv
```

## Com Docker (recomendado)

**Pré-requisitos:** Docker com Compose v2.

Na raiz do repositório:

```sh
docker compose up --build
```

O backend aplica as migrações, carrega os CSVs se o banco estiver vazio e só
então sobe a API; o frontend espera a API ficar saudável para subir. Se faltar
algum CSV, o backend para com a lista dos arquivos ausentes em vez de subir uma
API vazia.

- Site: `http://localhost:5173` (área administrativa em `/admin`)
- API: `http://localhost:8000`, documentação em `/docs`

> [!NOTE]
> A primeira subida leva alguns minutos por causa da carga dos CSVs; as
> seguintes reaproveitam o banco. O código de `backend/` e `frontend/` é
> montado nos containers, então a API recarrega e o Vite faz HMR ao salvar.

Comandos úteis:

```sh
docker compose exec backend pytest                               # testes do backend
docker compose exec backend python -m app.scripts.seed --reset   # recarrega os CSVs
docker compose up --build -V                                     # após mudar dependências do frontend
docker compose down -v                                           # apaga também o banco
```

O banco fica no volume `db`, separado do `backend/rocketlab.db` usado no
caminho manual. `-V` recria o volume com o `node_modules` do container, que
senão continuaria com as dependências antigas.

## Manual

**Pré-requisitos:** Python 3.11+ e Node.js 20.19+ ou 22.12+.

### 1. Backend

```sh
cd backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cp .env.example .env
.venv/bin/alembic upgrade head
```

### 2. Carga dos CSVs

Com as migrações aplicadas e os CSVs em `backend/database_csv/`, rode a partir
de `backend/`:

```sh
.venv/bin/python -m app.scripts.seed
```

> [!NOTE]
> A carga leva alguns minutos. Se o banco já tiver dados, ela não faz nada (e
> não exige os CSVs); use `--reset` para apagar tudo e recarregar e
> `--data-dir` para ler os CSVs de outra pasta.

### 3. API

```sh
cd backend
.venv/bin/uvicorn app.main:app --reload
```

A API fica em `http://localhost:8000`, com a documentação em
`http://localhost:8000/docs`. `GET /health` responde `200` com o banco pronto e
`503` com o próximo passo se houver migrações pendentes ou o banco estiver sem
filmes; o mesmo aviso aparece no log quando a API sobe.

### 4. Frontend

Com a API no ar, em outro terminal:

```sh
cd frontend
npm install
cp .env.example .env
npm run dev
```

O site abre em `http://localhost:5173` e a área administrativa em
`http://localhost:5173/admin`. `VITE_API_URL` aponta para a API; o padrão já é
`http://localhost:8000`.

# Testes e qualidade

```sh
# backend
cd backend
.venv/bin/pytest
.venv/bin/ruff check .

# frontend
cd frontend
npm test
npm run typecheck
npm run lint
```

Os testes do backend são divididos em três camadas: `unit/` (sem I/O),
`integration/` (SQLite real) e `api/` (requisições HTTP contra a aplicação).

> [!IMPORTANT]
> `npm run dev` **não** roda typecheck — só `npm run build` roda. Rode
> `npm run typecheck` e `npm run lint` antes de abrir um PR.

Outros scripts úteis do frontend:

- `npm run storybook`: catálogo de componentes em `http://localhost:6006`.
- `npm run gen:api`: regenera o cliente da API (com a API no ar). Rode sempre
  que o contrato mudar; a saída em `src/lib/api/generated` é versionada e não
  deve ser editada à mão.
- `npm run format`: formata o código com Prettier.
- `npm run build`: typecheck + build de produção.

# Estrutura do projeto

```
one_more_movie/
├── compose.yaml           # Backend e frontend em containers para desenvolvimento
├── backend/
│   ├── app/
│   │   ├── api/           # Router v1 e dependências (DbSession)
│   │   ├── core/          # Configurações e logging
│   │   ├── db/            # Base ORM, engine, sessões e checagem do banco
│   │   ├── movies/        # Modelos, schemas, service e routers de filmes, gêneros e avaliações
│   │   └── scripts/       # Seed dos CSVs
│   ├── database_csv/      # CSVs da carga (não versionados)
│   ├── migrations/        # Ambiente e revisões Alembic
│   ├── tests/             # unit/, integration/ e api/
│   ├── Dockerfile
│   └── docker-entrypoint.sh  # Migrações + carga antes de subir a API
└── frontend/
    ├── .storybook/        # Configuração do Storybook
    ├── Dockerfile
    └── src/
        ├── app/           # Router, query client e estilos globais
        ├── components/    # Design system (ui/), formulários e layout
        ├── hooks/         # Hooks compartilhados (debounce, media query, cor do pôster)
        ├── lib/api/       # Cliente gerado a partir do OpenAPI
        ├── modules/       # movies, genres e reviews: queries, mutations, schemas e componentes
        └── routes/        # _site/ (público) e admin/
```

# Banco de dados e migrações

O modelo usa um esquema estrela para o catálogo de filmes:

- dimensões de filmes, gêneros, pessoas, produtoras e resumo de avaliações;
- fato de desempenho financeiro e de engajamento;
- tabelas de associação N:N entre filmes, gêneros, produtoras e pessoas;
- `movie_reviews`: uma avaliação individual por linha, na escala 0–10.

As tabelas são criadas exclusivamente pelo Alembic. Para evoluir os modelos,
crie uma revisão e aplique-a:

```sh
cd backend
.venv/bin/alembic revision --autogenerate -m "descreva a alteração"
.venv/bin/alembic upgrade head
```

O banco padrão é SQLite local em `backend/rocketlab.db`. Ajuste `DATABASE_URL`
no `.env` para usar outro banco compatível.

Atividade do RocketLab 2026.2 | Visagio.
