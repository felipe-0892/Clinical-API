# 🏥 Clinical API

API REST para gerenciamento de atendimentos clínicos, construída com **Node.js**, **TypeScript**, **Express** e **SQLite**. Conta com autenticação via **JWT** e um painel frontend completo em HTML + Tailwind CSS.

---

## Índice

- [Visão Geral](#visão-geral)
- [Stack](#stack)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Banco de Dados](#banco-de-dados)
- [Autenticação JWT](#autenticação-jwt)
- [Endpoints da API](#endpoints-da-api)
- [Frontend — Painel](#frontend--painel)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Variáveis e Configurações](#variáveis-e-configurações)
- [Observações](#observações)

---

## Visão Geral

O projeto simula o backend de uma clínica simples, permitindo registrar pacientes, consultas e sintomas via API REST. O acesso ao painel e a todos os endpoints (exceto o login) é protegido por **JSON Web Token (JWT)**. O frontend consome a API diretamente via `fetch`, sem frameworks adicionais.

---

## Stack

| Camada         | Tecnologia                        |
|----------------|-----------------------------------|
| Servidor       | Node.js 18+ + Express 5           |
| Linguagem      | TypeScript                        |
| Banco de dados | SQLite 3 (arquivo local)          |
| Autenticação   | JSON Web Token (jsonwebtoken)     |
| Frontend       | HTML + Tailwind CSS (CDN)         |
| Execução dev   | ts-node                           |
| Tipagem        | @types/node, @types/express, etc. |

---

## Estrutura do Projeto

```
Clinical-API/
├── dist/               # Código compilado (gerado pelo tsc)
├── node_modules/
├── .gitignore
├── clinica.sqlite      # Banco de dados local (gerado em runtime)
├── index.html          # Frontend do painel (tela de login + painel)
├── package.json
├── package-lock.json
├── server.ts           # Servidor principal + rotas + middleware JWT
├── tsconfig.json
└── README.md
```

---

## Banco de Dados

O SQLite é inicializado e migrado automaticamente na primeira execução. As tabelas criadas são:

### Tabelas

**`pacientes`**
| Coluna | Tipo    | Descrição              |
|--------|---------|------------------------|
| id     | INTEGER | Chave primária (auto)  |
| nome   | TEXT    | Nome do paciente       |

**`consultas`**
| Coluna        | Tipo    | Descrição                        |
|---------------|---------|----------------------------------|
| id            | INTEGER | Chave primária (auto)            |
| paciente_id   | INTEGER | FK → pacientes.id                |
| data_consulta | TEXT    | Data no formato `YYYY-MM-DD`     |
| medico        | TEXT    | Nome do médico responsável       |
| prontuario    | TEXT    | Observações clínicas (opcional)  |

**`sintomas`**
| Coluna    | Tipo    | Descrição             |
|-----------|---------|-----------------------|
| id        | INTEGER | Chave primária (auto) |
| descricao | TEXT    | Nome do sintoma       |

**`consulta_sintoma`** *(relação N:N)*
| Coluna      | Tipo    | Descrição          |
|-------------|---------|--------------------|
| consulta_id | INTEGER | FK → consultas.id  |
| sintoma_id  | INTEGER | FK → sintomas.id   |

### Dados de exemplo

Inseridos automaticamente se o banco estiver vazio:

- **Pacientes:** Ana, Carlos, Beatriz
- **Sintomas:** Febre, Dor de cabeça, Tosse
- **Consultas:** 4 registros entre abril/2026, com médicos e prontuários distintos

---

## Autenticação JWT

Todos os endpoints da API (exceto `GET /` e `POST /api/login`) exigem um token JWT válido no header `Authorization`.

### Fluxo de autenticação

```
Cliente                          Servidor
  |                                  |
  |  POST /api/login                 |
  |  { email, senha }  ─────────────>|
  |                                  |  Valida credenciais
  |  { token, usuario } <────────────|  Gera JWT (8h de validade)
  |                                  |
  |  GET /api/atendimentos           |
  |  Authorization: Bearer <token> ─>|
  |                                  |  Verifica assinatura JWT
  |  [ ...atendimentos ] <───────────|  Retorna dados protegidos
```

### Header obrigatório nas rotas protegidas

```
Authorization: Bearer <seu_token_jwt>
```

### Credenciais de teste

> ⚠️ Para uso exclusivo em ambiente de desenvolvimento.

| Campo | Valor                  |
|-------|------------------------|
| Email | `admin@teste.com.br`   |
| Senha | `admin123`             |

### Comportamento de erros de autenticação

| Situação               | HTTP Status | Mensagem                        |
|------------------------|-------------|---------------------------------|
| Token ausente          | `401`       | `Token não fornecido.`          |
| Token inválido/expirado| `403`       | `Token inválido ou expirado.`   |
| Credenciais incorretas | `401`       | `E-mail ou senha incorretos.`   |

---

## Endpoints da API

### `GET /`
Verifica se a API está online.

**Resposta:**
```
✅ API funcionando!
```

---

### `POST /api/login`
Autentica o usuário e retorna um token JWT. **Rota pública — não exige token.**

**Body (JSON):**
```json
{
  "email": "admin@teste.com.br",
  "senha": "admin123"
}
```

**Resposta de sucesso `200`:**
```json
{
  "message": "Login realizado com sucesso!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "email": "admin@teste.com.br",
    "nome": "Administrador"
  }
}
```

**Resposta de erro `401`:**
```json
{
  "error": "E-mail ou senha incorretos."
}
```

---

### `GET /api/atendimentos` 🔒
Lista todos os atendimentos registrados, com paciente, médico, sintomas, prontuário e data.

**Resposta `200`:**
```json
[
  {
    "id": 1,
    "paciente": "Ana",
    "medico": "Dra. Ana Lima",
    "prontuario": "Paciente relata febre há 2 dias",
    "data_consulta": "2026-04-10",
    "sintomas": "Febre, Dor de cabeça"
  }
]
```

---

### `POST /api/atendimento` 🔒
Registra um novo atendimento. Cria o paciente e/ou sintoma automaticamente caso não existam.

**Body (JSON):**
```json
{
  "nome": "Maria Silva",
  "sintoma": "Tosse",
  "medico": "Dr. Pedro Costa",
  "prontuario": "Tosse seca há 3 dias"
}
```

> `medico` e `prontuario` são opcionais. O médico padrão é `"Dr. João"`.

**Validação:** `nome` deve conter apenas letras e espaços (sem números ou caracteres especiais).

**Resposta de sucesso `200`:**
```json
{
  "message": "✅ Atendimento registrado com sucesso!",
  "paciente": "Maria Silva",
  "sintoma": "Tosse",
  "medico": "Dr. Pedro Costa",
  "prontuario": "Tosse seca há 3 dias",
  "data": "2026-05-18"
}
```

**Resposta de erro `400`:**
```json
{
  "error": "Nome inválido. Use apenas letras."
}
```

---

### `PUT /api/atendimento/:id` 🔒
Atualiza os dados de um atendimento existente (paciente, sintoma, médico e prontuário).

**Parâmetro de rota:** `id` — ID da consulta

**Body (JSON):**
```json
{
  "nome": "Maria Silva",
  "sintoma": "Febre",
  "medico": "Dra. Ana Lima",
  "prontuario": "Febre controlada após medicação"
}
```

**Resposta de sucesso `200`:**
```json
{
  "message": "✅ Atendimento atualizado com sucesso!",
  "id": 1,
  "nome": "Maria Silva",
  "sintoma": "Febre",
  "medico": "Dra. Ana Lima",
  "prontuario": "Febre controlada após medicação"
}
```

**Resposta de erro `404`:**
```json
{
  "error": "Consulta não encontrada."
}
```

---

### `DELETE /api/atendimento/:id` 🔒
Remove permanentemente um atendimento e seus vínculos de sintoma.

**Parâmetro de rota:** `id` — ID da consulta

**Resposta de sucesso `200`:**
```json
{
  "message": "✅ Atendimento excluído com sucesso!",
  "id": 3
}
```

---

### Rotas de consulta SQL analítica 🔒

Estas rotas expõem queries SQL específicas para fins didáticos/analíticos.

| Rota             | Descrição                                                |
|------------------|----------------------------------------------------------|
| `GET /api/etapa5`  | Lista todos os pacientes                               |
| `GET /api/etapa6`  | Nome do paciente + data de cada consulta (JOIN simples)|
| `GET /api/etapa7`  | Nome do paciente + sintoma (JOIN com 4 tabelas)        |
| `GET /api/etapa8`  | Pacientes que tiveram o sintoma **Febre**              |
| `GET /api/etapa9`  | Total de consultas agrupado por paciente               |
| `GET /api/etapa10` | Sintoma com maior frequência de ocorrências            |

**Exemplo — `GET /api/etapa10`:**
```json
{
  "descricao": "Febre",
  "frequencia": 3
}
```

---

## Frontend — Painel

O `index.html` é o painel completo da aplicação. Não requer build — usa **Tailwind CSS via CDN**.

### Tela de Login

- Formulário com e-mail e senha
- Botão para mostrar/ocultar a senha
- Card informativo com as credenciais de teste
- Token armazenado em `sessionStorage` após autenticação
- Suporte a `Enter` para submeter o formulário

### Painel Principal

Exibido apenas após login bem-sucedido. Contém:

- **Header** com nome do usuário logado e **botão Sair**
- **Formulário** para registrar novo atendimento (paciente, sintoma, médico, prontuário)
- **Tabela** com todos os atendimentos, busca em tempo real e recarregamento manual
- **Modal Visualizar** — exibe todos os detalhes do atendimento
- **Modal Editar** — edita os campos do atendimento inline
- **Modal Excluir** — confirmação antes de deletar
- **Toast** de feedback (sucesso / erro) com barra de progresso animada

### Comportamento de segurança no frontend

- Todas as requisições incluem `Authorization: Bearer <token>` automaticamente
- Se qualquer requisição retornar `401` ou `403`, o usuário é deslogado e redirecionado para o login
- O token é removido do `sessionStorage` ao clicar em **Sair**

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- npm

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>
cd Clinical-API

# Instale as dependências
npm install
```

### Execução em desenvolvimento

```bash
npx ts-node server.ts
```

O servidor sobe em `http://localhost:3000`.

Abra o `index.html` diretamente no navegador (ou acesse via `http://localhost:3000/index.html` — o Express serve arquivos estáticos do diretório raiz).

### Compilação para produção

```bash
npx tsc
node dist/server.js
```

---

## Variáveis e Configurações

| Configuração   | Local       | Valor padrão                          | Descrição                        |
|----------------|-------------|---------------------------------------|----------------------------------|
| `JWT_SECRET`   | `server.ts` | `"clinical_api_secret_key_2024"`      | Chave de assinatura do JWT       |
| `PORT`         | `server.ts` | `3000`                                | Porta do servidor Express        |
| Banco de dados | `server.ts` | `./clinica.sqlite`                    | Caminho do arquivo SQLite        |
| Token expira   | `server.ts` | `8h`                                  | Validade do JWT após login       |

> ⚠️ Em produção, substitua `JWT_SECRET` por uma variável de ambiente segura:
> ```ts
> const JWT_SECRET = process.env.JWT_SECRET ?? "fallback_inseguro";
> ```

---

## Observações

- O arquivo `clinica.sqlite` é gerado localmente e deve estar no `.gitignore`.
- A pasta `dist/` (saída do TypeScript compilado) também deve estar no `.gitignore`.
- O projeto não usa ORM — todas as queries são **SQL puro** via `sqlite3`.
- A autenticação é simples e de usuário único, adequada apenas para testes e fins didáticos.
- O frontend usa `sessionStorage`, portanto o token é perdido ao fechar a aba/navegador (comportamento intencional).