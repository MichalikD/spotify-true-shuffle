FROM node:24-alpine
WORKDIR /app
COPY server/index.mjs server/spotify.mjs ./server/
COPY web/engine.mjs web/playlists.mjs ./web/
COPY scriptable/ ./scriptable/
COPY config/config.example.json ./config/
RUN mkdir /data && chown node:node /data
ENV HOST=0.0.0.0 PORT=8080 DATA_DIR=/data
USER node
EXPOSE 8080
CMD ["node", "server/index.mjs"]
