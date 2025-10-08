/*
  # Corrigir Recursão Infinita nas Políticas RLS

  1. Problema
    - Políticas RLS com recursão infinita na tabela `profiles`
    - Condições que fazem referência circular à própria tabela

  2. Solução
    - Remover todas as políticas problemáticas
    - Criar políticas simples e diretas
    - Usar apenas `auth.uid()` para verificações de usuário
*/

-- Remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Admins podem atualizar perfis" ON profiles;
DROP POLICY IF EXISTS "Admins podem deletar perfis" ON profiles;

-- Garantir que RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política simples para usuários verem seu próprio perfil
CREATE POLICY "users_can_view_own_profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política simples para usuários atualizarem seu próprio perfil
CREATE POLICY "users_can_update_own_profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para admins verem todos os perfis (usando auth.jwt())
CREATE POLICY "admins_can_view_all_profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (auth.jwt() ->> 'email') = 'radiologiativa@gmail.com'
  );

-- Política para admins atualizarem qualquer perfil
CREATE POLICY "admins_can_update_all_profiles" ON profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'radiologiativa@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'radiologiativa@gmail.com');

-- Política para admins deletarem qualquer perfil
CREATE POLICY "admins_can_delete_all_profiles" ON profiles
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'radiologiativa@gmail.com');

-- Política para inserção de novos perfis (apenas pelo sistema)
CREATE POLICY "system_can_insert_profiles" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);