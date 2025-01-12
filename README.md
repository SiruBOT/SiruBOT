<h1 align="center">
SiruBOT GitHub Repository

![Node version](https://img.shields.io/badge/node-%3E%3D16.9-brightgreen)
![GitHub](https://img.shields.io/github/license/SiruBOT/SiruBOT)
[![Run eslint](https://github.com/SiruBOT/SiruBOT/actions/workflows/lint.yml/badge.svg?branch=main)](https://github.com/SiruBOT/SiruBOT/actions/workflows/lint.yml)
[![Typescript build](https://github.com/SiruBOT/SiruBOT/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/SiruBOT/SiruBOT/actions/workflows/node.js.yml)

</h1>

Want to use your bot rather than host it? [Invite to your guild!](https://discordapp.com/api/oauth2/authorize?client_id=426722888293548032&permissions=277062404416&scope=bot+applications.commands)

## Selfhost
 1. Create your discord application
 2. Change following lines in docker-compose.yml
 ```yml
 # docker-compose.yml / mongodb
   environment:
    MONGO_INITDB_ROOT_USERNAME: root
    MONGO_INITDB_ROOT_PASSWORD: password
 # docker-compose.yml / mariadb
   environment:
    MARIADB_ROOT_PASSWORD: super-secret-passwd
    MARIADB_DATABASE: siru
 ```
 3. Change file name settings.inc.yml to settings.yml
 ```sh
 mv settings.inc.yml settings.yml
 ```
