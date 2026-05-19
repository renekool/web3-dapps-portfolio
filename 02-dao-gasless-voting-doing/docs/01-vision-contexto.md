# 01 • Visión y Contexto

## Problema que se quiere resolver
En muchas comunidades, proyectos open-source o grupos de inversión colectiva, existe la necesidad de **gestionar fondos comunes y tomar decisiones colectivas sobre su uso**.

Tradicionalmente, estas decisiones se toman mediante **estructuras centralizadas**, donde una persona o un pequeño grupo administra los fondos y decide cómo utilizarlos. Esto genera varios problemas:

### Falta de transparencia
Los miembros de la comunidad no siempre tienen visibilidad completa sobre:
- Cuánto dinero hay disponible
- Quién decide cómo se utiliza
- Cuándo se ejecutan los pagos

Esto puede generar **desconfianza entre los participantes**.

### Dependencia de intermediarios
La gestión del dinero depende de administradores humanos que:
- Aprueban gastos
- Ejecutan transferencias
- Mantienen registros

Esto introduce **riesgos de error humano, abuso de poder o mala administración**.

### Procesos de votación ineficientes
En muchos sistemas de gobernanza comunitaria, la votación se realiza mediante herramientas externas (foros, encuestas, formularios), lo que provoca:
- Falta de integridad en los resultados
- Dificultad para verificar votos
- Desconexión entre la decisión tomada y la ejecución del pago

### Barreras de entrada en sistemas blockchain
Aunque las organizaciones autónomas descentralizadas (DAO) permiten resolver estos problemas mediante **smart contracts**, todavía existe una limitación importante:
Los usuarios deben pagar **gas fees** para interactuar con el contrato.

Esto provoca que:
- Usuarios con poco conocimiento técnico no participen
- La experiencia de uso sea compleja
- La participación en la gobernanza sea limitada

### Problema central
Existe la necesidad de un sistema que permita a una comunidad:
- **Gestionar un fondo común**
- **Proponer gastos**
- **Votar colectivamente sobre esas propuestas**
- **Ejecutar automáticamente las decisiones aprobadas**

Todo esto de forma:
- Transparente
- Sin intermediarios
- Verificable en blockchain
- Con una experiencia de usuario simple que no requiera pagar gas directamente.

## Contexto del proyecto
Este proyecto busca abordar este problema mediante la construcción de una **plataforma de votación para una DAO con soporte para transacciones gasless**, donde los usuarios pueden:
- depositar fondos en una tesorería común
- crear propuestas de gasto
- votar propuestas
- ejecutar automáticamente pagos aprobados

**Relación entre ambos**
Utilizando meta-transacciones (EIP-2771) y firmas off-chain EIP-712 para permitir interacciones gasless.

El flujo correcto es:
```text
EIP-712 → firma del mensaje
  ↓
Relayer recibe firma
  ↓
EIP-2771 → ejecución en blockchain
```

Visualmente:
```text
Usuario
   │
   │ firma EIP-712
   ▼
Frontend
   │
   │ envía firma
   ▼
Relayer
   │
   │ ejecuta meta-tx
   ▼
MinimalForwarder (EIP-2771)
   │
   ▼
DAOVoting Contract
```

## Motivación técnica y de negocio
El desarrollo de sistemas de gobernanza descentralizada ha crecido significativamente con la adopción de tecnología blockchain, especialmente en contextos donde múltiples participantes necesitan tomar decisiones colectivas sobre recursos compartidos.

Las DAO (Decentralized Autonomous Organizations) surgen como una alternativa a los modelos tradicionales de gestión centralizada, permitiendo que las reglas de gobernanza se ejecuten automáticamente mediante smart contracts.

Sin embargo, muchos sistemas DAO presentan todavía **problemas de usabilidad, complejidad técnica y barreras de participación**, lo que limita su adopción en comunidades reales.

Este proyecto aborda estas limitaciones desde dos perspectivas principales: motivación técnica y motivación de negocio o uso práctico.

### Motivación técnica
Desde el punto de vista tecnológico, este proyecto permite explorar e integrar varios conceptos fundamentales del desarrollo Web3:

**Gobernanza descentralizada mediante smart contracts**
El sistema implementa un mecanismo de gobernanza donde:
- los miembros pueden proponer el uso de fondos
- la comunidad puede votar sobre dichas propuestas
- el resultado de la votación determina automáticamente la ejecución de las acciones

Esto elimina la necesidad de intermediarios y permite que las reglas se cumplan de manera **determinística y verificable en blockchain**.

**Implementación de meta-transacciones**
Uno de los objetivos técnicos principales del proyecto es implementar **transacciones gasless** mediante un sistema de **meta-transacciones**.

En este modelo:
- el usuario firma una acción off-chain
- un relayer envía la transacción al blockchain
- el contrato ejecuta la acción en nombre del usuario

Para lograr esto se utilizan:
- **EIP-712** para la firma estructurada de datos
- **EIP-2771** para la ejecución de meta-transacciones mediante un forwarder confiable.

Este mecanismo permite estudiar un patrón cada vez más utilizado en aplicaciones Web3 que buscan **mejorar la experiencia de usuario**.

**Integración full-stack Web3**
El proyecto también busca integrar los componentes típicos de una aplicación descentralizada moderna:
- **Smart contracts en Solidity**
- **Infraestructura local de desarrollo con Foundry**
- **Frontend en Next.js**
- **Interacción con wallets (MetaMask)**
- **Servicios backend para relayer de transacciones**

Esta integración permite comprender cómo interactúan las diferentes capas de una **arquitectura dApp completa**.

### Motivación de negocio y uso práctico
Más allá del aprendizaje técnico, los sistemas de gobernanza descentralizada tienen aplicaciones prácticas en múltiples contextos:

**Gestión transparente de fondos comunitarios**
Comunidades, organizaciones o proyectos colaborativos pueden utilizar un sistema como este para:
- administrar fondos comunes
- proponer iniciativas financiadas colectivamente
- decidir el uso de recursos mediante votaciones transparentes

Todo el proceso queda **registrado en blockchain**, lo que permite auditoría pública.

**Automatización de decisiones colectivas**
Una vez aprobada una propuesta, el sistema ejecuta automáticamente la transferencia de fondos al beneficiario definido en la propuesta.
Esto elimina procesos manuales y reduce la posibilidad de manipulación o retrasos en la ejecución de decisiones.

**Reducción de barreras de participación**
Las **gas fees** representan una de las principales barreras para la adopción de aplicaciones blockchain.

El uso de meta-transacciones permite que los usuarios interactúen con el sistema **sin necesidad de pagar gas directamente**, lo que mejora la accesibilidad y facilita la participación de usuarios con menor experiencia técnica.

**Valor del Proyecto**
Este proyecto combina:
- aprendizaje técnico en desarrollo Web3
- implementación práctica de gobernanza descentralizada
- mejora de la experiencia de usuario mediante transacciones gasless

lo que lo convierte en un ejercicio relevante tanto desde el punto de vista educativo como desde el punto de vista de diseño de sistemas descentralizados.

## Alcance del proyecto
El alcance de este proyecto consiste en el desarrollo de una **aplicación descentralizada (dApp)** que permita a una comunidad gestionar un fondo común y tomar decisiones colectivas sobre su uso mediante un sistema de propuestas y votaciones.

El sistema estará compuesto por **smart contracts desplegados en blockchain**, una **aplicación web para interactuar con los contratos** y un **servicio relayer para soportar transacciones gasless**.

El objetivo es implementar una versión funcional mínima de un sistema DAO que permita experimentar con **gobernanza descentralizada, meta-transacciones y arquitectura Web3 full-stack**.

### Funcionalidades incluidas en el sistema
El sistema permitirá realizar las siguientes acciones principales.

**Gestión de fondos del DAO**
Los usuarios podrán **depositar ETH en la tesorería del DAO** mediante una función del contrato inteligente.
El sistema mantendrá registro de:
- El balance total del DAO
- El balance depositado por cada usuario

Esto permitirá determinar qué usuarios tienen derecho a participar en la gobernanza del sistema.

**Creación de propuestas**
Los participantes que cumplan las condiciones definidas podrán **crear propuestas para utilizar fondos del DAO**.
Cada propuesta incluirá:
- Dirección del beneficiario
- Cantidad de ETH solicitada
- Fecha límite de votación
- Descripción del propósito de la propuesta

Para evitar abuso del sistema, solo podrán crear propuestas los usuarios que posean **al menos el requisito mínimo establecido (ej. 1% del balance total del DAO)**. *(Nota: En el MVP anterior este valor era del 10%, lo excluyente para la mayoría. La nueva propuesta mejorada reduce este umbral para democratizar la participación).*

**Sistema de votación**
Los miembros del DAO podrán votar en cada propuesta utilizando tres opciones:
- Voto a favor
- Voto en contra
- Abstención

El sistema garantizará que:
- Cada usuario pueda emitir **un único voto por propuesta**
- El voto pueda modificarse mientras la votación esté abierta
- El resultado de la votación sea visible públicamente.

**Ejecución automática de propuestas aprobadas**
Una vez finalizado el período de votación, el sistema evaluará el resultado.
Si una propuesta obtiene **más votos a favor que en contra**, el contrato permitirá ejecutar la propuesta y transferir automáticamente los fondos al beneficiario definido.
Esto garantiza que las decisiones colectivas se ejecuten **sin intervención manual**.

**Soporte para votación gasless**
El sistema implementará un mecanismo de **meta-transacciones** que permitirá a los usuarios interactuar con el contrato sin pagar gas directamente.

Para ello se utilizarán los siguientes componentes:
- **Firmas off-chain mediante EIP-712**
- **Contrato forwarder compatible con EIP-2771**
- **Servicio relayer que envía las transacciones a la red**

Este mecanismo permite mejorar la experiencia de usuario al reducir la fricción asociada a las tarifas de gas.

**Interfaz web para interacción con el sistema**
El proyecto incluirá una aplicación web desarrollada con **Next.js** que permitirá a los usuarios:
- Conectar su wallet mediante MetaMask
- Depositar fondos en el DAO
- Crear propuestas
- Votar propuestas
- Visualizar el estado de las propuestas
- Consultar balances del sistema

La interfaz servirá como punto de interacción principal entre los usuarios y los contratos inteligentes.

### Componentes principales del sistema
El sistema estará compuesto por tres capas principales:

**Smart Contracts**
- contrato `MinimalForwarder` para meta-transacciones
- contrato `DAOVoting` que implementa la lógica de gobernanza del DAO

**Backend / Infraestructura**
- **Servicio Relayer**: servicio API REST (backend) que recibe, verifica y ejecuta meta-transacciones pagando el gas.
- **Daemon de Ejecución**: proceso automático que monitorea constantemente el estado de las propuestas aprobadas y las ejecuta automáticamente una vez finalizado el *timelock*.

**Frontend**
- aplicación web para interactuar con el sistema y visualizar información del DAO.

### Entorno de desarrollo
El proyecto será desarrollado y probado inicialmente en un entorno local utilizando:
- **Foundry** para desarrollo de smart contracts
- **Anvil** como nodo local de Ethereum
- **Next.js** para la interfaz web
- **ethers.js** para interacción con los contratos

Esto permitirá probar el sistema completo antes de desplegarlo en una red pública de prueba.

## No-alcance (lo que NO se va a hacer)
El objetivo de este proyecto es construir una **versión mínima funcional de una DAO con votación gasless** con fines de aprendizaje y experimentación técnica.

Por esta razón, varias funcionalidades que podrían existir en sistemas DAO más avanzados **no forman parte del alcance de este proyecto**.

A continuación se describen explícitamente las características que **no serán implementadas**:

### No se implementará un sistema avanzado de gobernanza
El sistema de votación será una implementación básica basada en el conteo de votos:
- Votos a favor
- Votos en contra
- Abstenciones

No se implementarán mecanismos avanzados de gobernanza como:
- Votación ponderada por tokens
- Delegación de votos
- Quorum dinámico
- Mecanismos de veto
- Gobernanza multicapa

El objetivo es mantener el sistema **simple y comprensible para fines educativos**.

### No se implementará un sistema completo de gestión de identidad
El sistema se basará únicamente en **direcciones de wallet de Ethereum** para identificar a los participantes.
No se integrarán soluciones de identidad descentralizada como:
- ENS
- DID (Decentralized Identifiers)
- Sistemas KYC o verificación de identidad

Cada usuario será identificado únicamente por su **dirección de wallet**.

### No se implementará un sistema avanzado de seguridad o auditoría formal
Aunque se aplicarán buenas prácticas básicas de desarrollo en smart contracts, este proyecto **no incluye una auditoría de seguridad profesional**.
Por lo tanto:
- No se implementarán mecanismos avanzados de protección contra ataques complejos
- No se realizará verificación formal del contrato
- No se garantizará que el sistema sea seguro para uso en producción con grandes cantidades de fondos

El sistema está diseñado **con fines educativos y experimentales**.

### No se implementará compatibilidad con múltiples redes blockchain
El sistema será desarrollado y probado inicialmente en un **entorno local de desarrollo (Anvil)**.
No se implementará soporte para:
- Múltiples redes Ethereum
- Redes L2
- Redes alternativas compatibles con EVM

El objetivo es simplificar el entorno de desarrollo.

### Se implementará una interfaz de usuario completamente optimizada
La aplicación web tendrá como objetivo demostrar la interacción con los smart contracts a la vez que se priorizará el desarrollo de una interfaz altamente optimizada y un diseño avanzado premium.
Se incluirá obligatoriamente:
- **Diseño UI/UX avanzado**: Branding específico, colores, micro-animaciones y tipografías que se definirán oportunamente.
- **Optimización completa**: Diseño completamente responsive adaptado a dispositivos móviles.
- **Internacionalización**: Soporte multi-idioma (si aplica) o arquitectura base para ello.
- **Accesibilidad avanzada**: Contraste correcto, navegación por teclado y etiquetas ARIA.

El foco será **tanto la funcionalidad técnica del sistema como la excelencia en el Diseño UI/UX y la accesibilidad**.

### No se implementará un sistema completo de gestión del relayer
El relayer será implementado como un **servicio simple para demostrar el funcionamiento de meta-transacciones**.
No se desarrollarán características avanzadas como:
- Balanceo de carga
- Gestión automática de gas
- Limitación de solicitudes
- Protección contra abuso del relayer

El objetivo es únicamente demostrar el **flujo de transacciones gasless**.

## Restricciones técnicas
El desarrollo de este proyecto está sujeto a un conjunto de **restricciones técnicas** que determinan las tecnologías, estándares y herramientas que deben utilizarse para su implementación.

Estas restricciones están definidas por los requerimientos del ejercicio y por el entorno de desarrollo seleccionado para el proyecto.

### Tecnologías obligatorias
El sistema deberá ser desarrollado utilizando las siguientes tecnologías principales:
- **Solidity** para la implementación de los smart contracts.
- **Foundry** como framework de desarrollo y testing de contratos inteligentes.
- **Anvil** como nodo local de Ethereum para pruebas.
- **Next.js** para el desarrollo del frontend de la aplicación.
- **ethers.js** para la interacción entre el frontend y los smart contracts.

Estas tecnologías forman parte del stack requerido para construir una **aplicación Web3 completa**.

### Estándares de meta-transacciones
El sistema deberá implementar el mecanismo de transacciones gasless utilizando los siguientes estándares:
- **EIP-712** para la firma estructurada de datos off-chain.
- **EIP-2771** para la ejecución de meta-transacciones mediante un forwarder confiable.

Estos estándares permiten que el usuario firme una acción localmente mientras que un **relayer externo** ejecuta la transacción en la blockchain.

### Compatibilidad con EVM
Los smart contracts desarrollados deberán ser **compatibles con la Ethereum Virtual Machine (EVM)**.
Esto implica que:
- El código deberá compilar con **Solidity**.
- Los contratos deberán ejecutarse en un nodo compatible con Ethereum.
- Las pruebas se realizarán inicialmente en un **entorno local basado en Anvil**.

### Uso obligatorio de wallets externas
La interacción con el sistema deberá realizarse mediante una **wallet compatible con Ethereum**, específicamente:
- **MetaMask**.

Esto significa que:
- El frontend no gestionará claves privadas.
- La firma de mensajes y transacciones será realizada directamente desde la wallet del usuario.

### Arquitectura basada en contratos inteligentes
La lógica crítica del sistema deberá ejecutarse **dentro de los smart contracts**, incluyendo:
- Gestión de fondos del DAO.
- Creación de propuestas.
- Registro de votos.
- Validación de resultados.
- Ejecución de propuestas aprobadas.

Esto garantiza que las reglas del sistema sean **determinísticas y verificables en blockchain**.

### Limitaciones del entorno de desarrollo
Durante el desarrollo inicial del proyecto se utilizará un **entorno local**, lo que implica:
- Las pruebas se realizarán en una blockchain local.
- Los balances de ETH utilizados serán simulados.
- El sistema no dependerá de infraestructura externa.

Este enfoque permite realizar iteraciones rápidas durante el desarrollo.

## Supuestos
Los siguientes supuestos definen las **condiciones que se consideran verdaderas para el diseño y funcionamiento del sistema**.
Estos supuestos permiten simplificar el desarrollo del proyecto y establecer un marco claro para su implementación.

### Supuestos sobre los usuarios del sistema
- **Los Usuarios Poseen Una Wallet Compatible Con Ethereum.**
Se asume que los participantes del sistema cuentan con una wallet compatible, como MetaMask, que les permite firmar mensajes y transacciones.
- **Los Usuarios Comprenden Las Acciones Que Realizan.**
Se asume que los participantes entienden las implicaciones básicas de interactuar con un sistema basado en blockchain, como firmar transacciones o mensajes.
- **Los Usuarios Actúan Dentro De Las Reglas Del Sistema.**
Se asume que los participantes no intentarán manipular el sistema de forma deliberada durante las pruebas del proyecto.

### Supuestos sobre la infraestructura técnica
- **La Red Blockchain Funciona Correctamente.**
Se asume que la red utilizada para ejecutar los contratos inteligentes opera de manera estable y sin interrupciones significativas.
- **El Nodo Local Está Disponible Durante El Desarrollo.**
Se asume que el entorno de desarrollo basado en Anvil estará disponible y funcionando correctamente durante las pruebas del sistema.
- **El Frontend Puede Comunicarse Con La Blockchain.**
Se asume que el frontend puede interactuar correctamente con los smart contracts mediante bibliotecas como ethers.js.

### Supuestos sobre el relayer de meta-transacciones
- **El Relayer Está Disponible Para Ejecutar Transacciones.**
Se asume que el servicio relayer estará disponible para recibir solicitudes firmadas y enviarlas a la blockchain.
- **El Relayer Posee Fondos Suficientes Para Pagar Gas.**
Se asume que la cuenta utilizada por el relayer dispone de ETH suficiente para cubrir los costos de gas de las transacciones ejecutadas.
- **El Relayer Ejecuta Las Transacciones De Forma Honesta.**
Se asume que el relayer no modifica ni manipula las solicitudes firmadas enviadas por los usuarios.

### Supuestos sobre el comportamiento del DAO
- **Las Propuestas Representan Solicitudes Legítimas De Uso De Fondos.**
Se asume que las propuestas creadas dentro del sistema corresponden a iniciativas reales planteadas por los participantes.
- **La Comunidad Participa En El Proceso De Votación.**
Se asume que los miembros del DAO ejercen su derecho a voto y participan activamente en las decisiones del sistema.

## Riesgos identificados
A continuación se presenta un análisis crítico del diseño del sistema DAO propuesto. El objetivo es identificar **los peores escenarios posibles** derivados de debilidades en gobernanza, arquitectura técnica, experiencia de usuario y viabilidad del modelo.

### 1. El Modelo De Gobernanza Es Extremadamente Débil
- **Problema:** El sistema se basa únicamente en conteo simple de votos sin mecanismos adicionales de gobernanza.
- **Ejemplo:** Un pequeño grupo que controle suficiente capital puede aprobar propuestas sin oposición efectiva.
- **Daño:** Captura completa del DAO por una minoría con mayor poder económico.

### 2. El Sistema Permite Ataques De Voto Rápido
- **Problema:** No existe mecanismo que limite cambios de voto o manipulación de última hora.
- **Ejemplo:** Un usuario cambia su voto justo antes del deadline después de observar el comportamiento de los demás.
- **Daño:** Manipulación estratégica de resultados.

### 3. El Requisito Original Del 10% Es Arbitrario Y Mal Diseñado
- **Problema:** El umbral de creación de propuestas del MVP no se basaba en un modelo de gobernanza sólido.
- **Ejemplo:** Si la tesorería tiene 100 ETH, solo alguien con 10 ETH podía proponer, lo que excluía a la mayoría de los participantes.
- **Daño:** Concentración del poder de iniciativa en unos pocos usuarios ricos (*whale capture*).

### 4. El Sistema No Tiene Protección Contra Spam De Propuestas
- **Problema:** Si un usuario supera el 10% puede crear múltiples propuestas sin restricción.
- **Ejemplo:** Un actor crea cientos de propuestas irrelevantes.
- **Daño:** Saturación del sistema y confusión de votantes.

### 5. No Existe Un Mecanismo De Quorum
- **Problema:** Una propuesta puede aprobarse con muy poca participación.
- **Ejemplo:** Solo dos personas votan y deciden el uso de toda la tesorería.
- **Daño:** Decisiones críticas tomadas sin legitimidad comunitaria.

### 6. No Existe Mayoría Mínima Requerida
- **Problema:** Basta con que haya más votos a favor que en contra.
- **Ejemplo:** 3 votos a favor y 2 en contra aprueban una transferencia grande.
- **Daño:** Decisiones importantes aprobadas por márgenes extremadamente débiles.

### 7. No Existe Protección Contra Propuestas Maliciosas
- **Problema:** El sistema no evalúa la naturaleza de las propuestas.
- **Ejemplo:** Una propuesta solicita transferir todos los fondos a una wallet controlada por un atacante.
- **Daño:** Pérdida total de la tesorería.

### 8. No Existe Un Sistema De Timelock
- **Problema:** Las propuestas pueden ejecutarse inmediatamente después de aprobarse.
- **Ejemplo:** Una propuesta maliciosa se ejecuta antes de que la comunidad pueda reaccionar.
- **Daño:** Robo instantáneo de fondos.

### 9. No Hay Protección Contra Ataques Sybil
- **Problema:** El sistema no limita la creación de múltiples identidades.
- **Ejemplo:** Un atacante divide fondos en múltiples wallets para manipular la votación.
- **Daño:** Distorsión del sistema de gobernanza.

### 10. El Modelo De Depósito Crea Desigualdad Extrema
- **Problema:** El poder dentro del sistema depende directamente del capital depositado.
- **Ejemplo:** Un participante rico domina todas las decisiones.
- **Daño:** El DAO se convierte en una plutocracia.

### 11. No Existe Un Sistema De Recuperación De Errores
- **Problema:** Una vez ejecutada una propuesta, no existe mecanismo de reversión.
- **Ejemplo:** Una transferencia se envía a una dirección incorrecta.
- **Daño:** Pérdida irreversible de fondos.

### 12. La Tesorería Inicial Es Un Problema Mal Resuelto
- **Problema:** El sistema no define claramente cómo se inicializa la tesorería.
- **Ejemplo:** Un único actor financia la mayor parte del fondo y controla el sistema.
- **Daño:** Centralización desde el inicio.

### 13. El Sistema No Contempla El Abandono De Usuarios
- **Problema:** Los depósitos permanecen bloqueados en el DAO.
- **Ejemplo:** Un usuario deja de participar pero su capital sigue influyendo en el sistema.
- **Daño:** Distorsión del poder de voto.

### 14. El Sistema No Tiene Protección Contra Manipulación Temporal
- **Problema:** Los votantes pueden esperar hasta el final para actuar estratégicamente.
- **Ejemplo:** Un grupo coordina votos en el último bloque antes del deadline.
- **Daño:** Resultados manipulados.

### 15. La Experiencia De Usuario Es Potencialmente Peligrosa
- **Problema:** Los usuarios pueden firmar mensajes sin entender su impacto real.
- **Ejemplo:** Un usuario firma una meta-transacción creyendo que es inofensiva.
- **Daño:** Transferencias o votos involuntarios.

### 16. El Sistema No Escala Bien
- **Problema:** A medida que aumenta el número de propuestas y votos, la complejidad del sistema crece.
- **Ejemplo:** Cientos de propuestas activas generan confusión.
- **Daño:** Gobernanza ineficiente.

### 17. No Existe Un Proceso De Deliberación
- **Problema:** El sistema solo contempla proponer y votar.
- **Ejemplo:** No existe espacio para discutir propuestas antes de votar.
- **Daño:** Decisiones mal informadas.

### 18. No Existe Protección Contra Colusión
- **Problema:** Grupos coordinados pueden manipular resultados.
- **Ejemplo:** Varios participantes acuerdan votar en bloque.
- **Daño:** Captura del sistema por coaliciones.

### 19. No Existe Protección Económica Contra Ataques
- **Problema:** Crear propuestas o votar no tiene costo económico significativo.
- **Ejemplo:** Un actor malicioso participa sin riesgo financiero.
- **Daño:** Incentivos desalineados.

### 20. El Sistema Es Una Simplificación Extrema De Un DAO Real
- **Problema:** El modelo ignora muchos problemas reales de gobernanza.
- **Ejemplo:** Falta de delegación, quorum dinámico, reputación o mecanismos de penalización.
- **Daño:** El sistema no sería viable en entornos reales con capital significativo.

### 21. Dependencia Crítica Del Relayer
- **Problema:** El sistema gasless depende completamente del relayer.
- **Ejemplo:** Si el relayer deja de funcionar, los usuarios no pueden interactuar con el sistema.
- **Daño:** Paralización completa del DAO.

### 22. Riesgo De Abuso Del Relayer
- **Problema:** El relayer podría censurar o priorizar ciertas transacciones.
- **Ejemplo:** El relayer decide no enviar ciertos votos.
- **Daño:** Manipulación indirecta de gobernanza.

### 23. Riesgo De Replay Attack En Meta-Transacciones
- **Problema:** Si los nonces no se gestionan correctamente, las firmas pueden reutilizarse.
- **Ejemplo:** Una firma válida se ejecuta múltiples veces.
- **Daño:** Repetición de acciones no deseadas.

### 24. Ejecución De Propuestas Puede Ser Manipulada
- **Problema:** El sistema depende de que alguien llame la función de ejecución.
- **Ejemplo:** Un actor ejecuta selectivamente propuestas favorables.
- **Daño:** Ejecución sesgada de decisiones.

### 25. Riesgo De Errores En Smart Contracts
- **Problema:** Un bug en el contrato puede comprometer todo el sistema.
- **Ejemplo:** Un error de cálculo permite retirar más fondos de los disponibles.
- **Daño:** Pérdida total de la tesorería.

**Conclusión del análisis crítico**
El diseño actual del sistema DAO representa **una implementación mínima educativa**, pero presenta múltiples debilidades estructurales si se evaluara como sistema real de gobernanza financiera.
Las principales áreas de riesgo se concentran en:
- Gobernanza insuficiente
- Protecciones económicas inexistentes
- Dependencias técnicas críticas
- Ausencia de mecanismos de seguridad avanzados

Este análisis permite identificar las áreas que requerirían mejoras para evitar que el sistema sea **trivialmente explotable** en un entorno real.

## Propuesta mínima mejorada + invariantes

### Reglas e Invariantes del Sistema DAO (Decisiones de diseño fijas)

- **Modelo de voto**: unitario. Una dirección, un voto. El balance determina si puedes proponer, no cuánto pesa tu voto.
- **Miembro activo**: cualquier dirección con `userBalance > 0` en el momento de votar o en el snapshot de creación de propuesta.
- **Fuente de verdad del balance**: siempre `treasuryBalance`. Nunca `address(this).balance`.
- **Retiro de fondos**: no existe. El ETH depositado es permanente. Decisión de diseño explícita.
- **Reentrancy**: patrón checks-effects-interactions sin excepción en toda transferencia.
- **Inicialización**: solo el owner puede hacer el primer depósito histórico.

### Reglas de Gobernanza

**Regla 1 — Duración de votación**
- **Problema que resuelve**: sin límites, alguien crea una votación de 10 segundos, vota solo y aprueba una propuesta antes de que nadie reaccione.
- **Definición**: mínimo y máximo configurables en el constructor. El invariante es que `minDuration > 0` y `maxDuration > minDuration`.

| Entorno | Mínimo | Máximo |
|---|---|---|
| Producción | 1 día | 7 días |
| Anvil local | 5 minutos | 1 hora |

**Regla 2 — Quorum mínimo de participación**
- **Problema que resuelve**: una propuesta no puede decidirse con participación mínima. Corrige la desincronización entre miembros históricos y miembros activos reales.
- **Definición**: al menos el 30% de los miembros activos en el momento de crear la propuesta deben haber votado. Se usa un snapshot al crear la propuesta, no el histórico total.

**Regla 3 — Mayoría para aprobar**
- **Problema que resuelve**: una propuesta no debería aprobarse con consenso débil cuando hay fondos reales en juego.
- **Definición**: los votos a favor deben superar el 60% de los votos decisivos (a favor + en contra). Las abstenciones cuentan para el quorum pero no para la mayoría. Quien quiere bloquear debe votar en contra explícitamente.

**Regla 4 — Límite máximo de gasto por propuesta**
- **Problema que resuelve**: sin límite, un actor con suficiente poder vota para vaciar la tesorería completa en una sola propuesta.
- **Definición**: máximo 25% de `treasuryBalance` en el momento de creación. Se valida dos veces: al crear y al ejecutar.

**Regla 5 — Timelock de ejecución**
- **Problema que resuelve**: una propuesta aprobada podría ejecutarse inmediatamente sin tiempo para detectar errores o propuestas maliciosas.
- **Definición**: configurable en el constructor. El timelock comienza cuando la propuesta cierra con resultado aprobado.

| Entorno | Timelock |
|---|---|
| Producción | 24 horas |
| Anvil local | 2 minutos |

**Regla 6 — Depósito mínimo inicial**
- **Problema que resuelve**: evita DAOs iniciadas con capital insignificante que rompen las proporciones del sistema. Corrige el front-running en la inicialización.
- **Definición**: solo el owner puede hacer el primer depósito histórico (1 ETH minimo). El flag `daoInitialized` se activa exactamente una vez y nunca se desactiva. Depósitos posteriores son libres.

**Regla 7 — Requisito mínimo para proponer**
- **Problema que resuelve**: evita spam de propuestas sin bloquear la participación cuando hay pocos miembros.
- **Definición**: el usuario debe tener al menos el 1% de `treasuryBalance` en el momento de crear la propuesta.

### Invariantes de Seguridad

**Invariante 1 — Reentrancy: checks-effects-interactions**
- **Problema que resuelve**: un contrato malicioso como beneficiario llama de vuelta a `executeProposal` durante la transferencia y drena la tesorería. (Previene drenado múltiple)

**Invariante 2 — Balance suficiente en dos momentos**
- **Problema que resuelve**: el balance puede cambiar entre la creación y la ejecución de una propuesta. (Cubre cambios de balance)

**Invariante 3 — Ejecución única**
- **Problema que resuelve**: una propuesta ejecutada no puede volver a ejecutarse. (Previene ejecuciones duplicadas)

**Invariante 4 — Un voto por dirección, cambio permitido antes del deadline**
- **Problema que resuelve**: votar múltiples veces o después del cierre inflaría contadores y manipularía resultados. (Previene manipulación de conteo)

**Invariante 5 — Solo miembros activos votan**
- **Problema que resuelve**: direcciones sin depósito no tienen derecho a participar en decisiones sobre fondos. (Restringe participación a contribuyentes, `userBalance > 0`)

**Invariante 6 — Nonces únicos en meta-transacciones**
- **Problema que resuelve**: un atacante reutiliza una firma válida para ejecutar la misma transacción múltiples veces (replay attack). `userNonce` en el forwarder es independiente.

### Limitaciones documentadas
- **Sybil attacks**: Requiere sistema de identidad fuera del alcance del MVP
- **`_countActiveMembers()` costoso**: Aceptable en MVP educativo, problema real en producción
- **Relayer sin fondos rompe votación**: Se valida en el API route antes de aceptar requests (Status 503)
