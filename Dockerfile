FROM node:12.14.1

COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN mkdir -p /app
WORKDIR /app
ADD ./ /app

RUN npm cache clean --force
RUN npm i -g npm@6.13.4
RUN npm i -g pm2
RUN pm2 install pm2-logrotate
RUN npm install

ENV HOST 0.0.0.0
EXPOSE 4000

#CMD [ "pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
CMD [ "/usr/local/bin/entrypoint.sh" ]
