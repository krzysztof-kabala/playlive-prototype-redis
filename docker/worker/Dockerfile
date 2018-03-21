FROM node:9

ENV WORKDIR=/usr/src/app

# Create app directory
WORKDIR $WORKDIR

# build data
RUN date > /builddate
COPY ./service $WORKDIR/service
COPY ./node_modules $WORKDIR/node_modules

COPY ./worker.js $WORKDIR/
COPY package*.json $WORKDIR/

CMD [ "./worker.js" ]
