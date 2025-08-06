#!/usr/bin/env node

import * as dotenv from "dotenv";
import sql from "mssql";

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log("🔍 Probando conexión a SQL Server...");
  console.log("======================================");
  
  const config = {
    server: "130.1.120.82",
    database: "WEBPYCCA",
    authentication: {
      type: "ntlm",
      options: {
        domain: "PYCCA",
        userName: "smendoza",
        password: "PDPY2025!*",
      },
    },
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    connectionTimeout: 60000,
  };

  console.log("📋 Configuración de conexión:");
  console.log("- Servidor:", config.server);
  console.log("- Base de datos:", config.database);
  console.log("- Dominio:", config.authentication.options.domain);
  console.log("- Usuario:", config.authentication.options.userName);
  console.log("- Encriptación:", config.options.encrypt);
  console.log("- Certificado confiable:", config.options.trustServerCertificate);
  console.log("");

  try {
    console.log("⏳ Intentando conectar...");
    const pool = await sql.connect(config);
    console.log("✅ ¡Conexión exitosa!");
    
    console.log("🔍 Probando consulta básica...");
    const result = await pool.request().query("SELECT @@VERSION as version, SYSTEM_USER as user_name, DB_NAME() as database_name");
    console.log("📊 Información del servidor:");
    console.log(result.recordset[0]);
    
    await pool.close();
    console.log("🔐 Conexión cerrada correctamente.");
    
  } catch (error) {
    console.error("❌ Error de conexión:");
    console.error("Tipo de error:", error.constructor.name);
    console.error("Mensaje:", error.message);
    
    if (error.code) {
      console.error("Código de error:", error.code);
    }
    
    // Sugerencias basadas en el tipo de error
    if (error.message.includes("Login failed")) {
      console.log("\n💡 Posibles soluciones:");
      console.log("1. Verificar que el usuario tenga permisos en la base de datos");
      console.log("2. Comprobar que SQL Server esté configurado para autenticación mixta");
      console.log("3. Verificar que el usuario esté habilitado en SQL Server");
    }
    
    if (error.message.includes("network")) {
      console.log("\n💡 Posibles soluciones:");
      console.log("1. Verificar conectividad de red al servidor");
      console.log("2. Comprobar que SQL Server esté ejecutándose");
      console.log("3. Verificar configuración de firewall");
    }
  }
}

// Función alternativa con configuración más simple
async function testConnectionSimple() {
  console.log("\n🔄 Probando configuración alternativa...");
  console.log("=====================================");
  
  const config = {
    server: "130.1.120.82",
    database: "WEBPYCCA",
    authentication: {
      type: "ntlm",
      options: {
        domain: "PYCCA",
        userName: "smendoza",
        password: "PDPY2025!*",
      },
    },
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
    connectionTimeout: 30000,
  };

  try {
    console.log("⏳ Intentando conectar sin encriptación...");
    const pool = await sql.connect(config);
    console.log("✅ ¡Conexión exitosa sin encriptación!");
    
    const result = await pool.request().query("SELECT SYSTEM_USER as user_name");
    console.log("👤 Usuario conectado:", result.recordset[0].user_name);
    
    await pool.close();
    
  } catch (error) {
    console.error("❌ También falló sin encriptación:", error.message);
  }
}

// Ejecutar pruebas
async function runTests() {
  await testConnection();
  await testConnectionSimple();
}

runTests().catch(console.error);
