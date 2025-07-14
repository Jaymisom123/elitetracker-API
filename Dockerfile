# Usa a imagem oficial do Node.js versão 18 como base
FROM node:18

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências (package.json e package-lock.json) para o container
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia todo o restante do código para dentro do container
COPY . .

# Expõe a porta 4000 (a mesma que sua API usa)
EXPOSE 4000

# Comando para iniciar a aplicação
CMD ["npm", "start"] 