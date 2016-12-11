FROM node:6.9.1

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

#Create upload directory
RUN mkdir -p uploads

# Bundle app source
COPY . /usr/src/app

EXPOSE 3001
ENTRYPOINT [ "npm", "start", "--", "-d" ]
CMD [ "mysql://apiUser:5TYnyNsH8g@127.0.0.1/cookbook?flags=MULTI_STATEMENTS" ]
