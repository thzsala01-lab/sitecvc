# Plano — acesso e gestão CMC

## Objetivo
Evoluir o site institucional em uma experiência comercial completa: imagem hero atualizada e sem cache antigo, tipografia predominantemente Montserrat, área de acesso por e-mail/senha, recuperação segura por e-mail ou atendimento assistido via WhatsApp, e dashboard administrativo para gestão dos leads.

## Arquitetura
- **Frontend público:** mantém a landing page estática, com a Área de login apontando para `/login`, CTAs de cadastro e hero com arquivo de mídia versionado para impedir que CDNs preservem o vídeo antigo.
- **Autenticação local:** páginas `/login`, `/cadastro`, `/esqueci-senha`, `/redefinir-senha` e `/verificar-email`; senhas são derivadas com `scrypt` e nunca persistidas em texto aberto.
- **Sessões:** cookies `HttpOnly`, `Secure` e `SameSite=None`, contendo identificadores aleatórios cujo hash é armazenado no banco e expira em sete dias. Nenhuma credencial é exposta ao navegador.
- **Banco gerenciado:** novas tabelas aditivas para usuários, sessões e tokens de verificação/redefinição; a tabela de leads existente permanece preservada.
- **E-mail e WhatsApp:** o servidor usa a API do Resend, com `RESEND_API_KEY` e `RESEND_FROM_EMAIL` fornecidos por segredo protegido, para verificação e recuperação por e-mail. A alternativa de WhatsApp leva o usuário ao atendimento da CMC sem expor tokens de redefinição.
- **Dashboard:** rota `/admin` protegida por papel `admin`; o endereço `aurumnorthgroup@gmail.com` recebe esse papel após verificar sua conta. O painel apresenta total de leads, novos cadastros, interesses de revenda e uma lista recente para acompanhamento.

## Direção de design
- **Movimento:** editorial contemporâneo, mais limpo e digital, sem perder o acolhimento da CMC.
- **Princípios:** clareza comercial, confiança, calor doméstico e CTAs consistentes.
- **Tipografia:** Montserrat assume navegação, textos, formulários e botões; Libre Baskerville permanece apenas em títulos e ênfases editoriais.
- **Hero:** vídeo e poster com nome versionado, texto um pouco menor e leitura preservada por véu claro à esquerda.
- **Acesso e painel:** superfícies creme/brancas, bordô CMC nos pontos de ação, cartões arejados, estados de sucesso/erro claros e foco visível.

## Estrutura de arquivos
- `server/index.js`: API, migrações aditivas, sessão, e-mail, recuperação, catálogo e endpoints administrativos.
- `login.html`, `auth.js`, `auth.css`: páginas e interações de login, cadastro e recuperação.
- `admin.html`, `admin.js`, `admin.css`: painel administrativo protegido.
- `index.html`, `styles.css`, `main.js`: landing page, hero, fontes e links de entrada.
- `public/manus-routes.json`: manifestação das páginas públicas adicionais.
- `Dockerfile`: continua a compilar e servir o front-end e o servidor em produção.
