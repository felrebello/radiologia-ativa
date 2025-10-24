# Deploy das Regras de Segurança do Firestore

## Problema Identificado

Quando você acessa a aplicação com o Chrome logado no seu email, tudo funciona porque o Firebase mantém a sessão autenticada em cache/cookies. Porém, ao mudar de perfil do Chrome ou usar guia anônima, os dados não aparecem porque:

1. Não há sessão autenticada
2. As regras de segurança do Firestore bloqueiam acesso não autenticado
3. A página de cadastro precisa exibir as turmas mesmo sem autenticação

## Solução

Foi criado o arquivo `firestore.rules` com regras de segurança que:

- Permitem **leitura pública** da coleção `classes` (turmas) para o formulário de registro
- Exigem **autenticação** para todas as outras operações e coleções
- Controlam permissões baseadas na role do usuário (admin/student)

## Como fazer o deploy das regras

### Opção 1: Via Firebase Console (Recomendado para teste rápido)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral, clique em "Firestore Database"
4. Clique na aba "Regras" (Rules)
5. Copie o conteúdo do arquivo `firestore.rules` e cole no editor
6. Clique em "Publicar" (Publish)

### Opção 2: Via Firebase CLI

Se você já tem o Firebase CLI instalado:

```bash
# 1. Fazer login no Firebase (se ainda não estiver logado)
firebase login

# 2. Selecionar o projeto (se ainda não estiver selecionado)
firebase use --add

# 3. Fazer deploy apenas das regras do Firestore
firebase deploy --only firestore:rules
```

### Opção 3: Deploy completo (regras + hosting)

```bash
firebase deploy
```

## Verificar se as regras foram aplicadas

Depois de fazer o deploy:

1. Abra o navegador em modo anônimo
2. Acesse a página de cadastro da aplicação
3. Verifique se a lista de turmas aparece no dropdown
4. Tente fazer login - os dados devem aparecer normalmente

## Estrutura das Regras

### Collections e suas permissões:

- **profiles**: Leitura para autenticados, escrita apenas pelo próprio usuário ou admin
- **classes**: **Leitura pública** (para cadastro), escrita apenas para admins
- **lessons**: Leitura para autenticados, escrita apenas para admins
- **attendances**: Leitura para autenticados, alunos podem marcar própria presença
- **enrollments**: Leitura para autenticados, alunos podem se matricular

## Importante

Após fazer o deploy das regras, limpe o cache do navegador ou use modo anônimo para testar, pois o navegador pode ter cacheado as tentativas de acesso anteriores.
