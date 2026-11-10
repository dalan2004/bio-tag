# BIO-TAG: implementación y prueba de seguridad

## Qué cambió

- Firestore aplica aislamiento por `institutionId` y rol; el navegador ya no puede escribir equipos, mantenimientos, incidentes, auditoría ni cuentas directamente.
- Cloud Functions valida el perfil activo, el rol, la institución y los campos recibidos antes de usar el Admin SDK.
- El consecutivo de mantenimiento y su auditoría se crean en una sola transacción.
- La creación y desactivación de usuarios se ejecuta con Firebase Admin; al desactivar una cuenta también se revocan sus sesiones.
- El registro inicial requiere el secreto `BIO_TAG_BOOTSTRAP_CODE`, App Check y queda bloqueado después del primer administrador.
- La consulta QR/NFC pública se hace por una función puntual; las colecciones ya no son públicas.
- Storage limita formato, tamaño, ubicación y rol para logos y fotografías.
- Las sesiones usan persistencia por pestaña, se cierran tras 30 minutos de inactividad y limpian la caché local al salir.
- Las contraseñas nuevas requieren mínimo 12 caracteres, mayúscula, minúscula, número y símbolo.
- La exportación CSV omite el token NFC/QR y neutraliza fórmulas de Excel.

## Preparación obligatoria en Firebase

No despliegues las reglas antes de las funciones: la interfaz nueva depende de ellas.

1. Haz una copia de seguridad de Firestore y confirma que cada usuario, equipo, mantenimiento e incidente tenga un `institutionId` válido.
2. En Firebase Authentication activa **Correo/contraseña**, configura los dominios autorizados y establece la política de contraseñas con 12 caracteres, mayúscula, minúscula, número y símbolo. Marca la política como obligatoria, no solo notificación.
3. Crea una clave web de **reCAPTCHA Enterprise** para los dominios reales de la aplicación y registra la app web en Firebase App Check.
4. Copia `.env.example` como `.env.production` y completa:
   - `VITE_PUBLIC_APP_URL`
   - `VITE_FIREBASE_APPCHECK_SITE_KEY`
5. Define un código inicial largo y aleatorio. No lo guardes en Git:

   ```powershell
   firebase functions:secrets:set BIO_TAG_BOOTSTRAP_CODE
   ```

6. Instala las dependencias del backend:

   ```powershell
   cd functions
   npm install
   cd ..
   ```

7. Despliega en este orden:

   ```powershell
   firebase deploy --only functions
   firebase deploy --only firestore:rules,firestore:indexes,storage
   npm run build
   firebase deploy --only hosting
   ```

Si ya existe un administrador, el backend considera la instalación configurada aunque todavía no exista `system/bootstrap`. Al iniciar sesión, su token recibe automáticamente los claims de rol e institución.

## Pruebas manuales antes de producción

Usa cuatro cuentas de una institución de prueba: administrador, ingeniero, enfermería y consulta. Cuando pruebes aislamiento entre hospitales, crea además otra institución con datos distintos.

### Inicio de sesión

- Contraseña incorrecta: no debe indicar si el correo existe.
- Restablecimiento: siempre debe mostrar el mismo mensaje genérico.
- Usuario desactivado: no debe entrar; una sesión previa debe quedar revocada.
- Inactividad: tras 30 minutos debe cerrar sesión y limpiar datos locales.
- Cerrar pestaña/navegador: debe exigir iniciar sesión otra vez.

### Permisos

| Acción | Admin | Ingeniero | Enfermería | Consulta |
|---|---:|---:|---:|---:|
| Ver datos de su institución | Sí | Sí | Sí | Sí |
| Administrar usuarios | Sí | No | No | No |
| Configurar hospital/empresa | Sí | No | No | No |
| Crear/editar equipo | No | Sí | No | No |
| Crear mantenimiento | No | Sí | No | No |
| Gestionar etiqueta QR/NFC | No | Sí | No | No |
| Reportar incidente | Sí | Sí | Sí | No |
| Ver auditoría | Sí | Sí | No | No |

Intenta repetir las operaciones prohibidas desde la consola del navegador. Firestore debe responder `permission-denied`; ocultar un botón no cuenta como prueba de seguridad.

### Aislamiento por institución

- Una cuenta del Hospital A no debe leer documentos del Hospital B, ni siquiera conociendo el ID.
- Las consultas de equipos, mantenimientos, incidentes, usuarios y auditorías deben incluir el `institutionId` de la sesión.
- Un token QR desactivado debe responder como inexistente.
- Si `requireLoginForScan` está activo, el QR debe pedir autenticación y rechazar cuentas de otra institución.

### Archivos

- Aceptar únicamente JPEG, PNG o WebP de hasta 5 MB.
- Un ingeniero solo debe subir fotografías a la carpeta de su institución.
- Solo un administrador debe cambiar el logo.
- Prueba archivos renombrados, SVG, HTML y archivos mayores a 5 MB: todos deben ser rechazados.

### Integridad

- Dos mantenimientos creados casi al mismo tiempo deben recibir consecutivos distintos.
- El cliente no debe poder escoger `createdBy`, autor de auditoría, institución, token ni estado inicial de un incidente.
- Rotar una etiqueta debe invalidar inmediatamente el enlace anterior.
- El CSV no debe incluir tokens QR/NFC y valores que empiecen por `=`, `+`, `-` o `@` no deben ejecutarse como fórmulas.

## Criterio para publicar

Publica solo cuando tipos y compilación pasen, App Check muestre solicitudes verificadas, las reglas estén desplegadas en el ID de base de datos correcto y todas las pruebas negativas anteriores fallen con `permission-denied` o una respuesta genérica.

