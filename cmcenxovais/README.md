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

## Vitrine com fotos reais e efeito de profundidade

A abertura usa uma imagem editada para mostrar a mulher em pé e a cama frontal, com movimento suave, controle de pausa e link para descer até os produtos. A vitrine utiliza os quatro PNGs originais enviados pelo cliente, preservados em `public/assets/products/`: taça âmbar, chaleira BE.SMART, air fryer BE.SMART de duas gavetas e almofadas esportivas.

- A taça recebe luz e movimento suave; as almofadas flutuam levemente.
- As gavetas da air fryer são isoladas em camadas da foto original por máscaras CSS e deslizam para abrir e fechar.
- A chaleira inclina a própria foto em sincronia com o fluxo de água e o preenchimento da taça.
- As cenas usam fotos e perspectiva CSS; não oferecem rotação de 360 graus nem substituem os produtos por modelos inventados.
- Clique nos nomes ou nas setas para mudar de produto. A troca automática ocorre a cada 11 segundos sem interação.
- A pausa, a preferência de movimento reduzido e a visibilidade da aba/seção controlam as animações. No celular, arrastar horizontalmente ajusta a perspectiva e a rolagem vertical continua livre.
- `showcase.js` controla a vitrine; `product-scenes.js` e `product-scenes.css` definem as cenas; `hero-depth.js` controla a abertura. Não há dependência de WebGL ou API externa para apresentar os produtos.

Para trabalhar apenas na interface, sem banco de dados: `pnpm exec vite --host 0.0.0.0`. Esse modo não fornece a API de login, cadastro ou contatos; para essas funcionalidades, use o servidor e o MySQL descritos acima. A compilação segue sendo `pnpm run build`.
