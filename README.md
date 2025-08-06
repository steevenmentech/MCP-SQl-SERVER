# Guía de Autenticación - MCP SQL Server

## Resumen

Este servidor MCP para SQL Server ahora soporta dos métodos de autenticación:

1. **Autenticación de SQL Server** (Tradicional)
2. **Autenticación de Windows** (Credenciales integradas)

## Configuración de Variables de Entorno

### Autenticación de SQL Server (Por defecto)

```env
# Configuración básica
SERVER_NAME=localhost
DATABASE_NAME=mi_base_datos
USE_WINDOWS_AUTH=false

# Credenciales de SQL Server
USERNAME=mi_usuario_sql
PASSWORD=mi_contraseña_sql

# Opciones adicionales
TRUST_SERVER_CERTIFICATE=true
CONNECTION_TIMEOUT=30
ENCRYPT=false
READONLY=false
```

### Autenticación de Windows

```env
# Configuración básica
SERVER_NAME=localhost
DATABASE_NAME=mi_base_datos
USE_WINDOWS_AUTH=true

# Opciones para credenciales de Windows
DOMAIN=MI_DOMINIO          # Opcional: dominio (vacío para máquina local)
USERNAME=mi_usuario_windows # Opcional: usuario específico (vacío para usuario actual)
PASSWORD=mi_contraseña_win  # Opcional: contraseña (vacío para usuario actual)

# Opciones adicionales
TRUST_SERVER_CERTIFICATE=true
CONNECTION_TIMEOUT=30
ENCRYPT=false
READONLY=false
```

## Ejemplos de Configuración

### Ejemplo 1: SQL Server Authentication (Desarrollo local)

```json
{
  "mcpServers": {
    "mssql-local": {
      "command": "node",
      "args": ["C:/ruta/a/tu/proyecto/dist/index.js"],
      "env": {
        "SERVER_NAME": "localhost",
        "DATABASE_NAME": "TestDB",
        "USE_WINDOWS_AUTH": "false",
        "USERNAME": "sa",
        "PASSWORD": "MiContraseña123!",
        "TRUST_SERVER_CERTIFICATE": "true",
        "READONLY": "false"
      }
    }
  }
}
```

### Ejemplo 2: Windows Authentication (Usuario actual)

```json
{
  "mcpServers": {
    "mssql-windows": {
      "command": "node",
      "args": ["C:/ruta/a/tu/proyecto/dist/index.js"],
      "env": {
        "SERVER_NAME": "SERVIDOR-EMPRESA",
        "DATABASE_NAME": "ProductionDB",
        "USE_WINDOWS_AUTH": "true",
        "TRUST_SERVER_CERTIFICATE": "true",
        "READONLY": "true"
      }
    }
  }
}
```

### Ejemplo 3: Windows Authentication (Usuario específico)

```json
{
  "mcpServers": {
    "mssql-domain": {
      "command": "node",
      "args": ["C:/ruta/a/tu/proyecto/dist/index.js"],
      "env": {
        "SERVER_NAME": "sql-server.empresa.com",
        "DATABASE_NAME": "EmpresaDB",
        "USE_WINDOWS_AUTH": "true",
        "DOMAIN": "EMPRESA",
        "USERNAME": "juan.perez",
        "PASSWORD": "ContraseñaDominio123!",
        "ENCRYPT": "true",
        "READONLY": "false"
      }
    }
  }
}
```

## Casos de Uso Comunes

### 1. Desarrollo Local con SQL Server Express

```env
SERVER_NAME=localhost\SQLEXPRESS
DATABASE_NAME=MiAppDB
USE_WINDOWS_AUTH=true
TRUST_SERVER_CERTIFICATE=true
READONLY=false
```

### 2. Servidor de Producción con Dominio

```env
SERVER_NAME=sqlprod.empresa.local
DATABASE_NAME=ProdDB
USE_WINDOWS_AUTH=true
DOMAIN=EMPRESA
USERNAME=svc_aplicacion
PASSWORD=contraseña_servicio
ENCRYPT=true
READONLY=true
```

### 3. Servidor Remoto con Autenticación SQL

```env
SERVER_NAME=192.168.1.100,1433
DATABASE_NAME=RemoteDB
USE_WINDOWS_AUTH=false
USERNAME=app_user
PASSWORD=app_password123
TRUST_SERVER_CERTIFICATE=false
ENCRYPT=true
READONLY=false
```

## Solución de Problemas

### Error de Autenticación de Windows

Si tienes problemas con la autenticación de Windows:

1. Verifica que el usuario tenga permisos en SQL Server
2. Asegúrate de que el servidor SQL Server esté configurado para autenticación mixta
3. Comprueba que el dominio sea correcto (usa `echo %USERDOMAIN%` en cmd)

### Error de Conexión

```env
# Aumenta el timeout si tienes conexiones lentas
CONNECTION_TIMEOUT=60

# Habilita certificados auto-firmados para servidores locales
TRUST_SERVER_CERTIFICATE=true

# Verifica la configuración de encriptación
ENCRYPT=false
```

### Verificar Configuración

Para verificar qué usuario está conectándose, puedes ejecutar esta consulta una vez conectado:

```sql
SELECT 
    SYSTEM_USER as 'Login Name',
    USER_NAME() as 'User Name',
    @@SERVERNAME as 'Server Name',
    DB_NAME() as 'Database Name'
```

## Notas de Seguridad

1. **Credenciales**: Nunca expongas credenciales en código fuente
2. **Solo lectura**: Usa `READONLY=true` en entornos de producción cuando sea posible
3. **Encriptación**: Habilita `ENCRYPT=true` para conexiones remotas
4. **Permisos mínimos**: Otorga solo los permisos necesarios al usuario de base de datos
5. **Variables de entorno**: Usa archivos `.env` para credenciales locales (no los subas a git)
