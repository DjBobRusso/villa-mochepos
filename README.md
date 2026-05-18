# Villa Moche - ERP/POS

## Estructura
- `index.html` - Frontend SPA (GitHub Pages)
- `server/` - Servidor Node.js Socket.IO (sincronización en tiempo real)

## Despliegue

### 1. Frontend (GitHub Pages)
1. Sube este repo a GitHub
2. Ve a Settings → Pages → Source: "Deploy from branch" → main → `/ (root)`
3. La app quedará en `https://[tu-user].github.io/[repo]/`

### 2. Servidor Sync (Render - gratis)
1. Crea cuenta en https://render.com
2. Conecta tu repo de GitHub
3. Crea nuevo "Web Service" y selecciona el repo
4. Render detectará automáticamente `render.yaml` o configura:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Render te dará una URL como `https://villa-moche-sync.onrender.com`

### 3. Conectar Frontend con Sync
1. Abre la app en GitHub Pages
2. Inicia sesión como Admin
3. Ve a Sistema → Sincronización Socket.io
4. Cambia la URL a la de Render (`https://villa-moche-sync.onrender.com`)
5. Click "Conectar"

## Local (XAMPP)
- Apache en `http://localhost` sirve `index.html`
- Node.js sync: `cd server && npm install && node server.js`
- Admin → Sistema → URL: `http://localhost:3001`

## Funciones
- Roles: Mozo, Cocina, Cajera, Admin
- Comandas separadas por plato con timer
- Carta digital pública (?mesa=ID)
- Sincronización multidispositivo en tiempo real
- Inventario con recetas y simulación
- Múltiples métodos de pago
- Historial de ventas
