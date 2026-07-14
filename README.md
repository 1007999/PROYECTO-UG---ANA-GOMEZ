# Sistema de Gestión del Taller de Carpintería – FAU UG

Proyecto listo con dos perfiles:

- **Vista del estudiante:** registra solicitudes, calcula presupuestos y consulta sus estados.
- **Vista del administrador:** revisa todas las solicitudes, cambia estados, consulta detalles y descarga reportes CSV.

## Accesos de demostración

- Estudiante: `estudiante` / `1234`
- Administrador: `admin` / `admin123`

> El inicio de sesión incluido es para demostración académica. Para producción se recomienda usar autenticación institucional o Firebase Authentication.

## Ejecutar en VS Code

1. Abra esta carpeta en Visual Studio Code.
2. Instale la extensión **Live Server**.
3. Haga clic derecho en `index.html`.
4. Seleccione **Open with Live Server**.

El sistema funciona inmediatamente en modo local con `localStorage`.

## Conectar con Google Sheets y correo

1. Cree una hoja de cálculo en Google Sheets.
2. Copie el ID de la hoja desde su URL.
3. Abra **Extensiones > Apps Script**.
4. Copie el contenido de `apps-script/Code.gs`.
5. Reemplace `PEGUE_AQUI_EL_ID_DE_SU_GOOGLE_SHEET` por el ID real.
6. Opcionalmente, configure `CORREO_ADMIN`.
7. Implemente como **Aplicación web**.
8. Copie la URL de implementación.
9. Péguela en `config.js`.

## Estructura

- `index.html`: inicio de sesión.
- `estudiante.html`: panel del estudiante.
- `admin.html`: panel administrativo.
- `auth.js`: acceso por roles.
- `common.js`: conexión local o Apps Script.
- `estudiante.js`: formulario, presupuesto y seguimiento.
- `admin.js`: gestión, filtros, estados y reportes.
- `styles.css`: diseño institucional adaptable.
- `apps-script/Code.gs`: backend de Google Sheets y correos.
