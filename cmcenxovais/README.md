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

## Experiência 3D real

A página inicial usa Three.js e WebGL2 para renderizar uma casa e os produtos como malhas volumétricas. A câmera começa no exterior, atravessa a sala e o corredor e para diante da porta do quarto. O botão **Clique para entrar**, acessível por teclado, ou um clique na própria porta abre a folha no eixo das dobradiças e conduz a câmera ao quarto. Há pausa, repetição e acesso direto aos produtos; a visita não bloqueia a navegação do site.

Na vitrine, arraste para girar os modelos em 360°, use dois dedos para aproximar no celular ou use o teclado: setas giram, `+`/`-` aproximam e `R` restaura a vista. A roda do mouse só controla o zoom depois de focar o visualizador. As demonstrações podem ser pausadas e repetidas:

- **Taça âmbar:** volume, haste, base e facetas geométricas; não recebe água.
- **Chaleira:** corpo transparente, tampa, alça, bico, água volumétrica, inclinação e fluxo segmentado em 3D para um **copo liso auxiliar**.
- **Air fryer:** carcaça, dois cestos com volume e puxadores, com abertura e fechamento independentes nas suas guias.
- **Almofada:** malha com espessura e costura; a demonstração comprime os vértices e depois restaura a forma. A estampa frontal vem da foto fornecida, aplicada como textura UV sobre a malha 3D; não há plano da fotografia simulando o produto.
- **Toalha:** malha fechada com espessura que se transforma de espiral enrolada em tecido aberto. É um estudo genérico de movimento, sem novo SKU, preço, medida ou especificação comercial.

### Referências e limites dos modelos

Não foram fornecidos arquivos CAD/glTF nem medidas ou vistas completas. Os modelos são reconstruções visuais das formas observáveis nas fotos, em unidades normalizadas. Não são réplicas dimensionais certificadas do fabricante. Superfícies não fotografadas ficam neutras; a parte interna dos cestos é simplificada, sem reproduzir componentes técnicos não documentados. As demonstrações de água e tecido são animações geométricas, não simulações físicas de desempenho do produto. Para fidelidade dimensional, as fábricas em `three/product-models.js` podem ser substituídas por modelos aprovados e medidos.

A casa é um ambiente autoral para a visita. Vídeos, GIFs e fotografias da casa/produto não são usados como substitutos da geometria. Texturas de tecido e inscrições são materiais de superfície; luzes, câmera, sombras, objetos, líquidos e deformações são renderizados em tempo real.

### Estrutura e desempenho

- `intro-3d.js` e `three/house-view.js`: carregamento da casa, estados da visita, câmera e porta.
- `three/house-model.js`: arquitetura, mobiliário e funções de trajetória testáveis.
- `showcase.js` e `three/product-view.js`: seleção, carregamento sob demanda, órbita, zoom, demonstrações e teclado.
- `three/product-models.js`: geometrias e animações dos cinco objetos.
- `three/runtime.js`: renderer, iluminação, sombras e limite de resolução. A resolução se adapta ao tamanho da tela e é reduzida em renderizadores por software. A resolução da refração e das sombras também é limitada.

O código dos produtos só é carregado quando a vitrine entra na tela. Os modelos são criados localmente, sem downloads de arquivos 3D grandes. As renderizações param fora da tela ou com a aba oculta; produtos parados são renderizados sob demanda. Geometrias, materiais e texturas do modelo anterior são liberados ao trocar de produto. A preferência de movimento reduzido leva direto à porta fechada, mantendo a entrada por clique. Sem WebGL2, os links e demais páginas continuam disponíveis, sem apresentar fotografias como se fossem 3D.

O backend, os formulários, a autenticação, as páginas administrativas e o conteúdo comercial após a vitrine permanecem preservados. A vitrine não altera preços nem cria itens comerciais. O link de catálogo continua usando o fluxo existente do servidor.

### Executar e testar

Para a interface, sem banco: `pnpm exec vite --host 0.0.0.0`. Esse modo não fornece a API Express. Para o site completo, use Node/MySQL e as variáveis descritas no início deste documento.

- `pnpm run build`: compila as três páginas existentes e os módulos 3D separados.
- `pnpm test`: testa os volumes, a porta, o caminho da câmera, as guias das gavetas, o copo correto, a deformação e o desenrolar do tecido.
- `pnpm exec playwright install chromium` e `pnpm run test:browser`: testa o percurso real em WebGL, o clique de entrada, a órbita, as demonstrações, pausa, celular, movimento reduzido e ausência de WebGL. Em máquinas com Chromium instalado, pode-se usar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm run test:browser`.

Os testes de navegador isolam a consulta inicial de sessão como usuário deslogado; não simulam sucesso de login nem de compras. A integração MySQL/e-mail requer as credenciais do ambiente e não é coberta pelos testes visuais.
