const { listUsers, getUser, createUser, updateUser, deleteUser } = require('../controllers/userControl');
const { User } = require('../models/model');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../index'); // Ajuste conforme sua estrutura

describe('Controlador de Usuários', () => {
  let token;
  let user;

  process.env.jwt_secret_key = 'alguma-senha-secreta';

  beforeAll(async () => {
    // Criar um usuário de teste para realizar as operações
    user = new User({
      name: 'Teste User',
      email: 'test@user.com',
      description: 'Descrição do usuário de teste',
      password: 'senha-secreta' // Adicionando o campo password
    });
    await user.save();
    
    // Criar um token JWT válido para testar autenticação
    token = jwt.sign({ _id: user._id, email: user.email, is_admin: true }, process.env.jwt_secret_key);
  });

  afterAll(async () => {
    // Limpar os dados após os testes
    await User.deleteMany({});
  });

  describe('Listagem de usuários', () => {
    it('Deve listar todos os usuários', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`); // Autenticação via token JWT

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].name).toBe('Teste User');
    });
  });

  describe('Obter usuário específico', () => {
    it('Deve retornar os dados do usuário com sucesso', async () => {
      const res = await request(app)
        .get(`/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Teste User');
      expect(res.body.email).toBe('test@user.com');
    });

    it('Deve retornar erro se o usuário não for encontrado', async () => {
      const res = await request(app)
        .get('/users/invalid_user_id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('Criar usuário', () => {
    it('Deve criar um novo usuário com sucesso', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Novo User',
          email: 'new@user.com',
          description: 'Descrição do novo usuário',
          password: 'nova-senha' // Adicionando o campo password
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Novo User');
      expect(res.body.email).toBe('new@user.com');
    });

    it('Deve retornar erro se dados inválidos forem fornecidos', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '', // Campo nome vazio (dado inválido)
          password: 'senha-fraca' // Adicionando um password válido
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('Atualizar usuário', () => {
    it('Deve atualizar as informações de um usuário', async () => {
      const res = await request(app)
        .put(`/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Descrição atualizada do usuário',
          password: 'senha-atualizada' // Adicionando o campo password
        });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('Descrição atualizada do usuário');
    });

    it('Deve retornar erro se tentar atualizar um usuário inexistente', async () => {
      const res = await request(app)
        .put('/users/invalid_user_id')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Nova descrição',
          password: 'senha-atualizada'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('Deletar usuário', () => {
    it('Deve deletar o usuário com sucesso', async () => {
      const res = await request(app)
        .delete(`/users/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Teste User');
    });

    it('Deve retornar erro se tentar deletar um usuário inexistente', async () => {
      const res = await request(app)
        .delete('/users/invalid_user_id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });
});
