This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Configuración de OpenAI

Para que el chat funcione correctamente, necesitas:

### 1. Obtener tu API Key
- Dirígete a [OpenAI Platform](https://platform.openai.com/api-keys)
- Inicia sesión con tu cuenta (o crea una)
- Genera una nueva API key en "API Keys"
- Copia la clave (solo podrás verla una vez)

### 2. Configurar la variable de entorno
- En la raíz del proyecto, edita el archivo `.env.local`
- Reemplaza `your_api_key_here` con tu API key:
	```
	OPENAI_API_KEY=sk-...tu-clave-aqui...
	```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Ejecutar el proyecto
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el chat en funcionamiento.

## Estructura del Proyecto

- `/app/page.tsx` - Página principal
- `/app/components/ChatComponent.tsx` - Componente del chat
- `/app/api/chat/route.ts` - Ruta API que comunica con OpenAI
- `.env.local` - Variables de entorno (incluir tu API key aquí)

## Modelo utilizado

El proyecto usa `gpt-4o-mini` de OpenAI, que es rápido y eficiente para conversaciones.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
