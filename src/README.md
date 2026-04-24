# Back-end (API REST)

## Objetivo

Este backend usa Spring Boot y MongoDB. La idea es mantenerlo con un estilo facil de leer y facil de explicar para alumnado de 2 de DAM.

## Estructura basica

- `controller`: recibe la peticion HTTP.
- `service`: aplica la logica de negocio.
- `repository`: accede a MongoDB.
- `entity`: representa lo que se guarda en base de datos.
- `dto`: define los datos que entran y salen por la API.
- `error` y `exception`: centralizan la gestion de errores.

## Como seguir el codigo

1. Empieza por un controlador, por ejemplo `UsersController`.
2. Sigue el metodo del servicio que usa ese controlador.
3. Mira el repositorio que consulta el servicio.
4. Revisa el DTO de entrada o salida para entender los datos.

## Tecnologias

- Java 17
- Spring Boot
- Spring Web MVC
- Spring Data MongoDB
- Lombok
- Gradle

## Criterios de codigo

- Metodos cortos.
- Nombres claros.
- Logica separada en pasos pequenos.
- Menos saturacion en cada clase.
- Sin cambiar el contrato actual del frontend.

## Ejecucion

Con MongoDB arrancado y desde la raiz del proyecto:

```bash
./gradlew bootRun
```

La API arranca por defecto en `http://localhost:8080`.
