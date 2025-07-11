# elitetracker

## Front-end Integration for GitHub Login with Firebase

### Step 1: Set Up Firebase in the Front-end

1. Install Firebase SDK in your front-end project:
   ```bash
   npm install firebase
   ```
2. Initialize Firebase in your front-end application using the Firebase configuration:

   ```javascript
   import { initializeApp } from 'firebase/app';

   const firebaseConfig = {
     apiKey: 'YOUR_API_KEY',
     authDomain: 'YOUR_AUTH_DOMAIN',
     projectId: 'YOUR_PROJECT_ID',
     storageBucket: 'YOUR_STORAGE_BUCKET',
     messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
     appId: 'YOUR_APP_ID',
   };

   const app = initializeApp(firebaseConfig);
   ```

### Step 2: Implement Authentication Flow

1. Redirect the user to GitHub for authentication.
2. After authentication, GitHub will redirect back to your application with an authorization code.
3. Send this authorization code to your back-end server to exchange it for an access token.

### Step 3: Communicate with the Back-end

1. Make a POST request to your back-end endpoint with the authorization code:
   ```javascript
   fetch('/api/auth/github', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({ code: authorizationCode }),
   })
     .then((response) => response.json())
     .then((data) => {
       // Handle the response, e.g., store the access token
     });
   ```

### Note

Ensure that your back-end is set up to handle the `/api/auth/github` endpoint and that it uses Firebase Admin SDK to verify the token and manage user sessions.

## Documentação das Rotas da API

### Rota Raiz

- **Endpoint**: `/`
- **Método**: GET
- **Descrição**: Retorna informações básicas sobre o projeto, incluindo nome, descrição e versão.

### Autenticação

- **Endpoint**: `/auth`
  - **Método**: GET
  - **Descrição**: Inicia o processo de autenticação.
- **Endpoint**: `/auth/callback`
  - **Método**: GET
  - **Descrição**: Lida com o retorno de chamada após a autenticação.

### Hábitos

- **Endpoint**: `/habits`
  - **Método**: GET
  - **Descrição**: Retorna uma lista de hábitos do usuário.
- **Endpoint**: `/habits/:id/metrics`
  - **Método**: GET
  - **Descrição**: Retorna métricas específicas para um hábito identificado por `id`.
- **Endpoint**: `/habits`
  - **Método**: POST
  - **Descrição**: Cria um novo hábito.
- **Endpoint**: `/habits/:id`
  - **Método**: DELETE
  - **Descrição**: Exclui um hábito identificado por `id`.
- **Endpoint**: `/habits/:id/toggle`
  - **Método**: PATCH
  - **Descrição**: Alterna o estado de um hábito identificado por `id`.

### Tempo de Foco

- **Endpoint**: `/focus-time`
  - **Método**: POST
  - **Descrição**: Cria um novo registro de tempo de foco.
- **Endpoint**: `/focus-time/metrics/month`
  - **Método**: GET
  - **Descrição**: Retorna métricas de tempo de foco por mês.
- **Endpoint**: `/focus-time`
  - **Método**: GET
  - **Descrição**: Retorna uma lista de registros de tempo de foco.

### Nota

Certifique-se de que o front-end se comunique corretamente com esses endpoints e lide com as respostas conforme esperado.

### Configuração do MongoDB

Para conectar ao MongoDB, use a seguinte URL de conexão no arquivo `.env`:

```plaintext
MONGO_URI="mongodb://localhost:27017/elitetracker"
```

Substitua `localhost:27017` e `elitetracker` conforme necessário para corresponder à sua configuração de banco de dados.
