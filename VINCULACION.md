# Sistema de Vinculación por Código

## Descripción General

El sistema permite vincular dispositivos de hijos mediante códigos únicos de 6 caracteres alfanuméricos. Esto facilita el onboarding de los hijos sin necesidad de que el tutor comparta credenciales.

## Flujo de Vinculación

### 1. Tutor Registra al Hijo

El tutor registra a un hijo mediante la app del tutor:

**Endpoint:** `POST /tutores/registrar-hijo`

**Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "temporal@example.com",
  "password": "temporal123",
  "telefono": "555-1234"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "temporal@example.com",
  "codigoVinculacion": "A3B7K9",
  "vinculado": false,
  ...
}
```

> **Importante:** El `codigoVinculacion` se genera automáticamente y debe mostrarse al tutor para que lo comparta con el hijo.

### 2. Hijo Verifica el Código (Opcional)

Antes de vincular, la app del hijo puede verificar que el código es válido:

**Endpoint:** `GET /hijos/verificar-codigo/:codigo`

**Ejemplo:** `GET /hijos/verificar-codigo/A3B7K9`

**Respuesta:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "vinculado": false
}
```

Esto permite mostrar al hijo: "¿Eres Juan Pérez?" para confirmar antes de vincular.

### 3. Hijo Vincula su Dispositivo

El hijo ingresa el código, su email y contraseña definitivos:

**Endpoint:** `POST /hijos/vincular`

**Body:**
```json
{
  "codigo": "A3B7K9",
  "email": "juan.perez@email.com",
  "password": "miPassword123"
}
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan.perez@email.com",
  "vinculado": true,
  ...
}
```

> **Nota:** Una vez vinculado, el código no puede reutilizarse. El email y password se actualizan a los definitivos.

### 4. Hijo Inicia Sesión

Una vez vinculado, el hijo puede iniciar sesión normalmente:

**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "email": "juan.perez@email.com",
  "password": "miPassword123"
}
```

## Endpoints Adicionales

### Regenerar Código de Vinculación

Si el hijo no vinculó su dispositivo y el código se perdió, el tutor puede regenerarlo:

**Endpoint:** `POST /hijos/:id/regenerar-codigo`

**Headers:** `Authorization: Bearer <token_del_tutor>`

**Respuesta:**
```json
{
  "codigoVinculacion": "X9Y2M5"
}
```

> **Restricción:** Solo se puede regenerar si el hijo aún NO está vinculado (`vinculado: false`).

## Características del Código

- **Longitud:** 6 caracteres
- **Caracteres permitidos:** A-Z (sin I, O) y 2-9 (sin 0, 1)
- **Único:** Cada código es único en la base de datos
- **Un solo uso:** Una vez vinculado, el código no puede reutilizarse
- **Regenerable:** Mientras no esté vinculado, puede regenerarse

## Estados del Hijo

| Estado | Descripción | Puede Login | Tiene Código |
|--------|-------------|-------------|--------------|
| `vinculado: false` | Recién creado por tutor | ❌ No | ✅ Sí |
| `vinculado: true` | Ya vinculó su dispositivo | ✅ Sí | ✅ Sí (usado) |

## Flujo en el Frontend

### App del Tutor:
1. Registra hijo → Recibe código
2. Muestra código en pantalla (puede ser QR o texto)
3. Tutor comparte código con hijo (verbal, foto, etc.)

### App del Hijo:
1. Pantalla de bienvenida: "¿Tienes un código?"
2. Ingresa código → Verifica → Muestra "¿Eres Juan Pérez?"
3. Confirma → Ingresa email y contraseña definitivos
4. Vincula → Listo para usar

## Seguridad

- ✅ Código único e irrepetible
- ✅ Endpoints de vinculación sin autenticación (solo para primer acceso)
- ✅ Password hasheado con bcrypt
- ✅ Validación de email único
- ✅ Código de 6 caracteres sin ambigüedad (sin I/O/0/1)

## Ejemplo de Implementación en Flutter/React Native

```dart
// 1. Verificar código
final response = await http.get('$API_URL/hijos/verificar-codigo/$codigo');
final data = jsonDecode(response.body);

// Mostrar: "¿Eres ${data['nombre']} ${data['apellido']}?"

// 2. Si confirma, vincular
final vincularResponse = await http.post(
  '$API_URL/hijos/vincular',
  body: jsonEncode({
    'codigo': codigo,
    'email': email,
    'password': password,
  }),
);

// 3. Guardar token y navegar a home
```
