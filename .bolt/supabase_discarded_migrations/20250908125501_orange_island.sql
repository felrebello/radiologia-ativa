/*
  # Corrigir usuário administrador

  1. Verificações
    - Verificar se o usuário admin existe
    - Verificar se o perfil está correto
    - Garantir que as credenciais funcionem

  2. Correções
    - Recriar usuário admin se necessário
    - Definir role como admin
    - Garantir que o email e senha estejam corretos
*/

-- Primeiro, vamos limpar qualquer usuário admin existente
DELETE FROM auth.users WHERE email = 'radiologiativa@gmail.com';

-- Inserir o usuário admin diretamente na tabela auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'radiologiativa@gmail.com',
  crypt('123456', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Administrador"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Inserir o perfil admin
INSERT INTO public.profiles (id, name, email, role)
SELECT 
  id,
  'Administrador',
  'radiologiativa@gmail.com',
  'admin'
FROM auth.users 
WHERE email = 'radiologiativa@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  name = 'Administrador',
  email = 'radiologiativa@gmail.com',
  role = 'admin';

-- Verificar se foi criado corretamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'radiologiativa@gmail.com'
  ) THEN
    RAISE EXCEPTION 'Falha ao criar usuário admin';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'radiologiativa@gmail.com' AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Falha ao criar perfil admin';
  END IF;
  
  RAISE NOTICE 'Usuário admin criado com sucesso!';
END $$;