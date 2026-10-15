# Entregas — CMC Enxovais

## 1. Página inicial orientada à conversão
- Recriar a página pública da CMC Enxovais em português do Brasil, preservando a identidade comercial, os conteúdos institucionais e os canais existentes do site de referência.
- Apresentar proposta de valor, destaques da marca e chamadas reais para catálogo, revenda, representante e WhatsApp.
- Manter as informações comerciais essenciais: mais de 20 anos de atuação, atacado e varejo, origem em Lagoa da Prata/MG e atendimento próximo.

## 2. Navegação, categorias e seções comerciais
- Implementar navegação responsiva entre as principais seções institucionais e comerciais, com cabeçalho e rodapé consistentes.
- Exibir as categorias Cama, Mesa, Banho, Cozinha, Tapetes/Cortinas, Decoração, Eletroportáteis e utilidades domésticas e Roupas íntimas, com descrições e caminhos para consulta do catálogo.
- Disponibilizar área de revenda para lojistas e revendedores, com benefícios, orientação sobre análise de cadastro e CTA real para iniciar contato.
- Disponibilizar canal para representantes com informações pertinentes e CTA real para atendimento.

## 3. Contatos e integrações externas
- Integrar os contatos existentes: WhatsApp de vendas (37) 98842-4250, telefone (37) 3261-2665, Instagram @cmcenxovais e endereço Rua João Antônio de Oliveira, 1234 — Maria Fernanda I, Lagoa da Prata/MG, CEP 35592-104.
- Usar links reais para WhatsApp, telefone, Instagram e Google Maps.
- Manter CTA de catálogo virtual e cadastro para revender, apontando para caminhos funcionais dentro do projeto ou para o fluxo de contato quando o catálogo não estiver disponível.

## 4. Formulário de contato funcional
- Implementar formulário com nome completo, WhatsApp, e-mail, cidade, estado, interesse, mensagem, campo honeypot de website e aceite de contato/aviso de privacidade.
- Validar campos essenciais, exibir mensagens claras de erro e sucesso, impedir envio com dados inválidos e manter o contato de WhatsApp como alternativa direta.
- Garantir rótulos associados, foco visível, navegação por teclado, contraste adequado e textos alternativos para imagens.

## 5. Experiência responsiva e acessível
- Entregar experiência mobile-first, responsiva em diferentes tamanhos de tela e com hierarquia visual orientada à conversão.
- Aplicar estética editorial contemporânea, acolhedora e sofisticada, com composição assimétrica, paleta creme/bordô/verde profundo, tipografia serifada para títulos e sans-serif para interface, sem depender de imagens genéricas repetidas.
- Incluir interações suaves e úteis: menu mobile, animações discretas de entrada, estados de foco/hover e botão flutuante de WhatsApp sem prejudicar leitura ou acessibilidade.

## 6. Acesso por e-mail, senha e recuperação
- Criar área de login com e-mail e senha, página de cadastro, opção “Esqueci minha senha” e redefinição segura de senha.
- Persistir usuários, sessões e tokens com senhas derivadas por `scrypt`; jamais armazenar senhas ou tokens em texto aberto.
- Enviar verificação e recuperação de senha pelo e-mail cadastrado usando o remetente configurado no Resend; oferecer atendimento assistido pelo WhatsApp como alternativa.
- Bloquear o acesso ao catálogo para quem não possui sessão CMC, redirecionar para login e encaminhar usuários autenticados ao portal oficial de catálogo.

## 7. Dashboard administrativo
- Proteger `/admin` por papel administrativo e designar `aurumnorthgroup@gmail.com` como administrador após a verificação da conta.
- Exibir no dashboard contadores de leads, novos cadastros, pedidos de revenda e uma tabela de contatos recentes com interesse, cidade, estado e data.
- Garantir que páginas e APIs administrativas rejeitem visitantes não autenticados ou sem papel de administrador.

## 8. Refinamento visual principal
- Trocar a referência do hero por media versionada para impedir cache de uma foto ou vídeo antigo.
- Reduzir levemente a escala da frase principal do hero e priorizar Montserrat em navegação, texto, formulários, botões e área de acesso, mantendo a serifada em títulos e detalhes editoriais.
