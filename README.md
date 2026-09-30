# Carreras de caracoles

Una aplicación web con temática de apuestas en carreras de caracoles. Por ahora incluye el registro y el inicio de sesión (simulados en local) y un dashboard con el saldo del usuario, dos gráficas y la recarga de saldo mediante **SnailPay**, una pasarela de pago simulada.

Está hecha con React + Vite + TypeScript en el frontend, Express + TypeScript en el backend, y LocalStorage para guardar los usuarios, la sesión y el saldo.

---

## Cómo ejecutarlo

Hacen falta dos terminales, una para cada lado:

```bash
# Terminal 1: backend  ->  http://localhost:3001
cd backend
npm install
npm run dev

# Terminal 2: frontend  ->  http://localhost:5173
cd frontend
npm install
npm run dev
```

Para comprobar que el backend está vivo, abre `http://localhost:3001/api/health`: debe responder `{"status":"ok"}`.

Si el backend corre en otra dirección, el frontend lee la variable opcional `VITE_API_URL`. Si no existe, usa `http://localhost:3001/api`.

---

## Cómo está organizado

### Backend (`backend/src`)

Separé el código en capas para que cada archivo haga una sola cosa: la ruta dice qué URL existe, el controlador traduce la petición y el servicio contiene la lógica.

| Carpeta o archivo | Qué hace |
| --- | --- |
| `server.ts` | Abre el puerto. Lo dejé aparte de `app.ts` para poder probar la app sin levantar un servidor. |
| `app.ts` | Arma Express: `cors`, `express.json`, las rutas bajo `/api` y, al final, los manejadores de error. |
| `routes/` | Definen la URL y el método, sin lógica. `snailpay.routes.ts` valida el monto con Zod antes de llegar al controlador. |
| `controllers/` | Hacen de puente entre HTTP y el servicio. No tienen reglas de negocio. |
| `services/snailpay.service.ts` | La simulación de la pasarela: decide al azar si un cobro se aprueba o falla. |
| `middlewares/validate.ts` | Valida el cuerpo de la petición y responde 400 con el detalle de cada campo inválido. |
| `middlewares/errorHandler.ts` | Es el único sitio que decide cómo se le muestra un error al cliente. |
| `errors/AppError.ts` | Un error propio con código HTTP y un código corto (`PAYMENT_DECLINED`, por ejemplo). |
| `config/` y `__tests__/` | Existen, pero todavía están vacías. |

### Frontend (`frontend/src`)

| Carpeta o archivo | Qué hace |
| --- | --- |
| `main.tsx` y `App.tsx` | Arrancan la app y definen las rutas: `/login` y `/register` (públicas) y `/dashboard` (protegida). |
| `context/` | Guarda la sesión de forma global (`AuthProvider` y `useAuth`). Se lee de LocalStorage desde el primer render, así que al recargar no hay parpadeo hacia el login. |
| `components/RouteGuards.tsx` | Manda a `/login` a quien no tenga sesión, y al dashboard a quien ya la tenga si intenta abrir el login. |
| `pages/` | Las tres pantallas: `LoginPage`, `RegisterPage` y `DashboardPage`. |
| `components/` | Las piezas del dashboard: `BalanceCard`, `TopUpForm`, `BetsDonutChart` y `RaceWinsBarChart`, además de `FormField` para los formularios. |
| `hooks/useBalance.ts` | Expone el saldo y la acción de acreditar. |
| `services/authService.ts` | El "backend" simulado de usuarios y sesión, sobre LocalStorage. |
| `services/walletService.ts` | Lee y guarda el saldo de cada usuario. |
| `services/apiClient.ts` | El único punto por donde el frontend habla con el backend. Convierte cada respuesta en un error tipado. |
| `services/snailPayService.ts` | La llamada concreta a la pasarela. |
| `data/mockData.ts` | Los datos simulados de carreras y apuestas que alimentan las gráficas. |
| `utils/` | `password.ts` (hash), `validators.ts` (validación de formularios) y `storage.ts` (único acceso a LocalStorage). |

---

## Registro e inicio de sesión

Es una simulación local: el backend no participa y todo vive en LocalStorage.

- **Registro** con nombre completo, correo, contraseña y confirmación. Se valida que el nombre lleve al menos nombre y apellido, que el correo tenga un formato válido, que la contraseña tenga mínimo 8 caracteres con una letra y un número, y que las dos contraseñas coincidan. El formulario no pide ni procesa archivos.
- **Inicio y cierre de sesión** con correo y contraseña.
- **Persistencia:** la sesión se mantiene al recargar la página.
- **Dashboard protegido:** solo se puede entrar con una sesión activa.

### Cómo trato la contraseña

La contraseña nunca se guarda tal cual. Uso **PBKDF2-SHA256** con Web Crypto, sin librerías extra, con 210 000 iteraciones y una sal aleatoria de 16 bytes para cada usuario. Lo que queda guardado tiene este formato:

```
pbkdf2$sha256$iteraciones$sal(base64)$hash(base64)
```

Guardar los parámetros junto al hash tiene una ventaja: más adelante se pueden subir las iteraciones sin romper las cuentas que ya existen. Al verificar, comparo el hash byte a byte sin detenerme en el primer error, para que el tiempo de respuesta no revele en qué punto falló.

**Una limitación que prefiero dejar clara:** un hash guardado en el navegador sigue siendo accesible para quien tenga acceso al dispositivo. En un sistema real esto se resuelve en el servidor, con Argon2 o bcrypt y cookies `httpOnly`. Aquí es una simulación, como pedía el enunciado.

Dos detalles más: el error de login es siempre el mismo ("Correo o contraseña incorrectos") para no revelar qué correos están registrados, y la sesión solo guarda el id, el nombre y el correo del usuario, nunca el hash.

---

## Dashboard

Al iniciar sesión se ve el nombre del usuario, su saldo actual (todos empiezan en **$0**), una gráfica donut de apuestas ganadas y perdidas, una gráfica de barras con las victorias de cada caracol, la opción de cargar saldo con SnailPay y el botón de cerrar sesión. Las gráficas usan `recharts`.

### Datos simulados

El enunciado pide que no haya sección de apuestas ni lógica de carreras, así que todo son datos fijos y conteos. Las dos gráficas salen del **mismo conjunto de datos**, y esa es la razón por la que son coherentes entre sí:

- **6 caracoles:** Turbo, Babosa Veloz, Concha Ligera, Rayo Lento, Tortuguita y Gary.
- **6 carreras** durante el día, con un ganador en cada una. Eso da 6 victorias en total: Babosa Veloz 3, y Turbo, Tortuguita y Gary 1 cada uno.
- **12 apuestas**, dos por carrera. Una apuesta se considera ganada si su caracol ganó esa carrera, lo que da **5 ganadas y 7 perdidas**.

### Recarga con SnailPay

El frontend llama a `POST /api/snailpay/charges` con un cuerpo como `{ "amount": 100 }`. El monto tiene que ser un entero entre 50 y 10 000. Diseñé la pasarela para que cada cobro termine al azar en uno de estos resultados, así la interfaz tiene que saber manejar todos:

| Resultado | Probabilidad | Respuesta del backend | Lo que ve el usuario |
| --- | --- | --- | --- |
| Aprobado | 70 % | `201` con `transactionId`, `amount`, `status` y `processedAt` | El saldo sube y aparece la referencia de la operación |
| Rechazado | 15 % | `402 PAYMENT_DECLINED` | Un mensaje de rechazo y el botón cambia a "Reintentar" |
| No disponible | 10 % | `503 SNAILPAY_UNAVAILABLE` | Un aviso de que el servicio no responde y el botón "Reintentar" |
| Sin respuesta | 5 % | El backend espera 8 s y responde `504` | El frontend corta a los 5 s y avisa que el saldo no se modificó |
| Monto inválido | n/a | `400 VALIDATION_ERROR` | Un mensaje sobre el monto (el formulario también lo valida antes de llamar al backend) |

Si el servidor está apagado o no hay conexión, el frontend lo distingue con su propio mensaje (`network`).

Todos los errores del backend usan el mismo formato: `{ "error": { "code", "message", "details?" } }`.

Para probar un resultado concreto sin esperar al azar, la petición acepta el campo opcional `simulate` (`approved`, `declined`, `unavailable` o `timeout`). Solo funciona fuera de producción: con `NODE_ENV=production` se ignora.

---

## Decisiones técnicas

- **El saldo se guarda por usuario en LocalStorage,** bajo la clave `caracoles:balance:<userId>`, y arranca en $0. Solo sube cuando SnailPay responde "aprobado". Ante cualquier error o timeout, no se toca.
- **Timeout de 5 segundos en el cliente.** Si no llega respuesta a tiempo, no acredito nada: no puedo confirmar que el cobro se procesó, y prefiero que el usuario reintente a regalarle saldo.
- **Un solo cliente HTTP.** `apiClient.ts` clasifica cada respuesta (`payment_declined`, `unavailable`, `timeout`, `validation`, `network` o `server`) para que la pantalla muestre un mensaje distinto en cada caso.
- **Un solo lugar para los errores del backend.** El `errorHandler` evita filtrar detalles internos: los fallos inesperados devuelven un 500 genérico y el detalle real queda solo en la consola del servidor.
- **Backend en capas.** Además, el generador aleatorio del servicio de SnailPay se recibe como parámetro, lo que permite fijarlo cuando se escriban pruebas.
- **Acceso a LocalStorage centralizado** en `utils/storage.ts`, con `try/catch` por si el navegador lo tiene bloqueado o lleno.
- **Los parámetros de SnailPay son decisión mía,** no del enunciado: los límites de 50 a 10 000 y los porcentajes de cada resultado. Se cambian en `snailpay.routes.ts` y `snailpay.service.ts`.
- **Limitación conocida: no hay idempotencia.** En un sistema real, un timeout seguido de un reintento podría duplicar un cobro. Se resolvería enviando una clave de idempotencia en cada recarga.

---

## Qué está terminado

Solo marco lo que comprobé ejecutando la aplicación:

- [x] Registro con validaciones y contraseña guardada como hash PBKDF2 (lo revisé directamente en LocalStorage).
- [x] Inicio y cierre de sesión, sesión que se mantiene al recargar y dashboard accesible solo con sesión activa.
- [x] Dashboard con nombre, saldo en $0.00, gráfica donut (12 apuestas) y gráfica de barras (6 carreras).
- [x] `POST /api/snailpay/charges` responde `201` cuando el resultado es aprobado.
- [x] El rechazo de SnailPay (`402`) se muestra en pantalla y el saldo no cambia.