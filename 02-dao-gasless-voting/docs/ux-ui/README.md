# UX/UI & Branding - DAO Gasless Voting

Este documento establece la base oficial de diseño, experiencia de usuario e interfaz (UX/UI) para el desarrollo del frontend de la DAO. Toda implementación futura deberá adherirse a estos lineamientos para garantizar una dApp visualmente profesional, coherente e intuitiva.

---

## 1. Identidad Visual (Branding)
El sistema transmite confianza, modernidad y eficiencia (vital para una DAO de gobernanza financiera sin gas). Para ello se apoya en:
- **Minimalismo y Simplicidad**: Abundante uso de espacio en blanco (*whitespace*) que reduce la carga cognitiva.
- **Paleta Ecológica / Tecnológica**: Tonos oscuros profundos combinados con verdes vibrantes (lime) para llamadas a la acción (*Call to Actions*).

## 2. Paleta de Colores
Los colores extraídos y clasificados aseguran jerarquía y consistencia:

- **Fondos (Backgrounds)**:
  - Blanco puro: `#FFFFFF` (Fondo principal de la dApp).
  - Off-White / Gris claro: `#F5F6F4`, `#F2F4F7`, `#F4F4F5` (Para diferenciar tarjetas o zonas secundarias).
- **Acentos y Botones (Acciones Primarias)**:
  - Verde Oscuro (Casi negro): `#063B26` y `#02140D` (Para botones primarios sólidos).
  - Verde Lima Vibrante: `#CFFF92` (Para destacados, fondos de tarjetas relevantes y llamadas de atención).
- **Textos**:
  - Principal: `#030E09` (Negro verdoso, óptimo para lectura profunda sin el cansancio del negro puro `#000000`).
  - Secundario: `#4B5852` (Gris verdoso oscuro para subtítulos y descripciones).
  - Invertido: `#FFFFFF` (Texto blanco sobre fondos oscuros).

## 3. Sistema de Tipografía
El uso adecuado de fuentes permitirá una lectura ágil en la presentación de montos y reglas de gobernanza:

- **Headings (Titulares)**: **Outfit** (Tipografía sans-serif de diseño contemporáneo, excelente para títulos principales y valores grandes de la tesorería).
- **Body (Cuerpo de Texto)**: **Inter** (Familia sans-serif de extrema legibilidad).
  - Tamaños estándar: `18px` y `16px` para párrafos.
  - Tamaños reducidos: `12px` para metadatos (fechas, direcciones de wallets parciales).

## 4. Reglas de Contraste y Accesibilidad
El diseño cumple con estrictas certificaciones **AA y AAA**:
- Texto `#030E09` sobre fondo `#FFFFFF` o `#CFFF92` (Contraste 19.61:1 y 17.16:1, *Excelente*).
- Texto `#FFFFFF` sobre fondo oscuro `#063B26` (Contraste 12.64:1, *Excelente*).
- Texto oscuro `#063B26` sobre verde lima `#CFFF92` (Contraste 11.06:1, *Excelente*).
- *Regla*: Todo botón crítico (como firmar voto o proponer) debe tener contraste AAA para asegurar claridad total.

---

## 5. Lineamientos de Layout y Estructura General
- **Bordes y Sombras (Cards)**: Contenedores principales usando estilo "tarjeta" (edges redondeados, sombras muy sutiles, espaciado generoso). 
- **Módulos Independientes**: La información de estado ("Proposals", "Treasury", "Voting") se agrupa en tarjetas visualmente aisladas.
- **Navegación Limpia**: Un *navbar* superior minimalista con logo a la izquierda y el estado de la wallet a la derecha.

---

## 6. Flujo UX: Comportamiento del Hero Inicial y Wallet
El paradigma de la dApp divide la vista radicalmente en dos estados: **Desconectado** y **Conectado**.

### Estado 1: Desconectado (Landing / Hero Section)
- **Objetivo**: Atraer al usuario y explicar la DAO antes de cualquier interacción on-chain.
- **Elementos**:
  - Titular majestuoso (Headline): Ejemplo "*Governance without limits. Gasless Meta-Transactions.*"
  - Subtítulo explicativo breve.
  - Botón o CTA Principal (reemplazando al input clásico de email): **"Connect Wallet"** o **"Connect to the dApp"** (Estilizado oscuro `#063B26` o `#000000`).
  - Sección inferior "*Trusted by* / *Backed by*" para integraciones tecnológicas u organizaciones del ecosistema.

### Estado 2: Transición
- Al hacer clic en "Connect Wallet", se gatilla Metamask (o WalletConnect).
- Se incorpora un *micro-feedback* (Loading) y, al tener éxito, la pantalla Hero hace una transición (fade-out) dándole lugar al Dashboard.

### Estado 3: Conectado (App Principal)
- La interfaz revela el menú de gobernanza al usuario validado.
- Se presentan las siguientes secciones integradas en tarjetas responsivas:
  1.  **Crear Propuestas**: Formulario limpio.
  2.  **Votar**: Grillas de propuestas activas con opciones directas (Votar A Favor / En Contra).
    *   **Autonomous Execution Info**: Indica si una propuesta está siendo procesada por un automatizador (Keeper) o si requiere intervención manual tras el timelock.
  3.  **Estado de Propuestas**: Tarjetas con barras de progreso (For vs Against) y estatus.
      - **Badge de Resultado Dinámico**:
        - **WINNING** (Vibrante / `#CFFF92`): Si `Votos a Favor > 60%` PERO `Quórum < 30%`. Indica que la tendencia es positiva pero falta participación.
        - **PASSING** (Verde Oscuro / `#063B26`): Si `Votos a Favor > 60%` Y `Quórum >= 30%`. Indica éxito inminente tras el timelock.
        - **FAILING** (Opcional / Rojo Sutil): Si `Votos a Favor <= 60%` o el tiempo se agota sin cumplir criterios.
  4.  **Balance y Tesorería**: Métricas prominentes (ej. monto TVL con fuente tipográfica grande `Outfit`).
- La wallet permanece visible y truncada (ej. `0x1A2...3F4`) en la zona superior derecha con un avatar generado.

---

## 7. Principios UX Esenciales (El "Golden Standard")
1. **Fricción Cero en Acción (Gasless)**: Cuando el usuario firme una meta-transacción, la UI debe indicarlo de forma positiva e instantánea (*"Successfully Sent! No Gas required."*).
2. **Jerarquía Financiera**: Los valores de Ethereum y balances (Tesorería de la DAO) siempre tienen peso tipográfico alto para una lectura de un solo vistazo.
3. **Consistencia Visual**: No se introducen colores por fuera de los descritos en la sección 2. Todas las acciones primarias lucen y se comportan igual.
