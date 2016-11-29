FROM node:6.9.1

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 3000
ENTRYPOINT [ "npm", "start", "--", "-d" ]
CMD [ "mysql://apiUser:5TYnyNsH8g@127.0.0.1/cookbook" ]
