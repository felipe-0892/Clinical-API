# Guia: Subindo as Mudanças como Nova Branch

Este guia explica como versionar as alterações deste projeto usando Git, criando uma nova branch para isolar as mudanças do frontend e da documentação.

---

## Pré-requisitos

- Git instalado (`git --version` para verificar)
- Repositório já inicializado (caso contrário, veja o passo 0)

---

## Passo 0 — Inicializar o repositório (se ainda não foi feito)

```bash
cd Clinical-API
git init
git remote add origin <url-do-seu-repositorio>
```

> Se o repositório já existe e você clonou, pule este passo.

---

## Passo 1 — Verificar o estado atual

```bash
git status
```

Você deve ver os arquivos modificados ou novos. Exemplo esperado:

```
modified:   index.html
new file:   README.md
```

---

## Passo 2 — Garantir que o `.gitignore` está correto

Confirme que o arquivo `.gitignore` na raiz do projeto contém ao menos:

```gitignore
# Dependências
node_modules/

# Banco de dados local
clinica.sqlite

# Build TypeScript
dist/

# Variáveis de ambiente
.env
.env.local

# Logs
*.log

# Editor
.vscode/
.idea/
```

Se precisar editar:

```bash
# Abra e edite o .gitignore com seu editor
code .gitignore
```

Depois de editar, salve. O Git ignorará esses arquivos automaticamente.

---

## Passo 3 — Criar a nova branch

Convenção de nome recomendada: `feat/` para novas funcionalidades, `refactor/` para melhorias.

```bash
git checkout -b feat/frontend-tailwind-docs
```

Isso cria a branch **e já troca para ela**. Você pode confirmar com:

```bash
git branch
# * feat/frontend-tailwind-docs
#   main
```

---

## Passo 4 — Adicionar os arquivos ao stage

```bash
# Adicionar apenas os arquivos alterados nesta mudança
git add index.html README.md .gitignore
```

Ou, se quiser adicionar tudo de uma vez:

```bash
git add .
```

> Atenção: use `git add .` apenas se tiver certeza de que o `.gitignore` está correto para não versionar arquivos indesejados como `clinica.sqlite` ou `node_modules/`.

---

## Passo 5 — Fazer o commit

```bash
git commit -m "feat: migra frontend para Tailwind CSS via CDN e adiciona documentação"
```

Boas práticas para mensagem de commit:
- Use o prefixo: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Seja descritivo mas conciso
- Use o presente: "adiciona" e não "adicionado"

---

## Passo 6 — Enviar a branch para o repositório remoto

```bash
git push origin feat/frontend-tailwind-docs
```

Se for o primeiro push desta branch, o Git pode pedir para setar o upstream:

```bash
git push --set-upstream origin feat/frontend-tailwind-docs
```

---

## Passo 7 — Abrir um Pull Request (PR)

Acesse o repositório no GitHub (ou GitLab/Bitbucket) e crie um Pull Request da branch `feat/frontend-tailwind-docs` para a `main`.

**Sugestão de título do PR:**
```
feat: frontend com Tailwind CSS CDN + README e docs
```

**Sugestão de descrição:**
```
## O que mudou
- index.html: migrado para Tailwind CSS via CDN com layout limpo e responsivo
- README.md: documentação completa do projeto, stack, endpoints e como rodar
- .gitignore: revisado para garantir que banco e build não são versionados

## Como testar
1. `npx ts-node server.ts`
2. Abrir index.html no navegador
3. Testar os botões de consulta e o formulário de atendimento
```

---

## Resumo dos Comandos

```bash
git checkout -b feat/frontend-tailwind-docs
git add index.html README.md .gitignore
git commit -m "feat: migra frontend para Tailwind CSS via CDN e adiciona documentação"
git push origin feat/frontend-tailwind-docs
```

---

## Dica: Ver histórico de commits

```bash
git log --oneline --graph --all
```

Isso exibe uma visualização compacta de todas as branches e commits.
