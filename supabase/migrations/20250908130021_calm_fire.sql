/*
  # Criar usuário administrador

  1. Usuário Admin
    - Email: radiologiativa@gmail.com
    - Senha: 123456
    - Role: admin
  
  2. Segurança
    - Usuário criado diretamente na tabela auth.users
    - Perfil criado automaticamente via trigger
    - Senha criptografada corretamente
*/

-- Primeiro, limpar qualquer usuário existente com este email
DELETE FROM auth.users WHERE email = 'radiologiativa@gmail.com';

-- Criar o usuário admin diretamente na tabela auth.users
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

-- Criar o perfil admin (caso o trigger não funcione)
INSERT INTO profiles (id, name, email, role)
SELECT 
  id,
  'Administrador',
  'radiologiativa@gmail.com',
  'admin'
FROM auth.users 
WHERE email = 'radiologiativa@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role;