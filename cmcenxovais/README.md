# CMC Enxovais — projeto completo

Pacote de exportação do site CMC Enxovais. Inclui o código-fonte, páginas de autenticação e administração, API Express e as imagens realmente usadas no site. As imagens antes servidas pelo armazenamento Manus foram incluídas em `public/assets/` e referenciadas localmente nesta cópia. O build de produção é gerado localmente com `pnpm run build`.

## Requisitos

- Node.js 22
- pnpm 10.16.1 (via Corepack)
- Banco de dados MySQL compatível

## Instalação e execução

1. Instale as dependências: `corepack enable` e `pnpm install --frozen-lockfile`.
2. Copie `.env.example` para `.env` e preencha os valores reais. O arquivo `.env` não deve ser publicado nem enviado a terceiros.
3. Carregue as variáveis de ambiente no shell e inicie: `set -a; . ./.env; set +a; pnpm run dev`.
4. Abra `http://localhost:3000`.

O servidor cria as tabelas necessárias no MySQL ao iniciar. `DATABASE_URL` é obrigatório. Para confirmação de e-mail e recuperação de senha, configure também `RESEND_API_KEY` e `RESEND_FROM_EMAIL` com um remetente verificado no Resend. Defina `PUBLIC_ORIGIN` para a URL pública correta ao hospedar. `ADMIN_EMAIL` usa `aurumnorthgroup@gmail.com` como padrão.

Para compilar: `pnpm run build`. Para iniciar em produção: `set -a; . ./.env; set +a; pnpm start`. O Dockerfile da raiz também contém a receita de imagem de produção.

## Arquivos principais

- `index.html`, `styles.css`, `main.js`: página inicial e interações.
- `auth.html`, `auth.css`, `auth.js`: login e cadastro.
- `admin.html`, `admin.css`, `admin.js`: painel administrativo.
- `server/index.js`: API, autenticação, leads e integração de e-mail.
- `assets/` e `public/assets/`: imagens usadas pelo site.
- `dist/`: diretório de saída gerado pelo comando de build.

O Google Sites não executa o backend Express nem o banco de dados deste projeto. Para usar o site completo nesse serviço, é necessário hospedar o projeto com Node.js/MySQL e incorporar a URL pública por iframe; importar somente `index.html` não habilita login, formulários ou painel administrativo.

## Apresentação e vitrine de fotos

A abertura voltou à foto frontal da cama e da mulher, com entrada suave e movimento discreto. Após o carregamento da foto, a página aguarda cinco segundos visíveis e desce para a vitrine. Rolar, tocar, usar o teclado ou clicar em um controle cancela essa descida. Entradas por âncora e páginas já roladas preservam a posição do visitante.

A vitrine alterna a cada cinco segundos entre as quatro fotos reais em `public/assets/products/`: taça, chaleira, air fryer e almofadas. Há seleção direta, anterior, próximo e pausa. O temporizador só funciona com a vitrine visível e a aba ativa. A preferência por movimento reduzido desliga as animações e inicia a troca automática pausada. Os módulos e a dependência de Three.js foram removidos.

- `intro-presentation.js`: apresentação inicial, pausa e descida automática.
- `showcase.js`: carrossel de produtos e links de consulta.
- `presentation.css` e `showcase.css`: apresentação responsiva das fotos.

O backend, os formulários, a autenticação, as páginas administrativas e o conteúdo comercial após a vitrine permanecem preservados. A vitrine não altera preços nem cria itens comerciais.

## Validação da interface

Para a interface sem banco: `pnpm exec vite --host 0.0.0.0`. Esse modo não fornece a API Express. Para o site completo, use Node/MySQL e as variáveis descritas no início deste documento.

`pnpm run build` compila as páginas. Instale o navegador com `pnpm exec playwright install chromium` e execute `pnpm test`. Em máquinas com Chromium instalado, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test`.

Os testes verificam o intervalo da abertura, a descida, a troca automática, a pausa, as quatro fotos, a navegação manual e o layout móvel com movimento reduzido. A consulta inicial de sessão é isolada como usuário deslogado; MySQL e e-mail exigem as credenciais do ambiente e não são cobertos por esses testes.
