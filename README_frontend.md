# 📚 Documentação para o Frontend — Consumo da API EliteTracker

## 🌐 URL do Backend

- **Local:** `http://localhost:4000`
- **Produção:** (ajuste conforme o deploy)

---

## 🔒 CORS Habilitado

O backend está configurado para aceitar requisições **apenas** da origem:
```
http://localhost:5173
```
Portanto, todas as requisições feitas a partir do seu frontend local (por exemplo, um projeto Vite/React rodando nessa porta) serão aceitas normalmente.

---

## 🚦 Como fazer requisições

### Exemplo com `fetch`:

```js
// Exemplo de requisição GET autenticada (Firebase)
fetch('http://localhost:4000/api/v1/habits', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer SEU_FIREBASE_ID_TOKEN'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Exemplo com `axios`:

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  // Não precisa configurar headers de CORS manualmente!
});

api.get('/api/v1/habits', {
  headers: {
    Authorization: `Bearer SEU_FIREBASE_ID_TOKEN`
  }
}).then(res => {
  console.log(res.data);
});
```

---

## ⚠️ Observações Importantes

- **Não é necessário configurar CORS no frontend.** O backend já está preparado para aceitar as requisições.
- **Sempre envie o token de autenticação** (Firebase ou JWT) no header `Authorization` para acessar rotas privadas.
- Se for acessar de produção, peça para o backend liberar o domínio de produção no CORS.

---

## 🛠️ Erros comuns

- **CORS error:**  
  Se tentar acessar de uma origem diferente de `http://localhost:5173`, o navegador irá bloquear a requisição.
- **401 Unauthorized:**  
  Verifique se está enviando o token correto no header `Authorization`.

---

## 📬 Dúvidas?

Se precisar liberar mais origens ou tiver problemas de CORS, peça para o backend adicionar o domínio desejado na configuração do CORS. 