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

## Vitrine interativa 3D

A página inicial inclui uma apresentação de taça, chaleira, air fryer e almofada, inspirada no vídeo de referência fornecido: tipografia grande, fundos coloridos, produtos flutuantes e troca de cenas. Os objetos são modelos ilustrativos criados com Three.js, não réplicas de produtos do catálogo.

- Clique nos nomes ou nas setas para trocar o produto. A apresentação avança automaticamente a cada 7 segundos quando não está pausada nem em interação.
- Arraste o objeto ou foque a área 3D e use as setas do teclado para girar.
- O botão de pausa interrompe o movimento e a troca automática. A preferência de movimento reduzido é respeitada.
- A renderização só começa perto da seção e é suspensa fora dela ou com a aba oculta. Sem WebGL, o catálogo textual e os links de consulta continuam disponíveis.
- `showcase.js` contém os modelos e comportamentos; `showcase.css` contém o layout responsivo. Não é necessário baixar modelos ou usar uma API 3D.

Para trabalhar apenas na interface, sem banco de dados: `pnpm exec vite --host 0.0.0.0`. Esse modo permite avaliar a vitrine, mas não fornece a API de login, cadastro ou contatos; para essas funcionalidades, use o servidor e o MySQL descritos acima. A compilação segue sendo `pnpm run build`.

Validação desta alteração: build Vite e testes em Chromium de renderização dos quatro modelos, navegação, teclado, arraste, pausa, troca automática, layout móvel, movimento reduzido e fallback sem WebGL. A integração com MySQL e e-mail não foi validada nesta alteração visual.
