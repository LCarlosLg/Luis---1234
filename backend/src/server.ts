// Arranca el servidor. Lo dejé separado de app.ts para poder probar la app mas adelante sin tener que levantar el servidor. 

import { app } from "./app";

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});