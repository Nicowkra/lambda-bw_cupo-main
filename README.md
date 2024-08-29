# Lambdas Cuponera

## Prisma

- Para usar el CLI de Prisma es necesario descargarlo primero e instalarlo globalmente con npm i -g prisma
- Si la base de datos es nueva, realizar un `prisma migrate deploy` primero.
- Al hacer modificaciones al schema de Prisma, es necesario primero generar la migración usando `prisma migrate dev --create-only` (en un ambiente local) y después si está todo correcto `prisma migrate deploy`.
- Para generar localmente el schema en VSCode, usar `prisma generate`.
- Para reiniciar la DB completamente, borrando los datos `prisma migrate reset`. <u><b>Usar con discreción!</b></u>
- Para tener un visualizador de la base de datos con sus tablas y entries, usar `prisma studio`

### Importante
- Las migraciones no deben borrarse una vez que fueron deployadas, puede generar errores en la DB.
- Al usar cualquier comando de `prisma migrate < comando >` tener en cuenta que se va a aplicar sobre la base de datos que esté en DATABASE_URL.

## Localmente

Para correr localmente la API, descomentar en 'serverless.yml' la linea del plugin `serverless-plugin-typescript` y `serverless-tscpaths`.

Correr `npm start`

## Deployment

1. Para empezar hay que forkear el repo y activar las Actions en el nuevo repo (yendo a la pestaña de Actions).

2. AWS:
- Crear una cuenta de servicio de AWS en IAM. Asignarle las politicas de permisos `bw-cupo-role`
- Crearle una access key a esa cuenta de servicio y anotar el KEY_ID y SECRET_KEY.
- Armar una nueva base de datos PostgreSQL 14.7 y guardar la URL, usuario y clave.

3. Setear las variables y secretos (.env.example) en la configuracion del repositorio para Actions.
4. Hacer un [deployment de Prisma](#prisma) y el schema en la nueva base de datos 

### Deployment source
https://dev.to/eddeee888/how-to-deploy-prisma-in-aws-lambda-with-serverless-1m76