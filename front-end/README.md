# Front-end (Interfaz de Usuario)

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black.svg) ![React](https://img.shields.io/badge/React-19.2.4-blue.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.2.0-38B2AC.svg)

## Descripción

Este directorio contiene el código fuente del front-end para el proyecto **TFG-Hospital**. Es una aplicación de página única (SPA) construida con **Next.js** (el framework de React) y **TypeScript**, diseñada para ofrecer una experiencia de usuario fluida, moderna y totalmente responsiva.

## Tecnologías Utilizadas

- **Framework**: Next.js 16.1.6
- **Lenguaje**: TypeScript 5.7.3
- **Librería de UI**: React 19.2.4
- **Estilos**:
  - **Tailwind CSS**: para un diseño rápido y personalizable basado en utilidades.
  - **shadcn/ui** y **Radix UI**: para un conjunto de componentes de UI accesibles y de alta calidad.
- **Gestión de Estado y Datos**:
  - **SWR**: para el fetching de datos y la gestión del estado remoto.
  - **Axios**: como cliente HTTP para comunicarse con la API del back-end.
- **Formularios**:
  - **React Hook Form**: para la gestión de formularios.
  - **Zod**: para la validación de esquemas.
- **Gestor de Paquetes**: PNPM

## Prerrequisitos

- Node.js (versión 22 o superior recomendada).
- PNPM (puedes instalarlo con `npm install -g pnpm`).
- El back-end debe estar en ejecución para que la aplicación funcione correctamente.

## Configuración

1.  **Clonar el repositorio** (si no lo has hecho ya):
    ```bash
    git clone https://github.com/tu-usuario/TFG-Hospital.git
    cd TFG-Hospital/front-end
    ```

2.  **Configurar la URL de la API**:
    Crea un archivo `.env.local` en el directorio `front-end` y añade la siguiente variable de entorno para apuntar a tu API de back-end:
    ```
    NEXT_PUBLIC_API_URL=http://localhost:8080/api
    ```

## Instalación y Ejecución

1.  **Instalar dependencias**:
    Desde el directorio `front-end`, ejecuta el siguiente comando para instalar todas las dependencias del proyecto:
    ```bash
    pnpm install
    ```

2.  **Ejecutar en modo de desarrollo**:
    Para iniciar el servidor de desarrollo de Next.js, ejecuta:
    ```bash
    pnpm dev
    ```
    La aplicación estará disponible en `http://localhost:3000`. El servidor se recargará automáticamente cada vez que hagas cambios en el código.

3.  **Construir para producción**:
    Para crear una versión optimizada para producción, utiliza:
    ```bash
    pnpm build
    ```
    Y para iniciar el servidor de producción:
    ```bash
    pnpm start
    ```
