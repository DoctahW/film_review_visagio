FROM node:22-slim

# O usuário `node` da imagem tem UID 1000: arquivos gerados no bind mount (ex.: routeTree.gen.ts)
# ficam com o dono certo no host.
RUN mkdir /app && chown node:node /app
USER node
WORKDIR /app

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
