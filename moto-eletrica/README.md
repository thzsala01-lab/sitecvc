# Site de motos elétricas

Site estático responsivo com seis fotografias enviadas pela loja, vitrine com ampliação de imagens e atendimento pelo WhatsApp +55 (37) 98811-3709. Os botões de cada opção levam uma mensagem específica ao WhatsApp. Nenhum envio é automático.

Para abrir, extraia o ZIP e clique em `index.html`. Para desenvolvimento:

```sh
cd /workspace/sitecvc/moto-eletrica
python3 -m http.server 4173 --bind 0.0.0.0
```

Não requer banco de dados, instalação de dependências ou build. As fotos originais ficam em `assets/`, sem depender de hospedagem externa. A fonte online é opcional: o navegador usa a fonte alternativa quando estiver offline.

A publicação fornecida está vinculada nos botões do Instagram. Seu conteúdo não pôde ser consultado por bloqueio de acesso. O nome da loja ainda precisa ser informado para substituir a identificação genérica. Os títulos das fotos são descritivos: modelos, preços, estoque e características técnicas devem ser confirmados com a loja.
