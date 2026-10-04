# Carreras de caracoles

Aplicación web con temática de apuestas en carreras de caracoles. Incluye registro e inicio de sesión (simulados en local), un dashboard con saldo, dos gráficas e historial de operaciones, y recarga de saldo mediante **SnailPay**, una pasarela de pago simulada que construí como mock en Express.

**Stack:** React + Vite + TypeScript (frontend) · Express + TypeScript (backend) · LocalStorage (usuarios, sesión, saldo e historial) · Recharts (gráficas).

## Funcionalidades

- Registro con validaciones y contraseña guardada como hash PBKDF2-SHA256.
- Inicio y cierre de sesión; la sesión persiste al recargar.
- Dashboard protegido con saldo, gráfica donut, gráfica de barras e historial.
- Recarga de saldo con SnailPay: cobro exitoso, errores de transacción y error del sistema.
- Saldo sin cambios y mensajes comprensibles cuando la operación falla.
- Diseño propio, responsivo y adaptado a móvil.

---

## Inicio rápido

Necesitas **Node.js** (versión LTS reciente) y dos terminales, una por cada lado.

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

Comprueba el backend en `http://localhost:3001/api/health`: debe responder `{"status":"ok"}`.

### Variables de entorno

| Variable | Dónde | Por defecto | Para qué sirve |
| --- | --- | --- | --- |
| `VITE_API_URL` | Frontend | `http://localhost:3001/api` | Dirección del backend si corre en otro lugar |
| `SNAILPAY_DOWN` | Backend | sin definir | Con `true`, SnailPay responde siempre con error del sistema |

### Probar la recarga rápido

En el formulario, el botón **"Usar la tarjeta de prueba"** rellena los datos con la tarjeta ficticia que SnailPay aprueba:

| Número | Vencimiento | CVV |
| --- | --- | --- |
| `1234 1234 1234 1234` | `12/26` | `543` |

---

## Arquitectura

```
backend/src
├── server.ts                  # Abre el puerto (separado de app.ts para poder probar sin servidor)
├── app.ts                     # cors, express.json, rutas bajo /api y manejadores de error
├── routes/                    # URL y método, sin lógica
├── controllers/
│   └── snailpay.controller.ts # Decide si SnailPay está "caído", delega al servicio y responde
├── services/
│   └── snailpay.service.ts    # Pasarela simulada: valida, decide el resultado, arma la respuesta
├── middlewares/
│   ├── errorHandler.ts        # Formato único para errores inesperados, sin filtrar detalles
│   └── validate.ts            # Validador genérico con Zod (hoy sin uso: SnailPay valida por su cuenta)
├── errors/AppError.ts         # Error propio con código HTTP y código corto
├── config/                    # Vacía (reservada para variables de entorno tipadas)
└── __tests__/                 # Vacía (ver "Estado y siguientes pasos")

frontend/src
├── main.tsx · App.tsx         # Arranque y rutas: /login y /register (públicas), /dashboard (protegida)
├── context/                   # AuthProvider y useAuth; sesión leída de LocalStorage desde el primer render
├── components/
│   ├── RouteGuards.tsx        # Redirige según haya o no sesión
│   ├── TopUpForm.tsx          # Formulario de recarga con SnailPay
│   ├── PaymentsList.tsx       # Últimas operaciones
│   └── BalanceCard · BetsDonutChart · RaceWinsBarChart · FormField
├── pages/                     # LoginPage · RegisterPage · DashboardPage
├── hooks/useBalance.ts        # Saldo y acción de acreditar
├── services/
│   ├── authService.ts         # "Backend" simulado de usuarios y sesión sobre LocalStorage
│   ├── walletService.ts       # Saldo de cada usuario
│   ├── paymentsService.ts     # Historial de operaciones de SnailPay
│   ├── snailPayService.ts     # Llamada a la pasarela y comprobación de coherencia de la respuesta
│   └── apiClient.ts           # Único punto de contacto con el backend (timeout de 5 s)
├── data/mockData.ts           # Datos simulados de carreras y apuestas para las gráficas
└── utils/                     # password.ts · validators.ts · storage.ts · snailPayMessages.ts
```

**Capas del backend:** la ruta dice qué URL existe, el controlador traduce la petición y el servicio contiene la lógica.

---

## Registro e inicio de sesión

Es una simulación local: el backend no participa y todo vive en LocalStorage.

**Validaciones del registro**

- Nombre completo con nombre y apellido.
- Correo con formato válido.
- Contraseña de mínimo 8 caracteres, con al menos una letra y un número.
- Confirmación de contraseña idéntica.

### Cómo se trata la contraseña

Nunca se guarda en claro. Se usa **PBKDF2-SHA256** con Web Crypto (sin librerías extra), **210 000 iteraciones** y una **sal aleatoria de 16 bytes** por usuario. El formato almacenado es:

```
pbkdf2$sha256$iteraciones$sal(base64)$hash(base64)
```

- Guardar los parámetros junto al hash permite subir las iteraciones más adelante sin romper cuentas existentes.
- La verificación compara byte a byte sin cortar en el primer error, para que el tiempo de respuesta no revele dónde falló.
- El error de login es siempre el mismo ("Correo o contraseña incorrectos"), para no revelar qué correos están registrados.
- La sesión guarda solo id, nombre y correo, nunca el hash.

> **Limitación:** un hash guardado en el navegador sigue siendo accesible para quien tenga el dispositivo. En un sistema real esto se resuelve en el servidor con Argon2 o bcrypt y cookies `httpOnly`.

---

## Dashboard

Al iniciar sesión se ve:

- Nombre del usuario y botón de cerrar sesión.
- Saldo actual (todos los usuarios empiezan en **$0**).
- Formulario de recarga con SnailPay.
- Gráfica donut de apuestas ganadas y perdidas.
- Gráfica de barras con las victorias de cada caracol.
- Historial de las últimas operaciones de SnailPay.

### Datos simulados

El enunciado excluye la sección de apuestas y la lógica de carreras, así que las gráficas salen de un **mismo conjunto de datos fijo**, lo que las hace coherentes entre sí:

| Elemento | Detalle |
| --- | --- |
| Caracoles (6) | Turbo, Babosa Veloz, Concha Ligera, Rayo Lento, Tortuguita y Gary |
| Carreras (6) | Una por ganador. Victorias: Babosa Veloz 3; Turbo, Tortuguita y Gary 1 cada uno |
| Apuestas (12) | Dos por carrera; ganada si su caracol ganó. Resultado: **5 ganadas y 7 perdidas** |

---

## SnailPay

Mock hecho en Express. No se conecta a ningún servicio real ni procesa información financiera.

### Petición

`POST /api/snailpay/charges`. El formulario pide titular, tarjeta, vencimiento, CVV y monto; el frontend añade el id y el correo del usuario con sesión.

| Campo | Qué es |
| --- | --- |
| `payer_id` | Identificador del usuario |
| `payer_email` | Correo del usuario |
| `card_number` | 16 dígitos |
| `expiration_date` | Formato `MM/AA` |
| `cvv` | 3 dígitos |
| `card_holder` | Nombre completo, cualquier valor no vacío |
| `transaction_amount` | Número mayor que cero, máximo dos decimales (tope de 1 000 000) |

### Resultados simulados

| Caso | Datos que lo provocan | HTTP | `status` | `status_detail` |
| --- | --- | --- | --- | --- |
| Cobro exitoso | `1234123412341234`, `12/26`, `543`, cualquier nombre y monto válido | 201 | `approved` | `accredited` |
| Datos inválidos | Formato incorrecto o campos faltantes | 400 | `rejected` | `invalid_data` (con lista `errors`) |
| Rechazo del banco | Tarjeta `4000000000000002` | 402 | `rejected` | `card_declined` |
| Tarjeta no reconocida | Cualquier otro número de 16 dígitos | 402 | `rejected` | `card_not_supported` |
| Vencimiento incorrecto | Tarjeta de prueba con otra fecha | 402 | `rejected` | `invalid_expiry_date` |
| CVV incorrecto | Tarjeta de prueba con otro CVV | 402 | `rejected` | `invalid_security_code` |
| Error del sistema | Header `X-SnailPay-Simulate: system_error` o `SNAILPAY_DOWN=true` | 503 | `error` | `system_error` |

Los casos de error de transacción los elegí yo, como permitía el enunciado. Una tarjeta distinta de la de prueba se rechaza sin revelar qué dato falló, como haría una pasarela real; solo con la tarjeta de prueba y un vencimiento o CVV equivocados devuelvo el detalle, para facilitar las pruebas.

### Simular que SnailPay está caído

Las tres formas tienen el mismo efecto, y este modo **tiene prioridad sobre cualquier otra validación** (no se aprueba ni se aplica ninguna recarga):

1. **Interfaz:** casilla "Simular que SnailPay tiene un problema interno" en el formulario.
2. **Por petición:** header `X-SnailPay-Simulate: system_error`.
3. **Todo el servidor:** arrancar con `SNAILPAY_DOWN=true` (PowerShell: `$env:SNAILPAY_DOWN="true"; npm run dev`).

### Formato de la respuesta

Cobro exitoso, rechazo y error del sistema devuelven siempre la misma forma:

| Campo | Descripción |
| --- | --- |
| `id` | UUID de la operación |
| `status` | `approved`, `rejected` o `error` |
| `status_detail` | Detalle del resultado (tabla anterior) |
| `transaction_amount` | Monto solicitado |
| `date_created` | Fecha de creación, ISO 8601 |
| `authorization_code` | Código de 6 dígitos si se aprueba; `null` en otro caso |
| `reference` | Formato `SNL-<código>-<4 dígitos>` |
| `payer_id` | Identificador del usuario |
| `payer_email` | Correo del usuario |
| `card_number` | Número de tarjeta (ficticio) |
| `cvv` | CVV (ficticio) |
| `errors` | Solo con `invalid_data`: campo y motivo de cada error |

### Comportamiento del frontend

| Situación | Qué ocurre |
| --- | --- |
| **Aprobada** | El saldo sube por el monto, se guarda en LocalStorage, el dashboard se actualiza al instante y se muestra el código de autorización y la referencia |
| **No aprobada** | El saldo no cambia, se muestra un mensaje distinto por cada `status_detail` y no se registra ningún cobro exitoso falso; si hay campos inválidos, se señalan en el formulario |
| **Sin respuesta** (servidor apagado, sin conexión o más de 5 s) | Se avisa que el saldo no se modificó |
| **Historial** | Cada respuesta, aprobada o no, queda guardada y aparece en "Últimas operaciones" con estado, monto, últimos 4 dígitos, detalle y referencia |

### Datos en LocalStorage

| Clave | Contenido |
| --- | --- |
| `caracoles:users` | Usuarios registrados, con el hash de la contraseña |
| `caracoles:session` | Sesión activa (id, nombre y correo) |
| `caracoles:balance:<userId>` | Saldo del usuario |
| `caracoles:payments:<userId>` | Últimas 20 respuestas de SnailPay, con `card_number` y `cvv` |

---

## Pruebas manuales

Con el backend corriendo, en PowerShell:

```powershell
# Imprime también el cuerpo de las respuestas de error
function Test-Charge($body, $headers = @{}) {
  try { Invoke-RestMethod -Method Post http://localhost:3001/api/snailpay/charges -ContentType "application/json" -Body $body -Headers $headers }
  catch { $_.ErrorDetails.Message }
}

$ok = '{"payer_id":"u1","payer_email":"a@b.com","card_number":"1234123412341234","expiration_date":"12/26","cvv":"543","card_holder":"Luis Lopez","transaction_amount":100}'

Test-Charge $ok                                                                  # 201 approved
Test-Charge ($ok -replace '"cvv":"543"','"cvv":"000"')                          # 402 invalid_security_code
Test-Charge ($ok -replace '1234123412341234','4000000000000002')                # 402 card_declined
Test-Charge ($ok -replace '"transaction_amount":100','"transaction_amount":0')  # 400 invalid_data
Test-Charge $ok @{ "X-SnailPay-Simulate" = "system_error" }                     # 503 system_error
```

Equivalente con `curl` (Linux/macOS):

```bash
curl -i -X POST http://localhost:3001/api/snailpay/charges \
  -H "Content-Type: application/json" \
  -d '{"payer_id":"u1","payer_email":"a@b.com","card_number":"1234123412341234","expiration_date":"12/26","cvv":"543","card_holder":"Luis Lopez","transaction_amount":100}'
```

### Problemas frecuentes

| Síntoma | Causa probable |
| --- | --- |
| La recarga avisa que no hubo respuesta | El backend no está corriendo o `VITE_API_URL` apunta a otra dirección |
| Todas las recargas devuelven `system_error` | Está activa `SNAILPAY_DOWN=true` o la casilla de simulación en el formulario |
| Un cobro con la tarjeta de prueba es rechazado | Vencimiento distinto de `12/26` o CVV distinto de `543` |

---

## Decisiones técnicas

- **El saldo solo sube con una operación aprobada de verdad.** El frontend exige `status: approved` y una respuesta HTTP exitosa; si falta una, no acredita nada.
- **SnailPay valida los datos, no el navegador.** Así "datos inválidos" es un resultado real de la integración. El formulario solo comprueba que no haya campos vacíos y que el monto sea mayor que cero.
- **El vencimiento se compara contra `12/26` exacto, no contra la fecha actual.** Con el reloj, la tarjeta de prueba dejaría de funcionar y el enunciado exige que siempre produzca un cobro exitoso.
- **Respuestas con la misma forma siempre,** también en rechazo y error del sistema. El formato `{ error: {...} }` del `errorHandler` queda solo para fallos inesperados.
- **Un solo cliente HTTP.** `apiClient.ts` distingue `network`, `timeout` (más de 5 s) y errores del servidor, para mostrar un mensaje distinto en cada caso.
- **Un solo lugar para errores inesperados.** El `errorHandler` devuelve un 500 genérico y deja el detalle en la consola del servidor. El controlador de SnailPay no imprime el cuerpo de las peticiones, porque trae datos de tarjeta.
- **Tarjeta y CVV en respuestas y LocalStorage,** porque el enunciado lo pide, siempre con datos ficticios. En pantalla solo se muestran los últimos 4 dígitos. En un sistema real nunca se guardarían el CVV ni la tarjeta completa; se usaría tokenización sobre HTTPS.
- **Monto máximo de 1 000 000 y dos decimales:** decisión propia, como protección.
- **LocalStorage centralizado** en `utils/storage.ts`, con `try/catch` por si el navegador lo bloquea o está lleno.
- **Limitación conocida: sin idempotencia.** Un timeout seguido de un reintento podría duplicar un cobro. Se resolvería con una clave de idempotencia por recarga.

---

## Diseño y herramientas

- **Plantilla base:** `create-vite` (React + TypeScript), sin el contenido de ejemplo.
- **Librerías:** `react-router-dom` (rutas) y `recharts` (gráficas). Sin librería de componentes ni framework de estilos.
- **Estilos:** CSS propio en `frontend/src/styles/global.css`, con colores y medidas como variables en `:root`. De ahí salen las tarjetas, la cuadrícula responsiva, los formularios, las etiquetas de estado del historial y la tarjeta destacada del saldo.

### Terminado

- [x] Registro con validaciones y contraseña con hash PBKDF2.
- [x] Inicio y cierre de sesión, sesión persistente y dashboard protegido.
- [x] Dashboard con nombre, saldo, gráfica donut, gráfica de barras y cierre de sesión.
- [x] SnailPay en Express: cobro exitoso, errores de transacción y error del sistema, con el formato del enunciado.
- [x] Recarga que actualiza el saldo al instante, lo guarda y avisa de la aprobación.
- [x] Saldo intacto y mensaje comprensible ante una operación fallida.
- [x] Historial de operaciones con tarjeta y CVV ficticios en LocalStorage.
- [x] Diseño propio con cuadrícula adaptable a móvil.

### Limitaciones conocidas

- **Sin tests automáticos:** `backend/src/__tests__` está vacía. Todo lo marcado como terminado se comprobó a mano, con la app corriendo y con las peticiones de [Pruebas manuales](#pruebas-manuales).
- **`backend/src/config/` vacía:** reservada para variables de entorno tipadas.
- **Sin idempotencia** en las recargas.