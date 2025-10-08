/*
  # Criar tabela de perfis de usuários

  1. Nova Tabela
    - `profiles`
      - `id` (uuid, primary key, referencia auth.users)
      - `name` (text, nome do usuário)
      - `email` (text, email único)
      - `role` (text, 'admin' ou 'student')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `profiles`
    - Políticas para usuários verem próprios dados
    - Políticas para admins gerenciarem todos os perfis

  3. Automação
    - Trigger para criar perfil automaticamente quando usuário se registra
    - Função para detectar admin pelo email
*/

-- Criar tabela profiles se não existir
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Admins podem atualizar perfis" ON profiles;
DROP POLICY IF EXISTS "Admins podem deletar perfis" ON profiles;

-- Criar políticas de segurança
CREATE POLICY "Usuários podem ver próprio perfil"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid() AND profiles_1.role = 'admin'
  ));

CREATE POLICY "Admins podem atualizar perfis"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid() AND profiles_1.role = 'admin'
  ));

CREATE POLICY "Admins podem deletar perfis"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles profiles_1
    WHERE profiles_1.id = auth.uid() AND profiles_1.role = 'admin'
  ));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    CASE 
      WHEN NEW.email = 'radiologiativa@gmail.com' THEN 'admin'
      ELSE 'student'
    END
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Inserir usuário admin se não existir
DO $$
BEGIN
  -- Verificar se o perfil admin já existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'radiologiativa@gmail.com') THEN
    -- Inserir usuário admin diretamente na tabela profiles
    -- O usuário auth será criado quando fizer login pela primeira vez
    INSERT INTO profiles (id, name, email, role, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'Administrador',
      'radiologiativa@gmail.com',
      'admin',
      now(),
      now()
    );
  END IF;
END $$;